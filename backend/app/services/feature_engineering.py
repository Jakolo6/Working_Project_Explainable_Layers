"""
Shared feature engineering logic for all ML services.
Ensures consistency across training, prediction, and preprocessing.
"""

import pandas as pd
from typing import Dict, Any


# Employment duration mapping to years (for engineered features)
EMPLOYMENT_YEARS_MAP = {
    'unemployed': 0,
    'lt_1_year': 0.5,
    '1_to_4_years': 2.5,
    '4_to_7_years': 5.5,
    'ge_7_years': 10
}

# Installment rate mapping: 1-4 scale to categorical
INSTALLMENT_RATE_MAP = {
    1: 'ge_35_percent',      # ≥35% (highest burden)
    2: '25_to_35_percent',   # 25-35%
    3: '20_to_25_percent',   # 20-25%
    4: 'lt_20_percent'       # <20% (lowest burden)
}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature engineering to a DataFrame.
    
    This function is used consistently across:
    - Model training (ModelTrainingService)
    - Prediction serving (XGBoostService, LogisticService)
    - Preprocessing (NotebookPreprocessor)
    
    Args:
        df: DataFrame with base features
        
    Returns:
        DataFrame with engineered features added
        
    Engineered Features:
        - employment_years: Numeric mapping of employment duration
        - installment_commitment: Categorical conversion from 1-4 scale
        - monthly_burden: Credit amount / duration
        - stability_score: Age × employment years
        - risk_ratio: Credit amount / (age × 100)
        - credit_to_income_proxy: Credit amount / age
        - duration_risk: Duration × credit amount
    """
    df = df.copy()
    
    # Map employment to years for stability calculations
    if 'employment' in df.columns:
        df['employment_years'] = df['employment'].map(EMPLOYMENT_YEARS_MAP)
    
    # Convert installment_commitment from numerical (1-4) to categorical
    # Handles both int and string inputs for robustness
    if 'installment_commitment' in df.columns:
        df['installment_commitment'] = df['installment_commitment'].apply(
            lambda x: INSTALLMENT_RATE_MAP.get(x, x) if isinstance(x, int) else x
        )
    
    # Create engineered numerical features
    if 'credit_amount' in df.columns and 'duration' in df.columns:
        df['monthly_burden'] = df['credit_amount'] / df['duration']
    
    if 'age' in df.columns and 'employment_years' in df.columns:
        df['stability_score'] = df['age'] * df['employment_years']
    
    if 'credit_amount' in df.columns and 'age' in df.columns:
        df['risk_ratio'] = df['credit_amount'] / (df['age'] * 100)
        df['credit_to_income_proxy'] = df['credit_amount'] / df['age']
    
    if 'duration' in df.columns and 'credit_amount' in df.columns:
        df['duration_risk'] = df['duration'] * df['credit_amount']
    
    return df


def get_feature_lists():
    """
    Get standardized feature lists for model training/prediction.
    
    Returns:
        Tuple of (numerical_features, categorical_features, engineered_features)
    """
    numerical_features = [
        'duration',
        'credit_amount',
        'residence_since',
        'age',
        'existing_credits',
        'num_dependents'
    ]
    
    categorical_features = [
        'checking_status',
        'credit_history',
        'purpose',
        'savings_status',
        'employment',
        'housing',
        'job',
        'other_debtors',
        'property_magnitude',
        'other_payment_plans',
        'own_telephone',
        'installment_commitment'
    ]
    
    engineered_features = [
        'monthly_burden',
        'stability_score',
        'risk_ratio',
        'credit_to_income_proxy',
        'duration_risk'
    ]
    
    return numerical_features, categorical_features, engineered_features
