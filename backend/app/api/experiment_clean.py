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
    
    # Section 1: Demographics
    age: int  # 18-99
    gender: str  # female, male, non_binary
    
    # Section 2: Experience & Preferences
    financial_relationship: str  # novice, consumer, financial_literate
    preferred_explanation_style: str  # technical, visual, narrative, action
    
    # Section 3: Trust & Ethics
    ai_trust_instinct: str  # automation_bias, algorithm_aversion, neutral
    ai_fairness_stance: str  # skeptic, conditional, optimist
    
    # Legacy fields (for backward compatibility - optional)
    participant_background: Optional[str] = None
    credit_experience: Optional[str] = None
    ai_familiarity: Optional[int] = None
    background_notes: Optional[str] = None


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
            # New questionnaire fields
            'age': session_data.age,
            'gender': session_data.gender,
            'financial_relationship': session_data.financial_relationship,
            'preferred_explanation_style': session_data.preferred_explanation_style,
            'ai_trust_instinct': session_data.ai_trust_instinct,
            'ai_fairness_stance': session_data.ai_fairness_stance,
            # Legacy fields (optional, for backward compatibility)
            'participant_background': session_data.participant_background,
            'credit_experience': session_data.credit_experience,
            'ai_familiarity': session_data.ai_familiarity,
            'background_notes': session_data.background_notes
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
        
        # Map frontend format to backend format (same as counterfactual endpoint)
        mapped_data = map_frontend_to_backend(application_data)
        print(f"[DEBUG] Mapped application data: {mapped_data}")
        
        # Make prediction
        print("[DEBUG] Starting prediction...")
        prediction_result = xgb_service.predict(mapped_data)
        print(f"[DEBUG] Prediction successful: {prediction_result}")
        
        # Get SHAP explanation for ALL features
        print("[DEBUG] Starting SHAP explanation...")
        shap_explanation = xgb_service.explain_prediction(mapped_data, num_features=50)  # Get all features
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
            'cognitive_load_rating': int(request.get('cognitive_load_rating', 0)),
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


@router.get("/participant/{session_id}")
async def get_participant_details(session_id: str):
    """
    Get comprehensive participant data including demographics, all ratings, and responses.
    For researcher use on the results page.
    """
    try:
        _, _, db = get_services()
        
        # Get session data
        session_data = db.get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail=f"Participant {session_id} not found")
        
        # Get all layer ratings for this session
        ratings_query = """
            SELECT 
                lr.layer_number,
                lr.persona_id,
                lr.understanding_rating,
                lr.communicability_rating,
                lr.cognitive_load_rating,
                lr.time_spent_seconds,
                lr.created_at,
                p.decision as prediction_decision,
                p.probability as prediction_probability
            FROM layer_ratings lr
            LEFT JOIN predictions p ON lr.prediction_id = p.id
            WHERE lr.session_id = %s
            ORDER BY lr.created_at ASC
        """
        ratings_result = db.supabase.rpc('execute_sql', {'query': ratings_query, 'params': [session_id]}).execute()
        layer_ratings = ratings_result.data if ratings_result.data else []
        
        # Get post-questionnaire data
        questionnaire_query = """
            SELECT 
                most_helpful_layer,
                most_trusted_layer,
                best_for_customer,
                overall_intuitiveness,
                ai_usefulness,
                improvement_suggestions,
                created_at
            FROM post_questionnaires
            WHERE session_id = %s
            LIMIT 1
        """
        questionnaire_result = db.supabase.rpc('execute_sql', {'query': questionnaire_query, 'params': [session_id]}).execute()
        questionnaire = questionnaire_result.data[0] if questionnaire_result.data else None
        
        # Format response
        return {
            "session_id": session_id,
            "demographics": {
                "age": session_data.get('age'),
                "gender": session_data.get('gender'),
                "financial_relationship": session_data.get('financial_relationship'),
                "ai_trust_instinct": session_data.get('ai_trust_instinct'),
                "ai_fairness_stance": session_data.get('ai_fairness_stance'),
                "preferred_explanation_style": session_data.get('preferred_explanation_style'),
            },
            "session_info": {
                "created_at": session_data.get('created_at'),
                "completed": session_data.get('completed', False),
                "completed_at": session_data.get('completed_at'),
            },
            "layer_ratings": layer_ratings,
            "post_questionnaire": questionnaire,
            "summary": {
                "total_ratings": len(layer_ratings),
                "personas_completed": len(set(r['persona_id'] for r in layer_ratings if r.get('persona_id'))),
                "avg_understanding": sum(r['understanding_rating'] for r in layer_ratings) / len(layer_ratings) if layer_ratings else 0,
                "avg_communicability": sum(r['communicability_rating'] for r in layer_ratings) / len(layer_ratings) if layer_ratings else 0,
                "avg_cognitive_load": sum(r['cognitive_load_rating'] for r in layer_ratings) / len(layer_ratings) if layer_ratings else 0,
                "total_time_seconds": sum(r['time_spent_seconds'] or 0 for r in layer_ratings),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve participant details: {str(e)}")


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


def map_frontend_to_backend(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map frontend field names and values to backend format.
    Frontend uses human-readable values, backend uses encoded values.
    """
    # Field name mappings
    field_mapping = {
        'checking_account_status': 'checking_status',
        'savings_account': 'savings_status',
        'employment_status': 'employment',
        'present_residence_since': 'residence_since',
        'other_installment_plans': 'other_payment_plans',
        'telephone': 'own_telephone',
        'duration_months': 'duration',
        'installment_rate': 'installment_commitment',
        'property': 'property_magnitude'
    }
    
    # Value mappings for each field
    value_mappings = {
        'checking_status': {
            'less than 0 DM': 'lt_0_dm',
            '0 to 200 DM': '0_to_200_dm',
            'greater than 200 DM': 'ge_200_dm',
            'no checking account': 'no_checking'
        },
        'credit_history': {
            'no credits taken': 'no_credits',
            'all credits paid back': 'all_paid',
            'existing credits paid back': 'existing_paid',
            'existing credits paid back duly': 'existing_paid',
            'delay in paying off in the past': 'delayed_past',
            'critical account': 'critical'
        },
        'purpose': {
            'car (new)': 'car_new',
            'car (used)': 'car_used',
            'furniture/equipment': 'furniture',
            'radio/television': 'radio_tv',
            'domestic appliances': 'domestic_appliances',
            'repairs': 'repairs',
            'education': 'education',
            'retraining': 'retraining',
            'business': 'business',
            'others': 'others'
        },
        'savings_status': {
            'less than 100 DM': 'lt_100_dm',
            '100 to 500 DM': '100_to_500_dm',
            '500 to 1000 DM': '500_to_1000_dm',
            'greater than 1000 DM': 'ge_1000_dm',
            'unknown': 'unknown'
        },
        'employment': {
            'unemployed': 'unemployed',
            'less than 1 year': 'lt_1_year',
            '1 to 4 years': '1_to_4_years',
            '4 to 7 years': '4_to_7_years',
            'greater than 7 years': 'ge_7_years'
        },
        'job': {
            'unemployed/unskilled - non-resident': 'unemployed_unskilled',
            'unskilled - resident': 'unskilled_resident',
            'skilled employee / official': 'skilled',
            'management / self-employed': 'management'
        },
        'property_magnitude': {
            'real estate': 'real_estate',
            'building society savings': 'savings_agreement',
            'car or other': 'car_or_other',
            'unknown/no property': 'unknown_no_property'
        },
        'other_payment_plans': {
            'bank': 'bank',
            'stores': 'stores',
            'none': 'none'
        },
        'own_telephone': {
            'yes': 'yes',
            'no': 'none'
        }
    }
    
    # Start with a copy of the data
    mapped_data = {}
    
    for key, value in data.items():
        # Map field name
        backend_key = field_mapping.get(key, key)
        
        # Handle installment_rate (numeric to categorical)
        if key == 'installment_rate' or backend_key == 'installment_commitment':
            if isinstance(value, (int, float)):
                # Map numeric to categorical
                rate_map = {
                    1: 'lt_20_percent',
                    2: '20_to_25_percent',
                    3: '25_to_35_percent',
                    4: 'ge_35_percent'
                }
                mapped_data['installment_commitment'] = rate_map.get(int(value), 'lt_20_percent')
            else:
                mapped_data['installment_commitment'] = value
            continue
        
        # Map value if mapping exists
        if backend_key in value_mappings and isinstance(value, str):
            # Try exact match first
            mapped_value = value_mappings[backend_key].get(value)
            
            # If no exact match, try case-insensitive match
            if mapped_value is None:
                value_lower = value.lower()
                for key_option, mapped_option in value_mappings[backend_key].items():
                    if key_option.lower() == value_lower:
                        mapped_value = mapped_option
                        break
            
            # Use mapped value if found, otherwise keep original
            mapped_data[backend_key] = mapped_value if mapped_value is not None else value
        else:
            mapped_data[backend_key] = value
    
    return mapped_data


@router.post("/predict-counterfactual")
async def predict_counterfactual(request: Dict[str, Any]):
    """
    Fast prediction endpoint for counterfactual "what-if" analysis.
    Returns only decision and probability - NO SHAP calculation for speed.
    
    Input: { "application_data": { ... all features ... } }
    Output: { "decision": "approved"|"rejected", "probability": 0.85 }
    """
    try:
        print("[DEBUG] Counterfactual request received")
        xgb_service, _, _ = get_services()
        
        # Extract application data
        application_data = request.get("application_data")
        if not application_data:
            print("[ERROR] Missing application_data in request")
            raise HTTPException(status_code=400, detail="Missing application_data")
        
        print(f"[DEBUG] Raw application data: {application_data}")
        
        # Map frontend format to backend format
        mapped_data = map_frontend_to_backend(application_data)
        print(f"[DEBUG] Mapped application data: {mapped_data}")
        
        # Make prediction (fast - no SHAP)
        prediction_result = xgb_service.predict(mapped_data)
        
        print(f"[DEBUG] Prediction result: {prediction_result}")
        
        # Return only decision and probability
        # Note: XGBoost service returns 'confidence' which is the max probability
        return {
            "decision": prediction_result["decision"],
            "probability": prediction_result["confidence"]  # Use confidence as probability
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Counterfactual prediction failed: {str(e)}")
        print(f"[ERROR] Traceback: {error_details}")
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


@router.get("/research-results")
async def get_research_results():
    """
    Get comprehensive research results for analysis.
    Aggregates data from experiment_complete_data and layer_performance_analysis views.
    """
    try:
        _, _, db = get_services()
        
        # Fetch layer performance data with error handling
        try:
            layer_performance_response = db.client.table('layer_performance_analysis').select('*').execute()
            layer_performance = layer_performance_response.data if layer_performance_response.data else []
            print(f"[INFO] Fetched {len(layer_performance)} layer performance records")
        except Exception as view_error:
            print(f"[WARNING] layer_performance_analysis view error: {str(view_error)}")
            layer_performance = []
        
        # Fetch complete session data with error handling
        try:
            session_data_response = db.client.table('experiment_complete_data').select('*').execute()
            session_data = session_data_response.data if session_data_response.data else []
            print(f"[INFO] Fetched {len(session_data)} session data records")
        except Exception as view_error:
            print(f"[WARNING] experiment_complete_data view error: {str(view_error)}")
            session_data = []
        
        # Calculate summary statistics
        total_participants = len(session_data)
        completed_participants = sum(1 for s in session_data if s.get('completed', False))
        total_layer_ratings = sum(s.get('total_layer_ratings', 0) for s in session_data)
        
        # Demographics breakdown
        demographics = {
            'age_distribution': {},
            'gender_distribution': {},
            'financial_relationship_distribution': {},
            'ai_trust_distribution': {},
            'ai_fairness_distribution': {},
            'explanation_style_distribution': {}
        }
        
        for session in session_data:
            # Age groups
            age = session.get('age')
            if age:
                age_group = f"{(age // 10) * 10}-{(age // 10) * 10 + 9}"
                demographics['age_distribution'][age_group] = demographics['age_distribution'].get(age_group, 0) + 1
            
            # Gender
            gender = session.get('gender')
            if gender:
                demographics['gender_distribution'][gender] = demographics['gender_distribution'].get(gender, 0) + 1
            
            # Financial relationship
            fin_rel = session.get('financial_relationship')
            if fin_rel:
                demographics['financial_relationship_distribution'][fin_rel] = demographics['financial_relationship_distribution'].get(fin_rel, 0) + 1
            
            # AI trust
            ai_trust = session.get('ai_trust_instinct')
            if ai_trust:
                demographics['ai_trust_distribution'][ai_trust] = demographics['ai_trust_distribution'].get(ai_trust, 0) + 1
            
            # AI fairness
            ai_fairness = session.get('ai_fairness_stance')
            if ai_fairness:
                demographics['ai_fairness_distribution'][ai_fairness] = demographics['ai_fairness_distribution'].get(ai_fairness, 0) + 1
            
            # Explanation style
            exp_style = session.get('preferred_explanation_style')
            if exp_style:
                demographics['explanation_style_distribution'][exp_style] = demographics['explanation_style_distribution'].get(exp_style, 0) + 1
        
        # Layer rankings
        layer_metrics = {}
        for perf in layer_performance:
            layer_name = perf.get('layer_name', f"Layer {perf.get('layer_number')}")
            if layer_name not in layer_metrics:
                layer_metrics[layer_name] = {
                    'understanding': [],
                    'communicability': [],
                    'cognitive_load': []
                }
            
            layer_metrics[layer_name]['understanding'].append(perf.get('avg_understanding', 0))
            layer_metrics[layer_name]['communicability'].append(perf.get('avg_communicability', 0))
            layer_metrics[layer_name]['cognitive_load'].append(perf.get('avg_cognitive_load', 0))
        
        # Calculate averages per layer
        layer_rankings = {
            'by_understanding': [],
            'by_communicability': [],
            'by_cognitive_load': [],
            'by_preference': []
        }
        
        for layer_name, metrics in layer_metrics.items():
            if metrics['understanding']:
                avg_understanding = sum(metrics['understanding']) / len(metrics['understanding'])
                layer_rankings['by_understanding'].append({'layer': layer_name, 'score': avg_understanding})
            
            if metrics['communicability']:
                avg_communicability = sum(metrics['communicability']) / len(metrics['communicability'])
                layer_rankings['by_communicability'].append({'layer': layer_name, 'score': avg_communicability})
            
            if metrics['cognitive_load']:
                avg_cognitive_load = sum(metrics['cognitive_load']) / len(metrics['cognitive_load'])
                layer_rankings['by_cognitive_load'].append({'layer': layer_name, 'score': avg_cognitive_load})
        
        # Sort rankings
        layer_rankings['by_understanding'].sort(key=lambda x: x['score'], reverse=True)
        layer_rankings['by_communicability'].sort(key=lambda x: x['score'], reverse=True)
        layer_rankings['by_cognitive_load'].sort(key=lambda x: x['score'])  # Lower is better
        
        # Preference counts
        preference_counts = {}
        for session in session_data:
            for field in ['most_helpful_layer', 'most_trusted_layer', 'best_for_customer']:
                layer = session.get(field)
                if layer:
                    preference_counts[layer] = preference_counts.get(layer, 0) + 1
        
        layer_rankings['by_preference'] = [
            {'layer': layer, 'count': count}
            for layer, count in preference_counts.items()
        ]
        layer_rankings['by_preference'].sort(key=lambda x: x['count'], reverse=True)
        
        # Persona comparison
        persona_metrics = {
            'maria': {'understanding': [], 'communicability': [], 'cognitive_load': []},
            'jonas': {'understanding': [], 'communicability': [], 'cognitive_load': []}
        }
        
        for perf in layer_performance:
            persona_id = perf.get('persona_id', '')
            if 'elderly-woman' in persona_id:
                persona_metrics['maria']['understanding'].append(perf.get('avg_understanding', 0))
                persona_metrics['maria']['communicability'].append(perf.get('avg_communicability', 0))
                persona_metrics['maria']['cognitive_load'].append(perf.get('avg_cognitive_load', 0))
            elif 'young-entrepreneur' in persona_id:
                persona_metrics['jonas']['understanding'].append(perf.get('avg_understanding', 0))
                persona_metrics['jonas']['communicability'].append(perf.get('avg_communicability', 0))
                persona_metrics['jonas']['cognitive_load'].append(perf.get('avg_cognitive_load', 0))
        
        persona_comparison = {
            'maria': {
                'avg_understanding': sum(persona_metrics['maria']['understanding']) / len(persona_metrics['maria']['understanding']) if persona_metrics['maria']['understanding'] else 0,
                'avg_communicability': sum(persona_metrics['maria']['communicability']) / len(persona_metrics['maria']['communicability']) if persona_metrics['maria']['communicability'] else 0,
                'avg_cognitive_load': sum(persona_metrics['maria']['cognitive_load']) / len(persona_metrics['maria']['cognitive_load']) if persona_metrics['maria']['cognitive_load'] else 0
            },
            'jonas': {
                'avg_understanding': sum(persona_metrics['jonas']['understanding']) / len(persona_metrics['jonas']['understanding']) if persona_metrics['jonas']['understanding'] else 0,
                'avg_communicability': sum(persona_metrics['jonas']['communicability']) / len(persona_metrics['jonas']['communicability']) if persona_metrics['jonas']['communicability'] else 0,
                'avg_cognitive_load': sum(persona_metrics['jonas']['cognitive_load']) / len(persona_metrics['jonas']['cognitive_load']) if persona_metrics['jonas']['cognitive_load'] else 0
            }
        }
        
        return {
            'layer_performance': layer_performance,
            'session_data': session_data,
            'total_participants': total_participants,
            'completed_participants': completed_participants,
            'total_layer_ratings': total_layer_ratings,
            'demographics': demographics,
            'layer_rankings': layer_rankings,
            'persona_comparison': persona_comparison
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Research results failed: {str(e)}")
        print(f"[ERROR] Traceback: {error_details}")
        
        # Return empty but valid structure instead of 500 error
        return {
            'layer_performance': [],
            'session_data': [],
            'total_participants': 0,
            'completed_participants': 0,
            'total_layer_ratings': 0,
            'demographics': {
                'age_distribution': {},
                'gender_distribution': {},
                'financial_relationship_distribution': {},
                'ai_trust_distribution': {},
                'ai_fairness_distribution': {},
                'explanation_style_distribution': {}
            },
            'layer_rankings': {
                'by_understanding': [],
                'by_communicability': [],
                'by_cognitive_load': [],
                'by_preference': []
            },
            'persona_comparison': {
                'maria': {'avg_understanding': 0, 'avg_communicability': 0, 'avg_cognitive_load': 0},
                'jonas': {'avg_understanding': 0, 'avg_communicability': 0, 'avg_cognitive_load': 0}
            },
            'error': str(e),
            'message': 'No data available yet or database views not created'
        }


@router.get("/debug/raw-data")
async def get_raw_debug_data():
    """
    Debug endpoint to check raw table data (not views).
    Helps diagnose why views might be empty.
    """
    try:
        _, _, db = get_services()
        
        # Get ALL sessions (not just 10)
        sessions_response = db.client.table('sessions').select('session_id, consent_given, completed').execute()
        sessions = sessions_response.data if sessions_response.data else []
        
        # Get ALL layer_ratings (not just 10)
        ratings_response = db.client.table('layer_ratings').select('session_id').execute()
        ratings = ratings_response.data if ratings_response.data else []
        
        # Get unique session_ids from each table
        session_ids_in_sessions = set(s['session_id'] for s in sessions)
        session_ids_in_ratings = set(r['session_id'] for r in ratings)
        
        # Find matching and non-matching IDs
        matching_ids = session_ids_in_sessions & session_ids_in_ratings
        only_in_sessions = session_ids_in_sessions - session_ids_in_ratings
        only_in_ratings = session_ids_in_ratings - session_ids_in_sessions
        
        # Get sample of matching sessions
        matching_sessions = [s for s in sessions if s['session_id'] in matching_ids][:5]
        
        return {
            'total_sessions': len(sessions),
            'total_ratings': len(ratings),
            'unique_session_ids_in_sessions': len(session_ids_in_sessions),
            'unique_session_ids_in_ratings': len(session_ids_in_ratings),
            'matching_session_ids': len(matching_ids),
            'only_in_sessions_table': len(only_in_sessions),
            'only_in_ratings_table': len(only_in_ratings),
            'matching_sessions_sample': matching_sessions,
            'orphaned_rating_sessions': list(only_in_ratings)[:5],
            'message': 'Session ID matching analysis'
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Debug endpoint failed: {str(e)}")
        print(f"[ERROR] Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")


@router.get("/debug/views")
async def get_view_debug_data():
    """
    Debug endpoint to check what the views actually return.
    """
    try:
        _, _, db = get_services()
        
        # Try to get data from views
        try:
            layer_perf_response = db.client.table('layer_performance_analysis').select('*').limit(5).execute()
            layer_perf = layer_perf_response.data if layer_perf_response.data else []
        except Exception as e:
            layer_perf = []
            layer_perf_error = str(e)
        
        try:
            complete_data_response = db.client.table('experiment_complete_data').select('*').limit(5).execute()
            complete_data = complete_data_response.data if complete_data_response.data else []
        except Exception as e:
            complete_data = []
            complete_data_error = str(e)
        
        # Also try a direct query to see what's in sessions with ratings
        try:
            direct_query = db.client.table('sessions').select('session_id, consent_given, completed').eq('consent_given', True).execute()
            sessions_with_consent = direct_query.data if direct_query.data else []
        except Exception as e:
            sessions_with_consent = []
            sessions_error = str(e)
        
        return {
            'layer_performance_count': len(layer_perf),
            'layer_performance_sample': layer_perf,
            'layer_performance_error': layer_perf_error if 'layer_perf_error' in locals() else None,
            'experiment_complete_data_count': len(complete_data),
            'experiment_complete_data_sample': complete_data,
            'complete_data_error': complete_data_error if 'complete_data_error' in locals() else None,
            'sessions_with_consent_count': len(sessions_with_consent),
            'sessions_with_consent_sample': sessions_with_consent[:5],
            'sessions_error': sessions_error if 'sessions_error' in locals() else None,
            'message': 'View data analysis'
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] View debug failed: {str(e)}")
        print(f"[ERROR] Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"View debug failed: {str(e)}")
