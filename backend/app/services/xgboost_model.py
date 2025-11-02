# XGBoost model training and prediction service

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
import joblib
import boto3
from io import BytesIO
import os
from .preprocessing import GermanCreditPreprocessor
from .feature_mappings import FeatureMappings

class CreditModel:
    """Handles XGBoost model training, loading, and prediction"""
    
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
        Train XGBoost classifier with comprehensive evaluation.
        
        Args:
            X: Preprocessed features
            y: Target variable
            
        Returns:
            Trained model
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Initialize XGBoost with optimized parameters
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            min_child_weight=1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False
        )
        
        # Train model
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Comprehensive evaluation
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        y_test_proba = self.model.predict_proba(X_test)[:, 1]
        
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        roc_auc = roc_auc_score(y_test, y_test_proba)
        
        # Calculate additional metrics
        from sklearn.metrics import precision_score, recall_score, f1_score
        precision = precision_score(y_test, y_test_pred)
        recall = recall_score(y_test, y_test_pred)
        f1 = f1_score(y_test, y_test_pred)
        
        # Calculate ROC curve coordinates
        fpr, tpr, thresholds = roc_curve(y_test, y_test_proba)

        # Compute feature importances (aligned with preprocessor feature names)
        feature_importances = []
        if hasattr(self.model, 'feature_importances_') and self.preprocessor.feature_names:
            importances = self.model.feature_importances_
            feature_importances = [
                {
                    'feature': feature_name,
                    'importance': float(importance)
                }
                for feature_name, importance in zip(self.preprocessor.feature_names, importances)
            ]
            feature_importances.sort(key=lambda item: item['importance'], reverse=True)

        # Store metrics for later retrieval
        self.training_metrics = {
            'model_type': 'XGBoost',
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'roc_auc': float(roc_auc),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'train_size': int(len(X_train)),
            'test_size': int(len(X_test)),
            'n_features': int(X.shape[1]),
            'classification_report': classification_report(y_test, y_test_pred, output_dict=True),
            'confusion_matrix': confusion_matrix(y_test, y_test_pred).tolist(),
            'roc_curve': {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist(),
                'thresholds': thresholds.tolist()
            },
            'feature_importance': feature_importances
        }
        
        print(f"\n{'='*60}")
        print("XGBoost Model Training Results")
        print(f"{'='*60}")
        print(f"Training accuracy: {train_score:.4f}")
        print(f"Test accuracy: {test_score:.4f}")
        print(f"ROC-AUC Score: {roc_auc:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall: {recall:.4f}")
        print(f"F1 Score: {f1:.4f}")
        
        print(f"\nTest Set Classification Report:")
        print(classification_report(y_test, y_test_pred))
        
        print(f"\nConfusion Matrix (Test Set):")
        print(confusion_matrix(y_test, y_test_pred))
        print(f"{'='*60}\n")
        
        return self.model
    
    def save_model_to_r2(self):
        """Save trained model, preprocessor, and metrics to Cloudflare R2"""
        s3_client = boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
        
        # Save model and preprocessor
        buffer = BytesIO()
        joblib.dump({
            'model': self.model,
            'preprocessor': self.preprocessor
        }, buffer)
        buffer.seek(0)
        
        s3_client.put_object(
            Bucket=self.config.r2_bucket_name,
            Key=self.config.model_path,
            Body=buffer.getvalue()
        )
        print(f"Model and preprocessor saved to R2: {self.config.model_path}")
        
        # Save training metrics as JSON
        if hasattr(self, 'training_metrics'):
            import json
            metrics_json = json.dumps(self.training_metrics, indent=2)
            s3_client.put_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/xgboost_metrics.json',
                Body=metrics_json.encode('utf-8'),
                ContentType='application/json'
            )
            print(f"Training metrics saved to R2: models/xgboost_metrics.json")
    
    def load_model_from_r2(self):
        """Load trained model and preprocessor from Cloudflare R2"""
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
        self.preprocessor = model_data['preprocessor']
        if hasattr(self.preprocessor, 'feature_names'):
            self.feature_names = self.preprocessor.feature_names
        else:
            self.feature_names = []
        
        print("Model and preprocessor loaded from R2")
    
    def predict(self, input_data: dict, is_human_readable: bool = True):
        """
        Make prediction on new data using trained model and preprocessor.
        
        Args:
            input_data: Dictionary with feature values
                - If is_human_readable=True: human-readable values (e.g., checking_balance=150)
                - If is_human_readable=False: symbolic codes (e.g., Attribute1='A12')
            is_human_readable: Whether input uses human-readable format
            
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model_from_r2() first.")
        
        if not self.preprocessor.is_fitted:
            raise ValueError("Preprocessor not fitted. Model may not be properly loaded.")
        
        # Translate human-readable input to symbolic codes if needed
        if is_human_readable:
            input_data = FeatureMappings.map_user_input(input_data)
        
        # Prepare input using preprocessor
        X = self.preprocessor.prepare_input_for_prediction(input_data)
        
        # Make prediction
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Model uses [0, 1] internally, map back to original [1, 2]
        # 0 = good credit (class 1), 1 = bad credit (class 2)
        original_prediction = int(prediction) + 1
        decision = "approved" if prediction == 0 else "rejected"
        confidence = float(max(probabilities))
        
        return {
            'decision': decision,
            'prediction': original_prediction,  # Return original class labels [1, 2]
            'confidence': confidence,
            'probability_good': float(probabilities[0]),  # Class 0 = good credit
            'probability_bad': float(probabilities[1]) if len(probabilities) > 1 else 1 - float(probabilities[0]),
            'preprocessed_features': X.iloc[0].to_dict()
        }
    
    def get_feature_info(self):
        """Get feature information for frontend form generation"""
        if not self.preprocessor.is_fitted:
            raise ValueError("Preprocessor not fitted. Train or load model first.")
        
        return self.preprocessor.get_feature_info()
