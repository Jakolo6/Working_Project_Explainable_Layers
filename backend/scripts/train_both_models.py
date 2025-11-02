# Script to train both XGBoost and Logistic Regression models with new preprocessing

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.services.xgboost_model import CreditModel
from app.services.logistic_model import LogisticCreditModel
from app.config import get_settings

load_dotenv()

def train_xgboost(config, df):
    """Train XGBoost model with new preprocessing"""
    print("\n" + "="*60)
    print("TRAINING XGBOOST MODEL")
    print("="*60)
    
    model_service = CreditModel(config)
    
    print("\n🔧 Preprocessing data for XGBoost...")
    X_scaled, y, X_raw = model_service.preprocess_data(df, fit_preprocessor=True)
    print(f"✓ Features (after one-hot encoding): {X_scaled.shape[1]} columns")
    print(f"✓ Target distribution: {y.value_counts().to_dict()}")
    print(f"✓ Raw features preserved for interpretability")
    
    print("\n🎯 Training XGBoost model...")
    model_service.train_model(X_scaled, y, X_raw)
    
    print("\n☁️  Uploading XGBoost model to R2...")
    model_service.save_model_to_r2()
    print("✓ XGBoost model saved successfully")
    
    return model_service

def train_logistic(config, df):
    """Train Logistic Regression model with new preprocessing"""
    print("\n" + "="*60)
    print("TRAINING LOGISTIC REGRESSION MODEL")
    print("="*60)
    
    model_service = LogisticCreditModel(config)
    
    print("\n🔧 Preprocessing data for Logistic Regression...")
    X_scaled, y, X_raw = model_service.preprocess_data(df, fit_preprocessor=True)
    print(f"✓ Features (after one-hot encoding): {X_scaled.shape[1]} columns")
    print(f"✓ Target distribution: {y.value_counts().to_dict()}")
    print(f"✓ Raw features preserved for interpretability")
    
    print("\n🎯 Training Logistic Regression model...")
    model_service.train_model(X_scaled, y, X_raw)
    
    print("\n☁️  Uploading Logistic Regression model to R2...")
    model_service.save_model_to_r2()
    print("✓ Logistic Regression model saved successfully")
    
    return model_service

def main():
    """Train both models with new one-hot encoding preprocessing"""
    print("="*60)
    print("COMPREHENSIVE MODEL TRAINING PIPELINE")
    print("Training XGBoost and Logistic Regression")
    print("New Preprocessing: One-hot encoding + raw feature preservation")
    print("Excluding bias features: personal_status, foreign_worker")
    print("="*60)
    
    try:
        # Load configuration
        config = get_settings()
        
        # Load dataset from R2 (only once)
        print("\n📥 Loading dataset from R2...")
        xgb_service = CreditModel(config)
        df = xgb_service.load_dataset_from_r2()
        print(f"✓ Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        print(f"✓ Columns: {df.columns.tolist()}")
        
        # Train XGBoost
        xgb_model = train_xgboost(config, df.copy())
        
        # Train Logistic Regression
        lr_model = train_logistic(config, df.copy())
        
        # Summary
        print("\n" + "="*60)
        print("✓ ALL MODELS TRAINED SUCCESSFULLY!")
        print("="*60)
        print("\nTrained Models:")
        print("  1. XGBoost Classifier")
        print("  2. Logistic Regression Classifier")
        print("\nBoth models:")
        print("  - Use one-hot encoding for categorical features")
        print("  - Preserve raw + scaled features for interpretability")
        print("  - Exclude bias features (personal_status, foreign_worker)")
        print("  - Use same preprocessing pipeline for fair comparison")
        print("  - Saved to Cloudflare R2")
        print("  - Ready for predictions and benchmarking")
        print("="*60)
        
    except Exception as e:
        print("\n" + "="*60)
        print(f"✗ Training failed: {e}")
        print("="*60)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
