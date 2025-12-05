"""
XGBoost model service using notebook-trained models.
Clean implementation - no Axx mappings, uses cleaned dataset format.
"""

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import joblib
import boto3
from io import BytesIO
import shap
from typing import Dict, Any, Tuple

from .notebook_preprocessing import NotebookPreprocessor, validate_user_input
from .feature_engineering import engineer_features


class XGBoostService:
    """
    Service for XGBoost model predictions.
    Uses models trained in Model_Training.ipynb notebook.
    """
    
    def __init__(self, config):
        self.config = config
        self.model = None  # This is a Pipeline with preprocessing built-in
        self.explainer = None
        # Employment mapping for feature engineering
        self.EMPLOYMENT_YEARS_MAP = {
            'unemployed': 0, 'lt_1_year': 0.5, '1_to_4_years': 2.5,
            '4_to_7_years': 5.5, 'ge_7_years': 10
        }
        # Installment rate mapping: 1-4 scale to categorical
        self.INSTALLMENT_RATE_MAP = {
            1: 'ge_35_percent',      # ≥35% (highest burden)
            2: '25_to_35_percent',   # 25-35%
            3: '20_to_25_percent',   # 20-25%
            4: 'lt_20_percent'       # <20% (lowest burden)
        }
        # Human-readable feature names
        self.FEATURE_NAMES = {
            'duration': 'Loan Duration (months)',
            'credit_amount': 'Credit Amount',
            'installment_commitment': 'Installment Rate',
            'residence_since': 'Years at Residence',
            'age': 'Age',
            'existing_credits': 'Existing Credits',
            'num_dependents': 'Number of Dependents',
            'monthly_burden': 'Monthly Payment Burden',
            'stability_score': 'Financial Stability Score',
            'risk_ratio': 'Credit Risk Ratio',
            'credit_to_income_proxy': 'Credit to Income Ratio',
            'duration_risk': 'Duration Risk Score',
            'checking_status': 'Checking Account Status',
            'credit_history': 'Credit History',
            'purpose': 'Loan Purpose',
            'savings_status': 'Savings Account Status',
            'employment': 'Employment Duration',
            'other_debtors': 'Other Debtors/Guarantors',
            'property_magnitude': 'Property Ownership',
            'other_payment_plans': 'Other Payment Plans',
            'housing': 'Housing Status',
            'job': 'Job Type',
            'own_telephone': 'Telephone Registration'
        }
        
    def _create_s3_client(self):
        """Create S3 client for R2"""
        return boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
    
    def load_model_from_r2(self):
        """
        Load notebook-trained XGBoost model from R2.
        Model is a Pipeline with preprocessing built-in.
        
        PERFORMANCE FIX: Initialize SHAP explainer here during startup,
        not on first request. This prevents latency spike on first prediction.
        """
        s3 = self._create_s3_client()
        
        try:
            # Load model (it's a Pipeline with preprocessing)
            obj = s3.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/xgboost_model.pkl'
            )
            self.model = joblib.load(BytesIO(obj['Body'].read()))
            
            print("✓ XGBoost model loaded from R2")
            print(f"  Model type: {type(self.model).__name__}")
            
            # PERFORMANCE FIX: Initialize SHAP explainer immediately
            # This takes time but happens during startup, not on first user request
            print("  Initializing SHAP explainer...")
            self.explainer = shap.TreeExplainer(self.model.named_steps['model'])
            print("✓ SHAP explainer initialized")
            
        except Exception as e:
            raise RuntimeError(f"Failed to load XGBoost model: {e}")
    
    def predict(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make prediction on user input.
        
        Args:
            user_input: Dictionary with cleaned feature values
                Example: {
                    'checking_status': 'negative_balance',
                    'duration': 12,
                    'credit_history': 'existing_paid',
                    'purpose': 'car_new',
                    'credit_amount': 5000,
                    'savings_status': 'lt_100_dm',
                    'employment': 'ge_7_years',
                    'installment_commitment': 'lt_20_percent',
                    'other_debtors': 'none',
                    'residence_since': 2,
                    'property_magnitude': 'car_or_other',
                    'age': 35,
                    'other_payment_plans': 'none',
                    'housing': 'own',
                    'existing_credits': 1,
                    'job': 'skilled_employee_official',
                    'num_dependents': 1,
                    'own_telephone': 'yes_registered'
                }
                
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model_from_r2() first.")
        
        # Validate input
        errors = validate_user_input(user_input)
        if errors:
            raise ValueError(f"Invalid input: {errors}")
        
        # Engineer features (model pipeline will handle encoding)
        df = self._engineer_features(user_input)
        
        # Make prediction (model is a Pipeline, will preprocess internally)
        prediction = self.model.predict(df)[0]
        probabilities = self.model.predict_proba(df)[0]
        
        # Map prediction (0 = good credit, 1 = bad credit)
        decision = "approved" if prediction == 0 else "rejected"
        confidence = float(max(probabilities))
        
        # IMPROVED: Calculate prediction strength metrics
        prob_good = float(probabilities[0])
        prob_bad = float(probabilities[1])
        probability_margin = abs(prob_good - prob_bad)  # How far apart are the probabilities?
        
        # Classify confidence level based on margin
        if probability_margin >= 0.4:
            confidence_level = 'high'      # Very confident (e.g., 0.8 vs 0.2)
        elif probability_margin >= 0.2:
            confidence_level = 'medium'    # Moderately confident (e.g., 0.6 vs 0.4)
        else:
            confidence_level = 'low'       # Weak prediction (e.g., 0.55 vs 0.45)
        
        return {
            'decision': decision,
            'prediction': int(prediction),
            'confidence': confidence,
            'probability_good': prob_good,
            'probability_bad': prob_bad,
            'probability_margin': probability_margin,  # NEW: Shows prediction strength
            'confidence_level': confidence_level,      # NEW: 'high', 'medium', or 'low'
            'model': 'xgboost'
        }
    
    # Mapping from one-hot encoded column prefixes to base feature names
    # Used to group SHAP values for categorical features
    CATEGORICAL_FEATURES = {
        'checking_status': 'Checking Account Status',
        'credit_history': 'Credit History',
        'purpose': 'Loan Purpose',
        'savings_status': 'Savings Account Status',
        'employment': 'Employment Duration',
        'other_debtors': 'Other Debtors/Guarantors',
        'property_magnitude': 'Property Ownership',
        'other_payment_plans': 'Other Payment Plans',
        'housing': 'Housing Status',
        'job': 'Job Type',
        'own_telephone': 'Telephone Registration',
        'installment_commitment': 'Installment Rate',
        'foreign_worker': 'Foreign Worker Status',
        'personal_status': 'Personal Status'
    }
    
    # Human-readable value mappings for categorical features
    CATEGORY_VALUE_DISPLAY = {
        'checking_status': {
            'negative_balance': 'Negative Balance (< 0 DM)',
            'no_checking': 'No Checking Account',
            'lt_200_dm': '0–200 DM',
            'ge_200_dm': '≥ 200 DM'
        },
        'savings_status': {
            'no_savings': 'No Savings',
            'lt_100_dm': '< 100 DM',
            'lt_500_dm': '100–500 DM',
            'lt_1000_dm': '500–1000 DM',
            'ge_1000_dm': '≥ 1000 DM'
        },
        'credit_history': {
            'critical': 'Critical Account',
            'existing_paid': 'Existing Credits Paid',
            'delayed_previously': 'Delayed Previously',
            'all_paid': 'All Credits Paid',
            'no_credits': 'No Credits Taken'
        },
        'employment': {
            'unemployed': 'Unemployed',
            'lt_1_year': '< 1 Year',
            '1_to_4_years': '1–4 Years',
            '4_to_7_years': '4–7 Years',
            'ge_7_years': '≥ 7 Years'
        },
        'purpose': {
            'car_new': 'New Car',
            'car_used': 'Used Car',
            'furniture_equipment': 'Furniture/Equipment',
            'radio_tv': 'Radio/TV',
            'domestic_appliance': 'Domestic Appliance',
            'repairs': 'Repairs',
            'education': 'Education',
            'vacation': 'Vacation',
            'retraining': 'Retraining',
            'business': 'Business',
            'other': 'Other'
        },
        'housing': {
            'rent': 'Renting',
            'own': 'Own Property',
            'for_free': 'Living for Free'
        },
        'property_magnitude': {
            'real_estate': 'Real Estate',
            'building_society_savings': 'Building Society Savings',
            'car_or_other': 'Car or Other',
            'no_known_property': 'No Known Property'
        },
        'other_debtors': {
            'none': 'None',
            'co_applicant': 'Co-Applicant',
            'guarantor': 'Guarantor'
        },
        'other_payment_plans': {
            'none': 'None',
            'bank': 'Bank',
            'stores': 'Stores'
        },
        'job': {
            'unemployed_unskilled_non_resident': 'Unemployed/Unskilled Non-Resident',
            'unskilled_resident': 'Unskilled Resident',
            'skilled_employee_official': 'Skilled Employee/Official',
            'management_self_employed': 'Management/Self-Employed'
        },
        'own_telephone': {
            'none': 'No Telephone',
            'yes_registered': 'Registered Telephone'
        },
        'installment_commitment': {
            'ge_35_percent': '≥35% (High Burden)',
            '25_to_35_percent': '25-35% (Moderate-High)',
            '20_to_25_percent': '20-25% (Moderate)',
            'lt_20_percent': '<20% (Low Burden)'
        }
    }

    def explain_prediction(self, user_input: Dict[str, Any], num_features: int = 10) -> Dict[str, Any]:
        """
        Generate SHAP explanation for prediction with grouped categorical features.
        
        One-hot encoded columns are grouped by their base feature, and SHAP values
        are summed to give one total impact score per original feature.
        
        Args:
            user_input: User input dictionary
            num_features: Number of top features to return
            
        Returns:
            Dictionary with SHAP values and feature contributions (grouped)
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Engineer features and keep original values
        df_engineered = self._engineer_features(user_input)
        
        # Store original values for display (before encoding)
        original_values = df_engineered.iloc[0].to_dict()
        
        # Transform using model's pipeline preprocessor
        X_transformed = self.model.named_steps['preprocess'].transform(df_engineered)
        X_transformed_df = pd.DataFrame(
            X_transformed,
            columns=self.model.named_steps['preprocess'].get_feature_names_out()
        )
        
        # SHAP explainer is now initialized in load_model_from_r2()
        # No lazy initialization needed - prevents first-request latency
        if self.explainer is None:
            raise ValueError("SHAP explainer not initialized. Call load_model_from_r2() first.")
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(X_transformed_df)
        
        # Get encoded feature names
        encoded_feature_names = list(X_transformed_df.columns)
        
        # Get SHAP values for bad credit class (class 1)
        # IMPORTANT SEMANTICS:
        # - We use Class 1 (bad credit/default risk) SHAP values
        # - Positive SHAP = feature INCREASES default risk = BAD for applicant = RED in UI
        # - Negative SHAP = feature DECREASES default risk = GOOD for applicant = GREEN in UI
        if isinstance(shap_values, list):
            shap_values_bad = shap_values[1][0]  # Class 1 (bad credit)
        else:
            shap_values_bad = shap_values[0]
        
        # Group SHAP values by base feature name
        grouped_shap = self._group_shap_values(
            encoded_feature_names, 
            shap_values_bad, 
            original_values,
            user_input
        )
        
        # Sort by absolute SHAP value
        grouped_shap.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        
        # Get base value (expected value)
        base_value = float(self.explainer.expected_value[1] if isinstance(self.explainer.expected_value, list) 
                          else self.explainer.expected_value)
        
        return {
            'top_features': grouped_shap[:num_features],
            'all_features': grouped_shap,
            'base_value': base_value,
            'prediction_value': float(base_value + sum(shap_values_bad))
        }
    
    def _group_shap_values(
        self, 
        encoded_feature_names: list, 
        shap_values: np.ndarray,
        original_values: Dict[str, Any],
        user_input: Dict[str, Any]
    ) -> list:
        """
        Group one-hot encoded SHAP values by their base feature.
        
        For categorical features, sums all one-hot column SHAP values into one.
        For numerical features, keeps the single SHAP value as-is.
        
        Args:
            encoded_feature_names: List of encoded column names (e.g., 'cat__checking_status_negative_balance')
            shap_values: Array of SHAP values for each encoded column
            original_values: Dictionary of original feature values (after engineering)
            user_input: Original user input dictionary (for categorical values)
            
        Returns:
            List of grouped feature contributions
        """
        # Dictionary to accumulate SHAP values by base feature
        feature_shap_sums = {}
        
        for encoded_feat, shap_val in zip(encoded_feature_names, shap_values):
            # Remove transformer prefix (num__ or cat__)
            clean_feat = encoded_feat
            if '__' in encoded_feat:
                clean_feat = encoded_feat.split('__', 1)[1]
            
            # Determine base feature name for categorical one-hot columns
            base_feature = None
            for cat_prefix in self.CATEGORICAL_FEATURES.keys():
                if clean_feat.startswith(cat_prefix + '_'):
                    base_feature = cat_prefix
                    break
            
            if base_feature is None:
                # This is a numerical feature or non-one-hot categorical
                base_feature = clean_feat
            
            # Accumulate SHAP value
            if base_feature not in feature_shap_sums:
                feature_shap_sums[base_feature] = 0.0
            feature_shap_sums[base_feature] += float(shap_val)
        
        # Build grouped contributions list
        contributions = []
        for base_feature, total_shap in feature_shap_sums.items():
            # Get human-readable display name
            display_name = self.FEATURE_NAMES.get(base_feature, base_feature)
            if display_name == base_feature:
                # Try categorical features mapping
                display_name = self.CATEGORICAL_FEATURES.get(base_feature, base_feature)
            
            # Get the original value for display
            if base_feature in user_input:
                # Categorical feature - get human-readable value
                raw_value = user_input[base_feature]
                if base_feature in self.CATEGORY_VALUE_DISPLAY:
                    display_value = self.CATEGORY_VALUE_DISPLAY[base_feature].get(raw_value, str(raw_value))
                else:
                    display_value = str(raw_value).replace('_', ' ').title()
            elif base_feature in original_values:
                # Engineered or numerical feature
                raw_value = original_values[base_feature]
                
                # Special formatting for engineered features to show the equation
                if base_feature == 'stability_score':
                    age = original_values.get('age', 0)
                    emp_years = original_values.get('employment_years', 0)
                    display_value = f"{int(raw_value)} (Age {int(age)} × Employment {int(emp_years)} years)"
                elif base_feature == 'monthly_burden':
                    credit = original_values.get('credit_amount', 0)
                    duration = original_values.get('duration', 1)
                    display_value = f"€{raw_value:.2f} (€{int(credit)} ÷ {int(duration)} months)"
                elif base_feature == 'risk_ratio':
                    credit = original_values.get('credit_amount', 0)
                    age = original_values.get('age', 1)
                    display_value = f"{raw_value:.2f} (€{int(credit)} ÷ Age {int(age)} × 100)"
                elif base_feature == 'credit_to_income_proxy':
                    credit = original_values.get('credit_amount', 0)
                    age = original_values.get('age', 1)
                    display_value = f"€{raw_value:.2f} (€{int(credit)} ÷ Age {int(age)})"
                elif base_feature == 'duration_risk':
                    duration = original_values.get('duration', 0)
                    credit = original_values.get('credit_amount', 0)
                    display_value = f"{int(raw_value)} ({int(duration)} months × €{int(credit)})"
                elif isinstance(raw_value, float):
                    if raw_value == int(raw_value):
                        display_value = str(int(raw_value))
                    else:
                        display_value = f"{raw_value:.2f}"
                else:
                    display_value = str(raw_value)
            else:
                # Fallback - should not happen
                display_value = "N/A"
                print(f"[WARNING] Could not find value for feature '{base_feature}'")
            
            contributions.append({
                'feature': display_name,
                'feature_key': base_feature,
                'shap_value': total_shap,
                'feature_value': display_value,
                'impact': 'increases_risk' if total_shap > 0 else 'decreases_risk'
            })
        
        return contributions
    
    def _engineer_features(self, user_input: Dict[str, Any]) -> pd.DataFrame:
        """
        Engineer features from user input using shared engineering module.
        Model pipeline will handle encoding.
        """
        df = pd.DataFrame([user_input])
        return engineer_features(df)
    
    def get_feature_importance(self, top_n: int = 15) -> Dict[str, float]:
        """
        Get feature importance from trained model.
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            Dictionary of feature names and importance scores
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Get feature names from pipeline
        feature_names = list(self.model.named_steps['preprocess'].get_feature_names_out())
        importance = self.model.named_steps['model'].feature_importances_
        
        # Create sorted dictionary
        importance_dict = dict(zip(feature_names, importance))
        sorted_importance = dict(sorted(importance_dict.items(), 
                                       key=lambda x: x[1], 
                                       reverse=True)[:top_n])
        
        return sorted_importance
