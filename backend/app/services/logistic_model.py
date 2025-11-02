# Logistic Regression model service with new one-hot encoding preprocessing

import pandas as pd
import numpy as np
import pickle
import json
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, roc_curve
)
from app.services.preprocessing import GermanCreditPreprocessor
from app.services.feature_mappings import FeatureMappings
from app.config import Settings
import boto3
from botocore.config import Config
from io import BytesIO


class LogisticCreditModel:
    """
    Logistic Regression model for credit risk prediction.
    Uses the same preprocessing pipeline as XGBoost for fair comparison.
    """
    
    def __init__(self, config: Settings):
        self.config = config
        self.model = None
        self.preprocessor = GermanCreditPreprocessor()
        self.training_metrics = {}
        self.key_features = []
        
    def create_r2_client(self):
        """Create Cloudflare R2 client"""
        return boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key,
            config=Config(signature_version='s3v4', region_name='auto')
        )
    
    def preprocess_data(self, df: pd.DataFrame, fit_preprocessor: bool = True):
        """
        Preprocess dataset using GermanCreditPreprocessor.
        
        Args:
            df: Raw dataset
            fit_preprocessor: If True, fit the preprocessor (training mode)
            
        Returns:
            Tuple of (X_scaled, y, X_raw) - scaled features, target, and raw features
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
            X_scaled, y, X_raw = self.preprocessor.fit_transform(df, target_col=target_col)
        else:
            X_scaled, y, X_raw = self.preprocessor.transform(df, target_col=target_col)
        
        return X_scaled, y, X_raw
    
    def train_model(self, X_scaled, y, X_raw=None):
        """
        Train Logistic Regression classifier.
        
        Args:
            X_scaled: Scaled preprocessed features
            y: Target variable
            X_raw: Raw feature values (for interpretability, optional)
            
        Returns:
            Trained model
        """
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Initialize Logistic Regression with balanced class weights
        self.model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight='balanced',
            solver='lbfgs',
            C=1.0
        )
        
        # Train model
        print("Training Logistic Regression model...")
        self.model.fit(X_train, y_train)
        
        # Predictions
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        y_test_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        train_score = accuracy_score(y_train, y_train_pred)
        test_score = accuracy_score(y_test, y_test_pred)
        precision = precision_score(y_test, y_test_pred)
        recall = recall_score(y_test, y_test_pred)
        f1 = f1_score(y_test, y_test_pred)
        roc_auc = roc_auc_score(y_test, y_test_proba)
        
        # ROC curve
        fpr, tpr, thresholds = roc_curve(y_test, y_test_proba)
        
        # Calculate misclassification cost using German Credit cost matrix
        # Cost matrix: [[0, 1], [5, 0]]
        # Row = actual, Column = predicted
        # Cost of FP (predict good when bad) = 5
        # Cost of FN (predict bad when good) = 1
        cm = confusion_matrix(y_test, y_test_pred)
        tn, fp, fn, tp = cm.ravel()
        total_cost = (fp * 5) + (fn * 1)  # FP costs 5, FN costs 1
        avg_cost_per_prediction = total_cost / len(y_test)
        
        print(f"\n{'='*60}")
        print("LOGISTIC REGRESSION TRAINING RESULTS")
        print(f"{'='*60}")
        print(f"Train Accuracy: {train_score:.4f}")
        print(f"Test Accuracy:  {test_score:.4f}")
        print(f"Precision:      {precision:.4f}")
        print(f"Recall:         {recall:.4f}")
        print(f"F1 Score:       {f1:.4f}")
        print(f"ROC-AUC:        {roc_auc:.4f}")
        
        print(f"\nConfusion Matrix (Test Set):")
        print(cm)
        
        print(f"\nMisclassification Cost Analysis:")
        print(f"False Positives (predict good when bad): {fp} × 5 = {fp * 5}")
        print(f"False Negatives (predict bad when good): {fn} × 1 = {fn * 1}")
        print(f"Total Cost: {total_cost}")
        print(f"Average Cost per Prediction: {avg_cost_per_prediction:.4f}")
        print(f"{'='*60}\n")
        
        # Compute feature coefficients (importance)
        feature_importance = []
        if hasattr(self.model, 'coef_') and self.preprocessor.feature_names:
            coefficients = self.model.coef_[0]
            feature_importance = [
                {
                    'feature': feature_name,
                    'coefficient': float(coef),
                    'abs_coefficient': float(abs(coef))
                }
                for feature_name, coef in zip(self.preprocessor.feature_names, coefficients)
            ]
            feature_importance.sort(key=lambda item: item['abs_coefficient'], reverse=True)
            
            # Store top 10 key features
            self.key_features = [item['feature'] for item in feature_importance[:10]]
        
        # Store metrics
        self.training_metrics = {
            'model_type': 'Logistic Regression',
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'roc_auc': float(roc_auc),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'train_size': int(len(X_train)),
            'test_size': int(len(X_test)),
            'n_features': int(X_scaled.shape[1]),
            'classification_report': classification_report(y_test, y_test_pred, output_dict=True),
            'confusion_matrix': confusion_matrix(y_test, y_test_pred).tolist(),
            'total_cost': int(total_cost),
            'avg_cost_per_prediction': float(avg_cost_per_prediction),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'roc_curve': {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist(),
                'thresholds': thresholds.tolist()
            },
            'feature_coefficients': feature_importance
        }
        
        return self.model
    
    def load_dataset_from_r2(self):
        """Load dataset from R2 storage"""
        print(f"Loading dataset from R2: {self.config.dataset_path}")
        s3_client = self.create_r2_client()
        
        try:
            obj = s3_client.get_object(
                Bucket=self.config.r2_bucket_name,
                Key=self.config.dataset_path
            )
            df = pd.read_csv(BytesIO(obj['Body'].read()))
            print(f"✓ Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
            return df
        except Exception as e:
            raise Exception(f"Failed to load dataset from R2: {str(e)}")
    
    def save_model_to_r2(self):
        """Save trained model and preprocessor to R2"""
        if self.model is None:
            raise ValueError("No model to save. Train the model first.")
        
        s3_client = self.create_r2_client()
        
        # Save model + preprocessor
        model_data = {
            'model': self.model,
            'preprocessor': self.preprocessor,
            'feature_names': self.preprocessor.feature_names,
            'key_features': self.key_features
        }
        
        model_buffer = BytesIO()
        pickle.dump(model_data, model_buffer)
        model_buffer.seek(0)
        
        model_key = 'models/logistic_credit_model.pkl'
        s3_client.put_object(
            Bucket=self.config.r2_bucket_name,
            Key=model_key,
            Body=model_buffer.getvalue()
        )
        print(f"✓ Model saved to R2: {model_key}")
        
        # Save metrics
        metrics_buffer = BytesIO(json.dumps(self.training_metrics, indent=2).encode())
        metrics_key = 'models/logistic_metrics.json'
        s3_client.put_object(
            Bucket=self.config.r2_bucket_name,
            Key=metrics_key,
            Body=metrics_buffer.getvalue()
        )
        print(f"✓ Metrics saved to R2: {metrics_key}")
    
    def load_model_from_r2(self):
        """Load trained model from R2"""
        s3_client = self.create_r2_client()
        
        try:
            obj = s3_client.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/logistic_credit_model.pkl'
            )
            model_data = pickle.loads(obj['Body'].read())
            
            self.model = model_data['model']
            self.preprocessor = model_data['preprocessor']
            self.key_features = model_data.get('key_features', [])
            
            # Ensure feature_names is set
            if hasattr(model_data, 'feature_names'):
                self.preprocessor.feature_names = model_data['feature_names']
            
            print("✓ Logistic Regression model loaded from R2")
            return self.model
        except Exception as e:
            raise Exception(f"Failed to load model from R2: {str(e)}")
    
    def predict(self, input_data: dict, is_human_readable: bool = True):
        """
        Make prediction on new data.
        
        Args:
            input_data: Dictionary with feature values
            is_human_readable: Whether input uses human-readable format
            
        Returns:
            Dictionary with prediction results including both scaled and raw features
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model_from_r2() first.")
        
        if not self.preprocessor.is_fitted:
            raise ValueError("Preprocessor not fitted. Model may not be properly loaded.")
        
        # Translate human-readable input to symbolic codes if needed
        if is_human_readable:
            input_data = FeatureMappings.map_user_input(input_data)
        
        # Prepare input using preprocessor (returns both scaled and raw)
        X_scaled, X_raw = self.preprocessor.prepare_input_for_prediction(input_data)
        
        # Make prediction using scaled features
        prediction = self.model.predict(X_scaled)[0]
        probabilities = self.model.predict_proba(X_scaled)[0]
        
        # Model uses [0, 1] internally, map back to original [1, 2]
        original_prediction = int(prediction) + 1
        decision = "approved" if prediction == 0 else "rejected"
        confidence = float(max(probabilities))
        
        return {
            'decision': decision,
            'prediction': original_prediction,
            'confidence': confidence,
            'probability_good': float(probabilities[0]),
            'probability_bad': float(probabilities[1]) if len(probabilities) > 1 else 1 - float(probabilities[0]),
            'features_scaled': X_scaled.iloc[0].to_dict(),
            'features_raw': X_raw.iloc[0].to_dict()
        }
    
    def get_feature_info(self):
        """Get feature information for frontend form generation"""
        if not self.preprocessor.is_fitted:
            raise ValueError("Preprocessor not fitted. Train or load model first.")
        
        return self.preprocessor.get_feature_info()
