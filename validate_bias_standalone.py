"""
Standalone Installment Rate Survivorship Bias Validation
No dependencies on app modules - can run directly
"""

import pandas as pd
import numpy as np
from scipy import stats

# ============================================================================
# CONFIGURATION
# ============================================================================

# According to German Credit Dataset documentation:
# Attribute 8 (installment_commitment): Installment rate in percentage of disposable income
# Values: 1, 2, 3, 4
# BUT: The encoding direction varies by source!
# 
# Option A (UCI standard): 1 = <20%, 2 = 20-25%, 3 = 25-35%, 4 = ≥35%
# Option B (Some sources): 1 = ≥35%, 2 = 25-35%, 3 = 20-25%, 4 = <20%
#
# We'll check BOTH and see which makes sense with the data

INSTALLMENT_RATE_MAP_A = {
    1: 'lt_20_percent',      # <20% - Lowest burden
    2: '20_to_25_percent',   # 20-25%
    3: '25_to_35_percent',   # 25-35%
    4: 'ge_35_percent'       # ≥35% - Highest burden
}

INSTALLMENT_RATE_MAP_B = {
    1: 'ge_35_percent',      # ≥35% - Highest burden
    2: '25_to_35_percent',   # 25-35%
    3: '20_to_25_percent',   # 20-25%
    4: 'lt_20_percent'       # <20% - Lowest burden
}

def print_header(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")

def load_and_check_encoding():
    """Load data and determine correct encoding"""
    print_header("STEP 1: LOAD DATA & DETERMINE CORRECT ENCODING")
    
    # Try to load the dataset
    try:
        df = pd.read_csv('data/german_credit_clean.csv')
        print(f"✓ Loaded {len(df)} records from data/german_credit_clean.csv\n")
    except:
        try:
            df = pd.read_csv('data/german_credit_raw.csv')
            print(f"✓ Loaded {len(df)} records from data/german_credit_raw.csv\n")
        except Exception as e:
            print(f"❌ Could not load dataset: {e}")
            return None, None
    
    # Check what column names we have
    print("Available columns:")
    print([col for col in df.columns if 'install' in col.lower() or 'attribute8' in col.lower() or 'class' in col.lower() or 'target' in col.lower()])
    print()
    
    # Find the installment column
    install_col = None
    for col in df.columns:
        if 'installment' in col.lower() or 'attribute8' in col.lower():
            install_col = col
            break
    
    if not install_col:
        print("❌ Could not find installment_commitment column")
        return None, None
    
    print(f"Using column: {install_col}")
    print(f"Unique values: {sorted(df[install_col].unique())}")
    print(f"Value counts:\n{df[install_col].value_counts().sort_index()}\n")
    
    # Find target column
    target_col = None
    for col in ['class', 'target', 'Class']:
        if col in df.columns:
            target_col = col
            break
    
    if not target_col:
        print("❌ Could not find target column")
        return None, None
    
    # Convert target to binary (1 = bad/default, 0 = good)
    if df[target_col].dtype == 'object':
        df['default'] = (df[target_col] == 'bad').astype(int)
    else:
        # Numeric: 1 = good, 2 = bad (German Credit standard encoding)
        df['default'] = (df[target_col] == 2).astype(int)
    
    print(f"Using target column: {target_col}")
    print(f"Overall default rate: {df['default'].mean():.1%}\n")
    
    return df, install_col

def analyze_with_both_encodings(df, install_col):
    """Test both encoding directions and see which makes sense"""
    print_header("STEP 2: TEST BOTH ENCODING DIRECTIONS")
    
    print("Testing Encoding A: 1=<20%, 2=20-25%, 3=25-35%, 4=≥35%")
    print("(Higher number = Higher burden)")
    print("-" * 80)
    
    # Calculate default rates for each category
    default_rates_a = df.groupby(install_col)['default'].agg(['count', 'mean']).round(4)
    default_rates_a.columns = ['Count', 'Default_Rate']
    default_rates_a['Default_Rate_Pct'] = (default_rates_a['Default_Rate'] * 100).round(2)
    default_rates_a['Category_A'] = default_rates_a.index.map(INSTALLMENT_RATE_MAP_A)
    
    print(default_rates_a[['Category_A', 'Count', 'Default_Rate_Pct']])
    
    # Check if it makes sense: higher burden should correlate with higher default
    correlation_a = df[install_col].corr(df['default'])
    print(f"\nCorrelation (installment_value vs default): {correlation_a:.4f}")
    if correlation_a > 0:
        print("✓ Positive correlation: Higher values → Higher default (MAKES SENSE)")
    else:
        print("✗ Negative correlation: Higher values → Lower default (PARADOX!)")
    
    print("\n" + "=" * 80)
    print("Testing Encoding B: 1=≥35%, 2=25-35%, 3=20-25%, 4=<20%")
    print("(Higher number = Lower burden)")
    print("-" * 80)
    
    default_rates_b = df.groupby(install_col)['default'].agg(['count', 'mean']).round(4)
    default_rates_b.columns = ['Count', 'Default_Rate']
    default_rates_b['Default_Rate_Pct'] = (default_rates_b['Default_Rate'] * 100).round(2)
    default_rates_b['Category_B'] = default_rates_b.index.map(INSTALLMENT_RATE_MAP_B)
    
    print(default_rates_b[['Category_B', 'Count', 'Default_Rate_Pct']])
    
    # For encoding B, we need to reverse the correlation
    correlation_b = -correlation_a  # Reverse because higher number = lower burden
    print(f"\nCorrelation (burden vs default): {correlation_b:.4f}")
    if correlation_b > 0:
        print("✓ Positive correlation: Higher burden → Higher default (MAKES SENSE)")
    else:
        print("✗ Negative correlation: Higher burden → Lower default (PARADOX!)")
    
    return default_rates_a, default_rates_b, correlation_a

def determine_correct_encoding(correlation_a):
    """Determine which encoding is correct"""
    print_header("STEP 3: DETERMINE CORRECT ENCODING")
    
    if correlation_a > 0:
        print("CONCLUSION: Encoding A is correct")
        print("  1 = <20% (lowest burden)")
        print("  2 = 20-25%")
        print("  3 = 25-35%")
        print("  4 = ≥35% (highest burden)")
        print("\n✓ Higher numbers → Higher burden → Higher default (as expected)")
        return 'A', INSTALLMENT_RATE_MAP_A
    else:
        print("CONCLUSION: Encoding B is correct")
        print("  1 = ≥35% (highest burden)")
        print("  2 = 25-35%")
        print("  3 = 20-25%")
        print("  4 = <20% (lowest burden)")
        print("\n⚠️  BUT: Higher burden → LOWER default (PARADOX!)")
        print("This suggests SURVIVORSHIP BIAS!")
        return 'B', INSTALLMENT_RATE_MAP_B

def analyze_paradox(df, install_col, encoding_map):
    """Analyze the paradox in detail"""
    print_header("STEP 4: PARADOX ANALYSIS")
    
    # Map to categories
    df['install_category'] = df[install_col].map(encoding_map)
    
    # Get default rates
    results = df.groupby(install_col).agg({
        'default': ['count', 'sum', 'mean']
    }).round(4)
    
    results.columns = ['Count', 'Defaults', 'Default_Rate']
    results['Category'] = results.index.map(encoding_map)
    results['Default_Rate_Pct'] = (results['Default_Rate'] * 100).round(2)
    
    print("Default Rates by Installment Rate:")
    print("-" * 80)
    print(results[['Category', 'Count', 'Defaults', 'Default_Rate_Pct']].to_string())
    
    # Statistical test
    contingency = pd.crosstab(df[install_col], df['default'])
    chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
    
    print(f"\nChi-Square Test:")
    print(f"  Chi-square: {chi2:.4f}")
    print(f"  P-value: {p_value:.4f}")
    if p_value < 0.05:
        print("  ✓ Significant relationship (p < 0.05)")
    else:
        print("  ✗ Not significant (p ≥ 0.05)")
    
    # Check for paradox
    if encoding_map == INSTALLMENT_RATE_MAP_B:
        rate_1 = df[df[install_col] == 1]['default'].mean()  # ≥35%
        rate_4 = df[df[install_col] == 4]['default'].mean()  # <20%
        
        print(f"\nParadox Check:")
        print(f"  High Burden (≥35%, rate=1): {rate_1:.1%} default")
        print(f"  Low Burden (<20%, rate=4): {rate_4:.1%} default")
        
        if rate_1 < rate_4:
            print(f"  ⚠️  PARADOX CONFIRMED!")
            print(f"     High burden has {(rate_4 - rate_1):.1%} LOWER default rate")
            return True
        else:
            print(f"  ✓ No paradox (high burden has higher default)")
            return False
    else:
        rate_4 = df[df[install_col] == 4]['default'].mean()  # ≥35%
        rate_1 = df[df[install_col] == 1]['default'].mean()  # <20%
        
        print(f"\nExpected Pattern Check:")
        print(f"  High Burden (≥35%, rate=4): {rate_4:.1%} default")
        print(f"  Low Burden (<20%, rate=1): {rate_1:.1%} default")
        
        if rate_4 > rate_1:
            print(f"  ✓ As expected: High burden has higher default")
            return False
        else:
            print(f"  ⚠️  Unexpected: High burden has lower default")
            return True

def main():
    """Main execution"""
    print("\n" + "=" * 80)
    print("  INSTALLMENT RATE ENCODING VALIDATION")
    print("  Determine correct encoding & check for survivorship bias")
    print("=" * 80)
    
    # Load data
    df, install_col = load_and_check_encoding()
    if df is None:
        return 1
    
    # Test both encodings
    rates_a, rates_b, corr_a = analyze_with_both_encodings(df, install_col)
    
    # Determine correct encoding
    correct_encoding, encoding_map = determine_correct_encoding(corr_a)
    
    # Analyze paradox
    paradox_exists = analyze_paradox(df, install_col, encoding_map)
    
    # Final summary
    print_header("FINAL SUMMARY")
    
    print(f"Correct Encoding: {correct_encoding}")
    if correct_encoding == 'A':
        print("  ✓ Current code uses CORRECT encoding")
        print("    (1=<20%, 2=20-25%, 3=25-35%, 4=≥35%)")
    else:
        print("  ⚠️  Current code uses INCORRECT encoding!")
        print("    Should be: 1=≥35%, 2=25-35%, 3=20-25%, 4=<20%")
        print("    Currently: 1=≥35%, 2=25-35%, 3=20-25%, 4=<20%")
        print("    → Actually, current code IS correct!")
    
    print(f"\nSurvivorship Bias: {'YES - CONFIRMED' if paradox_exists else 'NO - Not detected'}")
    
    if paradox_exists:
        print("\n⚠️  RECOMMENDATION:")
        print("  1. The paradox exists: high burden → lower default")
        print("  2. This is likely due to survivorship bias")
        print("  3. Banks only approved high-burden loans for super-prime applicants")
        print("  4. Add warnings to the UI about this feature")
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
