# Experiment API endpoints for prediction and response submission

from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    CreditApplicationInput, 
    PredictionResponse, 
    ParticipantResponse,
    ResponseSubmissionResult,
    ExplanationData,
    SessionCreate,
    SessionResponse,
    PreExperimentResponse,
    PostExperimentResponse,
    LayerFeedbackRequest,
    LayerFeedbackResponse
)
from app.services.xgboost_model import CreditModel
from app.services.shap_service import SHAPExplainer
from app.services.supabase_service import SupabaseService
from app.services.feature_mappings import FeatureMappings
from app.config import get_settings
import pandas as pd
import uuid
from datetime import datetime

router = APIRouter()

# Global instances (loaded on startup)
credit_model = None
shap_explainer = None
supabase_service = None

def get_services():
    """Initialize services on first request"""
    global credit_model, shap_explainer, supabase_service
    
    config = get_settings()
    
    if credit_model is None:
        credit_model = CreditModel(config)
        try:
            credit_model.load_model_from_r2()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load model: {str(e)}"
            )
    
    if shap_explainer is None:
        shap_explainer = SHAPExplainer(
            credit_model.model,
            credit_model.feature_names
        )
    
    if supabase_service is None:
        supabase_service = SupabaseService(config)
    
    return credit_model, shap_explainer, supabase_service

@router.post("/predict", response_model=PredictionResponse)
async def predict_credit_decision(application: CreditApplicationInput):
    """
    Predict credit approval/rejection with SHAP explanation
    Randomly assigns one of five explanation layers
    """
    try:
        model, explainer, db = get_services()
        
        # Convert input to dictionary
        input_data = application.dict()
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Make prediction
        prediction_result = model.predict(input_data)
        
        # Assign random explanation layer
        layer = explainer.assign_random_layer()
        
        # Generate SHAP explanation
        features_df = pd.DataFrame([prediction_result['features']])
        explanation = explainer.generate_explanation(features_df, layer)
        
        # Store prediction in Supabase
        prediction_data = {
            'decision': prediction_result['decision'],
            'probability': prediction_result['probability'],
            'explanation_layer': layer,
            'explanation': explanation
        }
        
        db.store_prediction(session_id, prediction_data)
        
        # Prepare response
        response = PredictionResponse(
            decision=prediction_result['decision'],
            probability=prediction_result['probability'],
            explanation_layer=layer,
            explanation=[ExplanationData(**exp) for exp in explanation],
            session_id=session_id
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/response", response_model=ResponseSubmissionResult)
async def submit_participant_response(response: ParticipantResponse):
    """
    Store participant feedback ratings in Supabase
    """
    try:
        _, _, db = get_services()
        
        # Store response
        response_id = db.store_participant_response(response.dict())
        
        if response_id:
            return ResponseSubmissionResult(
                success=True,
                message="Response stored successfully",
                response_id=response_id
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to store response"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit response: {str(e)}"
        )

# ============================================================================
# NEW EXPERIMENTAL FLOW ENDPOINTS
# ============================================================================

@router.post("/create_session", response_model=SessionResponse)
async def create_session(session_data: SessionCreate):
    """
    Create a new participant session with demographic information
    """
    try:
        _, _, db = get_services()
        
        session_id = str(uuid.uuid4())
        
        session_record = {
            'session_id': session_id,
            'participant_name': session_data.participant_name,
            'participant_age': session_data.participant_age,
            'participant_profession': session_data.participant_profession,
            'finance_experience': session_data.finance_experience,
            'ai_familiarity': session_data.ai_familiarity,
            'created_at': datetime.utcnow().isoformat(),
            'completed': False
        }
        
        result = db.create_session(session_record)
        
        if result:
            return SessionResponse(
                session_id=session_id,
                success=True,
                message="Session created successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create session"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Session creation failed: {str(e)}"
        )

@router.post("/pre_response")
async def submit_pre_experiment_response(response: PreExperimentResponse):
    """
    Store pre-experiment questionnaire responses
    """
    try:
        _, _, db = get_services()
        
        response_data = {
            'id': str(uuid.uuid4()),
            'session_id': response.session_id,
            'expectation_ai_decision': response.expectation_ai_decision,
            'expectation_fair_explanation': response.expectation_fair_explanation,
            'expectation_role_explanations': response.expectation_role_explanations,
            'submitted_at': datetime.utcnow().isoformat()
        }
        
        result = db.store_pre_experiment_response(response_data)
        
        if result:
            return {
                "success": True,
                "message": "Pre-experiment response stored successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to store pre-experiment response"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit pre-experiment response: {str(e)}"
        )

@router.post("/post_response")
async def submit_post_experiment_response(response: PostExperimentResponse):
    """
    Store post-experiment questionnaire responses and mark session as complete
    """
    try:
        _, _, db = get_services()
        
        response_data = {
            'id': str(uuid.uuid4()),
            'session_id': response.session_id,
            'best_format': response.best_format,
            'most_credible': response.most_credible,
            'most_useful': response.most_useful,
            'impact_on_perception': response.impact_on_perception,
            'future_recommendations': response.future_recommendations,
            'submitted_at': datetime.utcnow().isoformat()
        }
        
        result = db.store_post_experiment_response(response_data)
        
        # Mark session as completed
        if result:
            if not db.mark_session_complete(response.session_id): raise HTTPException(status_code=500, detail="Failed to mark session as complete")
            return {
                "success": True,
                "message": "Post-experiment response stored successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to store post-experiment response"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit post-experiment response: {str(e)}"
        )

@router.post("/layer_feedback", response_model=LayerFeedbackResponse)
async def submit_layer_feedback(feedback: LayerFeedbackRequest):
    """
    Store participant feedback for a specific explanation layer
    """
    try:
        _, _, db = get_services()
        
        feedback_data = {
            'id': str(uuid.uuid4()),
            'session_id': feedback.session_id,
            'persona_id': feedback.persona_id,
            'layer_id': feedback.layer_id,
            'layer_name': feedback.layer_name,
            'understanding_gained': feedback.understanding_gained,
            'unclear_aspects': feedback.unclear_aspects,
            'customer_confidence': feedback.customer_confidence,
            'interpretation_effort': feedback.interpretation_effort,
            'expectation_difference': feedback.expectation_difference,
            'submitted_at': datetime.utcnow().isoformat()
        }
        
        result = db.store_layer_feedback(feedback_data)
        
        if result:
            return LayerFeedbackResponse(
                success=True,
                message="Layer feedback stored successfully",
                feedback_id=feedback_data['id']
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to store layer feedback"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit layer feedback: {str(e)}"
        )

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Retrieve session data and progress
    """
    try:
        _, _, db = get_services()
        
        session = db.get_session(session_id)
        
        if session:
            return session
        else:
            raise HTTPException(
                status_code=404,
                detail="Session not found"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve session: {str(e)}"
        )


@router.get("/feature-options")
async def get_feature_options():
    """
    Get all available options for categorical features and metadata for numerical features.
    Used by frontend to generate dynamic input forms with correct options.
    
    Returns human-readable feature names and options that will be automatically
    mapped to symbolic codes (A11, A12, etc.) when making predictions.
    """
    try:
        return {
            "success": True,
            "features": FeatureMappings.get_feature_options(),
            "note": "All categorical values will be automatically mapped to symbolic codes used in training"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve feature options: {str(e)}"
        )
