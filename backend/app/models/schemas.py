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
