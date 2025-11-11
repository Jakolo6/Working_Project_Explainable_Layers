# Simplified Admin API - Local-First Approach
# Only serves data from R2, no upload endpoints

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import boto3
from botocore.config import Config
from app.config import get_settings
import json
import io

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
    Get aggregated experiment results for dashboard
    (This would query Supabase for experiment data)
    """
    # TODO: Implement when experiment data collection is active
    return {
        "total_sessions": 0,
        "completed_sessions": 0,
        "layer_ratings": {},
        "message": "No experiment data yet"
    }


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
