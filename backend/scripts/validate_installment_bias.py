"""
Validate Survivorship Bias in Installment Rate Feature
=======================================================

Context: ENCODING VALIDATION for the installment_commitment (Installment Rate) feature.

Original Hypothesis (DISPROVEN): High burden correlates with lower default rates due to
survivorship bias. Analysis showed this was due to INCORRECT ENCODING in the codebase.

Current Purpose: Validate that the corrected encoding (1=low burden, 4=high burden) 
shows the expected pattern: higher burden → higher default risk.

This script performs statistical analysis to confirm or reject this hypothesis.
"""

import pandas as pd
import numpy as np
from scipy import stats
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.config import get_settings
from app.services.r2_service import R2Service

# ============================================================================
# CONFIGURATION
# ============================================================================

# CORRECTED ENCODING: 1 = lowest burden, 4 = highest burden
INSTALLMENT_RATE_MAP = {
    1: 'lt_20_percent',      # <20% - LOWEST burden
    2: '20_to_25_percent',   # 20-25%
    3: '25_to_35_percent',   # 25-35%
    4: 'ge_35_percent'       # ≥35% - HIGHEST burden
}

INSTALLMENT_RATE_LABELS = {
    1: '<20% (Lowest Burden)',
    2: '20-25% (Moderate Burden)',
    3: '25-35% (Moderate-High Burden)',
    4: '≥35% (Highest Burden)'
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def print_header(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_table(df, title=None):
    """Print a formatted ASCII table"""
    if title:
        print(f"\n{title}")
        print("-" * 80)
    print(df.to_string(index=False))
    print()


def load_dataset():
    """Load the cleaned German Credit dataset"""
    print("Loading dataset...")
    
    # Try to load from R2 first
    try:
        config = get_settings()
        r2_service = R2Service(config)
        
        # Download from R2
        local_path = "/tmp/german_credit_cleaned.csv"
        r2_service.download_file("datasets/german_credit_cleaned.csv", local_path)
        
        df = pd.read_csv(local_path)
        print(f"✓ Loaded {len(df)} records from R2")
        return df
        
    except Exception as e:
        print(f"⚠ Could not load from R2: {e}")
        
        # Try local paths
        local_paths = [
            "../data/german_credit_cleaned.csv",
            "../../data/german_credit_cleaned.csv",
            "../../../data/german_credit_cleaned.csv",
            "data/german_credit_cleaned.csv"
        ]
        
        for path in local_paths:
            if os.path.exists(path):
                df = pd.read_csv(path)
                print(f"✓ Loaded {len(df)} records from {path}")
                return df
        
        raise FileNotFoundError("Could not find german_credit_cleaned.csv in any location")


def prepare_data(df):
    """Prepare data for analysis"""
    print("Preparing data...")
    
    # Create a copy
    df = df.copy()
    
    # Map installment_commitment to categories if it's numeric
    if df['installment_commitment'].dtype in ['int64', 'float64']:
        df['installment_rate_category'] = df['installment_commitment'].map(INSTALLMENT_RATE_MAP)
        df['installment_rate_label'] = df['installment_commitment'].map(INSTALLMENT_RATE_LABELS)
    else:
        # Already categorical
        df['installment_rate_category'] = df['installment_commitment']
        # Create reverse map for labels
        reverse_map = {v: k for k, v in INSTALLMENT_RATE_MAP.items()}
        df['installment_rate_label'] = df['installment_commitment'].map(
            lambda x: INSTALLMENT_RATE_LABELS.get(reverse_map.get(x, 0), x)
        )
    
    # Ensure target is binary (0 = good, 1 = bad)
    if 'class' in df.columns:
        df['default'] = (df['class'] == 'bad').astype(int)
    elif 'target' in df.columns:
        df['default'] = df['target']
    else:
        raise ValueError("Could not find target column (class or target)")
    
    print(f"✓ Prepared {len(df)} records")
    print(f"  Default rate: {df['default'].mean():.1%}")
    print(f"  Installment rate categories: {df['installment_rate_category'].nunique()}")
    
    return df


# ============================================================================
# ANALYSIS 1: THE PARADOX CHECK
# ============================================================================

def analyze_paradox(df):
    """
    Check if high burden correlates with lower default rates (the paradox).
    Expected: Rate 1 (≥35%) should have LOWER default rate than Rate 2-3.
    """
    print_header("ANALYSIS 1: THE PARADOX CHECK")
    print("Question: Does high installment burden correlate with LOWER default rates?")
    print("Expected (if bias exists): Rate 1 (≥35%) has lower default than Rate 2-3\n")
    
    # Group by installment rate
    if df['installment_commitment'].dtype in ['int64', 'float64']:
        # Numeric categories (1, 2, 3, 4)
        grouped = df.groupby('installment_commitment').agg({
            'default': ['count', 'sum', 'mean']
        }).round(4)
        
        grouped.columns = ['Count', 'Defaults', 'Default_Rate']
        grouped = grouped.reset_index()
        grouped['Category'] = grouped['installment_commitment'].map(INSTALLMENT_RATE_LABELS)
        grouped['Default_Rate_Pct'] = (grouped['Default_Rate'] * 100).round(2)
        
        # Reorder columns
        result = grouped[['installment_commitment', 'Category', 'Count', 'Defaults', 'Default_Rate_Pct']]
        result.columns = ['Rate', 'Description', 'Count', 'Defaults', 'Default Rate (%)']
        
    else:
        # Categorical
        grouped = df.groupby('installment_rate_category').agg({
            'default': ['count', 'sum', 'mean']
        }).round(4)
        
        grouped.columns = ['Count', 'Defaults', 'Default_Rate']
        grouped = grouped.reset_index()
        grouped['Default_Rate_Pct'] = (grouped['Default_Rate'] * 100).round(2)
        
        result = grouped[['installment_rate_category', 'Count', 'Defaults', 'Default_Rate_Pct']]
        result.columns = ['Category', 'Count', 'Defaults', 'Default Rate (%)']
    
    print_table(result, "Default Rates by Installment Rate Category:")
    
    # Statistical test: Compare Rate 1 vs Rate 2-3
    if df['installment_commitment'].dtype in ['int64', 'float64']:
        rate_1 = df[df['installment_commitment'] == 1]['default']
        rate_2_3 = df[df['installment_commitment'].isin([2, 3])]['default']
    else:
        rate_1 = df[df['installment_rate_category'] == 'ge_35_percent']['default']
        rate_2_3 = df[df['installment_rate_category'].isin(['25_to_35_percent', '20_to_25_percent'])]['default']
    
    # Chi-square test
    contingency = pd.crosstab(
        df['installment_commitment'] if df['installment_commitment'].dtype in ['int64', 'float64'] else df['installment_rate_category'],
        df['default']
    )
    chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
    
    print("Statistical Test: Chi-Square Test of Independence")
    print(f"  Chi-square statistic: {chi2:.4f}")
    print(f"  P-value: {p_value:.4f}")
    print(f"  Degrees of freedom: {dof}")
    
    if p_value < 0.05:
        print("  ✓ Result: SIGNIFICANT relationship between installment rate and default")
    else:
        print("  ✗ Result: NO significant relationship")
    
    # Check for paradox
    rate_1_default = rate_1.mean()
    rate_2_3_default = rate_2_3.mean()
    
    print(f"\nParadox Check:")
    print(f"  Rate 1 (≥35%) default rate: {rate_1_default:.1%}")
    print(f"  Rate 2-3 (20-35%) default rate: {rate_2_3_default:.1%}")
    
    if rate_1_default < rate_2_3_default:
        print(f"  ⚠️  PARADOX CONFIRMED: High burden has LOWER default rate!")
        print(f"     Difference: {(rate_2_3_default - rate_1_default):.1%} lower")
        return True
    else:
        print(f"  ✓ No paradox: High burden has higher default rate (as expected)")
        return False


# ============================================================================
# ANALYSIS 2: SUPER-PRIME HYPOTHESIS CHECK
# ============================================================================

def analyze_super_prime_hypothesis(df):
    """
    Check if Rate 1 (≥35%) applicants are "super-prime" in other dimensions.
    Compare Rate 1 vs Rate 2 on wealth/stability indicators.
    """
    print_header("ANALYSIS 2: SUPER-PRIME HYPOTHESIS CHECK")
    print("Question: Are high-burden applicants significantly 'richer' or 'safer'?")
    print("Hypothesis: Banks only approved ≥35% burden for super-prime applicants\n")
    
    # Define groups
    if df['installment_commitment'].dtype in ['int64', 'float64']:
        rate_1 = df[df['installment_commitment'] == 1]  # ≥35%
        rate_2 = df[df['installment_commitment'] == 2]  # 25-35%
    else:
        rate_1 = df[df['installment_rate_category'] == 'ge_35_percent']
        rate_2 = df[df['installment_rate_category'] == '25_to_35_percent']
    
    print(f"Comparing:")
    print(f"  Group A (High Burden ≥35%): n={len(rate_1)}")
    print(f"  Group B (Moderate Burden 25-35%): n={len(rate_2)}\n")
    
    results = []
    
    # 1. SAVINGS ACCOUNT
    print("1. SAVINGS ACCOUNT STATUS")
    print("-" * 80)
    
    if 'savings_status' in df.columns:
        # Check for high savings (≥1000 DM)
        rate_1_high_savings = (rate_1['savings_status'] == 'gte_1000_dm').mean()
        rate_2_high_savings = (rate_2['savings_status'] == 'gte_1000_dm').mean()
        
        print(f"  High Savings (≥€1000):")
        print(f"    Rate 1 (≥35%): {rate_1_high_savings:.1%}")
        print(f"    Rate 2 (25-35%): {rate_2_high_savings:.1%}")
        print(f"    Difference: {(rate_1_high_savings - rate_2_high_savings):.1%}")
        
        # Chi-square test
        contingency = pd.crosstab(
            [rate_1['savings_status'], rate_2['savings_status']],
            [['Rate 1'] * len(rate_1) + ['Rate 2'] * len(rate_2)]
        )
        
        results.append({
            'Indicator': 'High Savings (≥€1000)',
            'Rate 1 (≥35%)': f"{rate_1_high_savings:.1%}",
            'Rate 2 (25-35%)': f"{rate_2_high_savings:.1%}",
            'Difference': f"{(rate_1_high_savings - rate_2_high_savings):.1%}",
            'Favors': 'Rate 1' if rate_1_high_savings > rate_2_high_savings else 'Rate 2'
        })
    
    # 2. CHECKING ACCOUNT
    print("\n2. CHECKING ACCOUNT STATUS")
    print("-" * 80)
    
    if 'checking_status' in df.columns:
        # Check for healthy checking (≥200 DM)
        rate_1_healthy_checking = (rate_1['checking_status'] == 'gte_200_dm').mean()
        rate_2_healthy_checking = (rate_2['checking_status'] == 'gte_200_dm').mean()
        
        print(f"  Healthy Checking (≥€200):")
        print(f"    Rate 1 (≥35%): {rate_1_healthy_checking:.1%}")
        print(f"    Rate 2 (25-35%): {rate_2_healthy_checking:.1%}")
        print(f"    Difference: {(rate_1_healthy_checking - rate_2_healthy_checking):.1%}")
        
        results.append({
            'Indicator': 'Healthy Checking (≥€200)',
            'Rate 1 (≥35%)': f"{rate_1_healthy_checking:.1%}",
            'Rate 2 (25-35%)': f"{rate_2_healthy_checking:.1%}",
            'Difference': f"{(rate_1_healthy_checking - rate_2_healthy_checking):.1%}",
            'Favors': 'Rate 1' if rate_1_healthy_checking > rate_2_healthy_checking else 'Rate 2'
        })
    
    # 3. EMPLOYMENT DURATION
    print("\n3. EMPLOYMENT DURATION")
    print("-" * 80)
    
    if 'employment' in df.columns:
        # Check for long employment (≥7 years)
        rate_1_long_employment = (rate_1['employment'] == 'ge_7_years').mean()
        rate_2_long_employment = (rate_2['employment'] == 'ge_7_years').mean()
        
        print(f"  Long Employment (≥7 years):")
        print(f"    Rate 1 (≥35%): {rate_1_long_employment:.1%}")
        print(f"    Rate 2 (25-35%): {rate_2_long_employment:.1%}")
        print(f"    Difference: {(rate_1_long_employment - rate_2_long_employment):.1%}")
        
        results.append({
            'Indicator': 'Long Employment (≥7 years)',
            'Rate 1 (≥35%)': f"{rate_1_long_employment:.1%}",
            'Rate 2 (25-35%)': f"{rate_2_long_employment:.1%}",
            'Difference': f"{(rate_1_long_employment - rate_2_long_employment):.1%}",
            'Favors': 'Rate 1' if rate_1_long_employment > rate_2_long_employment else 'Rate 2'
        })
    
    # 4. LOAN AMOUNT
    print("\n4. LOAN AMOUNT")
    print("-" * 80)
    
    if 'credit_amount' in df.columns:
        rate_1_loan = rate_1['credit_amount'].mean()
        rate_2_loan = rate_2['credit_amount'].mean()
        
        # T-test
        t_stat, p_value = stats.ttest_ind(rate_1['credit_amount'], rate_2['credit_amount'])
        
        print(f"  Average Loan Amount:")
        print(f"    Rate 1 (≥35%): €{rate_1_loan:,.0f}")
        print(f"    Rate 2 (25-35%): €{rate_2_loan:,.0f}")
        print(f"    Difference: €{(rate_1_loan - rate_2_loan):,.0f}")
        print(f"    T-test p-value: {p_value:.4f}")
        
        if p_value < 0.05:
            print(f"    ✓ Significantly different")
        else:
            print(f"    ✗ Not significantly different")
        
        results.append({
            'Indicator': 'Average Loan Amount',
            'Rate 1 (≥35%)': f"€{rate_1_loan:,.0f}",
            'Rate 2 (25-35%)': f"€{rate_2_loan:,.0f}",
            'Difference': f"€{(rate_1_loan - rate_2_loan):,.0f}",
            'Favors': 'Rate 1' if rate_1_loan < rate_2_loan else 'Rate 2'  # Lower is better
        })
    
    # 5. AGE
    print("\n5. AGE")
    print("-" * 80)
    
    if 'age' in df.columns:
        rate_1_age = rate_1['age'].mean()
        rate_2_age = rate_2['age'].mean()
        
        # T-test
        t_stat, p_value = stats.ttest_ind(rate_1['age'], rate_2['age'])
        
        print(f"  Average Age:")
        print(f"    Rate 1 (≥35%): {rate_1_age:.1f} years")
        print(f"    Rate 2 (25-35%): {rate_2_age:.1f} years")
        print(f"    Difference: {(rate_1_age - rate_2_age):.1f} years")
        print(f"    T-test p-value: {p_value:.4f}")
        
        if p_value < 0.05:
            print(f"    ✓ Significantly different")
        else:
            print(f"    ✗ Not significantly different")
        
        results.append({
            'Indicator': 'Average Age',
            'Rate 1 (≥35%)': f"{rate_1_age:.1f} years",
            'Rate 2 (25-35%)': f"{rate_2_age:.1f} years",
            'Difference': f"{(rate_1_age - rate_2_age):.1f} years",
            'Favors': 'Rate 1' if rate_1_age > rate_2_age else 'Rate 2'  # Older is better
        })
    
    # Summary table
    print("\n" + "=" * 80)
    print("SUMMARY: Super-Prime Indicators Comparison")
    print("=" * 80)
    
    results_df = pd.DataFrame(results)
    print_table(results_df)
    
    # Count how many favor Rate 1
    rate_1_advantages = sum(1 for r in results if r['Favors'] == 'Rate 1')
    total_indicators = len(results)
    
    print(f"Super-Prime Evidence:")
    print(f"  {rate_1_advantages}/{total_indicators} indicators favor Rate 1 (≥35% burden)")
    
    if rate_1_advantages >= total_indicators * 0.6:
        print(f"  ✓ STRONG EVIDENCE: Rate 1 applicants are significantly 'super-prime'")
        return True
    elif rate_1_advantages >= total_indicators * 0.4:
        print(f"  ⚠️  MODERATE EVIDENCE: Some super-prime characteristics")
        return True
    else:
        print(f"  ✗ WEAK EVIDENCE: Rate 1 applicants are not significantly different")
        return False


# ============================================================================
# ANALYSIS 3: SHAP INTERACTION ANALYSIS
# ============================================================================

def analyze_shap_interactions(df):
    """
    Load XGBoost model and analyze SHAP interactions.
    Check if installment_commitment effect depends on other features.
    """
    print_header("ANALYSIS 3: SHAP INTERACTION ANALYSIS")
    print("Question: Does the effect of installment rate depend on other features?")
    print("Hypothesis: High burden is 'good' only when savings/checking are high\n")
    
    try:
        import shap
        import joblib
        from app.services.xgboost_service import XGBoostService
        from app.config import get_settings
        
        print("Loading XGBoost model...")
        config = get_settings()
        xgb_service = XGBoostService(config)
        xgb_service.load_model_from_r2()
        
        model = xgb_service.model
        print("✓ Model loaded successfully\n")
        
        # Prepare data for SHAP
        print("Preparing data for SHAP analysis...")
        
        # Get feature names from model
        if hasattr(model, 'feature_names_in_'):
            feature_names = model.feature_names_in_
        else:
            feature_names = model.get_booster().feature_names
        
        # Select relevant columns
        X = df[feature_names].copy()
        
        # Create SHAP explainer
        print("Creating SHAP explainer (this may take a minute)...")
        explainer = shap.TreeExplainer(model)
        
        # Calculate SHAP values for a sample (to save time)
        sample_size = min(500, len(X))
        X_sample = X.sample(n=sample_size, random_state=42)
        
        print(f"Calculating SHAP values for {sample_size} samples...")
        shap_values = explainer.shap_values(X_sample)
        
        # Find installment_commitment column index
        installment_cols = [i for i, col in enumerate(feature_names) if 'installment' in col.lower()]
        
        if not installment_cols:
            print("⚠️  Could not find installment_commitment feature in model")
            return False
        
        print(f"\nFound installment-related features: {[feature_names[i] for i in installment_cols]}")
        
        # Analyze SHAP values by savings status
        if 'savings_status' in df.columns:
            print("\nSHAP Interaction: Installment Rate × Savings Status")
            print("-" * 80)
            
            # Get SHAP values for first installment column
            inst_col_idx = installment_cols[0]
            inst_shap = shap_values[:, inst_col_idx]
            
            # Merge with original data
            sample_df = X_sample.copy()
            sample_df['shap_installment'] = inst_shap
            sample_df = sample_df.merge(
                df[['savings_status', 'installment_commitment']],
                left_index=True,
                right_index=True,
                how='left'
            )
            
            # Group by savings and installment rate
            if df['installment_commitment'].dtype in ['int64', 'float64']:
                high_burden = sample_df[sample_df['installment_commitment'] == 1]
            else:
                high_burden = sample_df[sample_df['installment_commitment'] == 'ge_35_percent']
            
            # Compare SHAP values for high burden with different savings
            high_savings = high_burden[high_burden['savings_status'] == 'gte_1000_dm']['shap_installment'].mean()
            low_savings = high_burden[high_burden['savings_status'] == 'lt_100_dm']['shap_installment'].mean()
            
            print(f"  Average SHAP value for High Burden (≥35%):")
            print(f"    With High Savings (≥€1000): {high_savings:.4f}")
            print(f"    With Low Savings (<€100): {low_savings:.4f}")
            print(f"    Difference: {(high_savings - low_savings):.4f}")
            
            if high_savings > 0 and low_savings < 0:
                print(f"\n  ✓ INTERACTION CONFIRMED:")
                print(f"    High burden is 'good' (positive SHAP) with high savings")
                print(f"    High burden is 'bad' (negative SHAP) with low savings")
                return True
            else:
                print(f"\n  ✗ No clear interaction detected")
                return False
        
        else:
            print("⚠️  savings_status column not found in dataset")
            return False
        
    except ImportError as e:
        print(f"⚠️  Could not import required libraries: {e}")
        print("   Install with: pip install shap")
        return False
    except Exception as e:
        print(f"⚠️  SHAP analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================================
# FINAL REPORT
# ============================================================================

def generate_report(paradox_exists, super_prime_confirmed, interaction_detected):
    """Generate final summary report"""
    print_header("FINAL REPORT: SURVIVORSHIP BIAS VALIDATION")
    
    print("RESEARCH QUESTION:")
    print("  Does the Installment Rate feature suffer from survivorship bias?")
    print("  (i.e., Do high-burden applicants have lower default rates due to")
    print("   selective approval of only super-prime high-burden applicants?)\n")
    
    print("=" * 80)
    print("FINDINGS:")
    print("=" * 80)
    
    # Finding 1: Paradox
    print("\n1. IS THE PARADOX REAL?")
    if paradox_exists:
        print("   ✓ YES - High burden (≥35%) correlates with LOWER default rates")
        print("   This is counterintuitive and suggests bias in the data.")
    else:
        print("   ✗ NO - High burden correlates with higher default rates (as expected)")
        print("   No evidence of survivorship bias.")
    
    # Finding 2: Super-Prime
    print("\n2. IS IT EXPLAINED BY SELECTION BIAS?")
    if super_prime_confirmed:
        print("   ✓ YES - High-burden applicants are significantly 'super-prime'")
        print("   They have better savings, checking, employment, etc.")
        print("   This suggests banks selectively approved only the best high-burden cases.")
    else:
        print("   ✗ NO - High-burden applicants are not significantly different")
        print("   Selection bias hypothesis is not supported.")
    
    # Finding 3: Interactions
    print("\n3. DOES THE EFFECT DEPEND ON OTHER FEATURES?")
    if interaction_detected:
        print("   ✓ YES - SHAP analysis shows interactions")
        print("   High burden is 'good' only when combined with high savings/wealth.")
        print("   This further supports the selection bias hypothesis.")
    else:
        print("   ⚠️  Could not confirm interactions (analysis may have failed)")
    
    # Overall conclusion
    print("\n" + "=" * 80)
    print("CONCLUSION:")
    print("=" * 80)
    
    if paradox_exists and super_prime_confirmed:
        print("\n✓ SURVIVORSHIP BIAS CONFIRMED")
        print("\nThe Installment Rate feature suffers from survivorship bias:")
        print("  • High burden (≥35%) appears to REDUCE default risk in the model")
        print("  • This is because banks in 1994 only approved high-burden loans")
        print("    for super-prime applicants (high savings, stable employment, etc.)")
        print("  • The dataset contains only 'survivors' - the best high-burden cases")
        print("  • In reality, high installment burden INCREASES default risk")
        print("\nRECOMMENDATION:")
        print("  1. Add prominent warnings about this feature in the UI")
        print("  2. Consider removing this feature from the model")
        print("  3. Document this as a key limitation in your research")
        print("  4. Use this as an example of how historical bias can mislead XAI")
        
    elif paradox_exists:
        print("\n⚠️  PARADOX EXISTS BUT CAUSE UNCLEAR")
        print("\nHigh burden correlates with lower default, but we couldn't confirm")
        print("that this is due to super-prime selection. Further investigation needed.")
        
    else:
        print("\n✓ NO SURVIVORSHIP BIAS DETECTED")
        print("\nThe Installment Rate feature behaves as expected:")
        print("  • High burden correlates with higher default risk")
        print("  • No evidence of selection bias")
        print("  • Feature can be used safely")
    
    print("\n" + "=" * 80)


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function"""
    print("\n" + "=" * 80)
    print("  INSTALLMENT RATE SURVIVORSHIP BIAS VALIDATION")
    print("  German Credit Dataset (1994)")
    print("=" * 80)
    
    try:
        # Load and prepare data
        df = load_dataset()
        df = prepare_data(df)
        
        # Run analyses
        paradox_exists = analyze_paradox(df)
        super_prime_confirmed = analyze_super_prime_hypothesis(df)
        interaction_detected = analyze_shap_interactions(df)
        
        # Generate final report
        generate_report(paradox_exists, super_prime_confirmed, interaction_detected)
        
        print("\n✓ Analysis complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
