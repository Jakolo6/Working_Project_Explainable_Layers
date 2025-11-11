# Admin API endpoints for data management and model training

from fastapi import APIRouter, HTTPException
import subprocess
import os
from pathlib import Path
import boto3
from botocore.config import Config

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def create_r2_client(config):
    """Create Cloudflare R2 client with correct signature configuration."""
    return boto3.client(
        's3',
        endpoint_url=config.r2_endpoint_url,
        aws_access_key_id=config.r2_access_key_id,
        aws_secret_access_key=config.r2_secret_access_key,
        config=Config(signature_version='s3v4', region_name='auto')
    )

@router.post("/download-dataset")
async def download_dataset():
    """
    Trigger dataset download from Kaggle
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "download_dataset.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=404, detail="Download script not found")
        
        # Run the download script
        result = subprocess.run(
            ["python3", str(script_path)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "Dataset downloaded successfully",
                "output": result.stdout
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Download failed: {result.stderr}"
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Download timeout (>5 minutes)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear-r2-bucket")
async def clear_r2_bucket():
    """
    Delete all files in R2 bucket.
    Use this before retraining to ensure clean state.
    WARNING: This will delete all models, EDA files, and datasets!
    """
    try:
        from app.config import get_settings
        
        config = get_settings()
        s3_client = create_r2_client(config)
        
        # List all objects
        response = s3_client.list_objects_v2(Bucket=config.r2_bucket_name)
        
        if 'Contents' not in response:
            return {
                "success": True,
                "message": "Bucket is already empty",
                "deleted_count": 0
            }
        
        # Delete all objects
        deleted_keys = []
        for obj in response['Contents']:
            s3_client.delete_object(
                Bucket=config.r2_bucket_name,
                Key=obj['Key']
            )
            deleted_keys.append(obj['Key'])
        
        return {
            "success": True,
            "message": f"Deleted {len(deleted_keys)} files from R2 bucket",
            "deleted_count": len(deleted_keys),
            "deleted_files": deleted_keys
        }
        
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear R2 bucket: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        )


@router.post("/clean-dataset")
async def clean_dataset():
    """
    Clean the raw dataset (map Axx codes to readable values) and upload to R2
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "clean_and_upload_dataset.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=404, detail="Cleaning script not found")
        
        # Run the cleaning script
        result = subprocess.run(
            ["python3", str(script_path)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "Dataset cleaned and uploaded successfully",
                "output": result.stdout
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Cleaning failed: {result.stderr}"
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Cleaning timeout (>5 minutes)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-eda")
async def generate_eda():
    """
    Generate EDA (Exploratory Data Analysis) from cleaned dataset and upload to R2.
    Uses german_credit_clean.csv from R2 bucket.
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "generate_eda_clean.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=404, detail=f"EDA script not found at {script_path}")
        
        # Run the EDA script
        result = subprocess.run(
            ["python3", str(script_path)],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "EDA generated successfully from cleaned dataset",
                "output": result.stdout
            }
        else:
            # Return both stdout and stderr for debugging
            error_msg = f"STDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="EDA generation timeout (>5 minutes)")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/train-model")
async def train_model():
    """
    Trigger training for both XGBoost and Logistic Regression models.
    Uses new one-hot encoding preprocessing pipeline for both models.
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "train_both_models.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=404, detail=f"Training script not found at {script_path}")
        
        # Run the training script with new preprocessing
        result = subprocess.run(
            ["python3", str(script_path)],
            capture_output=True,
            text=True,
            timeout=900  # 15 minutes timeout for both models
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "Both models (XGBoost + Logistic Regression) trained successfully with new preprocessing",
                "output": result.stdout,
                "note": "Both models use one-hot encoding + raw feature preservation for fair comparison"
            }
        else:
            # Return both stdout and stderr for debugging
            error_msg = f"STDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Training timeout (>15 minutes)")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Exception: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/eda-stats")
async def get_eda_stats():
    """
    Retrieve EDA statistics from R2.
    Returns the statistics.json file generated by the EDA script.
    """
    try:
        import json
        from app.config import get_settings
        
        config = get_settings()
        s3_client = create_r2_client(config)
        
        # Load EDA statistics
        try:
            obj = s3_client.get_object(
                Bucket=config.r2_bucket_name,
                Key='eda/statistics.json'
            )
            stats = json.loads(obj['Body'].read().decode('utf-8'))
            return stats
        except s3_client.exceptions.NoSuchKey:
            raise HTTPException(
                status_code=404,
                detail="EDA statistics not found. Please run 'Generate EDA' from the admin panel first."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to retrieve EDA stats: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/eda-images")
async def get_eda_images():
    """
    List all available EDA visualization images from R2.
    Returns URLs and metadata for all generated charts.
    """
    try:
        from app.config import get_settings
        
        config = get_settings()
        s3_client = create_r2_client(config)
        
        # List all objects in eda/ folder
        response = s3_client.list_objects_v2(
            Bucket=config.r2_bucket_name,
            Prefix='eda/'
        )
        
        if 'Contents' not in response:
            raise HTTPException(
                status_code=404,
                detail="No EDA visualizations found. Please run 'Generate EDA' from the admin panel first."
            )
        
        # Filter for PNG images only
        images = []
        for obj in response['Contents']:
            if obj['Key'].endswith('.png'):
                # Generate presigned URL (valid for 1 hour)
                url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': config.r2_bucket_name,
                        'Key': obj['Key']
                    },
                    ExpiresIn=3600  # 1 hour
                )
                
                # Extract filename without path
                filename = obj['Key'].split('/')[-1]
                
                images.append({
                    'filename': filename,
                    'key': obj['Key'],
                    'url': url,
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat()
                })
        
        return {
            'success': True,
            'count': len(images),
            'images': sorted(images, key=lambda x: x['filename'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to retrieve EDA images: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


def sanitize_metrics(metrics):
    """Replace inf, -inf, and nan values with None for JSON serialization"""
    import math
    
    if isinstance(metrics, dict):
        return {k: sanitize_metrics(v) for k, v in metrics.items()}
    elif isinstance(metrics, list):
        return [sanitize_metrics(item) for item in metrics]
    elif isinstance(metrics, float):
        if math.isinf(metrics) or math.isnan(metrics):
            return None
        return metrics
    else:
        return metrics

@router.get("/model-metrics")
async def get_model_metrics():
    """
    Retrieve training metrics for both XGBoost and Logistic Regression models from R2.
    Returns metrics including feature importance and performance stats for benchmarking.
    """
    try:
        import boto3
        import json
        from app.config import get_settings
        
        config = get_settings()
        s3_client = create_r2_client(config)
        
        metrics = {}
        
        # Load XGBoost metrics
        try:
            obj = s3_client.get_object(
                Bucket=config.r2_bucket_name,
                Key='models/xgboost_metrics.json'
            )
            xgb_metrics = json.loads(obj['Body'].read().decode('utf-8'))
            metrics['xgboost'] = sanitize_metrics(xgb_metrics)
        except Exception:
            metrics['xgboost'] = None
        
        # Load Logistic Regression metrics
        try:
            obj = s3_client.get_object(
                Bucket=config.r2_bucket_name,
                Key='models/logistic_metrics.json'
            )
            lr_metrics = json.loads(obj['Body'].read().decode('utf-8'))
            metrics['logistic'] = sanitize_metrics(lr_metrics)
        except Exception:
            metrics['logistic'] = None
        
        if not metrics['xgboost'] and not metrics['logistic']:
            raise HTTPException(
                status_code=404,
                detail="No model metrics found. Please train the models first using the admin panel."
            )
        
        return {
            "success": True,
            "preprocessing": "one-hot encoding + raw feature preservation",
            "note": "Both models use identical preprocessing for fair benchmarking",
            "metrics": metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to retrieve model metrics: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/dashboard-stats")
async def get_dashboard_stats():
    """
    Retrieve aggregated statistics for the researcher dashboard.
    Aggregates data from experiment_sessions, layer_ratings, and post_questionnaires tables.
    """
    try:
        from app.services.supabase_service import SupabaseService
        from app.config import get_settings
        
        config = get_settings()
        supabase_service = SupabaseService(config)
        supabase = supabase_service.client
        
        # Get total and completed sessions
        sessions_response = supabase.table('sessions').select('session_id, completed_at').execute()
        total_sessions = len(sessions_response.data)
        completed_sessions = len([s for s in sessions_response.data if s.get('completed_at')])
        
        # Get all layer ratings
        ratings_response = supabase.table('layer_ratings').select('trust_rating, understanding_rating, usefulness_rating, mental_effort_rating').execute()
        ratings = ratings_response.data
        total_ratings = len(ratings)
        
        # Calculate average ratings
        if total_ratings > 0:
            avg_trust = sum(r['trust_rating'] for r in ratings) / total_ratings
            avg_understanding = sum(r['understanding_rating'] for r in ratings) / total_ratings
            avg_usefulness = sum(r['usefulness_rating'] for r in ratings) / total_ratings
            avg_mental_effort = sum(r['mental_effort_rating'] for r in ratings) / total_ratings
        else:
            avg_trust = avg_understanding = avg_usefulness = avg_mental_effort = 0.0
        
        # Get post-questionnaire data
        post_response = supabase.table('post_questionnaires').select(
            'overall_experience, explanation_helpfulness, would_trust_ai, preferred_layer'
        ).execute()
        post_data = post_response.data
        
        # Calculate post-questionnaire averages
        if len(post_data) > 0:
            avg_overall_experience = sum(p['overall_experience'] for p in post_data) / len(post_data)
            avg_explanation_helpfulness = sum(p['explanation_helpfulness'] for p in post_data) / len(post_data)
            avg_would_trust_ai = sum(p['would_trust_ai'] for p in post_data) / len(post_data)
            
            # Count layer preferences
            layer_preferences = {}
            for p in post_data:
                layer = p.get('preferred_layer')
                if layer:
                    layer_preferences[layer] = layer_preferences.get(layer, 0) + 1
        else:
            avg_overall_experience = avg_explanation_helpfulness = avg_would_trust_ai = 0.0
            layer_preferences = {}
        
        # Ensure all layers are represented (even with 0 votes)
        all_layers = ['Minimal', 'Feature Importance', 'Detailed SHAP', 'Visual', 'Counterfactual']
        for layer in all_layers:
            if layer not in layer_preferences:
                layer_preferences[layer] = 0
        
        return {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "total_ratings": total_ratings,
            "avg_trust": round(avg_trust, 2),
            "avg_understanding": round(avg_understanding, 2),
            "avg_usefulness": round(avg_usefulness, 2),
            "avg_mental_effort": round(avg_mental_effort, 2),
            "layer_preferences": layer_preferences,
            "avg_overall_experience": round(avg_overall_experience, 2),
            "avg_explanation_helpfulness": round(avg_explanation_helpfulness, 2),
            "avg_would_trust_ai": round(avg_would_trust_ai, 2)
        }
        
    except Exception as e:
        import traceback
        error_detail = f"Failed to retrieve dashboard stats: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/training-docs")
async def get_training_documentation():
    """
    Get model training documentation (methodology, hyperparameters, insights)
    """
    try:
        from app.core.config import get_settings
        import json
        
        config = get_settings()
        
        # Try to fetch from R2 first
        try:
            s3 = create_r2_client(config)
            response = s3.get_object(
                Bucket=config.r2_bucket_name,
                Key='models/training_documentation.json'
            )
            training_docs = json.loads(response['Body'].read().decode('utf-8'))
            return training_docs
        except Exception as r2_error:
            # Fallback to local file
            local_path = Path(__file__).parent.parent.parent.parent / 'models' / 'training_documentation.json'
            if local_path.exists():
                with open(local_path, 'r') as f:
                    training_docs = json.load(f)
                return training_docs
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Training documentation not found in R2 or locally"
                )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to retrieve training documentation: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)
