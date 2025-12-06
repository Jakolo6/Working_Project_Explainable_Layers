# Installment Rate Survivorship Bias Validation

## Overview

This script validates whether the `installment_commitment` (Installment Rate) feature in the German Credit Dataset suffers from **survivorship bias** - similar to the known issue with the `credit_history` feature.

## Hypothesis

**High installment burden (≥35% of income) correlates with LOWER default rates** because banks in 1994 only approved high-burden loans for "super-prime" applicants with excellent credit profiles.

## What the Script Does

### Analysis 1: The Paradox Check
- Calculates default rates for each installment rate category (1-4)
- Tests if high burden (Rate 1 / ≥35%) has lower default than moderate burden (Rate 2-3)
- Uses Chi-square test to confirm statistical significance

**Expected Result (if bias exists):** Rate 1 should have lower default rate than Rate 2-3

### Analysis 2: Super-Prime Hypothesis Check
Compares high-burden (Rate 1) vs moderate-burden (Rate 2) applicants on:
- **Savings Account:** % with ≥€1000 savings
- **Checking Account:** % with ≥€200 balance
- **Employment:** % with ≥7 years employment
- **Loan Amount:** Average loan size
- **Age:** Average age

**Expected Result (if bias exists):** Rate 1 applicants should be significantly "richer" and more stable

### Analysis 3: SHAP Interaction Analysis
- Loads the trained XGBoost model
- Calculates SHAP values for installment_commitment
- Tests if the effect depends on other features (e.g., savings)

**Expected Result (if bias exists):** High burden should be "good" (positive SHAP) only when savings are high

## How to Run

### Option 1: Using the Shell Script (Recommended)

```bash
cd backend/scripts
./run_bias_validation.sh
```

This will:
1. Run the analysis
2. Display results in terminal
3. Save a full report to `bias_validation_report.txt`

### Option 2: Direct Python Execution

```bash
cd backend
python scripts/validate_installment_bias.py
```

### Option 3: Save Output to File

```bash
cd backend
python scripts/validate_installment_bias.py > bias_validation_report.txt 2>&1
```

## Requirements

### Python Packages
```bash
pip install pandas numpy scipy
pip install shap  # Optional, for Analysis 3
```

### Data Requirements
The script will attempt to load the dataset from:
1. **R2 Storage** (if configured): `datasets/german_credit_cleaned.csv`
2. **Local paths** (fallback):
   - `../data/german_credit_cleaned.csv`
   - `../../data/german_credit_cleaned.csv`
   - `data/german_credit_cleaned.csv`

## Expected Output

### If Survivorship Bias is Confirmed:

```
═══════════════════════════════════════════════════════════════════════
FINAL REPORT: SURVIVORSHIP BIAS VALIDATION
═══════════════════════════════════════════════════════════════════════

FINDINGS:

1. IS THE PARADOX REAL?
   ✓ YES - High burden (≥35%) correlates with LOWER default rates
   This is counterintuitive and suggests bias in the data.

2. IS IT EXPLAINED BY SELECTION BIAS?
   ✓ YES - High-burden applicants are significantly 'super-prime'
   They have better savings, checking, employment, etc.
   This suggests banks selectively approved only the best high-burden cases.

3. DOES THE EFFECT DEPEND ON OTHER FEATURES?
   ✓ YES - SHAP analysis shows interactions
   High burden is 'good' only when combined with high savings/wealth.

CONCLUSION:
✓ SURVIVORSHIP BIAS CONFIRMED

The Installment Rate feature suffers from survivorship bias:
  • High burden (≥35%) appears to REDUCE default risk in the model
  • This is because banks in 1994 only approved high-burden loans
    for super-prime applicants (high savings, stable employment, etc.)
  • The dataset contains only 'survivors' - the best high-burden cases
  • In reality, high installment burden INCREASES default risk

RECOMMENDATION:
  1. Add prominent warnings about this feature in the UI
  2. Consider removing this feature from the model
  3. Document this as a key limitation in your research
  4. Use this as an example of how historical bias can mislead XAI
```

## Interpreting Results

### Paradox Confirmed
If Rate 1 (≥35%) has **lower** default rate than Rate 2-3 (20-35%), the paradox exists.

### Super-Prime Evidence
Count how many indicators favor Rate 1:
- **5/5 indicators:** Strong evidence of super-prime selection
- **3-4/5 indicators:** Moderate evidence
- **0-2/5 indicators:** Weak evidence

### SHAP Interactions
If high burden has:
- **Positive SHAP** with high savings → Good signal
- **Negative SHAP** with low savings → Bad signal

This confirms the effect depends on wealth, supporting selection bias.

## Research Implications

### For Your Thesis

This analysis provides evidence for:

1. **Limitation of Historical Datasets**
   - 1994 lending practices created systematic bias
   - Selection effects can reverse expected relationships

2. **XAI is Not Enough**
   - Transparency alone doesn't prevent misleading conclusions
   - Need domain knowledge + data quality assessment
   - SHAP values can be "correct" but misleading

3. **Practical Recommendations**
   - Add warnings for biased features
   - Consider feature exclusion
   - Document data collection process
   - Combine XAI with statistical validation

### Discussion Points

**Research Question:** "Can users detect when AI explanations are misleading due to data bias?"

**Key Insight:** Even with perfect SHAP explanations, users may trust counterintuitive patterns if they're not warned about historical selection bias.

**Mitigation Strategy:** Combine XAI with:
- Statistical bias detection (this script)
- Domain expert review
- Prominent warnings in UI
- User education about data limitations

## Troubleshooting

### "Could not find german_credit_cleaned.csv"
- Ensure the dataset is in one of the expected locations
- Or update the `load_dataset()` function with your path

### "Could not import shap"
- Analysis 3 is optional
- Install with: `pip install shap`
- Or skip SHAP analysis (Analyses 1-2 are sufficient)

### "Model not loaded"
- Ensure XGBoost model is available in R2 storage
- Or Analysis 3 will be skipped (Analyses 1-2 still run)

## Files Created

- `validate_installment_bias.py` - Main analysis script
- `run_bias_validation.sh` - Convenience runner script
- `bias_validation_report.txt` - Output report (after running)

## Next Steps

After confirming bias:

1. **Update Feature Descriptions**
   - Add warning to `featureDescriptions.ts`
   - Similar to existing Credit History warning

2. **Update UI**
   - Add ⚠️ icon next to Installment Rate
   - Show tooltip explaining the bias

3. **Document in Thesis**
   - Include this analysis in limitations section
   - Use as example of XAI + statistical validation

4. **Consider Model Update**
   - Retrain without installment_commitment
   - Or add interaction terms to capture true relationship

## References

- German Credit Dataset: UCI Machine Learning Repository
- Similar bias documented in: Kamiran & Calders (2012) "Data preprocessing techniques for discrimination prevention in data mining"
- Selection bias in credit scoring: Thomas et al. (2017) "Credit Scoring and Its Applications"
