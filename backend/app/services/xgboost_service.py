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
        self.model = None
        self.preprocessor = NotebookPreprocessor(model_type='xgboost')
        self.explainer = None
        
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
        Model was trained with NotebookPreprocessor pipeline.
        """
        s3 = self._create_s3_client()
        
        try:
            # Load model
            obj = s3.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/xgboost_model.pkl'
            )
            self.model = joblib.load(BytesIO(obj['Body'].read()))
            
            # Load cleaned dataset to fit preprocessor
            obj = s3.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='data/german_credit_clean.csv'
            )
            df = pd.read_csv(BytesIO(obj['Body'].read()))
            
            # Fit preprocessor on full dataset (same as notebook)
            self.preprocessor.fit(df)
            
            print("✓ XGBoost model loaded from R2")
            print(f"✓ Preprocessor fitted on {len(df)} samples")
            
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
        
        # Preprocess input
        X_transformed = self.preprocessor.prepare_single_input(user_input)
        
        # Make prediction
        prediction = self.model.predict(X_transformed)[0]
        probabilities = self.model.predict_proba(X_transformed)[0]
        
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
        
        # Preprocess input
        X_transformed = self.preprocessor.prepare_single_input(user_input)
        
        # Create SHAP explainer if not exists
        if self.explainer is None:
            self.explainer = shap.TreeExplainer(self.model)
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(X_transformed)
        
        # Get feature names
        feature_names = self.preprocessor.get_feature_names()
        
        # Get SHAP values for bad credit class (class 1)
        if isinstance(shap_values, list):
            shap_values_bad = shap_values[1][0]  # Class 1 (bad credit)
        else:
            shap_values_bad = shap_values[0]
        
        # Create feature contributions
        contributions = []
        for i, (feat, shap_val) in enumerate(zip(feature_names, shap_values_bad)):
            contributions.append({
                'feature': feat,
                'shap_value': float(shap_val),
                'feature_value': float(X_transformed.iloc[0, i]),
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
        
        feature_names = self.preprocessor.get_feature_names()
        importance = self.model.feature_importances_
        
        # Create sorted dictionary
        importance_dict = dict(zip(feature_names, importance))
        sorted_importance = dict(sorted(importance_dict.items(), 
                                       key=lambda x: x[1], 
                                       reverse=True)[:top_n])
        
        return sorted_importance
