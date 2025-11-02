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


@router.get("/list-r2-files")
async def list_r2_files():
    """
    List all files in R2 bucket for debugging
    """
    try:
        from app.config import get_settings
        import boto3
        
        config = get_settings()
        
        s3_client = create_r2_client(config)
        
        response = s3_client.list_objects_v2(Bucket=config.r2_bucket_name)
        
        files = []
        if 'Contents' in response:
            for obj in response['Contents']:
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat()
                })
        
        return {
            "success": True,
            "bucket": config.r2_bucket_name,
            "endpoint": config.r2_endpoint_url,
            "dataset_path_config": config.dataset_path,
            "files": files
        }
        
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Error listing R2 files: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        )


@router.delete("/clear-r2-bucket")
async def clear_r2_bucket():
    """
    Delete all files in R2 bucket.
    Use this to clean up before retraining with new preprocessing pipeline.
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


@router.post("/generate-eda")
async def generate_eda():
    """
    Generate EDA (Exploratory Data Analysis) and upload to R2
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "generate_eda.py"
        
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
                "message": "EDA generated successfully",
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
