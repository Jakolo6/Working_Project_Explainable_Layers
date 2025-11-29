#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Local-First Model Training Script for German Credit Data
Trains XGBoost and Logistic Regression models
Saves models, metrics, ROC curves, and training code to /data/models/
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import joblib
import time
import warnings
import inspect
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.utils import resample
from sklearn.preprocessing import OneHotEncoder, StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             roc_curve, classification_report)

# ============================================================================
# CONFIGURATION
# ============================================================================

DATA_PATH = Path('data/german_credit_clean.csv')
OUTPUT_DIR = Path('data/models')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Style settings
sns.set_style("whitegrid")
plt.rcParams['figure.dpi'] = 150
plt.rcParams['savefig.dpi'] = 150

print("=" * 80)
print("GERMAN CREDIT DATA: LOCAL MODEL TRAINING")
print("=" * 80)
print(f"Data source: {DATA_PATH}")
print(f"Output directory: {OUTPUT_DIR}")
print("=" * 80)

# ============================================================================
# 1. LOAD DATA
# ============================================================================

print("\n" + "=" * 80)
print("1. LOADING DATA")
print("=" * 80)

df = pd.read_csv(DATA_PATH)
print(f"✓ Loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# ============================================================================
# 2. PREPARE TARGET & REMOVE BIAS FEATURES
# ============================================================================

print("\n" + "=" * 80)
print("2. PREPARING TARGET & REMOVING BIAS FEATURES")
print("=" * 80)

# Binary target: Bad Credit = 1
df['target'] = (df['class'] == 2).astype(int)

# Remove bias features
bias_features = ['personal_status_sex', 'foreign_worker']
df_clean = df.drop(columns=bias_features + ['class'], errors='ignore')

print(f"Target distribution:")
print(f"  Good credit (0): {(df_clean['target']==0).sum()}")
print(f"  Bad credit (1): {(df_clean['target']==1).sum()}")
print(f"  Bad credit rate: {df_clean['target'].mean():.1%}")
print(f"✓ Shape after bias removal: {df_clean.shape}")

# ============================================================================
# 3. DEFINE FEATURES
# ============================================================================

print("\n" + "=" * 80)
print("3. DEFINING FEATURES")
print("=" * 80)

num_features = ['duration', 'credit_amount', 'installment_commitment',
                'residence_since', 'age', 'existing_credits', 'num_dependents']

cat_features = ['checking_status', 'credit_history', 'purpose',
                'savings_status', 'employment', 'housing', 'job',
                'other_debtors', 'property_magnitude', 'other_payment_plans',
                'own_telephone']

print(f"Numerical features: {len(num_features)}")
print(f"Categorical features: {len(cat_features)}")

# ============================================================================
# 4. FEATURE ENGINEERING
# ============================================================================

print("\n" + "=" * 80)
print("4. FEATURE ENGINEERING")
print("=" * 80)

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

print(f"✓ Created {len(num_features_eng) - len(num_features)} engineered features")
print(f"Total numerical features: {len(num_features_eng)}")

# ============================================================================
# 5. TRAIN-TEST SPLIT
# ============================================================================

print("\n" + "=" * 80)
print("5. TRAIN-TEST SPLIT")
print("=" * 80)

X = df_clean[num_features_eng + cat_features]
y = df_clean['target']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

print(f"Train: {X_train.shape[0]} samples ({y_train.mean():.1%} bad credit)")
print(f"Test: {X_test.shape[0]} samples ({y_test.mean():.1%} bad credit)")

# ============================================================================
# 6. RANDOM UP-SAMPLING (TRAINING SET ONLY)
# ============================================================================

print("\n" + "=" * 80)
print("6. RANDOM UP-SAMPLING")
print("=" * 80)

# Separate classes
X_train_maj = X_train[y_train == 0]
y_train_maj = y_train[y_train == 0]
X_train_min = X_train[y_train == 1]
y_train_min = y_train[y_train == 1]

print(f"BEFORE UPSAMPLING:")
print(f"  Good credit: {len(y_train_maj)}")
print(f"  Bad credit: {len(y_train_min)}")
print(f"  Ratio: {len(y_train_maj)/len(y_train_min):.2f}:1")

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

print(f"\nAFTER UPSAMPLING:")
print(f"  Total: {len(X_train_bal)}")
print(f"  Good credit: {(y_train_bal==0).sum()}")
print(f"  Bad credit: {(y_train_bal==1).sum()}")
print(f"  Ratio: {(y_train_bal==0).sum()/(y_train_bal==1).sum():.2f}:1")
print("✓ Training set is now balanced!")

# ============================================================================
# 7. CREATE LOGISTIC REGRESSION PIPELINE
# ============================================================================

print("\n" + "=" * 80)
print("7. CREATING LOGISTIC REGRESSION PIPELINE")
print("=" * 80)

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

print("✓ Logistic Regression pipeline created")
print("  • Solver: saga (optimized)")
print("  • C: 0.1 (strong regularization)")
print("  • Max iterations: 2000")

# ============================================================================
# 8. CREATE XGBOOST PIPELINE
# ============================================================================

print("\n" + "=" * 80)
print("8. CREATING XGBOOST PIPELINE")
print("=" * 80)

# Use OneHotEncoder for XGBoost - gives MUCH better performance
# than OrdinalEncoder because XGBoost can learn arbitrary splits for each category
xgb_prep = ColumnTransformer([
    ('num', 'passthrough', num_features_eng),
    ('cat', OneHotEncoder(
        drop=None,  # Don't drop first - XGBoost handles collinearity well
        sparse_output=False,
        handle_unknown='ignore'
    ), cat_features)
])
print("✓ XGBoost preprocessing uses OneHotEncoder for optimal performance")

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
        scale_pos_weight=1.5,       # Handle class imbalance
        random_state=42,
        eval_metric='auc',
        early_stopping_rounds=50
    ))
])

print("✓ XGBoost pipeline created (optimized)")
print("  • n_estimators: 500")
print("  • learning_rate: 0.03")
print("  • max_depth: 6")
print("  • scale_pos_weight: 1.5")
print("  • eval_metric: auc")

# ============================================================================
# 9. TRAIN MODELS
# ============================================================================

print("\n" + "=" * 80)
print("9. TRAINING MODELS")
print("=" * 80)

# Train Logistic Regression
print("\n[1/2] Training Logistic Regression...")
start = time.time()
logreg_pipeline.fit(X_train_bal, y_train_bal)
logreg_time = time.time() - start
print(f"✓ Trained in {logreg_time:.2f}s")

# Train XGBoost with validation
print("\n[2/2] Training XGBoost with early stopping...")
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
xgb_time = time.time() - start
print(f"✓ Trained in {xgb_time:.2f}s")
print(f"  Best iteration: {xgb_pipeline.named_steps['model'].best_iteration}")

# ============================================================================
# 10. EVALUATE ON TEST SET
# ============================================================================

print("\n" + "=" * 80)
print("10. EVALUATING ON TEST SET")
print("=" * 80)

# Predictions
logreg_pred = logreg_pipeline.predict(X_test)
logreg_proba = logreg_pipeline.predict_proba(X_test)[:, 1]
xgb_pred = xgb_pipeline.predict(X_test)
xgb_proba = xgb_pipeline.predict_proba(X_test)[:, 1]

def eval_model(y_true, y_pred, y_proba, name):
    print(f"\n{name}")
    print("=" * 60)
    print(f"Accuracy:  {accuracy_score(y_true, y_pred):.4f}")
    print(f"Precision: {precision_score(y_true, y_pred):.4f}")
    print(f"Recall:    {recall_score(y_true, y_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_true, y_pred):.4f}")
    print(f"AUC-ROC:   {roc_auc_score(y_true, y_proba):.4f}")
    
    cm = confusion_matrix(y_true, y_pred)
    print(f"\nConfusion Matrix:")
    print(f"              Predicted")
    print(f"              Good  Bad")
    print(f"Actual Good   {cm[0,0]:4d}  {cm[0,1]:4d}")
    print(f"Actual Bad    {cm[1,0]:4d}  {cm[1,1]:4d}")

eval_model(y_test, logreg_pred, logreg_proba, 'LOGISTIC REGRESSION')
eval_model(y_test, xgb_pred, xgb_proba, 'XGBOOST')

# ============================================================================
# 11. GENERATE ROC CURVES
# ============================================================================

print("\n" + "=" * 80)
print("11. GENERATING ROC CURVES")
print("=" * 80)

logreg_fpr, logreg_tpr, _ = roc_curve(y_test, logreg_proba)
xgb_fpr, xgb_tpr, _ = roc_curve(y_test, xgb_proba)

fig, ax = plt.subplots(figsize=(10, 8))
ax.plot(logreg_fpr, logreg_tpr,
        label=f'Logistic Regression (AUC={roc_auc_score(y_test, logreg_proba):.3f})',
        linewidth=2.5, color='#3498db')
ax.plot(xgb_fpr, xgb_tpr,
        label=f'XGBoost (AUC={roc_auc_score(y_test, xgb_proba):.3f})',
        linewidth=2.5, color='#2ecc71')
ax.plot([0, 1], [0, 1], 'k--', label='Random Classifier', linewidth=1.5)
ax.set_xlabel('False Positive Rate', fontsize=13)
ax.set_ylabel('True Positive Rate', fontsize=13)
ax.set_title('ROC Curves: Model Comparison', fontsize=15, fontweight='bold')
ax.legend(fontsize=12, loc='lower right')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'roc_curves.png', bbox_inches='tight')
plt.close()
print("✓ Saved: roc_curves.png")

# ============================================================================
# 12. GENERATE CONFUSION MATRICES
# ============================================================================

print("\n" + "=" * 80)
print("12. GENERATING CONFUSION MATRICES")
print("=" * 80)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Logistic Regression
cm_logreg = confusion_matrix(y_test, logreg_pred)
sns.heatmap(cm_logreg, annot=True, fmt='d', cmap='Blues', ax=ax1,
            xticklabels=['Good', 'Bad'], yticklabels=['Good', 'Bad'])
ax1.set_xlabel('Predicted', fontsize=12)
ax1.set_ylabel('Actual', fontsize=12)
ax1.set_title('Logistic Regression', fontsize=13, fontweight='bold')

# XGBoost
cm_xgb = confusion_matrix(y_test, xgb_pred)
sns.heatmap(cm_xgb, annot=True, fmt='d', cmap='Greens', ax=ax2,
            xticklabels=['Good', 'Bad'], yticklabels=['Good', 'Bad'])
ax2.set_xlabel('Predicted', fontsize=12)
ax2.set_ylabel('Actual', fontsize=12)
ax2.set_title('XGBoost', fontsize=13, fontweight='bold')

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'confusion_matrices.png', bbox_inches='tight')
plt.close()
print("✓ Saved: confusion_matrices.png")

# ============================================================================
# 13. FEATURE IMPORTANCE (XGBOOST)
# ============================================================================

print("\n" + "=" * 80)
print("13. GENERATING FEATURE IMPORTANCE")
print("=" * 80)

xgb_model = xgb_pipeline.named_steps['model']
feature_names = num_features_eng + cat_features
importance = xgb_model.feature_importances_

importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importance
}).sort_values('importance', ascending=False)

# Plot top 15
fig, ax = plt.subplots(figsize=(10, 8))
top15 = importance_df.head(15)
ax.barh(range(len(top15)), top15['importance'], color='steelblue', alpha=0.7)
ax.set_yticks(range(len(top15)))
ax.set_yticklabels(top15['feature'])
ax.set_xlabel('Importance', fontsize=12)
ax.set_title('XGBoost: Top 15 Features', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3, axis='x')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'feature_importance.png', bbox_inches='tight')
plt.close()
print("✓ Saved: feature_importance.png")

# ============================================================================
# 14. SAVE MODELS
# ============================================================================

print("\n" + "=" * 80)
print("14. SAVING MODELS")
print("=" * 80)

joblib.dump(logreg_pipeline, OUTPUT_DIR / 'logistic_model.pkl')
joblib.dump(xgb_pipeline, OUTPUT_DIR / 'xgboost_model.pkl')
print("✓ Saved: logistic_model.pkl")
print("✓ Saved: xgboost_model.pkl")

# ============================================================================
# 15. SAVE METRICS JSON
# ============================================================================

print("\n" + "=" * 80)
print("15. SAVING METRICS JSON")
print("=" * 80)

metrics = {
    "training_info": {
        "train_samples": int(len(X_train_bal)),
        "test_samples": int(len(X_test)),
        "upsampling_applied": True,
        "test_bad_credit_rate": float(y_test.mean()),
        "training_time_logreg_seconds": float(logreg_time),
        "training_time_xgb_seconds": float(xgb_time)
    },
    "features": {
        "numerical_base": num_features,
        "numerical_engineered": ['monthly_burden', 'stability_score', 'risk_ratio',
                                 'credit_to_income_proxy', 'duration_risk'],
        "categorical": cat_features,
        "total_features": len(num_features_eng) + len(cat_features)
    },
    "logistic_regression": {
        "accuracy": float(accuracy_score(y_test, logreg_pred)),
        "precision": float(precision_score(y_test, logreg_pred)),
        "recall": float(recall_score(y_test, logreg_pred)),
        "f1_score": float(f1_score(y_test, logreg_pred)),
        "auc_roc": float(roc_auc_score(y_test, logreg_proba)),
        "confusion_matrix": cm_logreg.tolist(),
        "hyperparameters": {
            "solver": "saga",
            "penalty": "l2",
            "C": 0.1,
            "max_iter": 2000
        }
    },
    "xgboost": {
        "accuracy": float(accuracy_score(y_test, xgb_pred)),
        "precision": float(precision_score(y_test, xgb_pred)),
        "recall": float(recall_score(y_test, xgb_pred)),
        "f1_score": float(f1_score(y_test, xgb_pred)),
        "auc_roc": float(roc_auc_score(y_test, xgb_proba)),
        "confusion_matrix": cm_xgb.tolist(),
        "best_iteration": int(xgb_pipeline.named_steps['model'].best_iteration),
        "hyperparameters": {
            "n_estimators": 500,
            "learning_rate": 0.03,
            "max_depth": 6,
            "min_child_weight": 3,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "gamma": 0.1,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0
        }
    },
    "feature_importance_top15": importance_df.head(15).to_dict('records'),
    "model_comparison": {
        "winner_accuracy": "XGBoost" if accuracy_score(y_test, xgb_pred) > accuracy_score(y_test, logreg_pred) else "Logistic",
        "winner_auc_roc": "XGBoost" if roc_auc_score(y_test, xgb_proba) > roc_auc_score(y_test, logreg_proba) else "Logistic",
        "winner_recall": "XGBoost" if recall_score(y_test, xgb_pred) > recall_score(y_test, logreg_pred) else "Logistic"
    }
}

with open(OUTPUT_DIR / 'metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)
print("✓ Saved: metrics.json")

# ============================================================================
# 16. SAVE TRAINING CODE AS JSON
# ============================================================================

print("\n" + "=" * 80)
print("16. SAVING TRAINING CODE")
print("=" * 80)

# Read this script's source code
with open(__file__, 'r') as f:
    training_code = f.read()

code_documentation = {
    "script_name": "train_models_local.py",
    "description": "Local-first model training script for German Credit Data",
    "models_trained": ["Logistic Regression", "XGBoost"],
    "preprocessing": {
        "logistic": "StandardScaler + OneHotEncoder(drop='first')",
        "xgboost": "Passthrough + OrdinalEncoder(handle_unknown='use_encoded_value')"
    },
    "upsampling": "Random upsampling to balance training set (70/30 → 50/50)",
    "feature_engineering": [
        "monthly_burden = credit_amount / duration",
        "stability_score = age × employment_years",
        "risk_ratio = credit_amount / (age × 100)",
        "credit_to_income_proxy = credit_amount / age",
        "duration_risk = duration × credit_amount"
    ],
    "source_code": training_code
}

with open(OUTPUT_DIR / 'training_code.json', 'w') as f:
    json.dump(code_documentation, f, indent=2)
print("✓ Saved: training_code.json")

# ============================================================================
# 17. SAVE PREPROCESSING PIPELINES
# ============================================================================

print("\n" + "=" * 80)
print("17. SAVING PREPROCESSING PIPELINES")
print("=" * 80)

# Save the fitted preprocessors separately (useful for frontend)
logreg_preprocessor = logreg_pipeline.named_steps['preprocess']
xgb_preprocessor = xgb_pipeline.named_steps['preprocess']

joblib.dump(logreg_preprocessor, OUTPUT_DIR / 'logistic_preprocessor.pkl')
joblib.dump(xgb_preprocessor, OUTPUT_DIR / 'xgboost_preprocessor.pkl')
print("✓ Saved: logistic_preprocessor.pkl")
print("✓ Saved: xgboost_preprocessor.pkl")

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "=" * 80)
print("MODEL TRAINING COMPLETE!")
print("=" * 80)
print(f"\nGenerated files in {OUTPUT_DIR}:")
print("  1. logistic_model.pkl")
print("  2. xgboost_model.pkl")
print("  3. logistic_preprocessor.pkl")
print("  4. xgboost_preprocessor.pkl")
print("  5. metrics.json")
print("  6. training_code.json")
print("  7. roc_curves.png")
print("  8. confusion_matrices.png")
print("  9. feature_importance.png")
print("\n✓ All files ready for manual upload to R2 bucket!")
print("\n" + "=" * 80)
print("PERFORMANCE SUMMARY")
print("=" * 80)
print(f"\nLogistic Regression:")
print(f"  Accuracy: {accuracy_score(y_test, logreg_pred):.4f}")
print(f"  AUC-ROC:  {roc_auc_score(y_test, logreg_proba):.4f}")
print(f"  Recall:   {recall_score(y_test, logreg_pred):.4f}")
print(f"\nXGBoost:")
print(f"  Accuracy: {accuracy_score(y_test, xgb_pred):.4f}")
print(f"  AUC-ROC:  {roc_auc_score(y_test, xgb_proba):.4f}")
print(f"  Recall:   {recall_score(y_test, xgb_pred):.4f}")
print("=" * 80)
