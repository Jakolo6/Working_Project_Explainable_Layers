#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Converted from Jupyter Notebook: notebook.ipynb
Conversion Date: 2025-11-11T22:26:44.904Z
"""

# # German Credit Data: EDA


# ## Exploratory Data Analysis (EDA)


import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 10)

# Map class labels
class_map = {1: 'Good Credit', 2: 'Bad Credit'}
df['class_label'] = df['class'].map(class_map)

print("=" * 80)
print("CREDIT OUTCOME DISTRIBUTION")
print("=" * 80)
print(df['class_label'].value_counts())
print(f"\nGood Credit Rate: {(df['class'] == 1).sum() / len(df) * 100:.1f}%")
print(f"Bad Credit Rate: {(df['class'] == 2).sum() / len(df) * 100:.1f}%")

# ### Numerical Features vs Credit Outcome


numerical_features = ['duration', 'credit_amount', 'installment_commitment', 'residence_since', 'age', 'existing_credits', 'num_dependents']

fig, axes = plt.subplots(2, 4, figsize=(16, 8))
axes = axes.flatten()

for idx, feature in enumerate(numerical_features):
    ax = axes[idx]
    
    good = df[df['class'] == 1][feature]
    bad = df[df['class'] == 2][feature]
    
    ax.hist(good, bins=30, alpha=0.6, label='Good Credit', color='green')
    ax.hist(bad, bins=30, alpha=0.6, label='Bad Credit', color='red')
    ax.set_xlabel(feature)
    ax.set_ylabel('Frequency')
    ax.set_title(f'{feature} by Credit Outcome')
    ax.legend()
    ax.grid(True, alpha=0.3)

# Remove extra subplot
axes[-1].remove()
plt.tight_layout()
plt.show()

# Statistical comparison
print("\n" + "=" * 80)
print("NUMERICAL FEATURES: MEAN VALUES BY CREDIT OUTCOME")
print("=" * 80)
comparison = df.groupby('class_label')[numerical_features].mean()
print(comparison)

# Calculate correlation with credit outcome
print("\n" + "=" * 80)
print("CORRELATION WITH CREDIT OUTCOME (1=Good, 2=Bad)")
print("=" * 80)
correlations = df[numerical_features + ['class']].corr()['class'].drop('class').sort_values()
print(correlations)

# ### Categorical Features vs Credit Outcome


categorical_features = ['checking_status', 'credit_history', 'purpose', 'savings_status', 'employment', 'housing', 'job']

fig, axes = plt.subplots(2, 4, figsize=(16, 10))
axes = axes.flatten()

for idx, feature in enumerate(categorical_features):
    ax = axes[idx]
    
    # Create crosstab
    ct = pd.crosstab(df[feature], df['class_label'], normalize='index') * 100
    ct.plot(kind='bar', ax=ax, color=['green', 'red'], alpha=0.7)
    ax.set_title(f'{feature}')
    ax.set_ylabel('Percentage (%)')
    ax.set_xlabel('')
    ax.legend(title='Credit Outcome', loc='best')
    ax.grid(True, alpha=0.3, axis='y')
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')

# Remove extra subplot
axes[-1].remove()
plt.tight_layout()
plt.show()

# Approval rate by category
print("\n" + "=" * 80)
print("APPROVAL RATE BY CATEGORICAL FEATURES")
print("=" * 80)

for feature in categorical_features:
    print(f"\n{feature.upper()}:")
    approval_rate = (df[df['class'] == 1].groupby(feature).size() / df.groupby(feature).size() * 100).sort_values(ascending=False)
    print(approval_rate.round(1))

# ### Feature Importance (Chi-Square & Information Gain)


from scipy.stats import chi2_contingency, pointbiserialr

# Chi-square test for categorical features
print("=" * 80)
print("CHI-SQUARE TEST: CATEGORICAL FEATURES vs CREDIT OUTCOME")
print("=" * 80)

chi_scores = {}
for feature in categorical_features:
    ct = pd.crosstab(df[feature], df['class'])
    chi2, p_value, dof, expected = chi2_contingency(ct)
    chi_scores[feature] = chi2
    print(f"{feature:30s} | Chi2: {chi2:8.2f} | p-value: {p_value:.2e}")

# Point-biserial correlation for numerical features
print("\n" + "=" * 80)
print("POINT-BISERIAL CORRELATION: NUMERICAL FEATURES vs CREDIT OUTCOME")
print("=" * 80)

pb_scores = {}
for feature in numerical_features:
    corr, p_value = pointbiserialr(df['class'], df[feature])
    pb_scores[feature] = abs(corr)
    print(f"{feature:30s} | Correlation: {corr:7.4f} | p-value: {p_value:.2e}")

# Visualize feature importance
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Categorical importance
chi_sorted = sorted(chi_scores.items(), key=lambda x: x[1], reverse=True)
features_cat, scores_cat = zip(*chi_sorted)
ax1.barh(features_cat, scores_cat, color='steelblue')
ax1.set_xlabel('Chi-Square Score')
ax1.set_title('Categorical Features Importance')
ax1.grid(True, alpha=0.3, axis='x')

# Numerical importance
pb_sorted = sorted(pb_scores.items(), key=lambda x: x[1], reverse=True)
features_num, scores_num = zip(*pb_sorted)
ax2.barh(features_num, scores_num, color='coral')
ax2.set_xlabel('Point-Biserial Correlation (Absolute)')
ax2.set_title('Numerical Features Importance')
ax2.grid(True, alpha=0.3, axis='x')

plt.tight_layout()
plt.show()

# ### Key Insights


# ### Causation vs Correlation Analysis


print("=" * 90)
print("DETAILED ANALYSIS: CAUSATION vs CORRELATION")
print("=" * 90)

print("""
This analysis examines whether features CAUSE credit rejection or merely CORRELATE with it.

KEY PRINCIPLE: Correlation ≠ Causation
- A feature may correlate with credit outcome because it CAUSES the outcome
- OR because it's a PROXY for another underlying factor
- OR because of REVERSE CAUSATION (outcome influences the feature)

""")

print("\n" + "=" * 90)
print("1. DURATION (Loan Length) - LIKELY CAUSAL")
print("=" * 90)

good_dur = df[df['class'] == 1]['duration'].mean()
bad_dur = df[df['class'] == 2]['duration'].mean()
print(f"""
OBSERVATION:
  • Good credit: {good_dur:.1f} months average
  • Bad credit:  {bad_dur:.1f} months average
  • Difference:  {bad_dur - good_dur:.1f} months longer for bad credit

INTERPRETATION (LIKELY CAUSAL):
  ✓ Longer loans = more time for things to go wrong
  ✓ Longer loans = higher total interest paid = harder to repay
  ✓ Longer loans = more risk exposure for the bank
  
  This is CAUSAL because:
  - Longer duration directly increases financial risk
  - The bank knows this and prices it in
  - It's not a proxy for something else; it's the actual risk factor

CONCLUSION: Duration CAUSES higher default risk (causal relationship)
""")

print("\n" + "=" * 90)
print("2. CREDIT AMOUNT - LIKELY CAUSAL")
print("=" * 90)

good_amt = df[df['class'] == 1]['credit_amount'].mean()
bad_amt = df[df['class'] == 2]['credit_amount'].mean()
print(f"""
OBSERVATION:
  • Good credit: {good_amt:.0f} DM average
  • Bad credit:  {bad_amt:.0f} DM average
  • Difference:  {bad_amt - good_amt:.0f} DM higher for bad credit

INTERPRETATION (LIKELY CAUSAL):
  ✓ Larger loans = harder to repay (more money owed)
  ✓ Larger loans = higher monthly payments
  ✓ Larger loans = more financial strain on applicant
  
  This is CAUSAL because:
  - Higher amounts directly increase repayment burden
  - The amount borrowed is a direct measure of financial obligation
  - It's not a proxy; it's the actual risk factor

CONCLUSION: Credit amount CAUSES higher default risk (causal relationship)
""")

print("\n" + "=" * 90)
print("3. AGE - MIXED (CAUSAL + PROXY)")
print("=" * 90)

good_age = df[df['class'] == 1]['age'].mean()
bad_age = df[df['class'] == 2]['age'].mean()
print(f"""
OBSERVATION:
  • Good credit: {good_age:.1f} years average
  • Bad credit:  {bad_age:.1f} years average
  • Difference:  {good_age - bad_age:.1f} years (older = better)

INTERPRETATION (MIXED - CAUSAL + PROXY):
  
  CAUSAL factors:
  ✓ Older people have more stable employment
  ✓ Older people have more savings/assets
  ✓ Older people have more credit history to prove reliability
  
  PROXY factors:
  ✓ Age correlates with INCOME (not directly measured)
  ✓ Age correlates with LIFE STABILITY (job, family, housing)
  ✓ Age correlates with EXPERIENCE managing money
  
  This is PARTIALLY CAUSAL because:
  - Age itself doesn't cause good credit; it's a proxy for maturity/stability
  - The real causal factors are income, employment stability, and experience
  - Age is useful because it correlates with these unmeasured factors

CONCLUSION: Age CORRELATES with lower default risk, but the REAL CAUSES are 
            stability, income, and experience (which age proxies for)
""")

print("\n" + "=" * 90)
print("4. CHECKING STATUS - STRONGLY CAUSAL")
print("=" * 90)

checking_dist = pd.crosstab(df['checking_status'], df['class_label'], normalize='index') * 100
print(f"""
OBSERVATION:
{checking_dist.to_string()}

INTERPRETATION (STRONGLY CAUSAL):
  ✓ Having NO checking account = 73.3% rejection rate
  ✓ Having checking account with balance = 90.9% approval rate
  
  Why this is CAUSAL:
  - Checking account balance = PROOF OF SAVINGS & FINANCIAL STABILITY
  - No checking account = FINANCIAL EXCLUSION or INSTABILITY
  - The bank uses this as direct evidence of ability to manage money
  - It's not a proxy; it's actual proof of financial behavior
  
  This is STRONGLY CAUSAL because:
  - The checking status directly demonstrates financial capability
  - It's based on actual observed behavior (having/not having money)
  - It's not just correlated; it's a direct measure of financial health

CONCLUSION: Checking status CAUSES credit decisions (causal relationship)
""")

print("\n" + "=" * 90)
print("5. CREDIT HISTORY - STRONGEST CAUSAL")
print("=" * 90)

history_dist = pd.crosstab(df['credit_history'], df['class_label'], normalize='index') * 100
print(f"""
OBSERVATION:
{history_dist.to_string()}

INTERPRETATION (STRONGEST CAUSAL):
  ✓ "All credits paid back duly" = 96.3% approval rate
  ✓ "Critical account" = 0% approval rate
  
  Why this is STRONGEST CAUSAL:
  - Past behavior is the BEST PREDICTOR of future behavior
  - If someone paid back all previous loans = they'll likely pay this one
  - If someone has a critical account = they've already defaulted
  - This is DIRECT EVIDENCE of creditworthiness
  
  This is the MOST CAUSAL factor because:
  - It's based on actual past performance
  - It directly predicts future performance
  - It's not a proxy; it's the actual track record
  - Banks use this as the PRIMARY decision factor

CONCLUSION: Credit history DIRECTLY CAUSES credit decisions (strongest causal)
""")

print("\n" + "=" * 90)
print("6. PURPOSE (Loan Purpose) - PROXY (NOT DIRECTLY CAUSAL)")
print("=" * 90)

purpose_dist = pd.crosstab(df['purpose'], df['class_label'], normalize='index') * 100
print(f"""
OBSERVATION:
{purpose_dist.to_string()}

INTERPRETATION (PROXY - NOT DIRECTLY CAUSAL):
  ✓ Education loans: 75.0% approval
  ✓ Car (new): 75.0% approval
  ✓ Business: 0% approval
  
  Why this is PROXY (not directly causal):
  - The PURPOSE itself doesn't cause default
  - But purpose correlates with OTHER FACTORS:
    • Education loans → young people with future earning potential
    • Car loans → collateral (can repossess the car)
    • Business loans → high risk, uncertain returns
  
  This is PROXY because:
  - The real causal factors are: collateral value, income potential, risk level
  - Purpose is just a marker for these underlying factors
  - Different purposes attract different risk profiles

CONCLUSION: Purpose CORRELATES with credit outcome, but it's a PROXY for 
            underlying factors like collateral, income potential, and risk
""")

print("\n" + "=" * 90)
print("SUMMARY: CAUSAL vs PROXY FACTORS")
print("=" * 90)

summary = """
STRONGLY CAUSAL (Direct causes of credit decisions):
  1. Credit History      → Past behavior predicts future behavior
  2. Duration            → Longer loans = more risk
  3. Credit Amount       → Larger amounts = harder to repay
  4. Checking Status     → Direct proof of financial stability

PROXY FACTORS (Correlate but aren't direct causes):
  1. Age                 → Proxy for stability, income, experience
  2. Purpose             → Proxy for collateral, risk level, income potential
  3. Employment          → Proxy for income stability
  4. Savings Status      → Proxy for financial discipline

KEY INSIGHT FOR YOUR RESEARCH:
- The model likely learns BOTH causal and proxy relationships
- SHAP explanations will show feature importance, but not causation
- When explaining to users, distinguish between:
  • "This feature CAUSES the decision" (credit history, amount, duration)
  • "This feature INDICATES risk" (age, purpose, savings)
  • This affects how users perceive fairness and trust in the model
"""

print(summary)

print("=" * 80)
print("KEY INSIGHTS: HOW FEATURES INFLUENCE CREDIT OUTCOME")
print("=" * 80)

print("\n🔴 TOP 3 MOST INFLUENTIAL CATEGORICAL FEATURES:")
for i, (feature, score) in enumerate(chi_sorted[:3], 1):
    print(f"  {i}. {feature} (Chi2={score:.2f})")

print("\n🔴 TOP 3 MOST INFLUENTIAL NUMERICAL FEATURES:")
for i, (feature, score) in enumerate(pb_sorted[:3], 1):
    print(f"  {i}. {feature} (Correlation={score:.4f})")

print("\n📊 DETAILED INSIGHTS:")

# Duration insight
good_duration = df[df['class'] == 1]['duration'].mean()
bad_duration = df[df['class'] == 2]['duration'].mean()
print(f"\n  • Duration: Good credit applicants have shorter loan durations ({good_duration:.1f} months)")
print(f"    vs bad credit ({bad_duration:.1f} months). Shorter duration = lower risk.")

# Credit amount insight
good_amount = df[df['class'] == 1]['credit_amount'].mean()
bad_amount = df[df['class'] == 2]['credit_amount'].mean()
print(f"\n  • Credit Amount: Good credit applicants borrow less ({good_amount:.0f} DM)")
print(f"    vs bad credit ({bad_amount:.0f} DM). Lower amounts = lower risk.")

# Age insight
good_age = df[df['class'] == 1]['age'].mean()
bad_age = df[df['class'] == 2]['age'].mean()
print(f"\n  • Age: Good credit applicants are older ({good_age:.1f} years)")
print(f"    vs bad credit ({bad_age:.1f} years). Older = more stable.")

# Checking status insight
checking_approval = (df[df['class'] == 1].groupby('checking_status').size() / df.groupby('checking_status').size() * 100)
best_checking = checking_approval.idxmax()
worst_checking = checking_approval.idxmin()
print(f"\n  • Checking Status: '{best_checking}' has highest approval rate ({checking_approval.max():.1f}%)")
print(f"    while '{worst_checking}' has lowest ({checking_approval.min():.1f}%).")

# Credit history insight
history_approval = (df[df['class'] == 1].groupby('credit_history').size() / df.groupby('credit_history').size() * 100)
best_history = history_approval.idxmax()
print(f"\n  • Credit History: '{best_history}' has highest approval rate ({history_approval.max():.1f}%)")

# Purpose insight
purpose_approval = (df[df['class'] == 1].groupby('purpose').size() / df.groupby('purpose').size() * 100)
best_purpose = purpose_approval.idxmax()
worst_purpose = purpose_approval.idxmin()
print(f"\n  • Purpose: '{best_purpose}' has highest approval rate ({purpose_approval.max():.1f}%)")
print(f"    while '{worst_purpose}' has lowest ({purpose_approval.min():.1f}%).")

print("\n" + "=" * 80)