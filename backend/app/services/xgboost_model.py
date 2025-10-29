# XGBoost model training and prediction service

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import boto3
from io import BytesIO
import os

class CreditModel:
    """Handles XGBoost model training, loading, and prediction"""
    
    def __init__(self, config):
        self.config = config
        self.model = None
        self.feature_names = None
        self.label_encoders = {}
        
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
    
    def preprocess_data(self, df: pd.DataFrame, fit_encoders: bool = True):
        """Preprocess dataset, excluding sensitive features"""
        # Exclude sensitive features
        sensitive_features = ['gender', 'marital_status', 'nationality']
        df = df.drop(columns=[col for col in sensitive_features if col in df.columns])
        
        # Separate features and target
        if 'target' in df.columns or 'credit_risk' in df.columns:
            target_col = 'target' if 'target' in df.columns else 'credit_risk'
            X = df.drop(columns=[target_col])
            y = df[target_col]
        else:
            X = df
            y = None
        
        # Encode categorical features
        categorical_cols = X.select_dtypes(include=['object']).columns
        
        for col in categorical_cols:
            if fit_encoders:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le
            else:
                if col in self.label_encoders:
                    X[col] = self.label_encoders[col].transform(X[col].astype(str))
        
        self.feature_names = X.columns.tolist()
        return X, y
    
    def train_model(self, X, y):
        """Train XGBoost classifier"""
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            eval_metric='logloss'
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"Training accuracy: {train_score:.4f}")
        print(f"Test accuracy: {test_score:.4f}")
        
        return self.model
    
    def save_model_to_r2(self):
        """Save trained model to Cloudflare R2"""
        # Serialize model to bytes
        buffer = BytesIO()
        joblib.dump({
            'model': self.model,
            'feature_names': self.feature_names,
            'label_encoders': self.label_encoders
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
            Key=self.config.model_path,
            Body=buffer.getvalue()
        )
        
        print(f"Model saved to R2: {self.config.model_path}")
    
    def load_model_from_r2(self):
        """Load trained model from Cloudflare R2"""
        s3_client = boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
        
        obj = s3_client.get_object(
            Bucket=self.config.r2_bucket_name,
            Key=self.config.model_path
        )
        
        model_data = joblib.load(BytesIO(obj['Body'].read()))
        self.model = model_data['model']
        self.feature_names = model_data['feature_names']
        self.label_encoders = model_data['label_encoders']
        
        print("Model loaded from R2")
    
    def predict(self, input_data: dict):
        """Make prediction on new data"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model_from_r2() first.")
        
        # Convert input to DataFrame
        df = pd.DataFrame([input_data])
        
        # Preprocess
        X, _ = self.preprocess_data(df, fit_encoders=False)
        
        # Ensure correct feature order
        X = X[self.feature_names]
        
        # Predict
        prediction = self.model.predict(X)[0]
        probability = self.model.predict_proba(X)[0][1]  # Probability of positive class
        
        decision = "approved" if prediction == 1 else "rejected"
        
        return {
            'decision': decision,
            'probability': float(probability),
            'features': X.iloc[0].to_dict()
        }
