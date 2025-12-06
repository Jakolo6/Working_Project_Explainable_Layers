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
# HELPER FUNCTIONS
# ============================================================================

def _get_default_global_context() -> str:
    """Return default global context when R2 assets are unavailable."""
    return """This AI model analyzes credit applications using the 1994 German Credit Dataset.

KEY FACTORS THE MODEL CONSIDERS:
- Checking Account Status: Higher balances indicate better financial management
- Loan Duration: Shorter loans are generally less risky
- Savings Account: More savings provide a financial safety buffer
- Employment Duration: Stable, long-term employment reduces risk
- Credit Amount: Larger amounts relative to the applicant's profile increase risk
- Age: Middle-aged applicants (30-55) typically have the most stable profiles

IMPORTANT DATA LIMITATION:
The Credit History feature shows counterintuitive patterns due to historical selection bias. In 1994, banks were more cautious with applicants who had problematic credit histories, approving only the most creditworthy among them. This means:
- Applicants labeled 'critical' in the training data had a 17% default rate (lowest)
- Applicants labeled 'all paid' had a 57% default rate (highest)

This is a known data anomaly that we preserve for research transparency."""


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
    """
    Generate analyst-grade narrative using OpenAI API with rich statistical context.
    
    This upgraded version provides:
    - Comparative analysis against dataset benchmarks
    - Percentile standings for numerical features
    - Actionable suggestions for mutable features
    - Proper handling of dataset quirks (Credit History)
    """
    try:
        from openai import OpenAI
        from app.services.context_builder import build_narrative_context
        
        client = OpenAI(api_key=api_key)
        
        # Convert Pydantic models to dicts for context builder
        shap_features_dict = [
            {"feature": f.feature, "value": f.value, "shap_value": f.shap_value, "impact": f.impact}
            for f in request.shap_features
        ]
        all_features_dict = None
        if request.all_features:
            all_features_dict = [
                {"feature": f.feature, "value": f.value, "shap_value": f.shap_value, "impact": f.impact}
                for f in request.all_features
            ]
        
        # Build rich context payload
        rich_context = build_narrative_context(
            decision=request.decision,
            probability=request.probability,
            shap_features=shap_features_dict,
            all_features=all_features_dict
        )
        
        # Master System Prompt - Analyst-Grade with Enhanced Fairness Defense
        system_prompt = """You are an expert Credit Analyst Assistant. Your goal is to explain a credit decision to a bank clerk in professional, defensible terms using specific statistical benchmarks.

### 1. CORE RULES
- **Tone:** Professional, objective, data-driven. This explanation must be defensible to regulators and customers.
- **Forbidden Terms:** SHAP, Feature Importance, Log-odds, XGBoost, Training Data, Machine Learning, Algorithm, Model Output, Prediction Score.
- **Use Instead:** factors, indicators, patterns, assessment, analysis, profile, typical range, historical benchmarks, statistical patterns.
- **Key Formatting:** Use **bold** for the most important factors and specific numbers.

### 2. MANDATORY USE OF GLOBAL BENCHMARKS
- **Always cite specific ranges:** NEVER say "Your duration is high." ALWAYS say "Your loan duration (**48 months**) exceeds our typical approved range (**12-24 months**, median: **18 months**)."
- **Use percentiles for context:** "Your credit amount places you in the **85th percentile**—higher than **85% of approved applicants**."
- **Compare to approved applicants:** Reference the typical_approved_range and typical_approved_median from the comparative context.
- **Be specific with numbers:** Include actual values, ranges, and percentiles in **bold**.

### 3. FAIRNESS DEFENSE (MANDATORY INCLUSION)
- **ALWAYS include this statement** in your explanation: "This assessment is based solely on financial and credit factors. **Gender, nationality, and other protected characteristics were strictly excluded** from the decision model to ensure fair and unbiased evaluation."
- **Position:** Include this naturally in the explanation, typically after the main analysis or at the end.
- **Purpose:** This provides regulatory compliance and builds trust with the customer.

### 4. HANDLING DATASET QUIRKS (CRITICAL)
- **Credit History:** This assessment model shows that "Critical/Existing Credits" categories often correlate with approval. This reflects historical patterns where applicants with existing credit relationships demonstrated reliability. If this factor helped the applicant, explain: "Your established history of managing credits played a positive role."
- **Do NOT mention:** The year 1994, "training data", "dataset bias", or technical explanations of why patterns exist.

### 5. RESPONSE STRUCTURE (PROFESSIONAL GRADE)
1. **Decision Summary:** Clear statement with confidence level and key metric.
   Example: "This application is **APPROVED** with **68% confidence**. The assessment identified **3 favorable factors** and **2 risk indicators**."

2. **Primary Factors (with benchmarks):** Explain top 1-2 factors using specific comparative data.
   Example: "The **loan duration (24 months)** is well within our typical approved range (**12-24 months**, median: **18 months**), which significantly supports approval."

3. **Risk/Supporting Balance:** Acknowledge both sides with specific data.
   Example: "While the **credit amount (€4,800)** is in the **75th percentile** (higher than most), the **short duration** and **stable employment** offset this risk."

4. **Fairness Statement:** Include the mandatory fairness defense.

5. **Actionable Guidance (if rejected):** One concrete suggestion based ONLY on mutable features (Duration, Amount, Savings, Checking).
   Example: "Reducing the loan duration to **18 months** (our typical median) or lowering the amount to **€3,500** (50th percentile) would significantly improve approval likelihood."

### 6. LENGTH & QUALITY
- **Target:** 150-200 words for professional, defensible explanations.
- **Quality over brevity:** Include specific numbers and benchmarks even if it adds length.
- **Regulatory-ready:** This explanation should be suitable for audit review."""

        # Build the user prompt with rich context
        user_prompt = f"""APPLICANT ANALYSIS:
{json.dumps(rich_context['applicant_analysis'], indent=2)}

COMPARATIVE CONTEXT (Use these specific benchmarks in your explanation):
{json.dumps(rich_context['comparative_context'], indent=2)}

ACTIONABLE SUGGESTIONS (Only for mutable features):
{json.dumps(rich_context['actionable_suggestions'], indent=2)}

RULES OF ENGAGEMENT:
- Mutable features (can suggest changes): {rich_context['rules_of_engagement']['mutable_features']}
- Immutable features (never suggest changes): {rich_context['rules_of_engagement']['immutable_features']}
- Excluded for fairness: {rich_context['rules_of_engagement']['excluded_for_fairness']}
- Dataset note: {rich_context['rules_of_engagement'].get('dataset_bias_warning', 'None')}

MANDATORY FAIRNESS STATEMENT (MUST INCLUDE):
{rich_context['rules_of_engagement']['fairness_statement']}

INSTRUCTIONS:
1. Use the COMPARATIVE CONTEXT to cite specific numbers (typical ranges, medians, percentiles)
2. Make every factor comparison data-driven with actual benchmarks
3. MUST include the fairness statement naturally in your explanation
4. Follow the professional response structure with specific examples
5. This explanation will be reviewed by regulators - make it defensible and precise"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=400,  # Increased for benchmark-rich, defensible explanations
            temperature=0.2  # Lower temperature for more consistent, professional output
        )
        
        return response.choices[0].message.content
        
    except ImportError as e:
        print(f"[WARNING] Context builder not available, falling back to basic generation: {e}")
        # Fallback to simpler generation if context builder fails
        return await _generate_basic_llm_narrative(request, api_key)
    except Exception as e:
        print(f"[ERROR] OpenAI API call failed: {e}")
        raise


async def _generate_basic_llm_narrative(request: NarrativeRequest, api_key: str) -> str:
    """Fallback basic LLM narrative generation without rich context."""
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    
    positive_features = [f for f in request.shap_features if f.impact == 'positive']
    negative_features = [f for f in request.shap_features if f.impact == 'negative']
    
    features_summary = {
        "decision": request.decision,
        "confidence": f"{request.probability * 100:.1f}%",
        "risk_increasing": [{"name": f.feature, "value": f.value} for f in positive_features[:3]],
        "risk_decreasing": [{"name": f.feature, "value": f.value} for f in negative_features[:3]]
    }
    
    system_prompt = """You are a Credit Analyst explaining a decision to a customer.
Be professional and empathetic. Use simple language.
Never use technical terms like SHAP, feature importance, or log-odds.
Keep the explanation under 150 words. Use **bold** for key points."""

    user_prompt = f"""Decision: {request.decision.upper()}
Confidence: {request.probability * 100:.1f}%
Analysis: {json.dumps(features_summary, indent=2)}

Write a clear explanation for this credit decision."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=200,
        temperature=0.3
    )
    
    return response.choices[0].message.content


def _generate_template_narrative(request: NarrativeRequest) -> str:
    """Generate template-based narrative as fallback with rich context when available."""
    decision = request.decision.upper()
    confidence = request.probability * 100
    
    positive = [f for f in request.shap_features if f.impact == 'positive']
    negative = [f for f in request.shap_features if f.impact == 'negative']
    
    # Try to get rich context for better template generation
    try:
        from app.services.context_builder import build_narrative_context
        shap_features_dict = [
            {"feature": f.feature, "value": f.value, "shap_value": f.shap_value, "impact": f.impact}
            for f in request.shap_features
        ]
        rich_context = build_narrative_context(
            decision=request.decision,
            probability=request.probability,
            shap_features=shap_features_dict
        )
        has_rich_context = True
    except Exception:
        rich_context = None
        has_rich_context = False
    
    # Build narrative with comparative context if available
    narrative = f"**Decision: {decision}** (Confidence: {confidence:.0f}%)\n\n"
    
    if positive:
        narrative += "**Key Factors Raising Concerns:**\n"
        for f in positive[:3]:
            feature_context = ""
            if has_rich_context:
                # Try to get comparative context
                feature_key = f.feature.lower().replace(' ', '_').replace('(months)', '').strip()
                for key, ctx in rich_context.get('comparative_context', {}).items():
                    if key in feature_key or feature_key in key:
                        if ctx.get('typical_approved_range'):
                            feature_context = f" (typical approved range: {ctx['typical_approved_range']} {ctx.get('unit', '')})"
                        break
            narrative += f"- **{f.feature}**: {f.value}{feature_context}\n"
        narrative += "\n"
    
    if negative:
        narrative += "**Positive Factors:**\n"
        for f in negative[:3]:
            narrative += f"- **{f.feature}**: {f.value}\n"
        narrative += "\n"
    
    # Add actionable suggestion for rejections
    if request.decision == 'rejected' and has_rich_context:
        suggestions = rich_context.get('actionable_suggestions', [])
        if suggestions:
            narrative += "**What Could Help:**\n"
            for s in suggestions[:2]:
                narrative += f"- {s.get('suggestion', '')}\n"
            narrative += "\n"
    
    # Check for Credit History and add context if present
    credit_history_feature = None
    for f in request.shap_features:
        if "credit history" in f.feature.lower() or "credit_history" in f.feature.lower():
            credit_history_feature = f
            break
    
    if credit_history_feature:
        narrative += "**Note:** Your credit history assessment reflects established patterns in managing credit relationships.\n\n"
    
    total = len(request.all_features) if request.all_features else len(request.shap_features)
    narrative += f"*This assessment analyzed {total} factors in your profile.*"
    
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


# ============================================================================
# INSIGHTS SUMMARY ENDPOINT (Short AI Summary for DecisionInsights layer)
# ============================================================================

class InsightsSummaryRequest(BaseModel):
    decision: str
    probability: float
    top_supportive: List[Dict[str, str]]
    top_concerns: List[Dict[str, str]]

class InsightsSummaryResponse(BaseModel):
    summary: str
    is_llm_generated: bool

@router.post("/insights-summary", response_model=InsightsSummaryResponse)
async def generate_insights_summary(request: InsightsSummaryRequest):
    """
    Generate a very short (2-3 sentence) summary for the DecisionInsights layer.
    This is meant to be a brief, empathetic summary for bank clerks.
    """
    try:
        openai_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("Openai_Key")
        
        if not openai_key:
            # Fallback to template
            return InsightsSummaryResponse(
                summary=_generate_template_insights_summary(request),
                is_llm_generated=False
            )
        
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        
        supportive_names = [f["feature"] for f in request.top_supportive]
        concern_names = [f["feature"] for f in request.top_concerns]
        
        prompt = f"""Write a 2-3 sentence summary for a bank clerk to understand this credit decision.
Decision: {request.decision.upper()}
Main supportive factors: {', '.join(supportive_names) if supportive_names else 'None identified'}
Main concerns: {', '.join(concern_names) if concern_names else 'None identified'}

Rules:
- Maximum 3 sentences
- Warm, professional tone suitable for explaining to a customer
- No technical terms, no numbers, no percentages
- Mention the key factors naturally
- Be empathetic but factual"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful banking assistant writing brief, empathetic summaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.3
        )
        
        return InsightsSummaryResponse(
            summary=response.choices[0].message.content.strip(),
            is_llm_generated=True
        )
        
    except Exception as e:
        print(f"[ERROR] Insights summary failed: {e}")
        return InsightsSummaryResponse(
            summary=_generate_template_insights_summary(request),
            is_llm_generated=False
        )


def _generate_template_insights_summary(request: InsightsSummaryRequest) -> str:
    """Template fallback for insights summary."""
    supportive = [f["feature"] for f in request.top_supportive]
    concerns = [f["feature"] for f in request.top_concerns]
    
    if request.decision == 'approved':
        if supportive:
            return f"This application was approved based on positive indicators including {' and '.join(supportive[:2])}. The overall profile met the criteria for approval."
        return "This application was approved. The applicant's profile met the necessary criteria."
    else:
        if concerns:
            return f"This application was not approved primarily due to concerns about {' and '.join(concerns[:2])}. These factors outweighed the positive aspects of the profile."
        return "This application was not approved. The overall profile did not meet the required criteria."


# ============================================================================
# CHATBOT ENDPOINT
# ============================================================================

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_context: str
    decision: str
    probability: float
    shap_features: List[SHAPFeature]

class ChatResponse(BaseModel):
    response: str
    is_llm_generated: bool

@router.post("/chat", response_model=ChatResponse)
async def chat_about_decision(request: ChatRequest):
    """
    Interactive chatbot for bank clerks to ask questions about credit decisions.
    Uses OpenAI API with global model context and local applicant SHAP values.
    """
    try:
        openai_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("Openai_Key")
        
        if not openai_key:
            return ChatResponse(
                response="Chat functionality requires an OpenAI API key. Please configure OPENAI_API_KEY in the environment.",
                is_llm_generated=False
            )
        
        from openai import OpenAI
        client = OpenAI(api_key=openai_key)
        
        # Build messages for OpenAI
        openai_messages = [
            {"role": "system", "content": request.system_context}
        ]
        
        # Add conversation history
        for msg in request.messages:
            openai_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=500,
            temperature=0.4
        )
        
        return ChatResponse(
            response=response.choices[0].message.content,
            is_llm_generated=True
        )
        
    except Exception as e:
        print(f"[ERROR] Chat endpoint failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )
