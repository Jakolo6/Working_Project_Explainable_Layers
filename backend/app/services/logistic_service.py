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
        self.model = None
        self.preprocessor = NotebookPreprocessor(model_type='logistic')
        
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
        Model was trained with NotebookPreprocessor pipeline.
        """
        s3 = self._create_s3_client()
        
        try:
            # Load model
            obj = s3.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/logistic_model.pkl'
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
            
            print("✓ Logistic Regression model loaded from R2")
            print(f"✓ Preprocessor fitted on {len(df)} samples")
            
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
            'model': 'logistic'
        }
    
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
        
        feature_names = self.preprocessor.get_feature_names()
        coefficients = self.model.coef_[0]  # Get coefficients for bad credit class
        
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
        
        # Preprocess input
        X_transformed = self.preprocessor.prepare_single_input(user_input)
        
        # Get feature names and coefficients
        feature_names = self.preprocessor.get_feature_names()
        coefficients = self.model.coef_[0]
        
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
        intercept = float(self.model.intercept_[0])
        
        return {
            'top_features': contributions[:num_features],
            'all_features': contributions,
            'intercept': intercept,
            'prediction_value': float(intercept + sum(c['contribution'] for c in contributions))
        }
