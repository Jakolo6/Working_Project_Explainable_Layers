#!/usr/bin/env python3
"""
Retrain models with sklearn 1.7.2 and upload to R2.
This fixes the OrdinalEncoder isnan() bug.
"""

import pandas as pd
import numpy as np
import joblib
import boto3
from io import BytesIO
from pathlib import Path
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.utils import resample
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

# R2 Configuration
R2_CONFIG = {
    'account_id': 'ff9c5d15c3296ba6a3aa9a96d1163cfe',
    'access_key_id': '58df651c2650ad40980aee11b9537146',
    'secret_access_key': 'e28f2e1d94035dfd814b79159dcadf82a33b926fe1f481becd1a50da9d2caa18',
    'bucket_name': 'xai-financial-data',
    'endpoint_url': 'https://ff9c5d15c3296ba6a3aa9a96d1163cfe.r2.cloudflarestorage.com'
}

def load_data():
    """Load and prepare data."""
    print("Loading data...")
    df = pd.read_csv('data/german_credit_clean.csv')
    
    # Binary target
    df['target'] = (df['class'] == 2).astype(int)
    
    # Remove bias features
    df_clean = df.drop(columns=['personal_status_sex', 'foreign_worker', 'class'], errors='ignore')
    
    print(f"✓ Loaded {df_clean.shape[0]} samples")
    print(f"  Bad credit rate: {df_clean['target'].mean():.1%}")
    return df_clean

def engineer_features(df):
    """Create engineered features."""
    emp_map = {'unemployed': 0, 'lt_1_year': 0.5, '1_to_4_years': 2.5,
               '4_to_7_years': 5.5, 'ge_7_years': 10}
    df['employment_years'] = df['employment'].map(emp_map)
    
    df['monthly_burden'] = df['credit_amount'] / df['duration']
    df['stability_score'] = df['age'] * df['employment_years']
    df['risk_ratio'] = df['credit_amount'] / (df['age'] * 100)
    df['credit_to_income_proxy'] = df['credit_amount'] / df['age']
    df['duration_risk'] = df['duration'] * df['credit_amount']
    
    return df

def prepare_data(df):
    """Prepare train/test split with upsampling."""
    num_features = ['duration', 'credit_amount', 'installment_commitment',
                    'residence_since', 'age', 'existing_credits', 'num_dependents']
    
    cat_features = ['checking_status', 'credit_history', 'purpose',
                    'savings_status', 'employment', 'housing', 'job',
                    'other_debtors', 'property_magnitude', 'other_payment_plans',
                    'own_telephone']
    
    num_features_eng = num_features + ['monthly_burden', 'stability_score', 'risk_ratio',
                                        'credit_to_income_proxy', 'duration_risk']
    
    df = engineer_features(df)
    
    X = df[num_features_eng + cat_features]
    y = df['target']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    # Upsample training set
    X_train_maj = X_train[y_train == 0]
    y_train_maj = y_train[y_train == 0]
    X_train_min = X_train[y_train == 1]
    y_train_min = y_train[y_train == 1]
    
    X_train_min_up, y_train_min_up = resample(
        X_train_min, y_train_min,
        n_samples=len(y_train_maj),
        random_state=42,
        replace=True
    )
    
    X_train_bal = pd.concat([X_train_maj, X_train_min_up])
    y_train_bal = pd.concat([y_train_maj, y_train_min_up])
    
    shuffle_idx = np.random.RandomState(42).permutation(len(X_train_bal))
    X_train_bal = X_train_bal.iloc[shuffle_idx].reset_index(drop=True)
    y_train_bal = y_train_bal.iloc[shuffle_idx].reset_index(drop=True)
    
    print(f"✓ Train: {X_train_bal.shape[0]} samples (balanced)")
    print(f"✓ Test: {X_test.shape[0]} samples")
    
    return X_train_bal, X_test, y_train_bal, y_test, num_features_eng, cat_features

def train_logistic(X_train, y_train, num_features, cat_features):
    """Train Logistic Regression model."""
    print("\nTraining Logistic Regression...")
    
    linear_prep = ColumnTransformer([
        ('num', StandardScaler(), num_features),
        ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), cat_features)
    ])
    
    logreg_pipeline = Pipeline([
        ('preprocess', linear_prep),
        ('model', LogisticRegression(
            max_iter=2000,
            solver='saga',
            penalty='l2',
            C=0.1,
            random_state=42
        ))
    ])
    
    logreg_pipeline.fit(X_train, y_train)
    print("✓ Logistic Regression trained")
    return logreg_pipeline

def train_xgboost(X_train, y_train, num_features, cat_features):
    """Train XGBoost model."""
    print("\nTraining XGBoost...")
    
    xgb_prep = ColumnTransformer([
        ('num', 'passthrough', num_features),
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), cat_features)
    ])
    
    xgb_pipeline = Pipeline([
        ('preprocess', xgb_prep),
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
            random_state=42,
            eval_metric='logloss'
        ))
    ])
    
    xgb_pipeline.fit(X_train, y_train)
    print("✓ XGBoost trained")
    return xgb_pipeline

def upload_to_r2(model, model_name):
    """Upload model to R2."""
    print(f"\nUploading {model_name} to R2...")
    
    s3 = boto3.client(
        's3',
        endpoint_url=R2_CONFIG['endpoint_url'],
        aws_access_key_id=R2_CONFIG['access_key_id'],
        aws_secret_access_key=R2_CONFIG['secret_access_key'],
        region_name='auto'
    )
    
    # Serialize model
    buffer = BytesIO()
    joblib.dump(model, buffer)
    buffer.seek(0)
    
    # Upload
    s3.upload_fileobj(buffer, R2_CONFIG['bucket_name'], f'models/{model_name}')
    print(f"✓ {model_name} uploaded to R2")

def main():
    print("="*60)
    print("RETRAINING MODELS WITH SKLEARN 1.7.2")
    print("="*60)
    
    # Check sklearn version
    import sklearn
    print(f"\nUsing scikit-learn version: {sklearn.__version__}")
    if not sklearn.__version__.startswith('1.7'):
        print("⚠️  WARNING: Expected sklearn 1.7.x")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            return
    
    # Load and prepare data
    df = load_data()
    X_train, X_test, y_train, y_test, num_features, cat_features = prepare_data(df)
    
    # Train models
    logreg = train_logistic(X_train, y_train, num_features, cat_features)
    xgboost = train_xgboost(X_train, y_train, num_features, cat_features)
    
    # Save locally
    models_dir = Path('models')
    models_dir.mkdir(exist_ok=True)
    
    print("\nSaving models locally...")
    joblib.dump(logreg, models_dir / 'logistic_model.pkl')
    joblib.dump(xgboost, models_dir / 'xgboost_model.pkl')
    print("✓ Models saved locally")
    
    # Upload to R2
    upload_to_r2(logreg, 'logistic_model.pkl')
    upload_to_r2(xgboost, 'xgboost_model.pkl')
    
    # Quick test
    print("\nQuick test...")
    logreg_pred = logreg.predict(X_test)
    xgb_pred = xgboost.predict(X_test)
    
    from sklearn.metrics import accuracy_score, f1_score
    print(f"Logistic - Accuracy: {accuracy_score(y_test, logreg_pred):.3f}, F1: {f1_score(y_test, logreg_pred):.3f}")
    print(f"XGBoost  - Accuracy: {accuracy_score(y_test, xgb_pred):.3f}, F1: {f1_score(y_test, xgb_pred):.3f}")
    
    print("\n" + "="*60)
    print("✓ RETRAINING COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Railway will automatically pick up the new models from R2")
    print("2. Test the prediction endpoint again")

if __name__ == '__main__':
    main()
