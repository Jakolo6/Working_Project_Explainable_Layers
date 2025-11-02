# Quick Start: Retrain Model with New Preprocessing

## Step-by-Step Instructions

After deleting everything in R2 bucket, follow these steps in order:

### 1. Clear R2 Bucket (via API or manually)

**Option A: Via Admin API**
```bash
curl -X DELETE https://workingprojectexplainablelayers-production.up.railway.app/api/v1/admin/clear-r2-bucket
```

**Option B: Manual deletion in Cloudflare dashboard**
- Go to R2 bucket `xai-financial-data`
- Delete all files

---

### 2. Download Dataset

```bash
curl -X POST https://workingprojectexplainablelayers-production.up.railway.app/api/v1/admin/download-dataset
```

**Expected:** Dataset uploaded to `data/german_credit_data.csv` in R2

---

### 3. Train Model

```bash
curl -X POST https://workingprojectexplainablelayers-production.up.railway.app/api/v1/admin/train-model
```

**Expected:**
- Training takes ~2-5 minutes
- Model uploaded to `models/xgboost_credit_model.pkl`
- Metrics uploaded to `models/xgboost_metrics.json`

**Output should show:**
```
✓ Features (after one-hot encoding): 60 columns
✓ Raw features preserved for interpretability
✓ Model trained successfully
✓ Model uploaded successfully
```

---

### 4. Verify Success

```bash
# Check files in R2
curl https://workingprojectexplainablelayers-production.up.railway.app/api/v1/admin/list-r2-files

# Check model metrics
curl https://workingprojectexplainablelayers-production.up.railway.app/api/v1/admin/model-metrics
```

---

### 5. Test Prediction Endpoint

```bash
curl -X POST https://workingprojectexplainablelayers-production.up.railway.app/api/v1/experiment/create_session \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "test_001",
    "age": 30,
    "education": "bachelors",
    "ai_familiarity": "intermediate"
  }'
```

**Expected:** Session created without 500 errors

---

## What Changed

### Before (Old Preprocessing)
- Label encoding for categorical features
- Feature names like `checking_status=0, checking_status=1`
- Single scaled feature set
- ~18 features total

### After (New Preprocessing)
- One-hot encoding for categorical features
- Feature names like `checking_status_A11, checking_status_A12`
- Both raw and scaled features preserved
- ~60 features total (expanded from one-hot encoding)

---

## Expected R2 Structure After Training

```
xai-financial-data/
├── data/
│   └── german_credit_data.csv          # 1000 rows, 21 columns
└── models/
    ├── xgboost_credit_model.pkl        # ~1-2 MB
    └── xgboost_metrics.json            # Performance stats
```

---

## Troubleshooting

### Training Fails

**Check:**
1. Dataset exists: `GET /api/v1/admin/list-r2-files`
2. Railway logs for detailed error
3. R2 credentials in Railway environment variables

**Solution:**
- Re-download dataset
- Check Railway environment variables match those in memory
- Verify R2 bucket permissions

### Prediction Endpoint Returns 500

**Symptom:** `AttributeError: 'CreditModel' object has no attribute 'feature_names'`

**Cause:** Old model still loaded (trained with label encoding)

**Solution:**
1. Clear R2 bucket
2. Retrain model
3. Railway will auto-reload new model

### Feature Count Mismatch

**Symptom:** `ValueError: X has 18 features but model expects 60`

**Cause:** Mixing old and new preprocessing

**Solution:**
- Ensure you cleared R2 bucket before retraining
- Verify model file timestamp is recent
- Restart Railway service if needed

---

## Admin Panel Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/admin/clear-r2-bucket` | DELETE | Clear all R2 files |
| `/api/v1/admin/download-dataset` | POST | Download dataset to R2 |
| `/api/v1/admin/train-model` | POST | Train XGBoost model |
| `/api/v1/admin/model-metrics` | GET | View training metrics |
| `/api/v1/admin/list-r2-files` | GET | List R2 bucket contents |

---

## Success Criteria

✅ R2 bucket contains 3 files (dataset + model + metrics)  
✅ Model metrics show accuracy >70%  
✅ Feature count is ~60 (after one-hot encoding)  
✅ Session creation works without errors  
✅ SHAP explanations show interpretable feature names  
✅ Frontend displays explanations correctly  

---

## Next Steps After Training

1. Test experiment flow on frontend
2. Verify SHAP explanations are interpretable
3. Check that feature names show symbolic codes (A11, A12, etc.)
4. Confirm raw values displayed in explanations (e.g., "150 DM")

---

## Notes

- **No local training needed** - Everything via admin API
- **Automatic deployment** - Railway redeploys on git push
- **Model persistence** - Stored in R2, loaded on startup
- **No Kaggle credentials** - Dataset from UCI ML Repository
- **Single model** - Only XGBoost (no Logistic Regression)
