# Admin API endpoints for data management and model training

from fastapi import APIRouter, HTTPException
import subprocess
import os
from pathlib import Path

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


@router.post("/train-model")
async def train_model():
    """
    Trigger model training with XGBoost and SHAP
    """
    try:
        script_path = Path(__file__).parent.parent.parent / "scripts" / "train_model.py"
        
        if not script_path.exists():
            raise HTTPException(status_code=404, detail="Training script not found")
        
        # Run the training script
        result = subprocess.run(
            ["python3", str(script_path)],
            capture_output=True,
            text=True,
            timeout=600  # 10 minutes timeout
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "Model trained successfully",
                "output": result.stdout
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Training failed: {result.stderr}"
            )
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Training timeout (>10 minutes)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
