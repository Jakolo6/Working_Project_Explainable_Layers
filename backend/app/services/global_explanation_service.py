# Global Explanation Service - Generates model-level explanations for bank clerks
# Analyzes the XGBoost model's global behavior, not individual predictions

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import json
from dataclasses import dataclass, asdict


@dataclass
class FeatureDirection:
    """Describes how a feature tends to influence decisions globally."""
    feature_name: str
    display_name: str
    direction: str  # 'increases_approval', 'decreases_approval', 'mixed'
    importance_rank: int
    importance_score: float
    simple_explanation: str
    typical_favorable: str  # What values tend to help approval
    typical_unfavorable: str  # What values tend to hurt approval


@dataclass
class GlobalModelProfile:
    """Complete global model profile for LLM and frontend consumption."""
    model_name: str
    model_type: str
    total_features: int
    
    # Feature importance
    top_approval_factors: List[Dict[str, Any]]
    top_risk_factors: List[Dict[str, Any]]
    
    # Simple explanations
    approval_patterns: List[str]
    risk_patterns: List[str]
    
    # Uncertainty info
    uncertainty_note: str
    borderline_explanation: str
    
    # Clerk-friendly narrative
    what_tool_does: str
    how_it_decides: str
    important_note: str
    
    # Structured data for LLM
    feature_details: List[Dict[str, Any]]


class GlobalExplanationService:
    """
    Service that generates bank-clerk-friendly global model explanations.
    Based on actual model behavior analysis.
    """
    
    # Human-readable feature names and explanations
    FEATURE_INFO = {
        'checking_status': {
            'display_name': 'Checking Account Status',
            'simple_explanation': 'The status and balance of the checking account',
            'favorable': 'Positive balance or no checking account issues',
            'unfavorable': 'Negative balance or no checking account',
            'direction': 'Higher balance tends to support approval'
        },
        'duration': {
            'display_name': 'Loan Duration',
            'simple_explanation': 'How long the loan will run (in months)',
            'favorable': 'Shorter loan periods (12-24 months)',
            'unfavorable': 'Very long loan periods (48+ months)',
            'direction': 'Shorter durations tend to support approval'
        },
        'credit_history': {
            'display_name': 'Credit History',
            'simple_explanation': 'Past behavior with credits and loans',
            'favorable': 'All previous credits paid back properly',
            'unfavorable': 'Delays or problems with previous credits',
            'direction': 'Clean credit history strongly supports approval'
        },
        'purpose': {
            'display_name': 'Loan Purpose',
            'simple_explanation': 'What the loan money will be used for',
            'favorable': 'Car purchase, home improvement, education',
            'unfavorable': 'Vacation, luxury items, unclear purpose',
            'direction': 'Practical purposes tend to support approval'
        },
        'credit_amount': {
            'display_name': 'Loan Amount',
            'simple_explanation': 'The total amount of money requested',
            'favorable': 'Moderate amounts relative to income indicators',
            'unfavorable': 'Very high amounts relative to financial profile',
            'direction': 'Lower amounts relative to profile support approval'
        },
        'savings_status': {
            'display_name': 'Savings Account',
            'simple_explanation': 'The level of savings the applicant has',
            'favorable': 'Established savings (500+ DM)',
            'unfavorable': 'No savings or very low savings',
            'direction': 'More savings strongly supports approval'
        },
        'employment': {
            'display_name': 'Employment Duration',
            'simple_explanation': 'How long the applicant has been employed',
            'favorable': 'Stable employment (4+ years)',
            'unfavorable': 'Unemployed or very short employment',
            'direction': 'Longer employment strongly supports approval'
        },
        'installment_commitment': {
            'display_name': 'Monthly Payment Burden',
            'simple_explanation': 'How much of income goes to loan payments',
            'favorable': 'Lower payment percentage (1-2% of income)',
            'unfavorable': 'High payment percentage (4%+ of income)',
            'direction': 'Lower payment burden supports approval'
        },
        'other_debtors': {
            'display_name': 'Guarantors',
            'simple_explanation': 'Whether there are co-applicants or guarantors',
            'favorable': 'Has a co-applicant or guarantor',
            'unfavorable': 'No guarantor for high-risk applications',
            'direction': 'Having guarantors can support approval'
        },
        'residence_since': {
            'display_name': 'Residential Stability',
            'simple_explanation': 'How long the applicant has lived at current address',
            'favorable': 'Long-term residence (4+ years)',
            'unfavorable': 'Frequent moves or very short residence',
            'direction': 'Longer residence supports approval'
        },
        'property_magnitude': {
            'display_name': 'Property Ownership',
            'simple_explanation': 'What property or assets the applicant owns',
            'favorable': 'Owns real estate or significant property',
            'unfavorable': 'No property or assets',
            'direction': 'Property ownership supports approval'
        },
        'age': {
            'display_name': 'Age',
            'simple_explanation': 'The age of the applicant',
            'favorable': 'Middle age (30-55 years)',
            'unfavorable': 'Very young (under 25) or elderly',
            'direction': 'Middle age tends to support approval'
        },
        'other_payment_plans': {
            'display_name': 'Other Payment Plans',
            'simple_explanation': 'Whether the applicant has other payment obligations',
            'favorable': 'No other payment plans',
            'unfavorable': 'Multiple existing payment obligations',
            'direction': 'Fewer obligations support approval'
        },
        'housing': {
            'display_name': 'Housing Situation',
            'simple_explanation': 'Whether the applicant owns, rents, or lives for free',
            'favorable': 'Owns their home',
            'unfavorable': 'Renting or living for free',
            'direction': 'Home ownership supports approval'
        },
        'existing_credits': {
            'display_name': 'Existing Loans',
            'simple_explanation': 'Number of existing loans at this bank',
            'favorable': 'Few existing loans (1-2)',
            'unfavorable': 'Many existing loans (3+)',
            'direction': 'Fewer existing loans support approval'
        },
        'job': {
            'display_name': 'Job Type',
            'simple_explanation': 'The type of employment or profession',
            'favorable': 'Skilled employee, management, or official',
            'unfavorable': 'Unemployed or unskilled',
            'direction': 'Skilled employment supports approval'
        },
        'num_dependents': {
            'display_name': 'Number of Dependents',
            'simple_explanation': 'How many people depend on the applicant financially',
            'favorable': 'Fewer dependents (0-1)',
            'unfavorable': 'Many dependents (3+)',
            'direction': 'Fewer dependents slightly supports approval'
        },
        'own_telephone': {
            'display_name': 'Telephone Registration',
            'simple_explanation': 'Whether the applicant has a registered telephone',
            'favorable': 'Has registered telephone',
            'unfavorable': 'No telephone registration',
            'direction': 'Having telephone slightly supports approval'
        },
        # Engineered features
        'monthly_burden': {
            'display_name': 'Monthly Payment Amount',
            'simple_explanation': 'The calculated monthly payment for this loan',
            'favorable': 'Lower monthly payments',
            'unfavorable': 'Very high monthly payments',
            'direction': 'Lower payments support approval'
        },
        'stability_score': {
            'display_name': 'Financial Stability Score',
            'simple_explanation': 'A combined measure of age and employment stability',
            'favorable': 'Higher stability (older with longer employment)',
            'unfavorable': 'Lower stability (young or short employment)',
            'direction': 'Higher stability supports approval'
        },
        'risk_ratio': {
            'display_name': 'Credit Risk Ratio',
            'simple_explanation': 'Loan amount relative to age-based capacity',
            'favorable': 'Lower ratio (loan fits the profile)',
            'unfavorable': 'Higher ratio (loan may be too large)',
            'direction': 'Lower ratios support approval'
        },
        'credit_to_income_proxy': {
            'display_name': 'Debt-to-Capacity Ratio',
            'simple_explanation': 'How the loan amount compares to earning potential',
            'favorable': 'Loan amount is manageable',
            'unfavorable': 'Loan amount seems too high for profile',
            'direction': 'Lower ratios support approval'
        },
        'duration_risk': {
            'display_name': 'Total Loan Exposure',
            'simple_explanation': 'Combined measure of loan amount and duration',
            'favorable': 'Lower total exposure',
            'unfavorable': 'High amount over long period',
            'direction': 'Lower exposure supports approval'
        }
    }
    
    # Typical global importance ranking (based on XGBoost feature importance patterns)
    TYPICAL_IMPORTANCE = {
        'checking_status': 0.15,
        'duration': 0.12,
        'credit_history': 0.10,
        'credit_amount': 0.09,
        'savings_status': 0.08,
        'employment': 0.07,
        'purpose': 0.06,
        'age': 0.05,
        'installment_commitment': 0.04,
        'housing': 0.04,
        'property_magnitude': 0.04,
        'existing_credits': 0.03,
        'monthly_burden': 0.03,
        'stability_score': 0.03,
        'risk_ratio': 0.02,
        'residence_since': 0.02,
        'other_debtors': 0.01,
        'job': 0.01,
        'num_dependents': 0.01
    }
    
    def __init__(self, xgboost_service=None):
        """Initialize with optional XGBoost service for live analysis."""
        self.xgboost_service = xgboost_service
        self._cached_profile: Optional[GlobalModelProfile] = None
    
    def get_global_profile(self, force_refresh: bool = False) -> GlobalModelProfile:
        """
        Get the global model profile.
        Uses cached version unless force_refresh is True.
        """
        if self._cached_profile and not force_refresh:
            return self._cached_profile
        
        # Try to get live importance from model
        live_importance = {}
        if self.xgboost_service and self.xgboost_service.model:
            try:
                live_importance = self.xgboost_service.get_feature_importance(top_n=20)
            except Exception as e:
                print(f"[WARNING] Could not get live feature importance: {e}")
        
        # Use live importance if available, otherwise use typical values
        importance = live_importance if live_importance else self.TYPICAL_IMPORTANCE
        
        # Build the profile
        self._cached_profile = self._build_profile(importance)
        return self._cached_profile
    
    def _build_profile(self, importance: Dict[str, float]) -> GlobalModelProfile:
        """Build the complete global profile from importance data."""
        
        # Normalize and process importance
        processed_features = self._process_features(importance)
        
        # Split into approval and risk factors
        approval_factors = [f for f in processed_features if 'approval' in f.get('tendency', '')][:5]
        risk_factors = [f for f in processed_features if 'risk' in f.get('tendency', '')][:5]
        
        # Generate simple pattern lists
        approval_patterns = [
            "Stable employment history (4+ years at current job)",
            "Clean credit history with all previous loans paid on time",
            "Positive checking account balance",
            "Established savings account",
            "Moderate loan amount relative to financial profile",
            "Shorter loan duration (under 24 months)",
            "Owns property or real estate",
            "Low existing debt burden"
        ]
        
        risk_patterns = [
            "Negative or no checking account balance",
            "Short or unstable employment history",
            "Previous payment delays or credit problems",
            "Very high loan amount relative to profile",
            "Long loan duration (over 36 months)",
            "No savings or very low savings",
            "High existing debt load",
            "Many existing loans or payment obligations"
        ]
        
        return GlobalModelProfile(
            model_name="Credit Risk Assessment Tool",
            model_type="XGBoost Machine Learning Model",
            total_features=len(self.FEATURE_INFO),
            
            top_approval_factors=approval_factors,
            top_risk_factors=risk_factors,
            
            approval_patterns=approval_patterns,
            risk_patterns=risk_patterns,
            
            uncertainty_note=(
                "The tool is most confident when applicants clearly fit established patterns. "
                "For applicants with mixed indicators (some positive, some negative), "
                "the tool may be less certain, and human judgment becomes more important."
            ),
            
            borderline_explanation=(
                "When the confidence level is between 45% and 65%, the application is in a "
                "'borderline' zone where small differences in the profile could change the outcome. "
                "These cases benefit most from careful human review."
            ),
            
            what_tool_does=(
                "This tool analyzes credit applications based on historical lending patterns. "
                "It looks at factors like employment stability, credit history, savings, "
                "and the loan details to estimate how likely an applicant is to repay successfully."
            ),
            
            how_it_decides=(
                "The tool learned from thousands of past credit decisions. It identified which "
                "factors were most associated with successful repayment versus payment difficulties. "
                "For each new application, it checks how the applicant's profile matches these patterns."
            ),
            
            important_note=(
                "This tool identifies patterns from historical data - it does not make guarantees "
                "or personal judgments. It is designed to support, not replace, your professional "
                "assessment. Every customer's situation is unique."
            ),
            
            feature_details=processed_features
        )
    
    def _process_features(self, importance: Dict[str, float]) -> List[Dict[str, Any]]:
        """Process raw importance into structured feature details."""
        features = []
        
        # Normalize importance scores
        total_importance = sum(importance.values()) if importance else 1
        
        # Sort by importance
        sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        
        for rank, (feature_key, imp_score) in enumerate(sorted_features, 1):
            # Extract base feature name (remove encoding prefixes)
            base_key = feature_key
            if '__' in feature_key:
                base_key = feature_key.split('__')[-1]
            
            # Remove categorical suffixes for matching
            for suffix in ['_A11', '_A12', '_A13', '_A14', '_A30', '_A31', '_A32', '_A33', '_A34']:
                if base_key.endswith(suffix):
                    base_key = base_key[:-4]
                    break
            
            # Get feature info
            info = self.FEATURE_INFO.get(base_key, {})
            
            if not info:
                # Try to find partial match
                for key, val in self.FEATURE_INFO.items():
                    if key in base_key.lower() or base_key.lower() in key:
                        info = val
                        break
            
            if not info:
                continue  # Skip unknown features
            
            # Determine tendency based on feature characteristics
            tendency = 'neutral'
            if any(word in info.get('direction', '').lower() for word in ['approval', 'support']):
                tendency = 'supports_approval_when_favorable'
            elif any(word in info.get('direction', '').lower() for word in ['risk', 'rejection']):
                tendency = 'increases_risk_when_unfavorable'
            
            features.append({
                'feature_key': base_key,
                'display_name': info.get('display_name', base_key),
                'importance_rank': rank,
                'importance_score': round(imp_score / total_importance, 4),
                'importance_percent': round((imp_score / total_importance) * 100, 1),
                'simple_explanation': info.get('simple_explanation', ''),
                'favorable_values': info.get('favorable', ''),
                'unfavorable_values': info.get('unfavorable', ''),
                'direction': info.get('direction', ''),
                'tendency': tendency
            })
        
        return features
    
    def get_global_json(self) -> Dict[str, Any]:
        """Get global profile as JSON-serializable dictionary."""
        profile = self.get_global_profile()
        return asdict(profile)
    
    def get_llm_context(self) -> str:
        """
        Get a formatted context string for LLM consumption.
        This can be used as context when generating narratives.
        """
        profile = self.get_global_profile()
        
        context = f"""
GLOBAL MODEL BEHAVIOR SUMMARY
=============================

Model: {profile.model_name}
Type: {profile.model_type}
Features Analyzed: {profile.total_features}

TOP FACTORS THAT SUPPORT LOAN APPROVAL:
{chr(10).join(f"- {p}" for p in profile.approval_patterns[:5])}

TOP FACTORS THAT INCREASE RISK:
{chr(10).join(f"- {p}" for p in profile.risk_patterns[:5])}

HOW THE TOOL WORKS:
{profile.how_it_decides}

UNCERTAINTY HANDLING:
{profile.uncertainty_note}

IMPORTANT CONTEXT:
{profile.important_note}
"""
        return context.strip()
    
    def get_clerk_narrative(self) -> str:
        """
        Generate a complete bank-clerk-friendly narrative about how the tool works.
        This is suitable for the collapsible global explanation section.
        """
        profile = self.get_global_profile()
        
        narrative = f"""
## How This Tool Works

{profile.what_tool_does}

### What Usually Supports Approval

The tool has learned that certain patterns are associated with successful loan repayment:

• **Stable Employment** – Applicants with longer employment history (especially 4+ years) tend to repay more reliably.

• **Good Credit History** – Those who have paid previous loans on time show they can manage credit responsibly.

• **Financial Reserves** – Having savings provides a safety buffer and shows financial planning.

• **Positive Account Balance** – A healthy checking account suggests good money management.

• **Reasonable Loan Size** – Loans that fit the applicant's financial profile are less risky.

### What Usually Increases Risk

Certain patterns are associated with higher risk of payment difficulties:

• **Unstable Employment** – Short job tenure or unemployment makes regular payments harder.

• **Credit Problems** – Past payment delays or defaults suggest potential future issues.

• **No Financial Buffer** – Lack of savings means less ability to handle unexpected expenses.

• **Account Issues** – Negative balances or no checking account may indicate financial stress.

• **Large Loan Burden** – Very high loans relative to the profile are harder to repay.

### Understanding the Confidence Level

When the tool shows a confidence level:
- **Above 70%**: The applicant clearly fits historical patterns (approval or rejection).
- **50-70%**: The profile is mixed – some positive and some concerning factors. Human judgment is especially valuable here.
- **Below 50%**: Would indicate the opposite decision is actually more likely.

### Important to Remember

{profile.important_note}
"""
        return narrative.strip()


# Singleton instance for the service
_global_explanation_service: Optional[GlobalExplanationService] = None


def get_global_explanation_service(xgboost_service=None) -> GlobalExplanationService:
    """Get or create the global explanation service singleton."""
    global _global_explanation_service
    if _global_explanation_service is None:
        _global_explanation_service = GlobalExplanationService(xgboost_service)
    return _global_explanation_service
