"""
Context Builder for Analyst-Grade Narrative Explanations

This module provides statistical context for LLM-based explanations by:
1. Loading and caching dataset statistics (medians, percentiles, ranges)
2. Calculating applicant-specific percentile standings
3. Generating rich context payloads for the LLM

The goal is to enable "Analyst-Grade" insights by comparing specific
applicants against the global dataset training distribution.
"""

import os
import json
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Optional imports - gracefully handle missing dependencies
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

# ============================================================================
# FEATURE CLASSIFICATION
# ============================================================================

# Features the applicant CAN change (actionable suggestions)
MUTABLE_FEATURES = [
    'duration',
    'credit_amount', 
    'savings_status',
    'checking_status',
    'installment_commitment',
    'other_installment_plans',
]

# Features the applicant CANNOT change (never suggest changing these)
IMMUTABLE_FEATURES = [
    'age',
    'personal_status_sex',
    'foreign_worker',
    'employment_duration',
    'credit_history',
    'present_residence_since',
    'existing_credits',
    'num_dependents',
    'job',
    'housing',
    'property',
    'purpose',
]

# Features explicitly excluded from the model for fairness
EXCLUDED_FOR_FAIRNESS = ['sex', 'foreign_worker']

# Numerical features for percentile analysis
NUMERICAL_FEATURES = [
    'duration',
    'credit_amount',
    'age',
    'present_residence_since',
    'existing_credits',
    'num_dependents',
]

# Feature name mappings (backend names -> human readable)
FEATURE_DISPLAY_NAMES = {
    'duration': 'Loan Duration',
    'credit_amount': 'Credit Amount',
    'age': 'Age',
    'installment_commitment': 'Installment Rate',
    'present_residence_since': 'Years at Residence',
    'existing_credits': 'Existing Credits',
    'num_dependents': 'Number of Dependents',
    'checking_status': 'Checking Account',
    'savings_status': 'Savings Account',
    'credit_history': 'Credit History',
    'employment_duration': 'Employment Duration',
    'purpose': 'Loan Purpose',
    'housing': 'Housing Status',
    'property': 'Property Ownership',
    'job': 'Job Type',
    'other_installment_plans': 'Other Payment Plans',
    'personal_status_sex': 'Personal Status',
    'other_debtors': 'Other Debtors/Guarantors',
    'telephone': 'Telephone',
    'foreign_worker': 'Foreign Worker',
}

# Units for numerical features
FEATURE_UNITS = {
    'duration': 'months',
    'credit_amount': '€',
    'age': 'years',
    'installment_commitment': 'category',
    'present_residence_since': 'years',
    'existing_credits': 'credits',
    'num_dependents': 'dependents',
}


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class FeatureBenchmark:
    """Statistical benchmarks for a numerical feature."""
    median: float
    mean: float
    p25: float  # 25th percentile
    p75: float  # 75th percentile
    p10: float  # 10th percentile
    p90: float  # 90th percentile
    min_val: float
    max_val: float
    # Approved-only statistics
    approved_median: float
    approved_p25: float
    approved_p75: float


@dataclass
class ApplicantStanding:
    """Applicant's standing relative to the dataset."""
    value: Any
    percentile: Optional[float]  # 0-100
    percentile_label: str  # "Very Low", "Low", "Average", "High", "Very High"
    vs_approved_median: Optional[str]  # "below", "at", "above"
    insight: str


@dataclass
class ComparativeContext:
    """Comparative context for a single feature."""
    feature_name: str
    display_name: str
    value: Any
    unit: str
    typical_approved_range: str
    typical_approved_median: Optional[float]
    applicant_percentile: Optional[float]
    percentile_label: str
    insight: str
    is_mutable: bool


@dataclass
class RichContextPayload:
    """Complete context payload for LLM."""
    applicant_analysis: Dict[str, Any]
    comparative_context: Dict[str, Dict[str, Any]]
    rules_of_engagement: Dict[str, Any]
    actionable_suggestions: List[Dict[str, Any]]


# ============================================================================
# DATASET STATISTICS LOADER
# ============================================================================

class DatasetStatistics:
    """
    Loads and caches dataset statistics for comparative analysis.
    Statistics are calculated once on first access and cached.
    """
    
    _instance = None
    _stats_cache: Optional[Dict[str, FeatureBenchmark]] = None
    _df: Optional[pd.DataFrame] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._stats_cache is None:
            self._load_statistics()
    
    def _load_statistics(self):
        """Load dataset and calculate statistics."""
        # If pandas is not available, use fallback statistics
        if not HAS_PANDAS:
            print("[ContextBuilder] Pandas not available, using fallback statistics")
            self._use_fallback_statistics()
            return
        
        try:
            # Try to load the dataset
            dataset_paths = [
                os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'german_credit_data.csv'),
                os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'german.csv'),
                os.path.join(os.path.dirname(__file__), '..', '..', 'ml_model', 'data', 'german_credit_data.csv'),
            ]
            
            df = None
            for path in dataset_paths:
                if os.path.exists(path):
                    df = pd.read_csv(path)
                    print(f"[ContextBuilder] Loaded dataset from {path}")
                    break
            
            if df is None:
                print("[ContextBuilder] Warning: Could not load dataset, using fallback statistics")
                self._use_fallback_statistics()
                return
            
            self._df = df
            self._calculate_statistics(df)
            
        except Exception as e:
            print(f"[ContextBuilder] Error loading statistics: {e}")
            self._use_fallback_statistics()
    
    def _calculate_statistics(self, df: pd.DataFrame):
        """Calculate statistics for all numerical features."""
        self._stats_cache = {}
        
        # Identify the target column (credit risk)
        target_col = None
        for col in ['credit_risk', 'class', 'target', 'default', 'good_bad']:
            if col in df.columns:
                target_col = col
                break
        
        # Map column names to our standard names
        column_mapping = {
            'duration': ['duration', 'Duration', 'duration_months', 'Attribute2'],
            'credit_amount': ['credit_amount', 'Credit amount', 'amount', 'Attribute5'],
            'age': ['age', 'Age', 'age_years', 'Attribute13'],
            'installment_commitment': ['installment_commitment', 'installment_rate', 'Installment rate', 'Attribute8'],
            'present_residence_since': ['present_residence_since', 'Present residence since', 'Attribute11'],
            'existing_credits': ['existing_credits', 'Number of existing credits', 'Attribute16'],
            'num_dependents': ['num_dependents', 'Number of dependents', 'Attribute18'],
        }
        
        for feature, possible_cols in column_mapping.items():
            col = None
            for pc in possible_cols:
                if pc in df.columns:
                    col = pc
                    break
            
            if col is None:
                continue
            
            try:
                values = pd.to_numeric(df[col], errors='coerce').dropna()
                
                if len(values) == 0:
                    continue
                
                # Calculate approved-only statistics if target column exists
                if target_col:
                    # Assuming 1 = good/approved, 2 = bad/rejected (German Credit format)
                    # Or 0 = good, 1 = bad
                    approved_mask = df[target_col].isin([1, 'good', 'Good', 0])
                    approved_values = pd.to_numeric(df.loc[approved_mask, col], errors='coerce').dropna()
                else:
                    approved_values = values
                
                self._stats_cache[feature] = FeatureBenchmark(
                    median=float(values.median()),
                    mean=float(values.mean()),
                    p25=float(values.quantile(0.25)),
                    p75=float(values.quantile(0.75)),
                    p10=float(values.quantile(0.10)),
                    p90=float(values.quantile(0.90)),
                    min_val=float(values.min()),
                    max_val=float(values.max()),
                    approved_median=float(approved_values.median()) if len(approved_values) > 0 else float(values.median()),
                    approved_p25=float(approved_values.quantile(0.25)) if len(approved_values) > 0 else float(values.quantile(0.25)),
                    approved_p75=float(approved_values.quantile(0.75)) if len(approved_values) > 0 else float(values.quantile(0.75)),
                )
            except Exception as e:
                print(f"[ContextBuilder] Error calculating stats for {feature}: {e}")
        
        print(f"[ContextBuilder] Calculated statistics for {len(self._stats_cache)} features")
    
    def _use_fallback_statistics(self):
        """Use hardcoded fallback statistics based on German Credit Dataset."""
        self._stats_cache = {
            'duration': FeatureBenchmark(
                median=18.0, mean=20.9, p25=12.0, p75=24.0, p10=6.0, p90=36.0,
                min_val=4.0, max_val=72.0,
                approved_median=15.0, approved_p25=10.0, approved_p75=21.0
            ),
            'credit_amount': FeatureBenchmark(
                median=2320.0, mean=3271.0, p25=1366.0, p75=3972.0, p10=708.0, p90=6468.0,
                min_val=250.0, max_val=18424.0,
                approved_median=2150.0, approved_p25=1200.0, approved_p75=3500.0
            ),
            'age': FeatureBenchmark(
                median=33.0, mean=35.5, p25=27.0, p75=42.0, p10=23.0, p90=52.0,
                min_val=19.0, max_val=75.0,
                approved_median=35.0, approved_p25=28.0, approved_p75=44.0
            ),
            'present_residence_since': FeatureBenchmark(
                median=3.0, mean=2.85, p25=2.0, p75=4.0, p10=1.0, p90=4.0,
                min_val=1.0, max_val=4.0,
                approved_median=3.0, approved_p25=2.0, approved_p75=4.0
            ),
            'existing_credits': FeatureBenchmark(
                median=1.0, mean=1.41, p25=1.0, p75=2.0, p10=1.0, p90=2.0,
                min_val=1.0, max_val=4.0,
                approved_median=1.0, approved_p25=1.0, approved_p75=2.0
            ),
            'num_dependents': FeatureBenchmark(
                median=1.0, mean=1.16, p25=1.0, p75=1.0, p10=1.0, p90=2.0,
                min_val=1.0, max_val=2.0,
                approved_median=1.0, approved_p25=1.0, approved_p75=1.0
            ),
        }
    
    def get_benchmark(self, feature: str) -> Optional[FeatureBenchmark]:
        """Get benchmark statistics for a feature."""
        return self._stats_cache.get(feature)
    
    def get_all_benchmarks(self) -> Dict[str, FeatureBenchmark]:
        """Get all benchmark statistics."""
        return self._stats_cache or {}
    
    def calculate_percentile(self, feature: str, value: float) -> Optional[float]:
        """Calculate the percentile of a value within the dataset distribution."""
        benchmark = self.get_benchmark(feature)
        if benchmark is None:
            return None
        
        # Estimate percentile using linear interpolation between known percentiles
        percentiles = [
            (benchmark.min_val, 0),
            (benchmark.p10, 10),
            (benchmark.p25, 25),
            (benchmark.median, 50),
            (benchmark.p75, 75),
            (benchmark.p90, 90),
            (benchmark.max_val, 100),
        ]
        
        for i in range(len(percentiles) - 1):
            v1, p1 = percentiles[i]
            v2, p2 = percentiles[i + 1]
            if v1 <= value <= v2:
                if v2 == v1:
                    return p1
                return p1 + (p2 - p1) * (value - v1) / (v2 - v1)
        
        if value < benchmark.min_val:
            return 0.0
        return 100.0


# ============================================================================
# CONTEXT BUILDER
# ============================================================================

class ContextBuilder:
    """
    Builds rich context payloads for LLM-based narrative explanations.
    """
    
    def __init__(self):
        self.stats = DatasetStatistics()
    
    def _get_percentile_label(self, percentile: Optional[float]) -> str:
        """Convert percentile to human-readable label."""
        if percentile is None:
            return "Unknown"
        if percentile <= 10:
            return "Very Low"
        if percentile <= 25:
            return "Low"
        if percentile <= 75:
            return "Average"
        if percentile <= 90:
            return "High"
        return "Very High"
    
    def _get_comparison_insight(
        self, 
        feature: str, 
        value: float, 
        benchmark: FeatureBenchmark,
        percentile: float,
        is_risk_factor: bool
    ) -> str:
        """Generate a human-readable insight for a feature comparison."""
        display_name = FEATURE_DISPLAY_NAMES.get(feature, feature.replace('_', ' ').title())
        unit = FEATURE_UNITS.get(feature, '')
        
        # Determine if higher is better or worse for this feature
        higher_is_worse = feature in ['duration', 'credit_amount', 'existing_credits']
        
        if percentile >= 90:
            if higher_is_worse:
                return f"Significantly higher than typical approved applicants"
            else:
                return f"Well above average, which is favorable"
        elif percentile >= 75:
            if higher_is_worse:
                return f"Higher than most approved applicants"
            else:
                return f"Above average, a positive indicator"
        elif percentile <= 10:
            if higher_is_worse:
                return f"Very conservative, well below typical range"
            else:
                return f"Below typical range for approved applicants"
        elif percentile <= 25:
            if higher_is_worse:
                return f"Lower than average, which is favorable"
            else:
                return f"Somewhat below typical approved range"
        else:
            return f"Within typical range for approved applicants"
    
    def build_comparative_context(
        self,
        applicant_features: Dict[str, Any],
        shap_features: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Build comparative context for all relevant features.
        
        Args:
            applicant_features: Dict of feature name -> value
            shap_features: List of SHAP feature dicts with 'feature', 'value', 'shap_value', 'impact'
        
        Returns:
            Dict of feature name -> comparative context
        """
        context = {}
        
        # Get risk factors from SHAP
        risk_factors = {f['feature'].lower().replace(' ', '_') for f in shap_features if f.get('impact') == 'positive'}
        
        # Map SHAP feature names to our internal names
        feature_name_map = {
            'loan duration (months)': 'duration',
            'loan duration': 'duration',
            'duration': 'duration',
            'credit amount': 'credit_amount',
            'credit_amount': 'credit_amount',
            'age': 'age',
            'installment rate': 'installment_commitment',
            'installment_rate': 'installment_commitment',
            'installment_commitment': 'installment_commitment',
            'years at residence': 'present_residence_since',
            'present_residence_since': 'present_residence_since',
            'existing credits': 'existing_credits',
            'existing_credits': 'existing_credits',
            'number of dependents': 'num_dependents',
            'num_dependents': 'num_dependents',
        }
        
        # Process SHAP features to extract values
        for shap_f in shap_features:
            feature_raw = shap_f['feature'].lower().replace(' ', '_').replace('(months)', '').replace('_(months)', '').strip().rstrip('_')
            feature = feature_name_map.get(feature_raw, feature_raw)
            
            # Also try partial matching for feature names
            if feature not in NUMERICAL_FEATURES:
                # Try to find a match
                for key, mapped in feature_name_map.items():
                    if key in feature_raw or feature_raw in key:
                        feature = mapped
                        break
            
            if feature not in NUMERICAL_FEATURES:
                continue
            
            # Try to get numeric value
            value_str = str(shap_f.get('value', ''))
            try:
                # Extract number from string like "48 months" or "€12000"
                import re
                numbers = re.findall(r'[\d.]+', value_str.replace(',', ''))
                if numbers:
                    value = float(numbers[0])
                else:
                    continue
            except (ValueError, IndexError):
                continue
            
            benchmark = self.stats.get_benchmark(feature)
            if benchmark is None:
                continue
            
            percentile = self.stats.calculate_percentile(feature, value)
            percentile_label = self._get_percentile_label(percentile)
            is_risk = feature_raw in risk_factors or feature in risk_factors
            
            insight = self._get_comparison_insight(feature, value, benchmark, percentile or 50, is_risk)
            
            context[feature] = {
                'feature_name': feature,
                'display_name': FEATURE_DISPLAY_NAMES.get(feature, feature.replace('_', ' ').title()),
                'value': value,
                'unit': FEATURE_UNITS.get(feature, ''),
                'typical_approved_range': f"{benchmark.approved_p25:.0f}-{benchmark.approved_p75:.0f}",
                'typical_approved_median': benchmark.approved_median,
                'applicant_percentile': round(percentile, 1) if percentile else None,
                'percentile_label': percentile_label,
                'insight': insight,
                'is_mutable': feature in [f.replace('_status', '') for f in MUTABLE_FEATURES] or feature in MUTABLE_FEATURES,
            }
        
        return context
    
    def build_actionable_suggestions(
        self,
        shap_features: List[Dict[str, Any]],
        comparative_context: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate actionable suggestions based on mutable risk factors.
        """
        suggestions = []
        
        # Get risk-increasing features that are mutable
        for shap_f in shap_features:
            if shap_f.get('impact') != 'positive':  # Only risk-increasing
                continue
            
            feature_raw = shap_f['feature'].lower().replace(' ', '_').replace('(months)', '').strip()
            
            # Check if mutable
            is_mutable = any(
                m in feature_raw or feature_raw in m 
                for m in ['duration', 'credit_amount', 'amount', 'savings', 'checking', 'installment']
            )
            
            if not is_mutable:
                continue
            
            # Generate suggestion based on feature type
            if 'duration' in feature_raw:
                ctx = comparative_context.get('duration', {})
                if ctx.get('typical_approved_median'):
                    target = int(ctx['typical_approved_median'])
                    suggestions.append({
                        'feature': 'Loan Duration',
                        'current': shap_f.get('value'),
                        'suggestion': f"Consider reducing to {target} months or less",
                        'impact': 'Would significantly improve approval chances',
                        'priority': 'high'
                    })
            
            elif 'amount' in feature_raw or 'credit' in feature_raw:
                ctx = comparative_context.get('credit_amount', {})
                if ctx.get('typical_approved_median'):
                    target = int(ctx['typical_approved_median'])
                    suggestions.append({
                        'feature': 'Credit Amount',
                        'current': shap_f.get('value'),
                        'suggestion': f"Consider a smaller loan amount (typical approved: €{target:,})",
                        'impact': 'Lower amounts have higher approval rates',
                        'priority': 'high'
                    })
            
            elif 'saving' in feature_raw:
                suggestions.append({
                    'feature': 'Savings Account',
                    'current': shap_f.get('value'),
                    'suggestion': 'Building savings before applying can improve chances',
                    'impact': 'Demonstrates financial buffer for unexpected expenses',
                    'priority': 'medium'
                })
            
            elif 'checking' in feature_raw:
                suggestions.append({
                    'feature': 'Checking Account',
                    'current': shap_f.get('value'),
                    'suggestion': 'Maintaining a positive balance shows financial stability',
                    'impact': 'Indicates healthy cash flow management',
                    'priority': 'medium'
                })
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def build_rich_payload(
        self,
        decision: str,
        probability: float,
        shap_features: List[Dict[str, Any]],
        all_features: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Build the complete rich context payload for the LLM.
        
        Args:
            decision: 'approved' or 'rejected'
            probability: Model confidence (0-1)
            shap_features: Top SHAP features with impact
            all_features: All features (optional, for more context)
        
        Returns:
            Complete payload dict for LLM context
        """
        features_to_use = all_features if all_features else shap_features
        
        # Separate risk factors and supporting factors
        risk_factors = [f for f in shap_features if f.get('impact') == 'positive']
        supporting_factors = [f for f in shap_features if f.get('impact') == 'negative']
        
        # Build comparative context
        comparative_context = self.build_comparative_context({}, features_to_use)
        
        # Build actionable suggestions
        suggestions = self.build_actionable_suggestions(shap_features, comparative_context)
        
        # Check for credit history quirk
        credit_history_warning = None
        for f in shap_features:
            if 'credit' in f['feature'].lower() and 'history' in f['feature'].lower():
                if f.get('impact') == 'negative':  # Helping approval
                    credit_history_warning = (
                        "Credit History shows counterintuitive patterns in this dataset. "
                        "'Critical' or 'Existing credits' categories often correlate with approval "
                        "due to survivorship bias in the 1994 training data."
                    )
                break
        
        payload = {
            'applicant_analysis': {
                'decision': decision.upper(),
                'model_confidence': round(probability, 3),
                'confidence_percent': f"{probability * 100:.1f}%",
                'top_risk_factors': [
                    {'name': f['feature'], 'value': f['value'], 'shap': round(f['shap_value'], 3)}
                    for f in risk_factors[:3]
                ],
                'top_supporting_factors': [
                    {'name': f['feature'], 'value': f['value'], 'shap': round(f['shap_value'], 3)}
                    for f in supporting_factors[:3]
                ],
                'total_factors_analyzed': len(features_to_use),
            },
            'comparative_context': comparative_context,
            'actionable_suggestions': suggestions,
            'rules_of_engagement': {
                'mutable_features': MUTABLE_FEATURES,
                'immutable_features': IMMUTABLE_FEATURES,
                'excluded_for_fairness': EXCLUDED_FOR_FAIRNESS,
                'dataset_bias_warning': credit_history_warning,
                'fairness_statement': (
                    "Gender and nationality were strictly excluded from this decision model "
                    "to ensure fair and unbiased assessments."
                ),
            }
        }
        
        return payload


# ============================================================================
# SINGLETON ACCESSOR
# ============================================================================

_context_builder: Optional[ContextBuilder] = None

def get_context_builder() -> ContextBuilder:
    """Get or create the singleton ContextBuilder instance."""
    global _context_builder
    if _context_builder is None:
        _context_builder = ContextBuilder()
    return _context_builder


def build_narrative_context(
    decision: str,
    probability: float,
    shap_features: List[Dict[str, Any]],
    all_features: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Convenience function to build narrative context.
    
    This is the main entry point for the explanations API.
    """
    builder = get_context_builder()
    return builder.build_rich_payload(decision, probability, shap_features, all_features)
