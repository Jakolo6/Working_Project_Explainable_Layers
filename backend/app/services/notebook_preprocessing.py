"""
Preprocessing module that exactly matches the Model_Training.ipynb notebook pipeline.
Uses cleaned dataset with readable column names (no Axx codes).
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from typing import Tuple, Dict, Any


class NotebookPreprocessor:
    """
    Preprocessing that matches the notebook training pipeline exactly.
    
    Features used in notebook:
    - 7 base numerical features
    - 5 engineered numerical features  
    - 11 categorical features
    
    No Axx mapping - uses cleaned readable values directly.
    """
    
    # Feature definitions (exactly as in notebook)
    NUM_FEATURES_BASE = [
        'duration', 'credit_amount', 'installment_commitment',
        'residence_since', 'age', 'existing_credits', 'num_dependents'
    ]
    
    ENGINEERED_FEATURES = [
        'monthly_burden', 'stability_score', 'risk_ratio',
        'credit_to_income_proxy', 'duration_risk'
    ]
    
    CAT_FEATURES = [
        'checking_status', 'credit_history', 'purpose',
        'savings_status', 'employment', 'housing', 'job',
        'other_debtors', 'property_magnitude', 'other_payment_plans',
        'own_telephone'
    ]
    
    # Employment mapping for feature engineering
    EMPLOYMENT_YEARS_MAP = {
        'unemployed': 0,
        'lt_1_year': 0.5,
        '1_to_4_years': 2.5,
        '4_to_7_years': 5.5,
        'ge_7_years': 10
    }
    
    def __init__(self, model_type: str = 'xgboost'):
        """
        Initialize preprocessor.
        
        Args:
            model_type: 'xgboost' or 'logistic'
        """
        self.model_type = model_type
        self.transformer = None
        self.is_fitted = False
        
    @property
    def num_features_all(self):
        """All numerical features (base + engineered)"""
        return self.NUM_FEATURES_BASE + self.ENGINEERED_FEATURES
    
    @property
    def all_features(self):
        """All features in correct order"""
        return self.num_features_all + self.CAT_FEATURES
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create engineered features exactly as in notebook.
        
        Args:
            df: DataFrame with base features
            
        Returns:
            DataFrame with engineered features added
        """
        df = df.copy()
        
        # Debug: Check data types before engineering
        print(f"[DEBUG] Data types before engineering: {df.dtypes.to_dict()}")
        print(f"[DEBUG] Sample values: {df.iloc[0].to_dict()}")
        
        # Ensure numerical columns are numeric
        num_cols = ['duration', 'credit_amount', 'installment_commitment', 'residence_since', 
                    'age', 'existing_credits', 'num_dependents']
        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Map employment to years
        df['employment_years'] = df['employment'].map(self.EMPLOYMENT_YEARS_MAP)
        
        # Create engineered features
        df['monthly_burden'] = df['credit_amount'] / df['duration']
        df['stability_score'] = df['age'] * df['employment_years']
        df['risk_ratio'] = df['credit_amount'] / (df['age'] * 100)
        df['credit_to_income_proxy'] = df['credit_amount'] / df['age']
        df['duration_risk'] = df['duration'] * df['credit_amount']
        
        return df
    
    def create_transformer(self) -> ColumnTransformer:
        """
        Create preprocessing transformer matching notebook.
        
        Logistic Regression:
            - Numerical: StandardScaler
            - Categorical: OneHotEncoder(drop='first')
            
        XGBoost:
            - Numerical: Passthrough (no scaling)
            - Categorical: OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
        """
        if self.model_type == 'logistic':
            return ColumnTransformer([
                ('num', StandardScaler(), self.num_features_all),
                ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), self.CAT_FEATURES)
            ])
        else:  # xgboost
            return ColumnTransformer([
                ('num', 'passthrough', self.num_features_all),
                ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), self.CAT_FEATURES)
            ])
    
    def fit(self, df: pd.DataFrame, y=None):
        """
        Fit the preprocessor on training data.
        
        Args:
            df: DataFrame with cleaned column names
            y: Target variable (optional)
        """
        # Engineer features
        df_eng = self.engineer_features(df)
        
        # Select features in correct order
        X = df_eng[self.all_features]
        
        # Create and fit transformer
        self.transformer = self.create_transformer()
        self.transformer.fit(X)
        self.is_fitted = True
        
        return self
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform data using fitted preprocessor.
        
        Args:
            df: DataFrame with cleaned column names
            
        Returns:
            Transformed DataFrame
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor not fitted. Call fit() first.")
        
        # Engineer features
        df_eng = self.engineer_features(df)
        
        # Select features in correct order
        X = df_eng[self.all_features]
        
        # Transform
        X_transformed = self.transformer.transform(X)
        
        # Convert to DataFrame
        if self.model_type == 'logistic':
            # OneHotEncoder creates multiple columns
            feature_names = self.transformer.get_feature_names_out()
            return pd.DataFrame(X_transformed, columns=feature_names, index=X.index)
        else:
            # XGBoost keeps original column names
            return pd.DataFrame(X_transformed, columns=self.all_features, index=X.index)
    
    def fit_transform(self, df: pd.DataFrame, y=None) -> pd.DataFrame:
        """Fit and transform in one step"""
        self.fit(df, y)
        return self.transform(df)
    
    def prepare_single_input(self, user_input: Dict[str, Any]) -> pd.DataFrame:
        """
        Prepare single user input for prediction.
        
        Args:
            user_input: Dictionary with feature values in cleaned format
                Example: {
                    'checking_status': 'negative_balance',
                    'duration': 12,
                    'credit_history': 'existing_paid',
                    'purpose': 'car_new',
                    'credit_amount': 5000,
                    'savings_status': 'lt_100_dm',
                    'employment': 'ge_7_years',
                    'installment_commitment': 4,
                    'other_debtors': 'none',
                    'residence_since': 2,
                    'property_magnitude': 'car',
                    'age': 35,
                    'other_payment_plans': 'none',
                    'housing': 'own',
                    'existing_credits': 1,
                    'job': 'skilled_employee_official',
                    'num_dependents': 1,
                    'own_telephone': 'yes_registered'
                }
                
        Returns:
            Transformed DataFrame ready for model prediction
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor not fitted. Load model first.")
        
        # Create DataFrame from input
        df = pd.DataFrame([user_input])
        
        # Ensure all required base features are present
        missing = set(self.NUM_FEATURES_BASE + self.CAT_FEATURES) - set(df.columns)
        if missing:
            raise ValueError(f"Missing required features: {missing}")
        
        # Transform
        return self.transform(df)
    
    def get_feature_names(self) -> list:
        """Get feature names after transformation"""
        if not self.is_fitted:
            raise ValueError("Preprocessor not fitted")
        
        if self.model_type == 'logistic':
            return list(self.transformer.get_feature_names_out())
        else:
            return self.all_features


def validate_user_input(user_input: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate user input has correct format and values.
    
    Returns:
        Dictionary of validation errors (empty if valid)
    """
    errors = {}
    
    # Required numerical features
    required_num = NotebookPreprocessor.NUM_FEATURES_BASE
    for feat in required_num:
        if feat not in user_input:
            errors[feat] = f"Missing required feature: {feat}"
        elif not isinstance(user_input[feat], (int, float)):
            errors[feat] = f"Must be a number, got {type(user_input[feat])}"
    
    # Required categorical features
    required_cat = NotebookPreprocessor.CAT_FEATURES
    for feat in required_cat:
        if feat not in user_input:
            errors[feat] = f"Missing required feature: {feat}"
        elif not isinstance(user_input[feat], str):
            errors[feat] = f"Must be a string, got {type(user_input[feat])}"
    
    # Validate ranges
    if 'age' in user_input:
        if not (18 <= user_input['age'] <= 100):
            errors['age'] = "Age must be between 18 and 100"
    
    if 'duration' in user_input:
        if not (1 <= user_input['duration'] <= 72):
            errors['duration'] = "Duration must be between 1 and 72 months"
    
    if 'credit_amount' in user_input:
        if not (250 <= user_input['credit_amount'] <= 20000):
            errors['credit_amount'] = "Credit amount must be between 250 and 20000 DM"
    
    return errors


def get_feature_schema() -> Dict[str, Any]:
    """
    Get schema for frontend form generation.
    Returns feature definitions with types and valid values.
    """
    return {
        'numerical': {
            'duration': {
                'label': 'Credit Duration (months)',
                'type': 'integer',
                'min': 1,
                'max': 72,
                'help': 'Duration of the credit in months'
            },
            'credit_amount': {
                'label': 'Credit Amount (DM)',
                'type': 'number',
                'min': 250,
                'max': 20000,
                'step': 50,
                'help': 'Amount of credit requested'
            },
            'installment_commitment': {
                'label': 'Installment Rate (% of income)',
                'type': 'integer',
                'min': 1,
                'max': 4,
                'help': 'Percentage of disposable income for installments'
            },
            'residence_since': {
                'label': 'Present Residence (years)',
                'type': 'integer',
                'min': 1,
                'max': 4,
                'help': 'Years at current residence'
            },
            'age': {
                'label': 'Age (years)',
                'type': 'integer',
                'min': 18,
                'max': 75,
                'help': 'Your age in years'
            },
            'existing_credits': {
                'label': 'Existing Credits at Bank',
                'type': 'integer',
                'min': 1,
                'max': 4,
                'help': 'Number of existing credits at this bank'
            },
            'num_dependents': {
                'label': 'Number of Dependents',
                'type': 'integer',
                'min': 1,
                'max': 2,
                'help': 'People you provide maintenance for'
            }
        },
        'categorical': {
            'checking_status': {
                'label': 'Checking Account Status',
                'type': 'select',
                'options': [
                    {'value': 'negative_balance', 'label': 'Negative balance (< 0 DM)'},
                    {'value': '0_to_200_dm', 'label': '0 to 200 DM'},
                    {'value': '200_or_more_dm', 'label': '200 DM or more'},
                    {'value': 'no_checking_account', 'label': 'No checking account'}
                ]
            },
            'credit_history': {
                'label': 'Credit History',
                'type': 'select',
                'options': [
                    {'value': 'no_credits', 'label': 'No credits taken / All paid back'},
                    {'value': 'all_paid', 'label': 'All credits at this bank paid back'},
                    {'value': 'existing_paid', 'label': 'Existing credits paid back'},
                    {'value': 'delay', 'label': 'Delay in paying off in the past'},
                    {'value': 'critical', 'label': 'Critical account / Other credits existing'}
                ]
            },
            'purpose': {
                'label': 'Purpose of Credit',
                'type': 'select',
                'options': [
                    {'value': 'car_new', 'label': 'Car (new)'},
                    {'value': 'car_used', 'label': 'Car (used)'},
                    {'value': 'furniture', 'label': 'Furniture/equipment'},
                    {'value': 'radio_tv', 'label': 'Radio/television'},
                    {'value': 'appliances', 'label': 'Domestic appliances'},
                    {'value': 'repairs', 'label': 'Repairs'},
                    {'value': 'education', 'label': 'Education'},
                    {'value': 'retraining', 'label': 'Retraining'},
                    {'value': 'business', 'label': 'Business'},
                    {'value': 'others', 'label': 'Others'}
                ]
            },
            'savings_status': {
                'label': 'Savings Account Status',
                'type': 'select',
                'options': [
                    {'value': 'lt_100_dm', 'label': 'Less than 100 DM'},
                    {'value': '100_to_500_dm', 'label': '100 to 500 DM'},
                    {'value': '500_to_1000_dm', 'label': '500 to 1000 DM'},
                    {'value': 'ge_1000_dm', 'label': '1000 DM or more'},
                    {'value': 'unknown_no_savings', 'label': 'Unknown / No savings'}
                ]
            },
            'employment': {
                'label': 'Employment Duration',
                'type': 'select',
                'options': [
                    {'value': 'unemployed', 'label': 'Unemployed'},
                    {'value': 'lt_1_year', 'label': 'Less than 1 year'},
                    {'value': '1_to_4_years', 'label': '1 to 4 years'},
                    {'value': '4_to_7_years', 'label': '4 to 7 years'},
                    {'value': 'ge_7_years', 'label': '7 years or more'}
                ]
            },
            'housing': {
                'label': 'Housing',
                'type': 'select',
                'options': [
                    {'value': 'rent', 'label': 'Rent'},
                    {'value': 'own', 'label': 'Own'},
                    {'value': 'for_free', 'label': 'For free'}
                ]
            },
            'job': {
                'label': 'Job Type',
                'type': 'select',
                'options': [
                    {'value': 'unemployed_or_unskilled_non_resident', 'label': 'Unemployed / Unskilled non-resident'},
                    {'value': 'unskilled_resident', 'label': 'Unskilled resident'},
                    {'value': 'skilled_employee_official', 'label': 'Skilled employee / Official'},
                    {'value': 'management_self_employed_highly_qualified_officer', 'label': 'Management / Self-employed / Highly qualified'}
                ]
            },
            'other_debtors': {
                'label': 'Other Debtors / Guarantors',
                'type': 'select',
                'options': [
                    {'value': 'none', 'label': 'None'},
                    {'value': 'co_applicant', 'label': 'Co-applicant'},
                    {'value': 'guarantor', 'label': 'Guarantor'}
                ]
            },
            'property_magnitude': {
                'label': 'Property',
                'type': 'select',
                'options': [
                    {'value': 'real_estate', 'label': 'Real estate'},
                    {'value': 'savings_agreement_or_life_insurance', 'label': 'Savings agreement / Life insurance'},
                    {'value': 'car_or_other', 'label': 'Car or other'},
                    {'value': 'unknown_no_property', 'label': 'Unknown / No property'}
                ]
            },
            'other_payment_plans': {
                'label': 'Other Installment Plans',
                'type': 'select',
                'options': [
                    {'value': 'bank', 'label': 'Bank'},
                    {'value': 'stores', 'label': 'Stores'},
                    {'value': 'none', 'label': 'None'}
                ]
            },
            'own_telephone': {
                'label': 'Telephone',
                'type': 'select',
                'options': [
                    {'value': 'none', 'label': 'None'},
                    {'value': 'yes_registered', 'label': 'Yes, registered'}
                ]
            }
        }
    }
