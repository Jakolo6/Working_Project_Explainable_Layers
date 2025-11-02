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
    LayerFeedbackResponse,
    PersonaPredictionRequest,
    PersonaPredictionResponse,
    SHAPFeature,
    LayerRatingRequest,
    LayerRatingResponse,
    PostQuestionnaireRequest,
    PostQuestionnaireResponse
)
from app.services.xgboost_model import CreditModel
from app.services.shap_service import SHAPExplainer
from app.services.supabase_service import SupabaseService
from app.services.feature_mappings import FeatureMappings
from app.config import get_settings
import pandas as pd
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/v1/experiment", tags=["experiment"])

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

# ============================================================================
# EXPERIMENTAL FLOW ENDPOINTS
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

# ============================================================================
# PERSONA PREDICTION ENDPOINT
# ============================================================================

@router.post("/predict_persona", response_model=PersonaPredictionResponse)
async def predict_persona(request: PersonaPredictionRequest):
    """
    Generate AI credit decision for a persona with SHAP explanations.
    This endpoint:
    1. Takes persona application data
    2. Runs XGBoost model prediction
    3. Calculates SHAP values for explanation
    4. Returns decision + probability + top SHAP features
    """
    try:
        model, explainer, db = get_services()
        
        # Convert application data to model input format
        app_data = request.application_data.dict()
        print(f"Received application data: {app_data}")
        
        # Helper function to map frontend string values to backend expected format
        def map_frontend_to_backend(app_data):
            """Map frontend field values to backend FeatureMappings expected format"""
            
            # Map credit history
            credit_history_map = {
                'no credits taken/all paid back': 'no_credits',
                'all credits paid back duly': 'all_paid',
                'existing credits paid back duly': 'existing_paid',
                'delay in paying off in the past': 'delay',
                'critical account': 'critical'
            }
            
            # Map purpose
            purpose_map = {
                'car (new)': 'car_new',
                'car (used)': 'car_used',
                'furniture/equipment': 'furniture',
                'radio/television': 'radio_tv',
                'domestic appliances': 'appliances',
                'repairs': 'repairs',
                'education': 'education',
                'retraining': 'retraining',
                'business': 'business',
                'others': 'others'
            }
            
            # Map housing
            housing_map = {
                'rent': 'rent',
                'own': 'own',
                'for free': 'free'
            }
            
            # Map job
            job_map = {
                'unemployed/unskilled - non-resident': 'unemployed',
                'unskilled - resident': 'unskilled',
                'skilled employee': 'skilled',
                'management/self-employed': 'management'
            }
            
            # Map other debtors
            other_debtors_map = {
                'none': 'none',
                'co-applicant': 'co_applicant',
                'guarantor': 'guarantor'
            }
            
            # Map other installment plans
            other_plans_map = {
                'none': 'none',
                'bank': 'bank',
                'stores': 'stores'
            }
            
            # Map property
            property_map = {
                'real estate': 'real_estate',
                'building society savings/life insurance': 'savings_insurance',
                'car or other': 'car',
                'unknown/no property': 'none'
            }
            
            # Map employment status to years (approximate)
            employment_map = {
                'unemployed': 0,
                'less than 1 year': 0.5,
                '1 to 4 years': 2.5,
                '4 to 7 years': 5.5,
                '7 years or more': 10
            }
            
            # Map checking account status to balance (exact frontend values)
            checking_map = {
                'less than 0 DM': -100,
                '0 to 200 DM': 100,
                '200 DM or more': 500,
                'no checking account': None
            }
            
            # Map savings account to balance (exact frontend values)
            savings_map = {
                'less than 100 DM': 50,
                '100 to 500 DM': 300,
                '500 to 1000 DM': 750,
                '1000 DM or more': 2000,
                'unknown/no savings': None
            }
            
            return {
                'age': app_data['age'],
                'credit_amount': app_data['credit_amount'],
                'duration_months': app_data['duration_months'],
                'installment_rate': app_data['installment_rate'],
                'residence_years': app_data['present_residence_since'],
                'existing_credits': app_data['existing_credits'],
                'dependents': app_data['num_dependents'],
                'credit_history': credit_history_map.get(app_data['credit_history'], 'existing_paid'),
                'purpose': purpose_map.get(app_data['purpose'], 'others'),
                'housing': housing_map.get(app_data['housing'], 'own'),
                'job': job_map.get(app_data['job'], 'skilled'),
                'other_debtors': other_debtors_map.get(app_data['other_debtors'], 'none'),
                'other_plans': other_plans_map.get(app_data['other_installment_plans'], 'none'),
                'property': property_map.get(app_data['property'], 'none'),
                'employment_years': employment_map.get(app_data['employment_status'], 2.5),
                'telephone': app_data['telephone'] == 'yes',
                'checking_balance': checking_map.get(app_data['checking_account_status']),
                'savings_balance': savings_map.get(app_data['savings_account']),
            }
        
        input_dict = map_frontend_to_backend(app_data)
        
        # Make prediction (is_human_readable=True so it will map the values)
        prediction_result = model.predict(input_dict, is_human_readable=True)
        decision = prediction_result['decision']
        probability = prediction_result['confidence']  # Use 'confidence' key from predict()
        
        # Get SHAP values for explanation
        features_scaled_df = pd.DataFrame([prediction_result['features_scaled']])
        features_raw_dict = prediction_result['features_raw']
        
        # Calculate SHAP values
        shap_values = explainer.explainer.shap_values(features_scaled_df)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Get positive class SHAP values
        
        # Get top 10 SHAP features
        feature_names = model.feature_names
        
        # Create list of (feature_name, shap_value, raw_value)
        shap_importance = []
        for feat_name, shap_val in zip(feature_names, shap_values[0]):
            # Get raw value from dict, use scaled value as fallback
            raw_val = features_raw_dict.get(feat_name, prediction_result['features_scaled'].get(feat_name, 0))
            shap_importance.append((feat_name, shap_val, raw_val))
        
        shap_importance_sorted = sorted(shap_importance, key=lambda x: abs(x[1]), reverse=True)[:10]
        
        # Format SHAP features for response
        shap_features = []
        for feat_name, shap_val, feat_val in shap_importance_sorted:
            shap_features.append(SHAPFeature(
                feature=feat_name,
                value=str(feat_val),
                shap_value=float(shap_val),
                impact="positive" if shap_val > 0 else "negative"
            ))
        
        # Generate prediction ID
        prediction_id = str(uuid.uuid4())
        
        # Store prediction in database (optional - for tracking)
        try:
            prediction_record = {
                'id': prediction_id,
                'session_id': request.session_id,
                'persona_id': request.persona_id,
                'decision': decision,
                'probability': float(probability),
                'shap_values': [f.dict() for f in shap_features],
                'timestamp': datetime.utcnow().isoformat()
            }
            # Note: You may want to store this in Supabase predictions table
        except Exception as e:
            print(f"Warning: Failed to store prediction: {e}")
        
        return PersonaPredictionResponse(
            session_id=request.session_id,
            persona_id=request.persona_id,
            decision=decision,
            probability=float(probability),
            shap_features=shap_features,
            prediction_id=prediction_id
        )
        
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate prediction: {str(e)}"
        )

@router.post("/submit_layer_rating", response_model=LayerRatingResponse)
async def submit_layer_rating(
    rating: LayerRatingRequest,
    supabase: SupabaseService = Depends(lambda: SupabaseService())
):
    """
    Submit rating for an explanation layer.
    Stores participant's ratings and feedback for a specific layer.
    """
    try:
        # Create rating record
        rating_id = str(uuid.uuid4())
        rating_data = {
            "id": rating_id,
            "session_id": rating.session_id,
            "persona_id": rating.persona_id,
            "layer_number": rating.layer_number,
            "layer_name": rating.layer_name,
            "trust_rating": rating.trust_rating,
            "understanding_rating": rating.understanding_rating,
            "usefulness_rating": rating.usefulness_rating,
            "mental_effort_rating": rating.mental_effort_rating,
            "comment": rating.comment,
            "time_spent_seconds": rating.time_spent_seconds,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in Supabase
        result = supabase.client.table("layer_ratings").insert(rating_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to store rating in database"
            )
        
        return LayerRatingResponse(
            success=True,
            message="Rating submitted successfully",
            rating_id=rating_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting layer rating: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit rating: {str(e)}"
        )

@router.post("/submit_post_questionnaire", response_model=PostQuestionnaireResponse)
async def submit_post_questionnaire(
    questionnaire: PostQuestionnaireRequest,
    supabase: SupabaseService = Depends(lambda: SupabaseService())
):
    """
    Submit post-experiment questionnaire.
    Stores participant's overall feedback after completing all personas.
    """
    try:
        # Create questionnaire record
        questionnaire_id = str(uuid.uuid4())
        questionnaire_data = {
            "id": questionnaire_id,
            "session_id": questionnaire.session_id,
            "overall_experience": questionnaire.overall_experience,
            "explanation_helpfulness": questionnaire.explanation_helpfulness,
            "preferred_layer": questionnaire.preferred_layer,
            "would_trust_ai": questionnaire.would_trust_ai,
            "comments": questionnaire.comments,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in Supabase
        result = supabase.client.table("post_questionnaires").insert(questionnaire_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to store questionnaire in database"
            )
        
        return PostQuestionnaireResponse(
            success=True,
            message="Questionnaire submitted successfully",
            questionnaire_id=questionnaire_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting post-questionnaire: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit questionnaire: {str(e)}"
        )
