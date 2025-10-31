# Pydantic schemas for API request/response validation

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class CreditApplicationInput(BaseModel):
    """Input schema for credit application prediction"""
    age: int = Field(..., ge=18, le=100, description="Applicant age")
    employment_duration: int = Field(..., ge=0, description="Employment duration in months")
    income: float = Field(..., gt=0, description="Monthly income")
    credit_amount: float = Field(..., gt=0, description="Requested credit amount")
    duration: int = Field(..., ge=1, le=72, description="Credit duration in months")
    existing_credits: int = Field(default=1, ge=0, description="Number of existing credits")
    dependents: int = Field(default=0, ge=0, description="Number of dependents")
    housing: str = Field(..., description="Housing status: own, rent, or free")
    job: str = Field(..., description="Job type: skilled, unskilled, management, or unemployed")
    purpose: str = Field(..., description="Credit purpose: car, education, furniture, etc.")

class ExplanationData(BaseModel):
    """SHAP explanation output"""
    feature: str
    value: float
    contribution: float

class PredictionResponse(BaseModel):
    """Response schema for credit prediction"""
    decision: str = Field(..., description="approved or rejected")
    probability: float = Field(..., ge=0, le=1, description="Approval probability")
    explanation_layer: str = Field(..., description="Assigned explanation type")
    explanation: List[ExplanationData] = Field(..., description="SHAP feature contributions")
    session_id: str = Field(..., description="Unique session identifier")

class ParticipantResponse(BaseModel):
    """Participant feedback submission"""
    session_id: str
    trust_rating: int = Field(..., ge=1, le=7, description="Trust in AI decision (1-7)")
    understanding_rating: int = Field(..., ge=1, le=7, description="Understanding of explanation (1-7)")
    usefulness_rating: int = Field(..., ge=1, le=7, description="Usefulness of explanation (1-7)")
    mental_effort_rating: int = Field(..., ge=1, le=7, description="Mental effort required (1-7)")
    decision: str
    probability: float
    explanation_layer: str

class ResponseSubmissionResult(BaseModel):
    """Result of storing participant response"""
    success: bool
    message: str
    response_id: Optional[str] = None

# ============================================================================
# NEW EXPERIMENTAL FLOW SCHEMAS
# ============================================================================

class SessionCreate(BaseModel):
    """Schema for creating a new participant session"""
    participant_name: str = Field(..., min_length=2, description="Participant's full name")
    participant_age: Optional[int] = Field(None, ge=18, le=100, description="Participant's age")
    participant_profession: str = Field(..., min_length=2, description="Participant's profession")
    finance_experience: str = Field(..., description="Experience level with finance")
    ai_familiarity: int = Field(..., ge=1, le=5, description="AI familiarity rating (1-5)")

class SessionResponse(BaseModel):
    """Response after creating a session"""
    session_id: str
    success: bool
    message: str

class PreExperimentResponse(BaseModel):
    """Pre-experiment questionnaire responses"""
    session_id: str
    expectation_ai_decision: str = Field(..., min_length=10, description="What participant expects AI to show")
    expectation_fair_explanation: str = Field(..., min_length=10, description="What would make explanation feel fair")
    expectation_role_explanations: str = Field(..., min_length=10, description="Role of explanations in AI banking")

class PostExperimentResponse(BaseModel):
    """Post-experiment questionnaire responses"""
    session_id: str
    best_format: str = Field(..., min_length=10, description="Which format helped understanding best")
    most_credible: str = Field(..., min_length=10, description="Which format felt most credible")
    most_useful: str = Field(..., min_length=10, description="Which format would be most useful")
    impact_on_perception: str = Field(..., min_length=10, description="Impact on AI perception")
    future_recommendations: str = Field(..., min_length=10, description="Recommendations for future systems")

class LayerFeedbackRequest(BaseModel):
    """Feedback for a specific explanation layer"""
    session_id: str
    persona_id: str = Field(..., description="Persona identifier (1, 2, or 3)")
    layer_id: int = Field(..., ge=1, le=4, description="Layer number (1-4)")
    layer_name: str = Field(..., description="Layer name (e.g., 'Basic SHAP', 'Textual')")
    understanding_gained: str = Field(..., min_length=10, description="What was understood")
    unclear_aspects: str = Field(..., min_length=10, description="What remained unclear")
    customer_confidence: str = Field(..., min_length=10, description="Confidence explaining to customer")
    interpretation_effort: int = Field(..., ge=1, le=7, description="Effort to interpret (1-7)")
    expectation_difference: str = Field(..., min_length=10, description="How it differed from expectations")

class LayerFeedbackResponse(BaseModel):
    """Response after submitting layer feedback"""
    success: bool
    message: str
    feedback_id: str
