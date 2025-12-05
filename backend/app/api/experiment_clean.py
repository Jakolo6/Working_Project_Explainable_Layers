"""
Clean experiment API using notebook-trained models.
No Axx mappings - uses cleaned dataset format directly.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from app.services.xgboost_service import XGBoostService
from app.services.logistic_service import LogisticService
from app.services.notebook_preprocessing import get_feature_schema
from app.services.supabase_service import SupabaseService
from app.config import get_settings

router = APIRouter(prefix="/api/v1/experiment", tags=["experiment"])

# Global service instances
xgboost_service = None
logistic_service = None
supabase_service = None


def get_services():
    """Initialize services on first request"""
    global xgboost_service, logistic_service, supabase_service
    
    config = get_settings()
    
    if xgboost_service is None:
        xgboost_service = XGBoostService(config)
        try:
            xgboost_service.load_model_from_r2()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load XGBoost model: {e}")
    
    if logistic_service is None:
        logistic_service = LogisticService(config)
        try:
            logistic_service.load_model_from_r2()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load Logistic model: {e}")
    
    if supabase_service is None:
        supabase_service = SupabaseService(config)
    
    return xgboost_service, logistic_service, supabase_service


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreditApplication(BaseModel):
    """Credit application with cleaned column names (no Axx codes)"""
    checking_status: str = Field(..., description="Checking account status")
    duration: int = Field(..., ge=1, le=72, description="Credit duration in months")
    credit_history: str = Field(..., description="Credit history")
    purpose: str = Field(..., description="Purpose of credit")
    credit_amount: float = Field(..., ge=250, le=20000, description="Credit amount in DM")
    savings_status: str = Field(..., description="Savings account status")
    employment: str = Field(..., description="Employment duration")
    installment_commitment: str = Field(..., description="Installment rate category (ge_35_percent, 25_to_35_percent, 20_to_25_percent, lt_20_percent)")
    other_debtors: str = Field(..., description="Other debtors/guarantors")
    residence_since: int = Field(..., ge=1, le=4, description="Years at current residence")
    property_magnitude: str = Field(..., description="Property type")
    age: int = Field(..., ge=18, le=75, description="Age in years")
    other_payment_plans: str = Field(..., description="Other installment plans")
    housing: str = Field(..., description="Housing type")
    existing_credits: int = Field(..., ge=1, le=4, description="Existing credits at bank")
    job: str = Field(..., description="Job type")
    num_dependents: int = Field(..., ge=1, le=2, description="Number of dependents")
    own_telephone: str = Field(..., description="Telephone status")


class PredictionRequest(BaseModel):
    """Request for credit prediction"""
    session_id: str
    application: CreditApplication
    explanation_layer: str = Field(..., description="minimal, feature_importance, shap, visual, counterfactual")


class SHAPFeature(BaseModel):
    """SHAP feature contribution"""
    feature: str
    shap_value: float
    feature_value: float
    impact: str


class PredictionResponse(BaseModel):
    """Response with prediction and explanation"""
    decision: str
    confidence: float
    probability_good: float
    probability_bad: float
    model: str
    explanation: Dict[str, Any]


class SessionCreate(BaseModel):
    """Create new experiment session with consent and baseline questions"""
    consent_given: bool
    participant_background: str  # banking, data_analytics, student, other
    credit_experience: str  # none, some, regular, expert
    ai_familiarity: int  # Likert 1-5
    preferred_explanation_style: str  # technical, visual, narrative, action_oriented
    background_notes: Optional[str] = ''


class SessionResponse(BaseModel):
    """Session creation response"""
    session_id: str
    success: bool
    message: str


class PostQuestionnaire(BaseModel):
    """Post-experiment questionnaire - submitted after EACH persona"""
    session_id: str
    persona_id: str  # elderly-woman, young-entrepreneur
    most_helpful_layer: str  # layer_1, layer_2, layer_3, layer_4
    most_trusted_layer: str  # layer_1, layer_2, layer_3, layer_4
    best_for_customer: str  # layer_1, layer_2, layer_3, layer_4
    overall_intuitiveness: int = Field(..., ge=1, le=5)
    ai_usefulness: int = Field(..., ge=1, le=5)
    improvement_suggestions: Optional[str] = ''


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/feature-schema")
async def get_feature_schema_endpoint():
    """Get feature schema for frontend form generation"""
    return get_feature_schema()


@router.post("/session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    """Create new experiment session"""
    try:
        _, _, db = get_services()
        
        session_id = str(uuid.uuid4())
        
        session_record = {
            'session_id': session_id,
            'consent_given': session_data.consent_given,
            'participant_background': session_data.participant_background,
            'credit_experience': session_data.credit_experience,
            'ai_familiarity': session_data.ai_familiarity,
            'preferred_explanation_style': session_data.preferred_explanation_style,
            'background_notes': session_data.background_notes or ''
        }
        
        result = db.create_session(session_record)
        
        if result.get("success"):
            return SessionResponse(
                session_id=session_id,
                success=True,
                message="Session created successfully"
            )
        else:
            error_msg = result.get("error", "Unknown error")
            raise HTTPException(status_code=500, detail=f"Failed to create session: {error_msg}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")


@router.post("/predict", response_model=PredictionResponse)
async def predict_credit(request: PredictionRequest):
    """
    Make credit prediction with explanation.
    Uses cleaned format - no Axx code conversion needed.
    """
    try:
        xgb_service, _, db = get_services()
        
        # Convert application to dict
        user_input = request.application.dict()
        
        # Make prediction
        prediction_result = xgb_service.predict(user_input)
        
        # Generate explanation based on layer
        explanation = {}
        
        if request.explanation_layer == "minimal":
            explanation = {
                "type": "minimal",
                "message": f"Decision: {prediction_result['decision'].upper()}"
            }
            
        elif request.explanation_layer == "feature_importance":
            importance = xgb_service.get_feature_importance(top_n=10)
            explanation = {
                "type": "feature_importance",
                "top_features": [
                    {"feature": feat, "importance": float(imp)}
                    for feat, imp in importance.items()
                ]
            }
            
        elif request.explanation_layer in ["shap", "visual"]:
            shap_explanation = xgb_service.explain_prediction(user_input, num_features=10)
            explanation = {
                "type": "shap",
                "top_features": shap_explanation['top_features'],
                "base_value": shap_explanation['base_value']
            }
            
        elif request.explanation_layer == "counterfactual":
            # Counterfactual explanations are generated via the /explanations/level3/counterfactuals endpoint
            # This layer should not be used directly - redirect to proper endpoint
            raise HTTPException(
                status_code=400,
                detail="Counterfactual explanations should be requested via /api/v1/explanations/level3/counterfactuals"
            )
        
        # Store prediction in database with correct keys
        prediction_data = {
            'decision': prediction_result['decision'],
            'probability': prediction_result['confidence'],
            'explanation_layer': request.explanation_layer,
            'explanation': {
                'explanation_data': explanation,
                'application_data': user_input
            }
        }
        db.store_prediction(request.session_id, prediction_data)
        
        return PredictionResponse(
            decision=prediction_result['decision'],
            confidence=prediction_result['confidence'],
            probability_good=prediction_result['probability_good'],
            probability_bad=prediction_result['probability_bad'],
            model=prediction_result['model'],
            explanation=explanation
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@router.post("/predict_persona")
async def predict_persona(request: dict):
    """
    Predict for persona - returns SHAP features for all layers.
    Frontend expects: { session_id, persona_id, application_data }
    Returns: { decision, probability, shap_features, prediction_id }
    """
    try:
        xgb_service, _, db = get_services()
        
        session_id = request.get('session_id')
        persona_id = request.get('persona_id')
        application_data = request.get('application_data')
        
        if not all([session_id, persona_id, application_data]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Log incoming data for debugging
        print(f"[DEBUG] Received application_data: {application_data}")
        print(f"[DEBUG] Data types: {[(k, type(v).__name__) for k, v in application_data.items()]}")
        
        # Make prediction
        print("[DEBUG] Starting prediction...")
        prediction_result = xgb_service.predict(application_data)
        print(f"[DEBUG] Prediction successful: {prediction_result}")
        
        # Get SHAP explanation for ALL features
        print("[DEBUG] Starting SHAP explanation...")
        shap_explanation = xgb_service.explain_prediction(application_data, num_features=50)  # Get all features
        print(f"[DEBUG] SHAP explanation successful")
        
        # Transform ALL SHAP features to match frontend expectation
        shap_features = []
        for feat in shap_explanation['all_features']:  # Use all_features instead of top_features
            shap_features.append({
                'feature': feat['feature'],
                'value': str(feat['feature_value']),
                'shap_value': feat['shap_value'],
                'impact': 'positive' if feat['shap_value'] > 0 else 'negative'
            })
        
        # Also create top features for backward compatibility
        top_shap_features = []
        for feat in shap_explanation['top_features']:
            top_shap_features.append({
                'feature': feat['feature'],
                'value': str(feat['feature_value']),
                'shap_value': feat['shap_value'],
                'impact': 'positive' if feat['shap_value'] > 0 else 'negative'
            })
        
        # Generate prediction ID
        prediction_id = str(uuid.uuid4())
        
        # Store prediction with correct keys matching Supabase schema
        prediction_data = {
            'decision': prediction_result['decision'],
            'probability': prediction_result['confidence'],
            'explanation_layer': 'shap',  # Default layer for XGBoost predictions
            'explanation': {
                'shap_features': shap_features,
                'prediction_id': prediction_id,
                'persona_id': persona_id,
                'application_data': application_data
            }
        }
        db.store_prediction(session_id, prediction_data)
        
        return {
            'decision': prediction_result['decision'],
            'probability': prediction_result['confidence'],
            'shap_features': shap_features,
            'prediction_id': prediction_id
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Prediction failed with exception: {str(e)}")
        print(f"[ERROR] Full traceback:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/rate-layer")
async def rate_explanation_layer(request: dict):
    """Submit rating for explanation layer"""
    try:
        print(f"[DEBUG] Received rating data: {request}")
        
        # Map frontend fields to backend fields (Supabase will auto-generate created_at)
        rating_record = {
            'session_id': request.get('session_id'),
            'persona_id': request.get('persona_id'),
            'layer_number': request.get('layer_number'),
            'layer_name': request.get('layer_name'),
            'understanding_rating': int(request.get('understanding_rating', 0)),
            'communicability_rating': int(request.get('communicability_rating', 0)),
            'perceived_fairness_rating': int(request.get('perceived_fairness_rating', 0)),
            'cognitive_load_rating': int(request.get('cognitive_load_rating', 0)),
            'reliance_intention_rating': int(request.get('reliance_intention_rating', 0)),
            'comment': request.get('comment', ''),
            'time_spent_seconds': int(request.get('time_spent_seconds', 0))
        }
        
        # Validate required fields
        if not rating_record['session_id']:
            raise HTTPException(status_code=422, detail="session_id is required")
        
        _, _, db = get_services()
        result = db.store_layer_rating(rating_record)
        
        if result:
            print(f"[INFO] Rating stored successfully for session {rating_record['session_id']}")
            return {"success": True, "message": "Rating submitted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to store rating")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Rating submission failed: {e}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Rating submission failed: {e}")


@router.post("/post-questionnaire")
async def submit_post_questionnaire(questionnaire: PostQuestionnaire):
    """Submit post-experiment questionnaire"""
    try:
        _, _, db = get_services()
        
        questionnaire_record = {
            'session_id': questionnaire.session_id,
            'persona_id': questionnaire.persona_id,
            'most_helpful_layer': questionnaire.most_helpful_layer,
            'most_trusted_layer': questionnaire.most_trusted_layer,
            'best_for_customer': questionnaire.best_for_customer,
            'overall_intuitiveness': questionnaire.overall_intuitiveness,
            'ai_usefulness': questionnaire.ai_usefulness,
            'improvement_suggestions': questionnaire.improvement_suggestions or ''
        }
        
        result = db.store_post_questionnaire(questionnaire_record)
        
        return {"success": True, "message": "Questionnaire submitted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Questionnaire submission failed: {e}")




@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve session data and progress"""
    try:
        _, _, db = get_services()
        
        session_data = db.get_session(session_id)
        
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return session_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")


@router.post("/session/{session_id}/complete")
async def mark_session_complete(session_id: str):
    """Mark a session as complete (called when participant finishes or exits early)"""
    try:
        _, _, db = get_services()
        
        # Mark session as completed
        db.complete_session(session_id)
        
        return {
            "success": True,
            "message": f"Session {session_id} marked as complete",
            "completed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark session complete: {str(e)}")


@router.post("/generate_explanation")
async def generate_natural_language_explanation(request: dict):
    """Generate natural language explanation (template-based, no GPT)"""
    try:
        decision = request.get('decision', 'unknown')
        probability = request.get('probability', 0)
        top_features = request.get('top_features', [])
        
        # Template-based explanation (no GPT API call)
        if len(top_features) >= 3:
            feature_names = [f['feature'].replace('_', ' ') for f in top_features[:3]]
            explanation = f"This {decision} decision was primarily influenced by the applicant's {feature_names[0]}, {feature_names[1]}, and {feature_names[2]}. "
            explanation += f"The model has {int(probability * 100)}% confidence in this assessment."
        else:
            explanation = f"The decision was {decision} with {int(probability * 100)}% confidence based on the available information."
        
        return {
            "success": True,
            "explanation": explanation
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate explanation: {str(e)}"
        )


@router.post("/predict-counterfactual")
async def predict_counterfactual(request: Dict[str, Any]):
    """
    Fast prediction endpoint for counterfactual "what-if" analysis.
    Returns only decision and probability - NO SHAP calculation for speed.
    
    Input: { "application_data": { ... all features ... } }
    Output: { "decision": "approved"|"rejected", "probability": 0.85 }
    """
    try:
        xgb_service, _, _ = get_services()
        
        # Extract application data
        application_data = request.get("application_data")
        if not application_data:
            raise HTTPException(status_code=400, detail="Missing application_data")
        
        # Make prediction (fast - no SHAP)
        prediction_result = xgb_service.predict(application_data)
        
        # Return only decision and probability
        return {
            "decision": prediction_result["decision"],
            "probability": prediction_result["probability"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Check if models are loaded and ready"""
    try:
        xgb, log, db = get_services()
        
        return {
            "status": "healthy",
            "xgboost_loaded": xgb.model is not None,
            "logistic_loaded": log.model is not None,
            "database_connected": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
