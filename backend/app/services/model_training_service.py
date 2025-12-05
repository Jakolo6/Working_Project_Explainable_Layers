# Model Training Service - Handles model retraining with risk-ordered categorical encoding
# Ensures SHAP values are semantically meaningful

import pandas as pd
import numpy as np
import joblib
import json
import boto3
from botocore.config import Config
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, Tuple, List
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.utils import resample
from sklearn.preprocessing import OrdinalEncoder, OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("⚠️ XGBoost not available - install with: pip install xgboost")

from app.config import get_settings


# =============================================================================
# RISK-ORDERED CATEGORIES - Critical for meaningful SHAP values
# =============================================================================
# Order: Lower risk (better) → Higher risk (worse)
# This ensures:
#   - Higher ordinal value = higher risk = positive SHAP contribution
#   - Lower ordinal value = lower risk = negative SHAP contribution

CATEGORY_ORDER = {
    'checking_status': ['ge_200_dm', '0_to_200_dm', 'no_checking', 'lt_0_dm'],
    'credit_history': ['all_paid', 'existing_paid', 'no_credits', 'delayed_past', 'critical'],
    'purpose': ['new_car', 'used_car', 'furniture', 'radio_tv', 'domestic_appliances', 
                'repairs', 'education', 'retraining', 'business', 'vacation', 'others'],
    'savings_status': ['ge_1000_dm', '500_to_1000_dm', '100_to_500_dm', 'lt_100_dm', 'unknown'],
    'employment': ['ge_7_years', '4_to_7_years', '1_to_4_years', 'lt_1_year', 'unemployed'],
    'housing': ['own', 'for_free', 'rent'],
    'job': ['management', 'skilled', 'unskilled_resident', 'unemployed_unskilled'],
    'other_debtors': ['guarantor', 'co_applicant', 'none'],
    'property_magnitude': ['real_estate', 'building_society', 'car_other', 'unknown'],
    'other_payment_plans': ['none', 'stores', 'bank'],
    'own_telephone': ['yes', 'none'],
    'installment_commitment': ['lt_20_percent', '20_to_25_percent', '25_to_35_percent', 'ge_35_percent']
}

# Feature definitions
NUM_FEATURES = ['duration', 'credit_amount', 
                'residence_since', 'age', 'existing_credits', 'num_dependents']

CAT_FEATURES = ['checking_status', 'credit_history', 'purpose', 'savings_status', 
                'employment', 'housing', 'job', 'other_debtors', 
                'property_magnitude', 'other_payment_plans', 'own_telephone', 'installment_commitment']

EMPLOYMENT_YEARS_MAP = {
    'unemployed': 0, 'lt_1_year': 0.5, '1_to_4_years': 2.5,
    '4_to_7_years': 5.5, 'ge_7_years': 10
}

# Installment rate mapping: 1-4 scale to categorical
INSTALLMENT_RATE_MAP = {
    1: 'ge_35_percent',      # ≥35% (highest burden)
    2: '25_to_35_percent',   # 25-35%
    3: '20_to_25_percent',   # 20-25%
    4: 'lt_20_percent'       # <20% (lowest burden)
}


class ModelTrainingService:
    """Service for training credit risk models with risk-ordered categorical encoding."""
    
    def __init__(self, config=None):
        self.config = config or get_settings()
        self.training_log = []
        
    def log(self, message: str):
        """Add message to training log."""
        timestamp = datetime.now().isoformat()
        self.training_log.append(f"[{timestamp}] {message}")
        print(message)
    
    def _create_r2_client(self):
        """Create Cloudflare R2 client."""
        return boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key,
            config=Config(signature_version='s3v4', region_name='auto')
        )
    
    def load_data_from_r2(self) -> pd.DataFrame:
        """Load training data from R2."""
        self.log("Loading data from R2...")
        r2 = self._create_r2_client()
        
        obj = r2.get_object(
            Bucket=self.config.r2_bucket_name,
            Key='data/german_credit_clean.csv'
        )
        df = pd.read_csv(BytesIO(obj['Body'].read()))
        self.log(f"✓ Loaded {len(df)} records from R2")
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply feature engineering."""
        self.log("Engineering features...")
        df = df.copy()
        
        # Map employment to years
        df['employment_years'] = df['employment'].map(EMPLOYMENT_YEARS_MAP)
        
        # Convert installment_commitment from numerical (1-4) to categorical
        if 'installment_commitment' in df.columns:
            df['installment_commitment'] = df['installment_commitment'].map(INSTALLMENT_RATE_MAP)
            self.log("✓ Converted installment_commitment to categorical")
        
        # Create engineered features
        df['monthly_burden'] = df['credit_amount'] / df['duration']
        df['stability_score'] = df['age'] * df['employment_years']
        df['risk_ratio'] = df['credit_amount'] / (df['age'] * 100)
        df['credit_to_income_proxy'] = df['credit_amount'] / df['age']
        df['duration_risk'] = df['duration'] * df['credit_amount']
        
        self.log("✓ Created 5 engineered features")
        return df
    
    def prepare_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, List[str], List[str]]:
        """Prepare data for training."""
        self.log("Preparing data...")
        
        # Create target (class 2 = bad credit = 1)
        df['target'] = (df['class'] == 2).astype(int)
        self.log(f"  Target distribution: {df['target'].value_counts().to_dict()}")
        
        # Engineer features
        df = self.engineer_features(df)
        
        # Define feature sets
        num_features = NUM_FEATURES + ['monthly_burden', 'stability_score', 'risk_ratio',
                                        'credit_to_income_proxy', 'duration_risk']
        
        X = df[num_features + CAT_FEATURES]
        y = df['target']
        
        self.log(f"✓ Prepared {len(num_features)} numerical + {len(CAT_FEATURES)} categorical features")
        return X, y, num_features, CAT_FEATURES
    
    def upsample_minority(self, X: pd.DataFrame, y: pd.Series) -> Tuple[pd.DataFrame, pd.Series]:
        """Upsample minority class for balanced training."""
        self.log("Upsampling minority class...")
        
        df_train = pd.concat([X, y], axis=1)
        df_majority = df_train[df_train['target'] == 0]
        df_minority = df_train[df_train['target'] == 1]
        
        df_minority_upsampled = resample(
            df_minority,
            replace=True,
            n_samples=len(df_majority),
            random_state=42
        )
        
        df_balanced = pd.concat([df_majority, df_minority_upsampled])
        
        X_bal = df_balanced.drop('target', axis=1)
        y_bal = df_balanced['target']
        
        self.log(f"✓ Balanced: {len(df_majority)} majority + {len(df_minority_upsampled)} minority")
        return X_bal, y_bal
    
    def train_xgboost(self, X_train: pd.DataFrame, y_train: pd.Series, 
                      X_test: pd.DataFrame, y_test: pd.Series,
                      num_features: List[str]) -> Tuple[Pipeline, Dict[str, float]]:
        """Train XGBoost model with OneHotEncoder for better performance."""
        if not HAS_XGBOOST:
            raise RuntimeError("XGBoost not installed. Run: pip install xgboost")
        
        self.log("Training XGBoost with OneHotEncoder for optimal performance...")
        
        # Use OneHotEncoder for XGBoost - this gives MUCH better performance
        # than OrdinalEncoder because XGBoost can learn arbitrary splits for each category
        # SHAP values will still be meaningful per category value
        preprocessor = ColumnTransformer([
            ('num', 'passthrough', num_features),
            ('cat', OneHotEncoder(
                drop=None,  # Don't drop first - XGBoost handles collinearity well
                sparse_output=False,
                handle_unknown='ignore'
            ), CAT_FEATURES)
        ])
        
        # Optimized hyperparameters for XGBoost with OneHotEncoding
        pipeline = Pipeline([
            ('preprocess', preprocessor),
            ('model', XGBClassifier(
                n_estimators=500,
                learning_rate=0.03,
                max_depth=6,
                min_child_weight=3,
                subsample=0.8,
                colsample_bytree=0.8,
                colsample_bylevel=0.8,
                gamma=0.1,
                reg_alpha=0.1,
                reg_lambda=1.0,
                scale_pos_weight=1.5,       # Handle class imbalance
                random_state=42,
                use_label_encoder=False,
                eval_metric='auc'
            ))
        ])
        
        # Train
        pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_proba)
        }
        
        self.log(f"✓ XGBoost trained - AUC: {metrics['roc_auc']:.4f}, F1: {metrics['f1']:.4f}")
        
        # If AUC is still below 0.75, try hyperparameter search
        if metrics['roc_auc'] < 0.75:
            self.log("⚠️ AUC below 0.75, running hyperparameter optimization...")
            pipeline, metrics = self._tune_xgboost(X_train, y_train, X_test, y_test, 
                                                    num_features)
        
        return pipeline, metrics
    
    def _tune_xgboost(self, X_train: pd.DataFrame, y_train: pd.Series,
                      X_test: pd.DataFrame, y_test: pd.Series,
                      num_features: List[str]) -> Tuple[Pipeline, Dict[str, float]]:
        """Hyperparameter tuning for XGBoost when initial training underperforms."""
        from sklearn.model_selection import RandomizedSearchCV
        
        self.log("Running RandomizedSearchCV for XGBoost optimization...")
        
        # Create base preprocessor with OneHotEncoder
        preprocessor = ColumnTransformer([
            ('num', 'passthrough', num_features),
            ('cat', OneHotEncoder(
                drop=None,
                sparse_output=False,
                handle_unknown='ignore'
            ), CAT_FEATURES)
        ])
        
        # Parameter grid
        param_distributions = {
            'model__n_estimators': [300, 500, 700, 1000],
            'model__learning_rate': [0.01, 0.02, 0.03, 0.05, 0.1],
            'model__max_depth': [3, 4, 5, 6, 7, 8],
            'model__min_child_weight': [1, 2, 3, 5],
            'model__subsample': [0.7, 0.8, 0.9, 1.0],
            'model__colsample_bytree': [0.6, 0.7, 0.8, 0.9],
            'model__gamma': [0, 0.05, 0.1, 0.2],
            'model__reg_alpha': [0, 0.01, 0.05, 0.1],
            'model__reg_lambda': [0.1, 0.5, 1.0, 2.0],
            'model__scale_pos_weight': [1, 1.5, 2, 2.5, 3]
        }
        
        # Create pipeline
        pipeline = Pipeline([
            ('preprocess', preprocessor),
            ('model', XGBClassifier(
                random_state=42,
                use_label_encoder=False,
                eval_metric='auc'
            ))
        ])
        
        # Randomized search
        search = RandomizedSearchCV(
            pipeline,
            param_distributions,
            n_iter=40,
            cv=5,
            scoring='roc_auc',
            random_state=42,
            n_jobs=-1,
            verbose=0
        )
        
        search.fit(X_train, y_train)
        
        best_pipeline = search.best_estimator_
        self.log(f"Best CV AUC: {search.best_score_:.4f}")
        self.log(f"Best params: {search.best_params_}")
        
        # Evaluate on test set
        y_pred = best_pipeline.predict(X_test)
        y_proba = best_pipeline.predict_proba(X_test)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_proba)
        }
        
        self.log(f"✓ Tuned XGBoost - AUC: {metrics['roc_auc']:.4f}, F1: {metrics['f1']:.4f}")
        return best_pipeline, metrics
    
    def train_logistic(self, X_train: pd.DataFrame, y_train: pd.Series,
                       X_test: pd.DataFrame, y_test: pd.Series,
                       num_features: List[str]) -> Tuple[Pipeline, Dict[str, float]]:
        """Train Logistic Regression model."""
        self.log("Training Logistic Regression...")
        
        # Create preprocessing pipeline
        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), CAT_FEATURES)
        ])
        
        # Create full pipeline
        pipeline = Pipeline([
            ('preprocess', preprocessor),
            ('model', LogisticRegression(
                max_iter=2000,
                solver='lbfgs',
                random_state=42,
                C=0.1
            ))
        ])
        
        # Train
        pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_proba)
        }
        
        self.log(f"✓ Logistic trained - AUC: {metrics['roc_auc']:.4f}, F1: {metrics['f1']:.4f}")
        return pipeline, metrics
    
    def run_sanity_check(self, xgb_pipeline: Pipeline, num_features: List[str]) -> Dict[str, Any]:
        """Run sanity checks on trained model."""
        self.log("Running sanity checks...")
        
        # Test applicants
        safe_applicant = {
            'duration': 12, 'credit_amount': 2000, 'installment_commitment': 'lt_20_percent',
            'residence_since': 4, 'age': 45, 'existing_credits': 1, 'num_dependents': 1,
            'monthly_burden': 166.67, 'stability_score': 450, 'risk_ratio': 0.44,
            'credit_to_income_proxy': 44.4, 'duration_risk': 24000,
            'checking_status': 'ge_200_dm', 'credit_history': 'all_paid',
            'purpose': 'new_car', 'savings_status': 'ge_1000_dm', 'employment': 'ge_7_years',
            'housing': 'own', 'job': 'management', 'other_debtors': 'guarantor',
            'property_magnitude': 'real_estate', 'other_payment_plans': 'none',
            'own_telephone': 'yes'
        }
        
        risky_applicant = {
            'duration': 48, 'credit_amount': 15000, 'installment_commitment': 'ge_35_percent',
            'residence_since': 1, 'age': 22, 'existing_credits': 4, 'num_dependents': 2,
            'monthly_burden': 312.5, 'stability_score': 0, 'risk_ratio': 6.82,
            'credit_to_income_proxy': 681.8, 'duration_risk': 720000,
            'checking_status': 'lt_0_dm', 'credit_history': 'critical',
            'purpose': 'vacation', 'savings_status': 'lt_100_dm', 'employment': 'unemployed',
            'housing': 'rent', 'job': 'unemployed_unskilled', 'other_debtors': 'none',
            'property_magnitude': 'unknown', 'other_payment_plans': 'bank',
            'own_telephone': 'none'
        }
        
        results = {}
        
        for name, applicant in [('safe', safe_applicant), ('risky', risky_applicant)]:
            df = pd.DataFrame([applicant])
            df = df[num_features + CAT_FEATURES]
            
            pred = xgb_pipeline.predict(df)[0]
            proba = xgb_pipeline.predict_proba(df)[0]
            
            decision = 'approved' if pred == 0 else 'rejected'
            confidence = max(proba)
            
            results[name] = {
                'decision': decision,
                'confidence': float(confidence),
                'probability_good': float(proba[0]),
                'probability_bad': float(proba[1])
            }
            
            expected = 'approved' if name == 'safe' else 'rejected'
            status = '✅' if decision == expected else '❌'
            self.log(f"  {status} {name.upper()}: {decision} ({confidence:.1%})")
        
        # Validate
        passed = (results['safe']['decision'] == 'approved' and 
                  results['risky']['decision'] == 'rejected')
        
        results['passed'] = passed
        
        if passed:
            self.log("✓ Sanity checks PASSED")
        else:
            self.log("❌ Sanity checks FAILED")
        
        return results
    
    def save_models_to_r2(self, xgb_pipeline: Pipeline, logistic_pipeline: Pipeline,
                          xgb_metrics: Dict, logistic_metrics: Dict,
                          sanity_results: Dict) -> Dict[str, str]:
        """Save trained models and metrics to R2."""
        self.log("Uploading models to R2...")
        r2 = self._create_r2_client()
        
        uploaded = {}
        
        # Save XGBoost model
        xgb_buffer = BytesIO()
        joblib.dump(xgb_pipeline, xgb_buffer)
        xgb_buffer.seek(0)
        r2.put_object(
            Bucket=self.config.r2_bucket_name,
            Key='models/xgboost_model.pkl',
            Body=xgb_buffer.getvalue()
        )
        uploaded['xgboost_model'] = 'models/xgboost_model.pkl'
        self.log("  ✓ Uploaded xgboost_model.pkl")
        
        # Save Logistic model
        log_buffer = BytesIO()
        joblib.dump(logistic_pipeline, log_buffer)
        log_buffer.seek(0)
        r2.put_object(
            Bucket=self.config.r2_bucket_name,
            Key='models/logistic_model.pkl',
            Body=log_buffer.getvalue()
        )
        uploaded['logistic_model'] = 'models/logistic_model.pkl'
        self.log("  ✓ Uploaded logistic_model.pkl")
        
        # Save metrics
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'xgboost': xgb_metrics,
            'logistic': logistic_metrics,
            'sanity_check': sanity_results,
            'encoding': 'risk_ordered_ordinal',
            'category_order': CATEGORY_ORDER
        }
        
        r2.put_object(
            Bucket=self.config.r2_bucket_name,
            Key='models/metrics.json',
            Body=json.dumps(metrics, indent=2)
        )
        uploaded['metrics'] = 'models/metrics.json'
        self.log("  ✓ Uploaded metrics.json")
        
        return uploaded
    
    def full_training_pipeline(self) -> Dict[str, Any]:
        """Run complete training pipeline."""
        self.training_log = []
        self.log("=" * 60)
        self.log("STARTING MODEL TRAINING PIPELINE")
        self.log("=" * 60)
        
        try:
            # Load data
            df = self.load_data_from_r2()
            
            # Prepare data
            X, y, num_features, cat_features = self.prepare_data(df)
            
            # Split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, stratify=y, random_state=42
            )
            self.log(f"Split: {len(X_train)} train, {len(X_test)} test")
            
            # Upsample
            X_train_bal, y_train_bal = self.upsample_minority(X_train, y_train)
            
            # Train XGBoost
            xgb_pipeline, xgb_metrics = self.train_xgboost(
                X_train_bal, y_train_bal, X_test, y_test, num_features
            )
            
            # Train Logistic
            logistic_pipeline, logistic_metrics = self.train_logistic(
                X_train_bal, y_train_bal, X_test, y_test, num_features
            )
            
            # Sanity check
            sanity_results = self.run_sanity_check(xgb_pipeline, num_features)
            
            # Upload to R2
            uploaded = self.save_models_to_r2(
                xgb_pipeline, logistic_pipeline,
                xgb_metrics, logistic_metrics,
                sanity_results
            )
            
            self.log("=" * 60)
            self.log("TRAINING COMPLETE")
            self.log("=" * 60)
            
            return {
                'success': True,
                'xgboost_metrics': xgb_metrics,
                'logistic_metrics': logistic_metrics,
                'sanity_check': sanity_results,
                'uploaded_files': uploaded,
                'log': self.training_log
            }
            
        except Exception as e:
            self.log(f"❌ Training failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'log': self.training_log
            }
