"""
Logistic Regression model service using notebook-trained models.
Clean implementation - no Axx mappings, uses cleaned dataset format.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib
import boto3
from io import BytesIO
from typing import Dict, Any

from .notebook_preprocessing import NotebookPreprocessor, validate_user_input


class LogisticService:
    """
    Service for Logistic Regression model predictions.
    Uses models trained in Model_Training.ipynb notebook.
    """
    
    def __init__(self, config):
        self.config = config
        self.model = None  # This is a Pipeline with preprocessing built-in
        # Employment mapping for feature engineering
        self.EMPLOYMENT_YEARS_MAP = {
            'unemployed': 0, 'lt_1_year': 0.5, '1_to_4_years': 2.5,
            '4_to_7_years': 5.5, 'ge_7_years': 10
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
        Load notebook-trained Logistic Regression model from R2.
        Model is a Pipeline with preprocessing built-in.
        """
        s3 = self._create_s3_client()
        
        try:
            # Load model (it's a Pipeline with preprocessing)
            obj = s3.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/logistic_model.pkl'
            )
            self.model = joblib.load(BytesIO(obj['Body'].read()))
            
            print("✓ Logistic Regression model loaded from R2")
            print(f"  Model type: {type(self.model).__name__}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to load Logistic Regression model: {e}")
    
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
            'model': 'logistic'
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
    
    def get_coefficients(self, top_n: int = 15) -> Dict[str, float]:
        """
        Get model coefficients (feature importance for linear models).
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            Dictionary of feature names and coefficients
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Get feature names from pipeline
        feature_names = list(self.model.named_steps['preprocess'].get_feature_names_out())
        coefficients = self.model.named_steps['model'].coef_[0]  # Get coefficients for bad credit class
        
        # Create sorted dictionary by absolute value
        coef_dict = dict(zip(feature_names, coefficients))
        sorted_coefs = dict(sorted(coef_dict.items(), 
                                   key=lambda x: abs(x[1]), 
                                   reverse=True)[:top_n])
        
        return sorted_coefs
    
    def explain_prediction(self, user_input: Dict[str, Any], num_features: int = 10) -> Dict[str, Any]:
        """
        Generate coefficient-based explanation for prediction.
        
        Args:
            user_input: User input dictionary
            num_features: Number of top features to return
            
        Returns:
            Dictionary with coefficients and feature contributions
        """
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Engineer features
        df = self._engineer_features(user_input)
        
        # Transform using model's pipeline preprocessor
        X_transformed = self.model.named_steps['preprocess'].transform(df)
        X_transformed = pd.DataFrame(
            X_transformed.toarray() if hasattr(X_transformed, 'toarray') else X_transformed,
            columns=self.model.named_steps['preprocess'].get_feature_names_out()
        )
        
        # Get feature names and coefficients
        feature_names = list(X_transformed.columns)
        coefficients = self.model.named_steps['model'].coef_[0]
        
        # Calculate contributions (coefficient * feature_value)
        contributions = []
        for i, (feat, coef) in enumerate(zip(feature_names, coefficients)):
            feat_value = float(X_transformed.iloc[0, i])
            contribution = coef * feat_value
            
            contributions.append({
                'feature': feat,
                'coefficient': float(coef),
                'feature_value': feat_value,
                'contribution': float(contribution),
                'impact': 'increases_risk' if contribution > 0 else 'decreases_risk'
            })
        
        # Sort by absolute contribution
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        # Get intercept
        intercept = float(self.model.named_steps['model'].intercept_[0])
        
        return {
            'top_features': contributions[:num_features],
            'all_features': contributions,
            'intercept': intercept,
            'prediction_value': float(intercept + sum(c['contribution'] for c in contributions))
        }
