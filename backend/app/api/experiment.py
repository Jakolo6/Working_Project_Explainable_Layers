# Experiment API endpoints for prediction and response submission

from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    CreditApplicationInput, 
    PredictionResponse, 
    ParticipantResponse,
    ResponseSubmissionResult,
    ExplanationData
)
from app.services.xgboost_model import CreditModel
from app.services.shap_service import SHAPExplainer
from app.services.supabase_service import SupabaseService
from app.config import get_settings
import pandas as pd
import uuid

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
