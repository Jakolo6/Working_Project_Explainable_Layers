# Logistic Regression model training and prediction service

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import boto3
from io import BytesIO
import os
from .preprocessing import GermanCreditPreprocessor


class LogisticCreditModel:
    """Handles Logistic Regression model training, loading, and prediction"""
    
    def __init__(self, config):
        self.config = config
        self.model = None
        self.preprocessor = GermanCreditPreprocessor()
        
    def load_dataset_from_r2(self) -> pd.DataFrame:
        """Download dataset from Cloudflare R2"""
        s3_client = boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
        
        obj = s3_client.get_object(
            Bucket=self.config.r2_bucket_name,
            Key=self.config.dataset_path
        )
        
        df = pd.read_csv(BytesIO(obj['Body'].read()))
        return df
    
    def preprocess_data(self, df: pd.DataFrame, fit_preprocessor: bool = True):
        """
        Preprocess dataset using GermanCreditPreprocessor.
        
        Args:
            df: Raw dataset
            fit_preprocessor: If True, fit the preprocessor (training mode)
            
        Returns:
            Tuple of (X, y) - preprocessed features and target
        """
        # Determine target column
        possible_target_cols = ['class', 'Class', 'target', 'credit_risk', 'Risk', 'risk']
        target_col = None
        
        for col in possible_target_cols:
            if col in df.columns:
                target_col = col
                break
        
        if not target_col:
            raise ValueError(f"No target column found. Available columns: {df.columns.tolist()}")
        
        # Fit or transform using preprocessor
        if fit_preprocessor:
            X, y = self.preprocessor.fit_transform(df, target_col=target_col)
        else:
            X, y = self.preprocessor.transform(df, target_col=target_col)
        
        return X, y
    
    def train_model(self, X, y):
        """
        Train Logistic Regression classifier with comprehensive evaluation.
        
        Args:
            X: Preprocessed features
            y: Target variable
            
        Returns:
            Trained model
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Initialize Logistic Regression with optimized parameters
        self.model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='lbfgs',
            C=1.0,
            class_weight='balanced'  # Handle class imbalance
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Comprehensive evaluation
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        y_test_proba = self.model.predict_proba(X_test)[:, 1]
        
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"\n{'='*60}")
        print("Logistic Regression Training Results")
        print(f"{'='*60}")
        print(f"Training accuracy: {train_score:.4f}")
        print(f"Test accuracy: {test_score:.4f}")
        
        try:
            roc_auc = roc_auc_score(y_test, y_test_proba)
            print(f"ROC-AUC Score: {roc_auc:.4f}")
        except:
            pass
        
        print(f"\nTest Set Classification Report:")
        print(classification_report(y_test, y_test_pred))
        
        print(f"\nConfusion Matrix (Test Set):")
        print(confusion_matrix(y_test, y_test_pred))
        
        # Feature importance (coefficients)
        print(f"\nTop 10 Most Important Features (by absolute coefficient):")
        feature_importance = pd.DataFrame({
            'feature': self.preprocessor.feature_names,
            'coefficient': self.model.coef_[0]
        })
        feature_importance['abs_coefficient'] = feature_importance['coefficient'].abs()
        feature_importance = feature_importance.sort_values('abs_coefficient', ascending=False)
        print(feature_importance.head(10).to_string(index=False))
        
        print(f"{'='*60}\n")
        
        return self.model
    
    def save_model_to_r2(self, model_path: str = None):
        """Save trained model and preprocessor to Cloudflare R2"""
        if model_path is None:
            # Use different path for logistic regression
            model_path = self.config.model_path.replace('.pkl', '_logistic.pkl')
        
        # Serialize model and preprocessor to bytes
        buffer = BytesIO()
        joblib.dump({
            'model': self.model,
            'preprocessor': self.preprocessor
        }, buffer)
        buffer.seek(0)
        
        # Upload to R2
        s3_client = boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
        
        s3_client.put_object(
            Bucket=self.config.r2_bucket_name,
            Key=model_path,
            Body=buffer.getvalue()
        )
        
        print(f"Logistic Regression model and preprocessor saved to R2: {model_path}")
    
    def load_model_from_r2(self, model_path: str = None):
        """Load trained model and preprocessor from Cloudflare R2"""
        if model_path is None:
            model_path = self.config.model_path.replace('.pkl', '_logistic.pkl')
        
        s3_client = boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
        
        obj = s3_client.get_object(
            Bucket=self.config.r2_bucket_name,
            Key=model_path
        )
        
        model_data = joblib.load(BytesIO(obj['Body'].read()))
        self.model = model_data['model']
        self.preprocessor = model_data['preprocessor']
        
        print("Logistic Regression model and preprocessor loaded from R2")
    
    def predict(self, input_data: dict):
        """
        Make prediction on new data using trained model and preprocessor.
        
        Args:
            input_data: Dictionary with raw feature values
            
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model_from_r2() first.")
        
        if not self.preprocessor.is_fitted:
            raise ValueError("Preprocessor not fitted. Model may not be properly loaded.")
        
        # Prepare input using preprocessor
        X = self.preprocessor.prepare_input_for_prediction(input_data)
        
        # Make prediction
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Map prediction to decision
        decision = "approved" if prediction == 1 else "rejected"
        confidence = float(max(probabilities))
        
        return {
            'decision': decision,
            'prediction': int(prediction),
            'confidence': confidence,
            'probability_good': float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0]),
            'probability_bad': float(probabilities[0]) if len(probabilities) > 1 else 1 - float(probabilities[0]),
            'preprocessed_features': X.iloc[0].to_dict()
        }
    
    def get_feature_info(self):
        """Get feature information for frontend form generation"""
        if not self.preprocessor.is_fitted:
            raise ValueError("Preprocessor not fitted. Train or load model first.")
        
        return self.preprocessor.get_feature_info()
