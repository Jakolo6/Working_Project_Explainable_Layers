#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Converted from Jupyter Notebook: EDA.ipynb
Conversion Date: 2025-11-11T22:27:01.557Z
"""

# # Model Training with Up-Sampling & Optimization
# 
# This notebook trains credit risk models with:
# - ✅ Random up-sampling for class balance
# - ✅ Enhanced feature engineering (5 new features)
# - ✅ Optimized XGBoost hyperparameters
# - ✅ Early stopping and regularization


# ## Step 1: Load Data


import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

df = pd.read_csv('data/german_credit_clean.csv')
print(f'Loaded: {df.shape}')
print(f'Columns: {len(df.columns)}')
df.head(3)

# ## Step 2: Define Target & Remove Bias Features


# Binary target: Bad Credit = 1
df['target'] = (df['class'] == 2).astype(int)

# Remove bias features
bias_features = ['personal_status_sex', 'foreign_worker']
df_clean = df.drop(columns=bias_features + ['class'], errors='ignore')

print(f'Target distribution:')
print(df_clean['target'].value_counts())
print(f'\nBad credit rate: {df_clean["target"].mean():.1%}')
print(f'Shape after bias removal: {df_clean.shape}')

# ## Step 3: Define Features


num_features = ['duration', 'credit_amount', 'installment_commitment',
                'residence_since', 'age', 'existing_credits', 'num_dependents']

cat_features = ['checking_status', 'credit_history', 'purpose',
                'savings_status', 'employment', 'housing', 'job',
                'other_debtors', 'property_magnitude', 'other_payment_plans',
                'own_telephone']

print(f'Numerical: {len(num_features)}')
print(f'Categorical: {len(cat_features)}')

# ## Step 4: Feature Engineering (5 New Features)
# 
# 1. **monthly_burden** = credit_amount / duration
# 2. **stability_score** = age × employment_years
# 3. **risk_ratio** = credit_amount / (age × 100)
# 4. **credit_to_income_proxy** = credit_amount / age
# 5. **duration_risk** = duration × credit_amount


# Map employment to years
emp_map = {'unemployed': 0, 'lt_1_year': 0.5, '1_to_4_years': 2.5,
           '4_to_7_years': 5.5, 'ge_7_years': 10}
df_clean['employment_years'] = df_clean['employment'].map(emp_map)

# Create engineered features
df_clean['monthly_burden'] = df_clean['credit_amount'] / df_clean['duration']
df_clean['stability_score'] = df_clean['age'] * df_clean['employment_years']
df_clean['risk_ratio'] = df_clean['credit_amount'] / (df_clean['age'] * 100)
df_clean['credit_to_income_proxy'] = df_clean['credit_amount'] / df_clean['age']
df_clean['duration_risk'] = df_clean['duration'] * df_clean['credit_amount']

num_features_eng = num_features + ['monthly_burden', 'stability_score', 'risk_ratio',
                                    'credit_to_income_proxy', 'duration_risk']

print(f'✓ Created {len(num_features_eng) - len(num_features)} engineered features')
print(f'Total numerical features: {len(num_features_eng)}')

# ## Step 5: Train-Test Split (BEFORE Upsampling)
# 
# ⚠️ **Critical**: Split BEFORE upsampling to avoid data leakage!


from sklearn.model_selection import train_test_split

X = df_clean[num_features_eng + cat_features]
y = df_clean['target']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

print(f'Train: {X_train.shape[0]} samples')
print(f'Test: {X_test.shape[0]} samples')
print(f'\nTrain bad credit rate: {y_train.mean():.1%}')
print(f'Test bad credit rate: {y_test.mean():.1%}')

# ## Step 6: Random Up-Sampling (Training Set Only)
# 
# **Why?** Balances 70/30 → 50/50 to help model learn minority class patterns.


from sklearn.utils import resample

# Separate classes
X_train_maj = X_train[y_train == 0]
y_train_maj = y_train[y_train == 0]
X_train_min = X_train[y_train == 1]
y_train_min = y_train[y_train == 1]

print('BEFORE UPSAMPLING:')
print(f'  Good credit: {len(y_train_maj)}')
print(f'  Bad credit: {len(y_train_min)}')
print(f'  Ratio: {len(y_train_maj)/len(y_train_min):.2f}:1')

# Upsample minority class
X_train_min_up, y_train_min_up = resample(
    X_train_min, y_train_min,
    n_samples=len(y_train_maj),
    random_state=42,
    replace=True
)

# Combine and shuffle
X_train_bal = pd.concat([X_train_maj, X_train_min_up])
y_train_bal = pd.concat([y_train_maj, y_train_min_up])

shuffle_idx = np.random.RandomState(42).permutation(len(X_train_bal))
X_train_bal = X_train_bal.iloc[shuffle_idx].reset_index(drop=True)
y_train_bal = y_train_bal.iloc[shuffle_idx].reset_index(drop=True)

print('\nAFTER UPSAMPLING:')
print(f'  Total: {len(X_train_bal)}')
print(f'  Good credit: {(y_train_bal==0).sum()}')
print(f'  Bad credit: {(y_train_bal==1).sum()}')
print(f'  Ratio: {(y_train_bal==0).sum()/(y_train_bal==1).sum():.2f}:1')
print('\n✓ Training set is now balanced!')

# ## Step 7: Logistic Regression Pipeline (Optimized)


from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

linear_prep = ColumnTransformer([
    ('num', StandardScaler(), num_features_eng),
    ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), cat_features)
])

logreg_pipeline = Pipeline([
    ('preprocess', linear_prep),
    ('model', LogisticRegression(
        max_iter=2000,
        solver='saga',
        penalty='l2',
        C=0.1,
        random_state=42
    ))
])

print('✓ Logistic Regression pipeline created')
print('  • Solver: saga (optimized)')
print('  • C: 0.1 (strong regularization)')
print('  • Max iterations: 2000')

# ## Step 8: XGBoost Pipeline (Heavily Optimized)
# 
# **Key optimizations:**
# - 500 estimators (more trees)
# - max_depth=6 (deeper for complex patterns)
# - learning_rate=0.03 (finer learning)
# - L1 + L2 regularization
# - Early stopping


from sklearn.preprocessing import OrdinalEncoder
from xgboost import XGBClassifier

xgb_prep = ColumnTransformer([
    ('num', 'passthrough', num_features_eng),
    ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), cat_features)
])

xgb_pipeline = Pipeline([
    ('preprocess', xgb_prep),
    ('model', XGBClassifier(
        n_estimators=500,
        learning_rate=0.03,
        max_depth=6,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        colsample_bylevel=0.8,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        eval_metric='logloss',
        early_stopping_rounds=50
    ))
])

print('✓ XGBoost pipeline created (optimized)')
print('  • n_estimators: 500')
print('  • learning_rate: 0.03')
print('  • max_depth: 6')
print('  • Regularization: L1 + L2')
print('  • Early stopping: 50 rounds')

# ## Step 9: Train Models


import time

print('TRAINING ON BALANCED DATA')
print('=' * 60)

# Train Logistic Regression
print('\n[1/2] Logistic Regression...')
start = time.time()
logreg_pipeline.fit(X_train_bal, y_train_bal)
print(f'✓ Trained in {time.time()-start:.2f}s')

# Train XGBoost with validation
print('\n[2/2] XGBoost with early stopping...')
X_tr, X_val, y_tr, y_val = train_test_split(
    X_train_bal, y_train_bal, test_size=0.2, stratify=y_train_bal, random_state=42
)

start = time.time()
xgb_prep_fit = xgb_prep.fit(X_tr)
xgb_pipeline.fit(
    X_train_bal, y_train_bal,
    model__eval_set=[(xgb_prep_fit.transform(X_tr), y_tr),
                     (xgb_prep_fit.transform(X_val), y_val)],
    model__verbose=False
)
print(f'✓ Trained in {time.time()-start:.2f}s')
print(f'  Best iteration: {xgb_pipeline.named_steps["model"].best_iteration}')

print('\n' + '=' * 60)
print('TRAINING COMPLETE')
print('=' * 60)

# ## Step 10: Evaluate on Test Set
# 
# Test set is **imbalanced** (reflects real-world).


from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             classification_report)

# Predictions
logreg_pred = logreg_pipeline.predict(X_test)
logreg_proba = logreg_pipeline.predict_proba(X_test)[:, 1]
xgb_pred = xgb_pipeline.predict(X_test)
xgb_proba = xgb_pipeline.predict_proba(X_test)[:, 1]

def eval_model(y_true, y_pred, y_proba, name):
    print(f"\n{'='*60}")
    print(f"{name}")
    print('='*60)
    print(f"Accuracy:  {accuracy_score(y_true, y_pred):.4f}")
    print(f"Precision: {precision_score(y_true, y_pred):.4f}")
    print(f"Recall:    {recall_score(y_true, y_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_true, y_pred):.4f}")
    print(f"AUC-ROC:   {roc_auc_score(y_true, y_proba):.4f}")
    print(f"\nConfusion Matrix:")
    cm = confusion_matrix(y_true, y_pred)
    print(f"              Predicted")
    print(f"              Good  Bad")
    print(f"Actual Good   {cm[0,0]:4d}  {cm[0,1]:4d}")
    print(f"Actual Bad    {cm[1,0]:4d}  {cm[1,1]:4d}")

eval_model(y_test, logreg_pred, logreg_proba, 'LOGISTIC REGRESSION')
eval_model(y_test, xgb_pred, xgb_proba, 'XGBOOST (OPTIMIZED)')

# ## Step 11: Model Comparison


comparison = pd.DataFrame({
    'Metric': ['Accuracy', 'Precision', 'Recall', 'F1', 'AUC-ROC'],
    'Logistic': [
        accuracy_score(y_test, logreg_pred),
        precision_score(y_test, logreg_pred),
        recall_score(y_test, logreg_pred),
        f1_score(y_test, logreg_pred),
        roc_auc_score(y_test, logreg_proba)
    ],
    'XGBoost': [
        accuracy_score(y_test, xgb_pred),
        precision_score(y_test, xgb_pred),
        recall_score(y_test, xgb_pred),
        f1_score(y_test, xgb_pred),
        roc_auc_score(y_test, xgb_proba)
    ]
})

comparison['Diff'] = comparison['XGBoost'] - comparison['Logistic']
comparison['Winner'] = comparison['Diff'].apply(
    lambda x: 'XGBoost' if x > 0.01 else 'Logistic' if x < -0.01 else 'Tie'
)

print('\nMODEL COMPARISON')
print('='*70)
print(comparison.to_string(index=False))
print('='*70)

# ## Step 12: ROC Curves


import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve

logreg_fpr, logreg_tpr, _ = roc_curve(y_test, logreg_proba)
xgb_fpr, xgb_tpr, _ = roc_curve(y_test, xgb_proba)

plt.figure(figsize=(10, 6))
plt.plot(logreg_fpr, logreg_tpr,
         label=f'Logistic (AUC={roc_auc_score(y_test, logreg_proba):.3f})',
         linewidth=2, color='blue')
plt.plot(xgb_fpr, xgb_tpr,
         label=f'XGBoost (AUC={roc_auc_score(y_test, xgb_proba):.3f})',
         linewidth=2, color='green')
plt.plot([0, 1], [0, 1], 'k--', label='Random', linewidth=1)
plt.xlabel('False Positive Rate', fontsize=12)
plt.ylabel('True Positive Rate', fontsize=12)
plt.title('ROC Curves (After Upsampling & Optimization)', fontsize=14, fontweight='bold')
plt.legend(fontsize=11)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

# ## Step 13: Feature Importance (XGBoost)


xgb_model = xgb_pipeline.named_steps['model']
feature_names = num_features_eng + cat_features
importance = xgb_model.feature_importances_

importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importance
}).sort_values('importance', ascending=False)

print('TOP 15 FEATURES:')
print(importance_df.head(15).to_string(index=False))

# Plot
plt.figure(figsize=(10, 8))
top15 = importance_df.head(15)
plt.barh(range(len(top15)), top15['importance'], color='steelblue', alpha=0.7)
plt.yticks(range(len(top15)), top15['feature'])
plt.xlabel('Importance', fontsize=12)
plt.title('XGBoost: Top 15 Features', fontsize=14, fontweight='bold')
plt.grid(True, alpha=0.3, axis='x')
plt.tight_layout()
plt.show()

# ## Step 14: Save Models


import joblib
import json

models_dir = Path('models')
models_dir.mkdir(exist_ok=True)

joblib.dump(logreg_pipeline, models_dir / 'logistic_model.pkl')
joblib.dump(xgb_pipeline, models_dir / 'xgboost_model.pkl')

metrics = {
    'logistic': {
        'accuracy': float(accuracy_score(y_test, logreg_pred)),
        'precision': float(precision_score(y_test, logreg_pred)),
        'recall': float(recall_score(y_test, logreg_pred)),
        'f1': float(f1_score(y_test, logreg_pred)),
        'auc_roc': float(roc_auc_score(y_test, logreg_proba))
    },
    'xgboost': {
        'accuracy': float(accuracy_score(y_test, xgb_pred)),
        'precision': float(precision_score(y_test, xgb_pred)),
        'recall': float(recall_score(y_test, xgb_pred)),
        'f1': float(f1_score(y_test, xgb_pred)),
        'auc_roc': float(roc_auc_score(y_test, xgb_proba))
    }
}

with open(models_dir / 'metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

print('✓ Models saved:')
print(f'  • {models_dir / "logistic_model.pkl"}')
print(f'  • {models_dir / "xgboost_model.pkl"}')
print(f'  • {models_dir / "metrics.json"}')
print('\n' + '='*60)
print('NOTEBOOK COMPLETE!')
print('='*60)

# ## Summary: What We Did
# 
# ### ✅ **Optimizations Applied:**
# 
# 1. **Random Up-Sampling** (Step 6)
#    - Balanced training data 70/30 → 50/50
#    - Only applied to training set (no data leakage)
#    - Improves minority class learning
# 
# 2. **Enhanced Features** (Step 4)
#    - 5 engineered features (was 3)
#    - Captures financial pressure and stability
# 
# 3. **XGBoost Tuning** (Step 8)
#    - 500 trees (was 300)
#    - Deeper trees: max_depth=6 (was 4)
#    - Lower learning rate: 0.03 (was 0.05)
#    - L1 + L2 regularization
#    - Early stopping
# 
# 4. **Logistic Regression Tuning** (Step 7)
#    - SAGA solver (better for large datasets)
#    - Stronger regularization (C=0.1)
# 
# ### 📊 **Expected Results:**
# - **Recall**: +15-25% improvement
# - **AUC-ROC**: +5-10% improvement
# - **F1 Score**: Better balance
# - **XGBoost should now outperform Logistic Regression**
# 
# ### 🎯 **Key Takeaways:**
# - Up-sampling helps with imbalanced data
# - Feature engineering matters
# - Hyperparameter tuning is crucial
# - Early stopping prevents overfitting