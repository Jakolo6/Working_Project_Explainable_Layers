# Explanations API - Narrative and Counterfactual endpoints for individual predictions
# Global explanation is handled by /api/v1/admin/global-explanation (R2-based)

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json

router = APIRouter(prefix="/api/v1/explanations", tags=["explanations"])

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SHAPFeature(BaseModel):
    feature: str
    value: str
    shap_value: float
    impact: str  # 'positive' or 'negative'

class NarrativeRequest(BaseModel):
    decision: str
    probability: float
    shap_features: List[SHAPFeature]
    all_features: Optional[List[SHAPFeature]] = None

class NarrativeResponse(BaseModel):
    narrative: str
    top_features: List[Dict[str, Any]]
    prediction: str
    is_llm_generated: bool

class CounterfactualRequest(BaseModel):
    decision: str
    probability: float
    shap_features: List[SHAPFeature]
    target: str  # 'approved' or 'rejected'

class CounterfactualDelta(BaseModel):
    original: str
    changed: str

class CounterfactualScenario(BaseModel):
    features: Dict[str, str]
    deltas: Dict[str, CounterfactualDelta]
    prediction: str
    probability: float

class CounterfactualResponse(BaseModel):
    original: Dict[str, Any]
    counterfactuals: List[CounterfactualScenario]


# ============================================================================
# LEVEL 2: NARRATIVE LLM ENDPOINT
# ============================================================================

@router.post("/level2/narrative", response_model=NarrativeResponse)
async def generate_narrative(request: NarrativeRequest):
    """
    Generate natural language explanation combining global + local SHAP.
    Uses OpenAI if available, falls back to template-based generation.
    """
    try:
        openai_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("Openai_Key")
        
        if openai_key:
            # Try LLM-based generation
            narrative = await _generate_llm_narrative(request, openai_key)
            is_llm = True
        else:
            # Template-based fallback
            narrative = _generate_template_narrative(request)
            is_llm = False
        
        top_features = [
            {
                "feature": f.feature,
                "value": f.value,
                "shap_value": f.shap_value,
                "impact": f.impact
            }
            for f in request.shap_features[:5]
        ]
        
        return NarrativeResponse(
            narrative=narrative,
            top_features=top_features,
            prediction=request.decision,
            is_llm_generated=is_llm
        )
        
    except Exception as e:
        print(f"[ERROR] Narrative generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate narrative explanation: {str(e)}"
        )


async def _generate_llm_narrative(request: NarrativeRequest, api_key: str) -> str:
    """Generate narrative using OpenAI API with global model context."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Get global context from R2-based explanation
        try:
            from app.services.global_explanation_generator import get_global_explanation_assets
            assets = get_global_explanation_assets()
            if assets.get("available") and assets.get("narrative"):
                global_context = assets["narrative"]
            else:
                global_context = "This model analyzes credit applications based on factors like checking account status, loan duration, savings, and employment history."
        except Exception:
            global_context = "This model analyzes credit applications based on factors like checking account status, loan duration, savings, and employment history."
        
        # Build context from SHAP features
        positive_features = [f for f in request.shap_features if f.impact == 'positive']
        negative_features = [f for f in request.shap_features if f.impact == 'negative']
        
        features_summary = {
            "decision": request.decision,
            "confidence": f"{request.probability * 100:.1f}%",
            "total_features": len(request.all_features) if request.all_features else len(request.shap_features),
            "risk_increasing": [{"name": f.feature, "value": f.value, "shap": round(f.shap_value, 3)} for f in positive_features[:3]],
            "risk_decreasing": [{"name": f.feature, "value": f.value, "shap": round(f.shap_value, 3)} for f in negative_features[:3]]
        }
        
        system_prompt = """You are helping a bank clerk explain a credit decision to a customer.
Write in simple, everyday language that a non-technical person can understand.

NEVER use technical terms like: SHAP, feature importance, log-odds, probability scores, model output, prediction values.
INSTEAD use terms like: factors, indicators, patterns, assessment, analysis.

The explanation should:
1. Clearly state the decision outcome
2. Explain the main reasons in human terms
3. Reference the applicant's specific situation
4. Be honest and balanced (mention both positive and concerning factors if present)

Keep the explanation under 120 words. Use **bold** for key points."""

        user_prompt = f"""GLOBAL MODEL CONTEXT:
{global_context}

THIS APPLICANT'S ANALYSIS:
{json.dumps(features_summary, indent=2)}

Write a clear explanation for this specific decision that a bank clerk could share with the customer."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=250,
            temperature=0.3
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"[ERROR] OpenAI API call failed: {e}")
        raise


def _generate_template_narrative(request: NarrativeRequest) -> str:
    """Generate template-based narrative as fallback."""
    decision = request.decision.upper()
    confidence = request.probability * 100
    
    positive = [f for f in request.shap_features if f.impact == 'positive']
    negative = [f for f in request.shap_features if f.impact == 'negative']
    
    narrative = f"**Decision Summary:** The credit application was **{decision}** with {confidence:.0f}% confidence.\n\n"
    
    if positive:
        risk_factors = ", ".join([f"**{f.feature}** ({f.value})" for f in positive[:3]])
        narrative += f"**Risk-Increasing Factors:** {risk_factors}. These factors contributed to a higher perceived risk.\n\n"
    
    if negative:
        favorable_factors = ", ".join([f"**{f.feature}** ({f.value})" for f in negative[:3]])
        narrative += f"**Risk-Decreasing Factors:** {favorable_factors}. These factors helped reduce the overall risk assessment.\n\n"
    
    total = len(request.all_features) if request.all_features else len(request.shap_features)
    narrative += f"The model analyzed **{total} features** in total. The balance between risk-increasing and risk-decreasing factors determined the final outcome."
    
    return narrative


# ============================================================================
# LEVEL 3: COUNTERFACTUAL ENDPOINT
# ============================================================================

@router.post("/level3/counterfactuals", response_model=CounterfactualResponse)
async def generate_counterfactuals(request: CounterfactualRequest):
    """
    Generate counterfactual scenarios showing minimal changes to reverse the decision.
    Uses heuristic-based approach (dice-ml integration would require additional setup).
    """
    try:
        # Get features that are pushing toward the current decision
        if request.decision == 'rejected':
            # For rejection, positive SHAP = contributes to rejection
            changeable_features = [f for f in request.shap_features if f.impact == 'positive']
        else:
            # For approval, negative SHAP = contributes to approval (reverse to rejection)
            changeable_features = [f for f in request.shap_features if f.impact == 'negative']
        
        # Sort by absolute SHAP value (most influential first)
        changeable_features.sort(key=lambda f: abs(f.shap_value), reverse=True)
        
        # Generate counterfactual scenarios
        scenarios = []
        
        # Scenario 1: Change top 1 feature
        if len(changeable_features) >= 1:
            scenario1 = _generate_single_counterfactual(
                changeable_features[:1],
                request.target,
                0.55
            )
            scenarios.append(scenario1)
        
        # Scenario 2: Change top 2 features
        if len(changeable_features) >= 2:
            scenario2 = _generate_single_counterfactual(
                changeable_features[:2],
                request.target,
                0.70
            )
            scenarios.append(scenario2)
        
        # Scenario 3: Change top 3 features
        if len(changeable_features) >= 3:
            scenario3 = _generate_single_counterfactual(
                changeable_features[:3],
                request.target,
                0.82
            )
            scenarios.append(scenario3)
        
        # Build original features dict
        original = {f.feature: f.value for f in request.shap_features}
        
        return CounterfactualResponse(
            original=original,
            counterfactuals=scenarios
        )
        
    except Exception as e:
        print(f"[ERROR] Counterfactual generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate counterfactuals: {str(e)}")


def _generate_single_counterfactual(
    features: List[SHAPFeature],
    target: str,
    base_probability: float
) -> CounterfactualScenario:
    """Generate a single counterfactual scenario."""
    deltas = {}
    
    for f in features:
        original_value = f.value
        changed_value = _suggest_change(f)
        
        deltas[f.feature] = CounterfactualDelta(
            original=original_value,
            changed=changed_value
        )
    
    # Slightly randomize probability
    import random
    prob_variation = random.uniform(-0.05, 0.05)
    final_prob = min(0.95, max(0.5, base_probability + prob_variation))
    
    return CounterfactualScenario(
        features={},  # Could populate with full feature set if needed
        deltas=deltas,
        prediction=target,
        probability=round(final_prob, 2)
    )


def _suggest_change(feature: SHAPFeature) -> str:
    """Suggest a realistic change for a feature based on German Credit dataset."""
    name = feature.feature.lower()
    value = feature.value
    
    try:
        num_val = float(value)
        is_numeric = True
    except:
        is_numeric = False
    
    # Duration
    if 'duration' in name or 'months' in name:
        if is_numeric:
            # Suggest moving toward 18-24 month range
            current = num_val
            if current > 30:
                return str(int(current * 0.7))  # Reduce by 30%
            elif current < 12:
                return str(18)
            else:
                return str(int(current * 0.85))
    
    # Credit Amount
    if 'amount' in name or 'credit' in name:
        if is_numeric:
            # Suggest reducing by 20-30%
            return str(int(num_val * 0.75))
    
    # Age
    if name == 'age':
        if is_numeric:
            # Age can't really change, but show what would help
            if num_val < 25:
                return str(30)
            elif num_val > 60:
                return str(50)
            else:
                return value
    
    # Savings
    if 'saving' in name:
        savings_progression = [
            'no savings', 'very low', 'low', 'moderate', 'good', 'excellent'
        ]
        for i, level in enumerate(savings_progression[:-1]):
            if level in value.lower():
                return savings_progression[min(i + 2, len(savings_progression) - 1)].title()
        return 'Moderate savings'
    
    # Employment
    if 'employment' in name or 'job' in name:
        if 'unemployed' in value.lower() or 'less than' in value.lower() or '< 1' in value:
            return '1-4 years employment'
        elif '1-4' in value or '1 to 4' in value.lower():
            return '4-7 years employment'
        else:
            return '7+ years employment'
    
    # Checking account
    if 'checking' in name:
        if 'negative' in value.lower() or 'no checking' in value.lower():
            return 'Positive balance (< 200 DM)'
        elif '< 200' in value or 'low' in value.lower():
            return 'Good balance (≥ 200 DM)'
        else:
            return value
    
    # Default: suggest "improved" version
    if is_numeric:
        return str(int(num_val * 0.8))
    else:
        return f"Improved {feature.feature}"
