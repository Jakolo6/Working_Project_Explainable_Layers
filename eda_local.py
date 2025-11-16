#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Local-First EDA Script for German Credit Data
Saves all visualizations and statistics to /data/eda/ folder
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import chi2_contingency, pointbiserialr
from pathlib import Path
import json
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURATION
# ============================================================================

DATA_PATH = Path('data/german_credit_clean.csv')
OUTPUT_DIR = Path('data/eda')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Style settings
sns.set_style("whitegrid")
plt.rcParams['figure.dpi'] = 150
plt.rcParams['savefig.dpi'] = 150
plt.rcParams['figure.figsize'] = (14, 10)

print("=" * 80)
print("GERMAN CREDIT DATA: LOCAL EDA")
print("=" * 80)
print(f"Data source: {DATA_PATH}")
print(f"Output directory: {OUTPUT_DIR}")
print("=" * 80)

# ============================================================================
# LOAD DATA
# ============================================================================

df = pd.read_csv(DATA_PATH)
print(f"\n✓ Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

# Map class labels
class_map = {1: 'Good Credit', 2: 'Bad Credit'}
df['class_label'] = df['class'].map(class_map)

# ============================================================================
# DEFINE FEATURES
# ============================================================================

# Feature name mapping (old -> human-readable)
FEATURE_NAMES = {
    'duration': 'Loan Duration (months)',
    'credit_amount': 'Credit Amount',
    'installment_commitment': 'Installment Rate',
    'residence_since': 'Years at Residence',
    'age': 'Age',
    'existing_credits': 'Existing Credits',
    'num_dependents': 'Number of Dependents',
    'checking_status': 'Checking Account Status',
    'credit_history': 'Credit History',
    'purpose': 'Loan Purpose',
    'savings_status': 'Savings Account Status',
    'employment': 'Employment Duration',
    'other_debtors': 'Other Debtors/Guarantors',
    'property_magnitude': 'Property Ownership',
    'other_payment_plans': 'Other Payment Plans',
    'housing': 'Housing Status',
    'job': 'Job Type',
    'own_telephone': 'Telephone Registration'
}

# Original feature lists (for data access)
numerical_features_raw = ['duration', 'credit_amount', 'installment_commitment',
                         'residence_since', 'age', 'existing_credits', 'num_dependents']

categorical_features_raw = ['checking_status', 'credit_history', 'purpose',
                           'savings_status', 'employment', 'other_debtors',
                           'property_magnitude', 'other_payment_plans', 'housing',
                           'job', 'own_telephone']

# Human-readable feature names (for display)
numerical_features = [FEATURE_NAMES[f] for f in numerical_features_raw]
categorical_features = [FEATURE_NAMES[f] for f in categorical_features_raw]

# ============================================================================
# 1. TARGET DISTRIBUTION
# ============================================================================

print("\n" + "=" * 80)
print("1. GENERATING TARGET DISTRIBUTION")
print("=" * 80)

fig, ax = plt.subplots(figsize=(10, 6))
counts = df['class_label'].value_counts()
colors = ['#2ecc71', '#e74c3c']
bars = ax.bar(counts.index, counts.values, color=colors, alpha=0.7, edgecolor='black')

# Add value labels
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{int(height)}\n({height/len(df)*100:.1f}%)',
            ha='center', va='bottom', fontsize=12, fontweight='bold')

ax.set_ylabel('Count', fontsize=12)
ax.set_title('Credit Outcome Distribution', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'target_distribution.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: target_distribution.png")

# ============================================================================
# 2. NUMERICAL FEATURES DISTRIBUTIONS
# ============================================================================

print("\n" + "=" * 80)
print("2. GENERATING NUMERICAL FEATURES DISTRIBUTIONS")
print("=" * 80)

fig, axes = plt.subplots(2, 4, figsize=(16, 8))
axes = axes.flatten()

for idx, feature_raw in enumerate(numerical_features_raw):
    ax = axes[idx]
    feature_display = FEATURE_NAMES[feature_raw]
    
    good = df[df['class'] == 1][feature_raw]
    bad = df[df['class'] == 2][feature_raw]
    
    ax.hist(good, bins=30, alpha=0.6, label='Good Credit', color='#2ecc71')
    ax.hist(bad, bins=30, alpha=0.6, label='Bad Credit', color='#e74c3c')
    ax.set_xlabel(feature_display, fontsize=10)
    ax.set_ylabel('Frequency', fontsize=10)
    ax.set_title(f'{feature_display}', fontsize=11, fontweight='bold')
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)

axes[-1].remove()
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'numerical_distributions.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: numerical_distributions.png")

# ============================================================================
# 3. CATEGORICAL FEATURES DISTRIBUTIONS
# ============================================================================

print("\n" + "=" * 80)
print("3. GENERATING CATEGORICAL FEATURES DISTRIBUTIONS")
print("=" * 80)

fig, axes = plt.subplots(3, 4, figsize=(18, 12))
axes = axes.flatten()

for idx, feature in enumerate(categorical_features):
    ax = axes[idx]
    
    ct = pd.crosstab(df[feature], df['class_label'], normalize='index') * 100
    ct.plot(kind='bar', ax=ax, color=['#2ecc71', '#e74c3c'], alpha=0.7)
    ax.set_title(f'{feature.replace("_", " ").title()}', fontsize=11, fontweight='bold')
    ax.set_ylabel('Percentage (%)', fontsize=10)
    ax.set_xlabel('')
    ax.legend(title='Credit Outcome', loc='best', fontsize=9)
    ax.grid(True, alpha=0.3, axis='y')
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right', fontsize=8)

axes[-1].remove()
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'categorical_distributions.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: categorical_distributions.png")

# ============================================================================
# 4. CORRELATION HEATMAP
# ============================================================================

print("\n" + "=" * 80)
print("4. GENERATING CORRELATION HEATMAP")
print("=" * 80)

fig, ax = plt.subplots(figsize=(12, 10))
# Create correlation matrix with raw feature names, then rename for display
corr_data = df[numerical_features_raw + ['class']].corr()
# Rename index and columns to human-readable names
corr_data.index = [FEATURE_NAMES.get(f, f) for f in corr_data.index]
corr_data.columns = [FEATURE_NAMES.get(f, f) for f in corr_data.columns]
# Rename 'class' to 'Credit Risk'
corr_data = corr_data.rename(index={'class': 'Credit Risk'}, columns={'class': 'Credit Risk'})

sns.heatmap(corr_data, annot=True, fmt='.2f', cmap='coolwarm', center=0,
            square=True, linewidths=1, cbar_kws={"shrink": 0.8}, ax=ax)
ax.set_title('Feature Correlation Matrix', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'correlation_heatmap.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: correlation_heatmap.png")

# ============================================================================
# 5. FEATURE IMPORTANCE (CHI-SQUARE & POINT-BISERIAL)
# ============================================================================

print("\n" + "=" * 80)
print("5. CALCULATING FEATURE IMPORTANCE")
print("=" * 80)

# Chi-square for categorical
chi_scores = {}
for feature_raw in categorical_features_raw:
    ct = pd.crosstab(df[feature_raw], df['class'])
    chi2, p_value, dof, expected = chi2_contingency(ct)
    feature_display = FEATURE_NAMES[feature_raw]
    chi_scores[feature_display] = chi2

# Point-biserial for numerical
pb_scores = {}
for feature_raw in numerical_features_raw:
    corr, p_value = pointbiserialr(df['class'], df[feature_raw])
    feature_display = FEATURE_NAMES[feature_raw]
    pb_scores[feature_display] = abs(corr)

# Plot
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

# Categorical importance
chi_sorted = sorted(chi_scores.items(), key=lambda x: x[1], reverse=True)
features_cat, scores_cat = zip(*chi_sorted)
ax1.barh(features_cat, scores_cat, color='steelblue', alpha=0.7)
ax1.set_xlabel('Chi-Square Score', fontsize=12)
ax1.set_title('Categorical Features Importance', fontsize=13, fontweight='bold')
ax1.grid(True, alpha=0.3, axis='x')

# Numerical importance
pb_sorted = sorted(pb_scores.items(), key=lambda x: x[1], reverse=True)
features_num, scores_num = zip(*pb_sorted)
ax2.barh(features_num, scores_num, color='coral', alpha=0.7)
ax2.set_xlabel('Point-Biserial Correlation (Absolute)', fontsize=12)
ax2.set_title('Numerical Features Importance', fontsize=13, fontweight='bold')
ax2.grid(True, alpha=0.3, axis='x')

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'feature_importance.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: feature_importance.png")

# ============================================================================
# 6. AGE DISTRIBUTION BY OUTCOME
# ============================================================================

print("\n" + "=" * 80)
print("6. GENERATING AGE DISTRIBUTION")
print("=" * 80)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Histogram
good_age = df[df['class'] == 1]['age']
bad_age = df[df['class'] == 2]['age']
ax1.hist(good_age, bins=20, alpha=0.6, label='Good Credit', color='#2ecc71')
ax1.hist(bad_age, bins=20, alpha=0.6, label='Bad Credit', color='#e74c3c')
ax1.set_xlabel('Age (years)', fontsize=11)
ax1.set_ylabel('Frequency', fontsize=11)
ax1.set_title('Age Distribution by Credit Outcome', fontsize=12, fontweight='bold')
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)

# Box plot
df.boxplot(column='age', by='class_label', ax=ax2, patch_artist=True,
           boxprops=dict(facecolor='lightblue', alpha=0.7))
ax2.set_xlabel('Credit Outcome', fontsize=11)
ax2.set_ylabel('Age (years)', fontsize=11)
ax2.set_title('Age Distribution by Credit Outcome', fontsize=12, fontweight='bold')
plt.suptitle('')

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'age_distribution.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: age_distribution.png")

# ============================================================================
# 7. CREDIT AMOUNT DISTRIBUTION
# ============================================================================

print("\n" + "=" * 80)
print("7. GENERATING CREDIT AMOUNT DISTRIBUTION")
print("=" * 80)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Histogram
good_amt = df[df['class'] == 1]['credit_amount']
bad_amt = df[df['class'] == 2]['credit_amount']
ax1.hist(good_amt, bins=30, alpha=0.6, label='Good Credit', color='#2ecc71')
ax1.hist(bad_amt, bins=30, alpha=0.6, label='Bad Credit', color='#e74c3c')
ax1.set_xlabel('Credit Amount (DM)', fontsize=11)
ax1.set_ylabel('Frequency', fontsize=11)
ax1.set_title('Credit Amount Distribution', fontsize=12, fontweight='bold')
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)

# Box plot
df.boxplot(column='credit_amount', by='class_label', ax=ax2, patch_artist=True,
           boxprops=dict(facecolor='lightgreen', alpha=0.7))
ax2.set_xlabel('Credit Outcome', fontsize=11)
ax2.set_ylabel('Credit Amount (DM)', fontsize=11)
ax2.set_title('Credit Amount by Outcome', fontsize=12, fontweight='bold')
plt.suptitle('')

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'credit_amount_distribution.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: credit_amount_distribution.png")

# ============================================================================
# 8. DURATION DISTRIBUTION
# ============================================================================

print("\n" + "=" * 80)
print("8. GENERATING DURATION DISTRIBUTION")
print("=" * 80)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Histogram
good_dur = df[df['class'] == 1]['duration']
bad_dur = df[df['class'] == 2]['duration']
ax1.hist(good_dur, bins=25, alpha=0.6, label='Good Credit', color='#2ecc71')
ax1.hist(bad_dur, bins=25, alpha=0.6, label='Bad Credit', color='#e74c3c')
ax1.set_xlabel('Duration (months)', fontsize=11)
ax1.set_ylabel('Frequency', fontsize=11)
ax1.set_title('Loan Duration Distribution', fontsize=12, fontweight='bold')
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)

# Box plot
df.boxplot(column='duration', by='class_label', ax=ax2, patch_artist=True,
           boxprops=dict(facecolor='lightyellow', alpha=0.7))
ax2.set_xlabel('Credit Outcome', fontsize=11)
ax2.set_ylabel('Duration (months)', fontsize=11)
ax2.set_title('Duration by Outcome', fontsize=12, fontweight='bold')
plt.suptitle('')

plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'duration_distribution.png', bbox_inches='tight')
plt.close()
print(f"✓ Saved: duration_distribution.png")

# ============================================================================
# 9. GENERATE STATISTICS JSON
# ============================================================================

print("\n" + "=" * 80)
print("9. GENERATING STATISTICS JSON")
print("=" * 80)

statistics = {
    "dataset_info": {
        "total_records": int(len(df)),
        "total_features": int(len(df.columns) - 2),  # Exclude class and class_label
        "numerical_features": len(numerical_features),
        "categorical_features": len(categorical_features)
    },
    "target_distribution": {
        "good_credit": int((df['class'] == 1).sum()),
        "bad_credit": int((df['class'] == 2).sum()),
        "good_credit_rate": float((df['class'] == 1).mean()),
        "bad_credit_rate": float((df['class'] == 2).mean())
    },
    "numerical_statistics": {},
    "categorical_statistics": {},
    "feature_importance": {
        "categorical_chi_square": dict(chi_sorted),
        "numerical_point_biserial": dict(pb_sorted)
    },
    "key_insights": {
        "avg_age_good": float(df[df['class'] == 1]['age'].mean()),
        "avg_age_bad": float(df[df['class'] == 2]['age'].mean()),
        "avg_amount_good": float(df[df['class'] == 1]['credit_amount'].mean()),
        "avg_amount_bad": float(df[df['class'] == 2]['credit_amount'].mean()),
        "avg_duration_good": float(df[df['class'] == 1]['duration'].mean()),
        "avg_duration_bad": float(df[df['class'] == 2]['duration'].mean())
    }
}

# Add numerical statistics
for feature in numerical_features:
    statistics["numerical_statistics"][feature] = {
        "mean": float(df[feature].mean()),
        "median": float(df[feature].median()),
        "std": float(df[feature].std()),
        "min": float(df[feature].min()),
        "max": float(df[feature].max()),
        "mean_good": float(df[df['class'] == 1][feature].mean()),
        "mean_bad": float(df[df['class'] == 2][feature].mean())
    }

# Add categorical statistics
for feature in categorical_features:
    value_counts = df[feature].value_counts().to_dict()
    approval_rates = (df[df['class'] == 1].groupby(feature).size() / 
                     df.groupby(feature).size() * 100).to_dict()
    
    statistics["categorical_statistics"][feature] = {
        "unique_values": int(df[feature].nunique()),
        "value_counts": {str(k): int(v) for k, v in value_counts.items()},
        "approval_rates": {str(k): float(v) for k, v in approval_rates.items()}
    }

# Save JSON
with open(OUTPUT_DIR / 'statistics.json', 'w') as f:
    json.dump(statistics, f, indent=2)

print(f"✓ Saved: statistics.json")

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "=" * 80)
print("EDA COMPLETE!")
print("=" * 80)
print(f"\nGenerated files in {OUTPUT_DIR}:")
print("  1. target_distribution.png")
print("  2. numerical_distributions.png")
print("  3. categorical_distributions.png")
print("  4. correlation_heatmap.png")
print("  5. feature_importance.png")
print("  6. age_distribution.png")
print("  7. credit_amount_distribution.png")
print("  8. duration_distribution.png")
print("  9. statistics.json")
print("\n✓ All files ready for manual upload to R2 bucket!")
print("=" * 80)
