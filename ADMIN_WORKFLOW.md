# Admin Panel Workflow - Updated for New Preprocessing

## Overview

The admin panel provides endpoints to manage the complete ML pipeline from data download to model deployment. After the preprocessing refactor, the workflow has been simplified to use a single XGBoost model with optimal one-hot encoding.

---

## Complete Workflow

### 1. Clear R2 Bucket (New!)

**Endpoint:** `DELETE /api/v1/admin/clear-r2-bucket`

**Purpose:** Remove all old files from R2 before retraining with new preprocessing

**When to use:**
- Before first training with new preprocessing pipeline
- When switching preprocessing approaches
- To clean up corrupted or outdated files

**Response:**
```json
{
  "success": true,
  "message": "Deleted 15 files from R2 bucket",
  "deleted_count": 15,
  "deleted_files": [
    "data/german_credit_data.csv",
    "models/xgboost_credit_model.pkl",
    "models/xgboost_metrics.json",
    ...
  ]
}
```

---

### 2. Download Dataset

**Endpoint:** `POST /api/v1/admin/download-dataset`

**Purpose:** Download German Credit dataset from UCI ML Repository and upload to R2

**What it does:**
- Downloads dataset using `ucimlrepo` package
- Processes into correct format with symbolic codes (A11, A12, etc.)
- Uploads to R2 at `data/german_credit_data.csv`

**Expected output:**
```
✓ Dataset downloaded: 1000 rows, 21 columns
✓ Uploaded to R2: data/german_credit_data.csv
```

---

### 3. Generate EDA (Optional)

**Endpoint:** `POST /api/v1/admin/generate-eda`

**Purpose:** Create exploratory data analysis visualizations

**What it generates:**
- Distribution plots for numerical features
- Bar charts for categorical features
- Correlation heatmap
- Target variable distribution
- Statistics JSON file

**Output location:** `eda/` folder in R2

---

### 4. Train Model

**Endpoint:** `POST /api/v1/admin/train-model`

**Purpose:** Train XGBoost model with new one-hot encoding preprocessing

**What it does:**
1. Loads dataset from R2
2. Applies new preprocessing:
   - One-hot encoding for categorical features
   - Preserves raw + scaled features
   - Excludes bias features (personal_status, foreign_worker)
3. Trains XGBoost classifier
4. Generates comprehensive metrics
5. Uploads to R2:
   - `models/xgboost_credit_model.pkl` (model + preprocessor)
   - `models/xgboost_metrics.json` (performance metrics)

**Expected output:**
```
✓ Dataset loaded: 1000 rows, 21 columns
✓ Features (after one-hot encoding): 60 columns
✓ Target distribution: {0: 700, 1: 300}
✓ Raw features preserved for interpretability
✓ Model trained successfully
✓ Model uploaded successfully
```

**Training time:** ~2-5 minutes

**Timeout:** 10 minutes

---

### 5. View Model Metrics

**Endpoint:** `GET /api/v1/admin/model-metrics`

**Purpose:** Retrieve training performance metrics

**Returns:**
```json
{
  "success": true,
  "model_type": "XGBoost",
  "preprocessing": "one-hot encoding + raw feature preservation",
  "metrics": {
    "train_accuracy": 0.95,
    "test_accuracy": 0.78,
    "roc_auc": 0.82,
    "precision": 0.75,
    "recall": 0.71,
    "f1_score": 0.73,
    "feature_importance": [
      {"feature": "checking_status_A11", "importance": 0.15},
      {"feature": "duration", "importance": 0.12},
      ...
    ]
  }
}
```

---

### 6. List R2 Files

**Endpoint:** `GET /api/v1/admin/list-r2-files`

**Purpose:** Debug and verify R2 bucket contents

**Returns:**
```json
{
  "success": true,
  "bucket": "xai-financial-data",
  "files": [
    {
      "key": "data/german_credit_data.csv",
      "size": 52000,
      "last_modified": "2025-01-02T12:00:00Z"
    },
    {
      "key": "models/xgboost_credit_model.pkl",
      "size": 1500000,
      "last_modified": "2025-01-02T12:05:00Z"
    }
  ]
}
```

---

## Recommended Workflow Order

### First Time Setup (After Preprocessing Refactor)

1. **Clear R2 Bucket**
   ```
   DELETE /api/v1/admin/clear-r2-bucket
   ```
   → Removes old models trained with label encoding

2. **Download Dataset**
   ```
   POST /api/v1/admin/download-dataset
   ```
   → Ensures fresh dataset in R2

3. **Train Model**
   ```
   POST /api/v1/admin/train-model
   ```
   → Trains with new one-hot encoding preprocessing

4. **Verify Success**
   ```
   GET /api/v1/admin/model-metrics
   GET /api/v1/admin/list-r2-files
   ```
   → Confirms model uploaded and metrics available

### Regular Updates

1. **Download Dataset** (if dataset updated)
2. **Train Model**
3. **View Metrics**

---

## Key Changes from Old Workflow

### ❌ Removed

- `train_all_models.py` script (trained both XGBoost + Logistic Regression)
- `train_logistic.py` script
- `logistic_model.py` service
- Support for multiple model types
- Label encoding preprocessing

### ✅ Added

- `DELETE /api/v1/admin/clear-r2-bucket` endpoint
- One-hot encoding preprocessing
- Raw + scaled feature preservation
- Simplified single-model approach
- Enhanced feature interpretability

### 🔄 Updated

- `/train-model` now uses `train_model.py` (not `train_all_models.py`)
- `/model-metrics` returns only XGBoost metrics
- Training timeout reduced to 10 minutes (was 15)
- Metrics include preprocessing method info

---

## File Structure in R2

After complete workflow:

```
xai-financial-data/
├── data/
│   └── german_credit_data.csv          # Raw dataset
├── models/
│   ├── xgboost_credit_model.pkl        # Trained model + preprocessor
│   └── xgboost_metrics.json            # Performance metrics
└── eda/                                 # Optional
    ├── statistics.json
    ├── age_distribution.png
    ├── credit_amount_distribution.png
    └── ...
```

---

## Error Handling

### Model Training Fails

**Check:**
1. Dataset exists in R2 (`/list-r2-files`)
2. Dataset has correct format (1000 rows, 21 columns)
3. Railway environment variables set correctly
4. R2 credentials valid

**Solution:**
- Re-download dataset
- Check Railway logs for detailed error
- Verify R2 bucket permissions

### Old Model Still Loading

**Symptom:** Predictions fail with feature mismatch errors

**Solution:**
1. Clear R2 bucket
2. Retrain model
3. Restart Railway service (auto-happens on deploy)

### Timeout During Training

**Symptom:** 408 error after 10 minutes

**Solution:**
- Check dataset size (should be ~1000 rows)
- Verify no infinite loops in preprocessing
- Increase timeout in `admin.py` if needed

---

## Testing Checklist

After running complete workflow:

- [ ] R2 bucket cleared successfully
- [ ] Dataset downloaded (1000 rows, 21 columns)
- [ ] Model trained without errors
- [ ] Model file exists in R2 (~1-2 MB)
- [ ] Metrics file exists in R2
- [ ] Metrics show reasonable accuracy (>70%)
- [ ] Feature count is ~60 (after one-hot encoding)
- [ ] `/api/v1/experiment/predict` endpoint works
- [ ] SHAP explanations show interpretable feature names
- [ ] Frontend can create sessions without 500 errors

---

## Notes

- **No Kaggle credentials needed** - Dataset comes from UCI ML Repository
- **Single model approach** - Only XGBoost, no Logistic Regression
- **Automatic deployment** - Railway redeploys on git push
- **Model persistence** - Stored in R2, loaded on backend startup
- **Preprocessing embedded** - Preprocessor saved with model, ensures consistency
