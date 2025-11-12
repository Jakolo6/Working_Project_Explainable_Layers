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
                    'installment_commitment': 4,
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
        
        return {
            'decision': decision,
            'prediction': int(prediction),
            'confidence': confidence,
            'probability_good': float(probabilities[0]),
            'probability_bad': float(probabilities[1]),
            'model': 'xgboost'
        }
    
    def explain_prediction(self, user_input: Dict[str, Any], num_features: int = 10) -> Dict[str, Any]:
        """
        Generate SHAP explanation for prediction.
        
        Args:
            user_input: User input dictionary
            num_features: Number of top features to return
            
        Returns:
            Dictionary with SHAP values and feature contributions
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Engineer features and keep original values
        df_engineered = self._engineer_features(user_input)
        
        # Store original values for display
        original_values = df_engineered.iloc[0].to_dict()
        
        # Transform using model's pipeline preprocessor
        X_transformed = self.model.named_steps['preprocess'].transform(df_engineered)
        X_transformed_df = pd.DataFrame(
            X_transformed,
            columns=self.model.named_steps['preprocess'].get_feature_names_out()
        )
        
        # Create SHAP explainer if not exists (use the XGBoost model, not pipeline)
        if self.explainer is None:
            self.explainer = shap.TreeExplainer(self.model.named_steps['model'])
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(X_transformed_df)
        
        # Get encoded feature names
        encoded_feature_names = list(X_transformed_df.columns)
        
        # Get SHAP values for bad credit class (class 1)
        if isinstance(shap_values, list):
            shap_values_bad = shap_values[1][0]  # Class 1 (bad credit)
        else:
            shap_values_bad = shap_values[0]
        
        # Create feature contributions with human-readable names and original values
        contributions = []
        for i, (encoded_feat, shap_val) in enumerate(zip(encoded_feature_names, shap_values_bad)):
            # Extract original feature name (remove 'num__' or 'cat__' prefix)
            original_feat = encoded_feat.replace('num__', '').replace('cat__', '')
            
            # Get human-readable name
            display_name = self.FEATURE_NAMES.get(original_feat, original_feat)
            
            # Get original value (before encoding)
            original_value = original_values.get(original_feat, X_transformed_df.iloc[0, i])
            
            contributions.append({
                'feature': display_name,
                'feature_key': original_feat,
                'shap_value': float(shap_val),
                'feature_value': original_value,
                'impact': 'increases_risk' if shap_val > 0 else 'decreases_risk'
            })
        
        # Sort by absolute SHAP value
        contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
        
        # Get base value (expected value)
        base_value = float(self.explainer.expected_value[1] if isinstance(self.explainer.expected_value, list) 
                          else self.explainer.expected_value)
        
        return {
            'top_features': contributions[:num_features],
            'all_features': contributions,
            'base_value': base_value,
            'prediction_value': float(base_value + sum(shap_values_bad))
        }
    
    def _engineer_features(self, user_input: Dict[str, Any]) -> pd.DataFrame:
        """
        Engineer features from user input.
        Model pipeline will handle encoding.
        """
        df = pd.DataFrame([user_input])
        
        # Map employment to years
        df['employment_years'] = df['employment'].map(self.EMPLOYMENT_YEARS_MAP)
        
        # Create engineered features
        df['monthly_burden'] = df['credit_amount'] / df['duration']
        df['stability_score'] = df['age'] * df['employment_years']
        df['risk_ratio'] = df['credit_amount'] / (df['age'] * 100)
        df['credit_to_income_proxy'] = df['credit_amount'] / df['age']
        df['duration_risk'] = df['duration'] * df['credit_amount']
        
        return df
    
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
