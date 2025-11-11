# Local-First Scripts Guide

## 📋 Overview

Two modular Python scripts for local data analysis and model training. All outputs are saved locally in `/data` for manual upload to Cloudflare R2.

---

## 🗂️ Scripts

### 1. **`eda_local.py`** - Exploratory Data Analysis

**Purpose**: Generate comprehensive EDA visualizations and statistics

**Input**: `data/german_credit_clean.csv`

**Output Directory**: `data/eda/`

**Generated Files**:
1. `target_distribution.png` - Credit outcome distribution with percentages
2. `numerical_distributions.png` - All 7 numerical features by outcome
3. `categorical_distributions.png` - All 11 categorical features by outcome
4. `correlation_heatmap.png` - Feature correlation matrix
5. `feature_importance.png` - Chi-square & point-biserial importance
6. `age_distribution.png` - Age histogram + box plot by outcome
7. `credit_amount_distribution.png` - Credit amount histogram + box plot
8. `duration_distribution.png` - Loan duration histogram + box plot
9. `statistics.json` - Complete dataset statistics

**Run**:
```bash
python eda_local.py
```

**Duration**: ~30 seconds

---

### 2. **`train_models_local.py`** - Model Training

**Purpose**: Train XGBoost and Logistic Regression models with full evaluation

**Input**: `data/german_credit_clean.csv`

**Output Directory**: `data/models/`

**Generated Files**:
1. `logistic_model.pkl` - Trained Logistic Regression pipeline
2. `xgboost_model.pkl` - Trained XGBoost pipeline
3. `logistic_preprocessor.pkl` - Fitted preprocessor for Logistic
4. `xgboost_preprocessor.pkl` - Fitted preprocessor for XGBoost
5. `metrics.json` - Complete training metrics & hyperparameters
6. `training_code.json` - Full source code of training script
7. `roc_curves.png` - ROC curves comparing both models
8. `confusion_matrices.png` - Confusion matrices for both models
9. `feature_importance.png` - XGBoost top 15 features

**Run**:
```bash
python train_models_local.py
```

**Duration**: ~2-3 minutes

---

## 📊 What Gets Generated

### EDA Output (`data/eda/`)
- **8 PNG visualizations** (150 DPI, publication quality)
- **1 JSON file** with complete statistics:
  - Dataset info (1000 records, 18 features)
  - Target distribution (70% good, 30% bad)
  - Numerical statistics (mean, median, std, min, max by outcome)
  - Categorical statistics (value counts, approval rates)
  - Feature importance scores
  - Key insights (avg age, amount, duration by outcome)

### Model Training Output (`data/models/`)
- **4 PKL files** (models + preprocessors)
- **3 PNG visualizations** (ROC, confusion matrices, feature importance)
- **2 JSON files**:
  - `metrics.json`: Training info, hyperparameters, performance metrics, confusion matrices, feature importance, model comparison
  - `training_code.json`: Full source code + documentation

---

## 🔧 Technical Details

### EDA Script Features:
- ✅ Loads cleaned dataset with readable column names
- ✅ Generates 8 high-quality visualizations
- ✅ Calculates chi-square test for categorical features
- ✅ Calculates point-biserial correlation for numerical features
- ✅ Exports comprehensive statistics JSON
- ✅ All plots saved at 150 DPI

### Model Training Features:
- ✅ **Feature Engineering**: 5 engineered features (monthly_burden, stability_score, risk_ratio, credit_to_income_proxy, duration_risk)
- ✅ **Upsampling**: Random upsampling to balance training set (70/30 → 50/50)
- ✅ **Logistic Regression**: StandardScaler + OneHotEncoder(drop='first'), SAGA solver, C=0.1
- ✅ **XGBoost**: Passthrough + OrdinalEncoder, 500 estimators, learning_rate=0.03, max_depth=6, L1+L2 regularization, early stopping
- ✅ **Evaluation**: Accuracy, Precision, Recall, F1, AUC-ROC, Confusion Matrix
- ✅ **Saves**: Models, preprocessors, metrics, code, visualizations

---

## 📁 Directory Structure After Running

```
data/
├── german_credit_clean.csv          # Input dataset
├── eda/                              # EDA outputs
│   ├── target_distribution.png
│   ├── numerical_distributions.png
│   ├── categorical_distributions.png
│   ├── correlation_heatmap.png
│   ├── feature_importance.png
│   ├── age_distribution.png
│   ├── credit_amount_distribution.png
│   ├── duration_distribution.png
│   └── statistics.json
└── models/                           # Model training outputs
    ├── logistic_model.pkl
    ├── xgboost_model.pkl
    ├── logistic_preprocessor.pkl
    ├── xgboost_preprocessor.pkl
    ├── metrics.json
    ├── training_code.json
    ├── roc_curves.png
    ├── confusion_matrices.png
    └── feature_importance.png
```

---

## 🚀 Workflow

### Step 1: Run EDA
```bash
python eda_local.py
```
✓ Generates 9 files in `data/eda/`

### Step 2: Run Model Training
```bash
python train_models_local.py
```
✓ Generates 9 files in `data/models/`

### Step 3: Manual Upload to R2
Upload all files from `data/eda/` and `data/models/` to your Cloudflare R2 bucket:
- `data/eda/*` → `eda/` folder in R2
- `data/models/*` → `models/` folder in R2

---

## 📊 Expected Performance

### Logistic Regression:
- Accuracy: ~0.75
- AUC-ROC: ~0.77
- Recall: ~0.50

### XGBoost:
- Accuracy: ~0.76
- AUC-ROC: ~0.79
- Recall: ~0.55

**XGBoost typically outperforms Logistic Regression** due to:
- Better handling of non-linear relationships
- Feature interactions captured automatically
- Optimized hyperparameters

---

## 🎓 For Your Professor

The `training_code.json` file contains:
- Complete source code of the training script
- Preprocessing pipelines for both models
- Feature engineering formulas
- Hyperparameter settings
- Upsampling methodology

This allows your professor to:
- ✅ See exactly how models were trained
- ✅ Verify preprocessing steps
- ✅ Understand feature engineering
- ✅ Review hyperparameter choices
- ✅ Reproduce results if needed

---

## 🔍 What's Included in JSONs

### `statistics.json`:
```json
{
  "dataset_info": {...},
  "target_distribution": {...},
  "numerical_statistics": {
    "duration": {
      "mean": 20.9,
      "median": 18.0,
      "std": 12.1,
      "mean_good": 19.5,
      "mean_bad": 24.9
    },
    ...
  },
  "categorical_statistics": {...},
  "feature_importance": {...},
  "key_insights": {...}
}
```

### `metrics.json`:
```json
{
  "training_info": {...},
  "features": {...},
  "logistic_regression": {
    "accuracy": 0.75,
    "precision": 0.68,
    "recall": 0.50,
    "f1_score": 0.58,
    "auc_roc": 0.77,
    "confusion_matrix": [[...], [...]],
    "hyperparameters": {...}
  },
  "xgboost": {...},
  "feature_importance_top15": [...],
  "model_comparison": {...}
}
```

---

## ✅ Advantages of Local-First Approach

1. **No Cloud Dependencies** - Run offline, no API keys needed
2. **Full Control** - Review all outputs before uploading
3. **Reproducible** - Same inputs = same outputs
4. **Transparent** - All code and data visible
5. **Professor-Friendly** - Easy to share and verify

---

## 🎯 Next Steps

1. ✅ Run `eda_local.py`
2. ✅ Run `train_models_local.py`
3. ✅ Review generated files
4. ✅ Manually upload to R2 bucket
5. ✅ Share `training_code.json` with professor if needed

---

**All outputs are ready for manual upload to your Cloudflare R2 bucket!** 🚀
