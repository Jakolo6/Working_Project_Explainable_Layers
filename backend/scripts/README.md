# Backend Scripts Directory

This directory contains essential scripts for data management and model training.

---

## Scripts Overview

### 1. `download_dataset.py`
**Purpose:** Download German Credit dataset from UCI ML Repository and upload to R2

**Used by:** Admin panel (`POST /api/v1/admin/download-dataset`)

**What it does:**
- Downloads Statlog German Credit Data (UCI ID: 144)
- Processes into correct format with symbolic codes (A11, A12, etc.)
- Uploads to R2 at `data/german_credit_data.csv`

**Run manually:**
```bash
cd backend
python3 scripts/download_dataset.py
```

---

### 2. `generate_eda.py`
**Purpose:** Generate Exploratory Data Analysis visualizations and statistics

**Used by:** Admin panel (`POST /api/v1/admin/generate-eda`)

**What it generates:**
- 7 high-quality visualizations (150 DPI)
- `statistics.json` with comprehensive dataset statistics
- Uploads all to R2 at `eda/` folder

**Visualizations created:**
- Target distribution
- Age distribution (histogram + box plot by risk)
- Credit amount distribution (histogram + box plot by risk)
- Duration distribution (histogram + box plot by risk)
- Purpose distribution (top 10 purposes)
- Checking status distribution
- Correlation heatmap (7 numerical features)

**Run manually:**
```bash
cd backend
python3 scripts/generate_eda.py
```

---

### 3. `train_both_models.py`
**Purpose:** Train both XGBoost and Logistic Regression models with new preprocessing

**Used by:** Admin panel (`POST /api/v1/admin/train-model`)

**What it does:**
- Loads dataset from R2
- Applies new preprocessing:
  - One-hot encoding for categorical features
  - Preserves raw + scaled features for interpretability
  - Excludes bias features (personal_status, foreign_worker)
- Trains XGBoost classifier (~60 features after encoding)
- Trains Logistic Regression with same preprocessing
- Uploads both models + metrics to R2

**Output files in R2:**
- `models/xgboost_credit_model.pkl`
- `models/xgboost_metrics.json`
- `models/logistic_credit_model.pkl`
- `models/logistic_metrics.json`

**Training time:** ~4-8 minutes

**Run manually:**
```bash
cd backend
python3 scripts/train_both_models.py
```

---

## Removed Scripts (No Longer Needed)

### ❌ `train_model.py`
- **Reason:** Redundant with `train_both_models.py`
- **Note:** Admin panel uses dual trainer for benchmarking
- **Removed:** 2025-01-02

### ❌ `system_audit.py`
- **Reason:** Debug/setup script not used by application
- **Note:** Was useful for initial setup validation
- **Removed:** 2025-01-02

### ❌ `train_all_models.py`
- **Reason:** Used old label encoding preprocessing
- **Note:** Replaced by `train_both_models.py` with new one-hot encoding
- **Removed:** 2025-01-02

### ❌ `train_logistic.py`
- **Reason:** Used old label encoding preprocessing
- **Note:** Logistic Regression now trained via `train_both_models.py`
- **Removed:** 2025-01-02

---

## Dependencies

All scripts require:
- Python 3.11+
- Environment variables set (see Railway configuration)
- R2 bucket access
- Supabase connection (for some operations)

**Key packages:**
- `ucimlrepo` - UCI ML Repository access
- `boto3` - R2/S3 client
- `pandas` - Data manipulation
- `scikit-learn` - Model training
- `xgboost` - XGBoost model
- `matplotlib`, `seaborn` - Visualizations

---

## Workflow

**Recommended order for first-time setup:**

1. **Download Dataset**
   ```bash
   python3 scripts/download_dataset.py
   ```

2. **Generate EDA** (optional)
   ```bash
   python3 scripts/generate_eda.py
   ```

3. **Train Models**
   ```bash
   python3 scripts/train_both_models.py
   ```

**Or use the admin panel:**
- Go to `https://novaxai.netlify.app/admin`
- Click buttons in order: Download → EDA → Train

---

## Notes

- All scripts upload results to R2 automatically
- Scripts are idempotent (safe to run multiple times)
- Training overwrites previous models in R2
- EDA generation overwrites previous visualizations
- Dataset download overwrites previous dataset

---

## Troubleshooting

**Script fails with "Module not found":**
- Ensure you're in the `backend/` directory
- Check that `sys.path.append` is working
- Verify all dependencies are installed

**R2 upload fails:**
- Check R2 credentials in environment variables
- Verify R2_ENDPOINT_URL does NOT include bucket name
- Confirm bucket exists and is accessible

**Training fails:**
- Ensure dataset exists in R2 first
- Check Railway logs for detailed error
- Verify sufficient memory (models need ~2GB)

---

## Maintenance

**When to update these scripts:**
- Dataset source changes
- Preprocessing logic changes
- New visualizations needed
- Model architecture changes

**What NOT to change:**
- File paths in R2 (frontend expects specific paths)
- Preprocessing logic (must match model service)
- Output format (API endpoints expect specific structure)
