# Admin API - Model Management and Global Explanation Generation
# Focused endpoints for uploading models, generating explanations, and managing assets

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import boto3
from botocore.config import Config
from app.config import get_settings
import json
import io
from datetime import datetime

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def create_r2_client():
    """Create Cloudflare R2 client"""
    config = get_settings()
    return boto3.client(
        's3',
        endpoint_url=config.r2_endpoint_url,
        aws_access_key_id=config.r2_access_key_id,
        aws_secret_access_key=config.r2_secret_access_key,
        config=Config(signature_version='s3v4', region_name='auto')
    )


# =============================================================================
# ASSET STATUS ENDPOINTS
# =============================================================================

@router.get("/asset-status")
async def get_asset_status():
    """
    Get the status and last update time for all managed assets.
    Returns info about: model, global explanation, performance stats.
    """
    try:
        config = get_settings()
        r2 = create_r2_client()
        
        assets = {
            "model": {
                "key": "models/xgboost_model.pkl",
                "name": "XGBoost Credit Risk Model",
                "available": False,
                "last_modified": None
            },
            "global_explanation": {
                "key": "global_explanation/manifest.json",
                "name": "Global Explanation Package",
                "available": False,
                "last_modified": None
            },
            "performance_stats": {
                "key": "models/metrics.json",
                "name": "Model Performance Statistics",
                "available": False,
                "last_modified": None
            }
        }
        
        for asset_name, asset_info in assets.items():
            try:
                response = r2.head_object(
                    Bucket=config.r2_bucket_name,
                    Key=asset_info["key"]
                )
                assets[asset_name]["available"] = True
                assets[asset_name]["last_modified"] = response["LastModified"].isoformat()
            except:
                pass
        
        return {
            "success": True,
            "assets": assets,
            "checked_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check asset status: {str(e)}")


@router.get("/eda-stats")
async def get_eda_stats():
    """
    Get EDA statistics from R2
    Path: eda/statistics.json
    """
    try:
        config = get_settings()
        r2_client = create_r2_client()
        
        response = r2_client.get_object(
            Bucket=config.r2_bucket_name,
            Key='eda/statistics.json'
        )
        
        stats = json.loads(response['Body'].read().decode('utf-8'))
        return stats
        
    except r2_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="EDA statistics not found. Run eda_local.py and upload to R2.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load EDA stats: {str(e)}")


@router.get("/eda-image/{filename}")
async def get_eda_image(filename: str):
    """
    Get EDA image from R2
    Path: eda/{filename}
    """
    try:
        config = get_settings()
        r2_client = create_r2_client()
        
        response = r2_client.get_object(
            Bucket=config.r2_bucket_name,
            Key=f'eda/{filename}'
        )
        
        image_data = response['Body'].read()
        
        return StreamingResponse(
            io.BytesIO(image_data),
            media_type='image/png',
            headers={'Cache-Control': 'public, max-age=86400'}
        )
        
    except r2_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail=f"Image {filename} not found. Run eda_local.py and upload to R2.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")


@router.get("/model-metrics")
async def get_model_metrics():
    """
    Get model training metrics from R2
    Path: models/metrics.json
    """
    try:
        config = get_settings()
        r2_client = create_r2_client()
        
        response = r2_client.get_object(
            Bucket=config.r2_bucket_name,
            Key='models/metrics.json'
        )
        
        metrics = json.loads(response['Body'].read().decode('utf-8'))
        return metrics
        
    except r2_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="Model metrics not found. Run train_models_local.py and upload to R2.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load metrics: {str(e)}")


@router.get("/training-code")
async def get_training_code():
    """
    Get training code documentation from R2
    Path: models/training_code.json
    """
    try:
        config = get_settings()
        r2_client = create_r2_client()
        
        response = r2_client.get_object(
            Bucket=config.r2_bucket_name,
            Key='models/training_code.json'
        )
        
        code_doc = json.loads(response['Body'].read().decode('utf-8'))
        return code_doc
        
    except r2_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="Training code not found. Run train_models_local.py and upload to R2.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load training code: {str(e)}")


@router.delete("/clear-r2-bucket")
async def clear_r2_bucket():
    """
    ⚠️ DANGER ZONE: Delete all files from R2 bucket
    Use with caution!
    """
    try:
        config = get_settings()
        r2_client = create_r2_client()
        
        # List all objects
        paginator = r2_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=config.r2_bucket_name)
        
        deleted_count = 0
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    r2_client.delete_object(
                        Bucket=config.r2_bucket_name,
                        Key=obj['Key']
                    )
                    deleted_count += 1
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} files from R2 bucket",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear bucket: {str(e)}")


@router.get("/dashboard-stats")
async def get_dashboard_stats():
    """
    Get aggregated experiment results for dashboard.
    Queries real data from Supabase - no mock data.
    
    Raises:
        HTTPException: If database query fails
    """
    try:
        from app.services.supabase_service import SupabaseService
        config = get_settings()
        supabase = SupabaseService(config)
        
        stats = supabase.get_dashboard_stats()
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard statistics from database: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Check if R2 connection is working"""
    try:
        config = get_settings()
        r2_client = create_r2_client()
        
        # Try to list bucket
        r2_client.list_objects_v2(
            Bucket=config.r2_bucket_name,
            MaxKeys=1
        )
        
        return {
            "status": "healthy",
            "r2_connected": True,
            "bucket": config.r2_bucket_name
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "r2_connected": False,
            "error": str(e)
        }


# =============================================================================
# GLOBAL EXPLANATION ENDPOINTS
# =============================================================================

@router.post("/generate-global-explanation")
async def generate_global_explanation():
    """
    Generate and upload the complete global explanation package to R2.
    
    This creates:
    - Feature importance bar chart (mean |SHAP|)
    - SHAP summary dot plot
    - Dependence plots for top features
    - Distribution histograms
    - Dataset summary with disclaimers
    - Plain-language narrative
    
    All assets are stored in R2 under 'global_explanation/' folder.
    """
    try:
        from app.services.global_explanation_generator import GlobalExplanationGenerator
        
        generator = GlobalExplanationGenerator()
        result = generator.generate_full_package()
        
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate global explanation: {str(e)}"
        )


@router.get("/global-explanation")
async def get_global_explanation():
    """
    Get the global explanation metadata and narrative from R2.
    Images are served via /global-explanation-image/{filename}
    """
    try:
        from app.services.global_explanation_generator import get_global_explanation_assets
        
        assets = get_global_explanation_assets()
        
        if not assets.get("available"):
            raise HTTPException(
                status_code=404,
                detail="Global explanation not generated yet. Use POST /generate-global-explanation first."
            )
        
        return assets
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve global explanation: {str(e)}"
        )


@router.get("/global-explanation-image/{filename}")
@router.head("/global-explanation-image/{filename}")
async def get_global_explanation_image(filename: str):
    """
    Get a global explanation image from R2.
    Valid filenames: feature_importance.png, shap_summary.png, distributions.png, dependence_*.png
    Supports both GET and HEAD requests.
    """
    try:
        config = get_settings()
        r2 = create_r2_client()
        
        # Validate filename
        if not filename.endswith('.png'):
            raise HTTPException(status_code=400, detail="Only PNG images are supported")
        
        # Security: prevent path traversal
        if '..' in filename or '/' in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        key = f'global_explanation/{filename}'
        
        response = r2.get_object(
            Bucket=config.r2_bucket_name,
            Key=key
        )
        
        image_data = response['Body'].read()
        
        return StreamingResponse(
            io.BytesIO(image_data),
            media_type='image/png',
            headers={
                'Cache-Control': 'public, max-age=86400',
                'Content-Length': str(len(image_data))
            }
        )
        
    except r2.exceptions.NoSuchKey:
        raise HTTPException(
            status_code=404, 
            detail=f"Image '{filename}' not found in R2. Generate global explanation from admin panel first."
        )
    except Exception as e:
        print(f"[ERROR] Failed to load global explanation image {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")


# =============================================================================
# MODEL TRAINING ENDPOINTS
# =============================================================================

@router.post("/retrain-model")
async def retrain_model():
    """
    Retrain XGBoost and Logistic models with risk-ordered categorical encoding.
    
    This ensures SHAP values are semantically meaningful:
    - Higher ordinal value = higher risk = positive SHAP
    - Lower ordinal value = lower risk = negative SHAP
    
    After training, models are automatically uploaded to R2.
    """
    try:
        from app.services.model_training_service import ModelTrainingService
        
        service = ModelTrainingService()
        result = service.full_training_pipeline()
        
        if result['success']:
            return {
                "success": True,
                "message": "Models retrained and uploaded successfully",
                "xgboost_metrics": result['xgboost_metrics'],
                "logistic_metrics": result['logistic_metrics'],
                "sanity_check": result['sanity_check'],
                "uploaded_files": result['uploaded_files'],
                "training_log": result['log']
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Training failed: {result.get('error', 'Unknown error')}"
            )
            
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Missing dependencies for training: {str(e)}. Install: pip install xgboost scikit-learn"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/training-status")
async def get_training_status():
    """
    Get the current model training status and configuration.
    Shows the risk-ordered category encoding that will be used.
    """
    try:
        from app.services.model_training_service import CATEGORY_ORDER, CAT_FEATURES
        
        return {
            "status": "ready",
            "encoding_type": "risk_ordered_ordinal",
            "description": "Categories ordered from lowest risk (0) to highest risk (N-1)",
            "categorical_features": CAT_FEATURES,
            "category_ordering": CATEGORY_ORDER
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.post("/run-sanity-check")
async def run_sanity_check():
    """
    Run sanity check on the currently deployed model.
    Tests with safe, risky, and borderline applicants.
    """
    try:
        from app.services.xgboost_service import XGBoostService
        import uuid
        
        config = get_settings()
        xgb_service = XGBoostService(config)
        xgb_service.load_model_from_r2()
        
        # Test applicants
        test_cases = {
            "safe_applicant": {
                "checking_status": "ge_200_dm",
                "duration": 12,
                "credit_history": "all_paid",
                "purpose": "new_car",
                "credit_amount": 2000,
                "savings_status": "ge_1000_dm",
                "employment": "ge_7_years",
                "installment_commitment": 1,
                "other_debtors": "guarantor",
                "residence_since": 4,
                "property_magnitude": "real_estate",
                "age": 45,
                "other_payment_plans": "none",
                "housing": "own",
                "existing_credits": 1,
                "job": "management",
                "num_dependents": 1,
                "own_telephone": "yes"
            },
            "risky_applicant": {
                "checking_status": "lt_0_dm",
                "duration": 48,
                "credit_history": "critical",
                "purpose": "vacation",
                "credit_amount": 15000,
                "savings_status": "lt_100_dm",
                "employment": "unemployed",
                "installment_commitment": 4,
                "other_debtors": "none",
                "residence_since": 1,
                "property_magnitude": "unknown",
                "age": 22,
                "other_payment_plans": "bank",
                "housing": "rent",
                "existing_credits": 4,
                "job": "unemployed_unskilled",
                "num_dependents": 2,
                "own_telephone": "none"
            },
            "borderline_applicant": {
                "checking_status": "0_to_200_dm",
                "duration": 24,
                "credit_history": "existing_paid",
                "purpose": "furniture",
                "credit_amount": 5000,
                "savings_status": "100_to_500_dm",
                "employment": "1_to_4_years",
                "installment_commitment": 2,
                "other_debtors": "none",
                "residence_since": 2,
                "property_magnitude": "car_other",
                "age": 32,
                "other_payment_plans": "none",
                "housing": "rent",
                "existing_credits": 2,
                "job": "skilled",
                "num_dependents": 1,
                "own_telephone": "yes"
            }
        }
        
        results = {}
        for name, applicant in test_cases.items():
            # Get prediction
            pred = xgb_service.predict(applicant)
            
            # Get SHAP explanation
            shap_exp = xgb_service.explain_prediction(applicant, num_features=10)
            
            # Extract key feature SHAP values
            key_features = {}
            for feat in shap_exp['all_features']:
                if any(k in feat['feature'].lower() for k in ['credit_history', 'employment', 'checking']):
                    key_features[feat['feature']] = {
                        'value': feat['feature_value'],
                        'shap': feat['shap_value'],
                        'impact': feat['impact']
                    }
            
            results[name] = {
                'decision': pred['decision'],
                'confidence': pred['confidence'],
                'probability_good': pred['probability_good'],
                'probability_bad': pred['probability_bad'],
                'key_shap_features': key_features
            }
        
        # Validate expectations
        checks = {
            'safe_approved': results['safe_applicant']['decision'] == 'approved',
            'risky_rejected': results['risky_applicant']['decision'] == 'rejected',
        }
        
        all_passed = all(checks.values())
        
        return {
            "passed": all_passed,
            "checks": checks,
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sanity check failed: {str(e)}")
