# Admin API endpoints for data management and model training

from fastapi import APIRouter, HTTPException
import subprocess
import os
from pathlib import Path
import boto3

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

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
        
        s3_client = boto3.client(
            's3',
            endpoint_url=config.r2_endpoint_url,
            aws_access_key_id=config.r2_access_key_id,
            aws_secret_access_key=config.r2_secret_access_key
        )
        
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
    Trigger model training for both XGBoost and Logistic Regression
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "train_all_models.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=404, detail=f"Training script not found at {script_path}")
        
        # Run the training script (trains both models)
        result = subprocess.run(
            ["python3", str(script_path)],
            capture_output=True,
            text=True,
            timeout=900  # 15 minutes timeout (training both models)
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "Both models (XGBoost + Logistic Regression) trained successfully",
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
        import boto3
        import json
        from app.config import get_settings
        
        config = get_settings()
        s3_client = boto3.client(
            's3',
            endpoint_url=config.r2_endpoint_url,
            aws_access_key_id=config.r2_access_key_id,
            aws_secret_access_key=config.r2_secret_access_key
        )
        
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
        import boto3
        from app.config import get_settings
        
        config = get_settings()
        s3_client = boto3.client(
            's3',
            endpoint_url=config.r2_endpoint_url,
            aws_access_key_id=config.r2_access_key_id,
            aws_secret_access_key=config.r2_secret_access_key
        )
        
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


@router.get("/model-metrics")
async def get_model_metrics():
    """
    Retrieve training metrics for both models from R2.
    Returns metrics for XGBoost and Logistic Regression models.
    """
    try:
        import boto3
        import json
        from app.config import get_settings
        
        config = get_settings()
        s3_client = boto3.client(
            's3',
            endpoint_url=config.r2_endpoint_url,
            aws_access_key_id=config.r2_access_key_id,
            aws_secret_access_key=config.r2_secret_access_key
        )
        
        metrics = {}
        
        # Try to load XGBoost metrics
        try:
            obj = s3_client.get_object(
                Bucket=config.r2_bucket_name,
                Key='models/xgboost_metrics.json'
            )
            metrics['xgboost'] = json.loads(obj['Body'].read().decode('utf-8'))
        except:
            metrics['xgboost'] = None
        
        # Try to load Logistic Regression metrics
        try:
            obj = s3_client.get_object(
                Bucket=config.r2_bucket_name,
                Key='models/logistic_metrics.json'
            )
            metrics['logistic'] = json.loads(obj['Body'].read().decode('utf-8'))
        except:
            metrics['logistic'] = None
        
        if not metrics['xgboost'] and not metrics['logistic']:
            raise HTTPException(
                status_code=404,
                detail="No model metrics found. Please train the models first."
            )
        
        return {
            "success": True,
            "metrics": metrics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to retrieve model metrics: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)
