# Script to train Logistic Regression model and upload to Cloudflare R2

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.services.logistic_model import LogisticCreditModel
from app.config import get_settings

load_dotenv()

def main():
    """Train Logistic Regression model and upload to R2"""
    print("=" * 60)
    print("Logistic Regression Model Training Pipeline")
    print("=" * 60)
    
    try:
        # Load configuration
        config = get_settings()
        
        # Initialize model service
        print("\n📊 Initializing Logistic Regression model service...")
        model_service = LogisticCreditModel(config)
        
        # Load dataset from R2
        print("\n📥 Loading dataset from R2...")
        df = model_service.load_dataset_from_r2()
        print(f"✓ Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Preprocess data
        print("\n🔧 Preprocessing data...")
        X, y = model_service.preprocess_data(df, fit_preprocessor=True)
        print(f"✓ Features: {X.shape[1]} columns")
        print(f"✓ Target distribution: {y.value_counts().to_dict()}")
        
        # Train model
        print("\n🎯 Training Logistic Regression model...")
        model_service.train_model(X, y)
        print("✓ Model trained successfully")
        
        # Save to R2
        print("\n☁️  Uploading model to R2...")
        model_service.save_model_to_r2()
        print("✓ Model uploaded successfully")
        
        print("\n" + "=" * 60)
        print("✓ Training pipeline completed!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ Training failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
