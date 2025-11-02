# Preprocessing Pipeline Refactor

## Summary

Major refactor of the data preprocessing pipeline to implement optimal practices for interpretable XAI explanations.

## Changes Made

### 1. Preprocessing Pipeline (`backend/app/services/preprocessing.py`)

**Key Changes:**
- ✅ Switched from `LabelEncoder` to **one-hot encoding** (`pd.get_dummies`)
- ✅ Feature names now human-readable (e.g., `checking_status_A11` instead of encoded integers)
- ✅ Preserves both **raw** and **scaled** features for interpretability
- ✅ Returns three values: `(X_scaled, y, X_raw)`
- ✅ Stores categorical mappings for reconstruction

**Benefits:**
- SHAP explanations now show feature names like `checking_status_A11` instead of `checking_status=0`
- Raw feature values preserved for displaying original units (DM, months, years)
- No ordinal assumptions introduced for categorical variables
- Frontend can receive both processed and interpretable values

### 2. Model Service (`backend/app/services/xgboost_model.py`)

**Key Changes:**
- ✅ `preprocess_data()` returns `(X_scaled, y, X_raw)`
- ✅ `train_model()` accepts optional `X_raw` parameter
- ✅ `predict()` returns both `features_scaled` and `features_raw`
- ✅ Stores top 10 key features for focused explanations (`self.key_features`)
- ✅ Initializes `self.feature_names` on model load to fix SHAP init

**Benefits:**
- Predictions include both model-ready and human-readable feature values
- Training metrics include feature importance rankings
- SHAP can be computed on scaled features while displaying raw values

### 3. SHAP Service (`backend/app/services/shap_service.py`)

**Key Changes:**
- ✅ `get_top_features()` accepts both `features_scaled` and `features_raw`
- ✅ Uses raw features for display values
- ✅ Adds `direction` field to explanations (`increases`/`decreases` risk)
- ✅ `generate_explanation()` updated to use both feature sets

**Benefits:**
- Explanations show original feature values (e.g., "150 DM" not "0.34")
- Direction field helps users understand impact
- Feature names are already interpretable from one-hot encoding

### 4. API Endpoints (`backend/app/api/experiment.py`)

**Key Changes:**
- ✅ `/predict` endpoint passes both scaled and raw features to SHAP
- ✅ Constructs separate DataFrames for `features_scaled_df` and `features_raw_df`

**Benefits:**
- Frontend receives complete explanation data
- No additional frontend processing needed

### 5. Training Script (`backend/scripts/train_model.py`)

**Key Changes:**
- ✅ Handles three return values from `preprocess_data()`
- ✅ Passes `X_raw` to `train_model()`

**Benefits:**
- Training pipeline works with new preprocessing format
- Ready to train and upload new models to R2

### 6. Schemas (`backend/app/models/schemas.py`)

**Key Changes:**
- ✅ Added `direction` field to `ExplanationData`

**Benefits:**
- API responses include directional impact information

### 7. Dependencies (`backend/requirements.txt`)

**Key Changes:**
- ✅ Upgraded `supabase==2.4.0` (from 2.1.1)
- ✅ Removed conflicting `httpx` constraint (handled by supabase internally)

**Benefits:**
- Fixes Railway deployment proxy errors
- Compatible with latest Supabase features

## Migration Path

### Immediate Actions Needed:

1. **Retrain Model:**
   ```bash
   cd backend
   python scripts/train_model.py
   ```
   This will:
   - Load dataset from R2
   - Apply new one-hot encoding preprocessing
   - Train XGBoost with updated features
   - Upload new model `.pkl` to R2

2. **Deploy Backend:**
   - Push changes to git
   - Railway will auto-redeploy
   - New model will be loaded automatically

3. **Test Endpoints:**
   - `/api/v1/experiment/create_session` - Should work without 500 errors
   - `/api/v1/experiment/predict` - Should return interpretable feature names
   - Verify SHAP explanations show human-readable features

## Expected Results

### Before (Label Encoding)
```json
{
  "feature": "checking_status",
  "value": 2,
  "contribution": 0.35
}
```

### After (One-Hot Encoding)
```json
{
  "feature": "checking_status_A12",
  "value": 1,
  "contribution": 0.35,
  "direction": "increases"
}
```

## Breaking Changes

⚠️ **Model Retraining Required:**
- Old models trained with label encoding will NOT work with new preprocessing
- Must retrain and upload before deployment
- Feature count will increase (one-hot encoding expands categories)

⚠️ **API Response Format:**
- `ExplanationData` now includes `direction` field
- Prediction response includes both `features_scaled` and `features_raw`
- Frontend may need updates to handle new format

## Rollback Plan

If issues arise:
1. Revert to commit before this refactor
2. Redeploy backend
3. Restore old model from R2 backup (if available)

## Testing Checklist

- [ ] Model trains without errors
- [ ] Model uploads to R2 successfully
- [ ] `/predict` endpoint returns interpretable features
- [ ] SHAP explanations include `direction` field
- [ ] Feature names show symbolic codes (A11, A12, etc.)
- [ ] Raw feature values preserved in responses
- [ ] Frontend displays explanations correctly

## Notes

- Feature count increased from ~18 to ~60 due to one-hot encoding
- Model performance should remain similar or improve slightly
- SHAP computation time may increase slightly (more features)
- Frontend TypeScript types may need updating for new response format
