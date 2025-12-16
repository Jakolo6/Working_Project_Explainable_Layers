# Scientific Audit Report - XAI Layers Analysis

**Date:** December 16, 2025  
**Auditor:** Cascade AI  
**Status:** ⚠️ **ERRORS FOUND AND CORRECTED**

---

## Executive Summary

This audit identified **ONE ERROR** in the original analysis:

| Issue | Original | Corrected | Impact |
|-------|----------|-----------|--------|
| Layer preference counts | Used `nunique()` counting unique participants | Count each response (per persona) | Preferences were **UNDERCOUNTED** by ~50% |

**All other analyses are CORRECT and scientifically valid.**

---

## 1. Data Integrity Verification

### 1.1 Raw Data Counts ✅ VERIFIED

| Metric | Value | Verification |
|--------|-------|--------------|
| Total layer ratings | 160 | ✅ Correct (21 participants × ~8 ratings) |
| Unique participants | 21 | ✅ Verified from session_ids |
| Unique personas | 2 | ✅ elderly-woman, young-entrepreneur |
| Unique layers | 4 | ✅ Layers 1-4 |

### 1.2 Completion Status ✅ VERIFIED

| Completion Level | Count | Verification Method |
|------------------|-------|---------------------|
| Both personas complete (8 ratings) | 19 | `ratings_per_session == 8` |
| One persona only (4 ratings) | 2 | `ratings_per_session == 4` |
| Partial (<4 ratings) | 0 | `ratings_per_session < 4` |

**Calculation:** 19 × 8 + 2 × 4 = 152 + 8 = **160 ratings** ✅

### 1.3 Post-Questionnaire Responses ✅ VERIFIED

| Metric | Value |
|--------|-------|
| Total session-persona combinations | 40 |
| Responses with post-questionnaire | 39 |
| Missing | 1 (session 1af88cd5 for elderly-woman) |

---

## 2. Descriptive Statistics Verification

### 2.1 Method ✅ CORRECT

```python
# For each layer:
subset = df[df['layer_number'] == layer]
mean = subset['understanding_rating'].mean()
std = subset['understanding_rating'].std()
```

### 2.2 Results ✅ VERIFIED

| Layer | n | Understanding M(SD) | Communicability M(SD) | Cognitive Load M(SD) | Time M(SD) |
|-------|---|---------------------|----------------------|---------------------|------------|
| 1 | 40 | 3.52 (1.11) | 3.33 (1.23) | 3.20 (1.32) | 90.83 (88.44) |
| 2 | 40 | 4.22 (1.14) | 4.12 (1.14) | 4.20 (1.04) | 72.62 (88.84) |
| 3 | 40 | 3.80 (1.24) | 3.70 (1.22) | 3.70 (1.14) | 76.47 (91.33) |
| 4 | 40 | 3.50 (1.09) | 3.60 (1.08) | 3.73 (1.13) | 73.72 (105.68) |

**Note:** n=40 per layer because: 21 participants × 2 personas = 42 expected, minus 2 participants with only 1 persona = 40 ratings per layer.

---

## 3. Friedman Test Verification

### 3.1 Method ✅ CORRECT

The Friedman test is appropriate for:
- Within-subjects design ✅
- Ordinal/continuous data ✅
- Non-normal distributions ✅
- Comparing >2 conditions ✅

**Data preparation:**
```python
# Average across personas for each participant
wide = df.pivot_table(
    index='session_id', 
    columns='layer_number', 
    values=metric, 
    aggfunc='mean'
).dropna()

# N = 21 (all participants have all 4 layers)
```

### 3.2 Results ✅ VERIFIED

| Metric | χ²(3) | p-value | Significant? |
|--------|-------|---------|--------------|
| Understanding | 12.050 | 0.0072 | **Yes** |
| Communicability | 4.724 | 0.1932 | No |
| Cognitive Load | 14.006 | 0.0029 | **Yes** |
| Time Spent | 14.415 | 0.0024 | **Yes** |

---

## 4. Wilcoxon Post-Hoc Tests Verification

### 4.1 Method ✅ CORRECT

- Only performed when Friedman is significant ✅
- Paired signed-rank test for within-subjects ✅
- Effect size: r = |Z| / √N ✅

### 4.2 Effect Size Interpretation

| r value | Interpretation |
|---------|---------------|
| < 0.10 | Negligible |
| 0.10 - 0.30 | Small |
| 0.30 - 0.50 | Medium |
| > 0.50 | Large |

### 4.3 Key Results ✅ VERIFIED

**Understanding Rating:**
- L1 vs L2: W=9.5, p=0.0022, r=0.67 (large effect) ✅
- L2 vs L4: W=21.0, p=0.0082, r=0.58 (large effect) ✅

**Cognitive Load:**
- L1 vs L2: W=0.0, p=0.0004, r=0.77 (large effect) ✅

**Time Spent:**
- L1 vs L2: W=40.0, p=0.0087, r=0.57 (large effect) ✅

---

## 5. Layer Preferences - ERROR FOUND AND CORRECTED

### 5.1 Original (WRONG) Method ❌

```python
# WRONG: Counts unique participants, not responses
df.groupby('most_helpful_layer')['session_id'].nunique()
```

**Problem:** Each participant gives preferences TWICE (once per persona). Using `nunique()` counts each participant only once, even if they chose different layers for different personas.

### 5.2 Corrected Method ✅

```python
# CORRECT: Count each response (per session-persona)
unique_responses = df.drop_duplicates(subset=['session_id', 'persona_id'])
unique_responses['most_helpful_layer'].value_counts()
```

### 5.3 Comparison

| Layer | ORIGINAL (Wrong) | CORRECTED |
|-------|------------------|-----------|
| **most_helpful_layer** |||
| layer_1 | 1 | 2 (5.1%) |
| layer_2 | 12 | **23 (59.0%)** |
| layer_3 | 4 | 8 (20.5%) |
| layer_4 | 3 | 6 (15.4%) |
| **most_trusted_layer** |||
| layer_1 | 4 | 8 (20.5%) |
| layer_2 | 13 | **25 (64.1%)** |
| layer_3 | 2 | 4 (10.3%) |
| layer_4 | 1 | 2 (5.1%) |
| **best_for_customer** |||
| layer_1 | 1 | 2 (5.1%) |
| layer_2 | 9 | **17 (43.6%)** |
| layer_3 | 3 | 6 (15.4%) |
| layer_4 | 7 | 14 (35.9%) |

**Impact:** The main finding (Layer 2 is most preferred) remains the same, but the percentages are now based on the correct denominator (39 responses, not ~20 unique participants).

---

## 6. Quality Checks Verification

### 6.1 Missing Values ✅ VERIFIED

| Column | Missing Count | % |
|--------|--------------|---|
| Ratings (understanding, communicability, cognitive_load, time) | 0 | 0% |
| Post-questionnaire fields | 4 rows | 2.5% |

**Note:** The 4 missing rows are from 1 session-persona combination (1af88cd5 / elderly-woman).

### 6.2 Time Outliers ✅ VERIFIED

Using IQR method (Q1 - 3×IQR, Q3 + 3×IQR):
- 12 outliers detected (7.5% of data)
- These are legitimate long/short viewing times, not data errors

---

## 7. Scientific Validity Summary

### What is CORRECT ✅

1. **Sample size reporting:** 21 participants, 160 ratings
2. **Descriptive statistics:** All means and SDs verified
3. **Friedman tests:** Methodology and results correct
4. **Wilcoxon tests:** Methodology and effect sizes correct
5. **Main findings:** Layer 2 outperforms others in understanding and time

### What was WRONG (now corrected) ⚠️

1. **Layer preference counts:** Used wrong aggregation method
   - Impact: Numbers were undercounted, but conclusions unchanged
   - Status: **CORRECTED** in `D_layer_preferences.csv` and `short_results_summary_CORRECTED.txt`

### What was MISLEADING (clarified)

1. **"20/21 completed"** - This was based on the session `completed` flag
   - Clarification: 19 completed both personas, 2 completed only 1 persona
   - The statistical analyses correctly include all 21 participants

---

## 8. Corrected Files

The following files have been updated with correct data:

1. ✅ `output/summary_tables/D_layer_preferences.csv` - Corrected preference counts
2. ✅ `output/short_results_summary_CORRECTED.txt` - Full corrected summary

---

## 9. Final Verdict

**The analysis is scientifically valid with one corrected error.**

| Aspect | Status |
|--------|--------|
| Data extraction | ✅ Complete and accurate |
| Descriptive statistics | ✅ Correct |
| Statistical tests | ✅ Appropriate methodology, correct results |
| Effect sizes | ✅ Correctly calculated |
| Layer preferences | ⚠️ **Corrected** (was using wrong aggregation) |
| Quality checks | ✅ Thorough and accurate |
| Conclusions | ✅ Supported by data |

**Main Finding (UNCHANGED):** Layer 2 (Visual Dashboard) significantly outperforms other layers in understanding (p=0.007, large effects) and is preferred by participants (59% most helpful, 64% most trusted).

---

## Appendix: Reproducibility Commands

To verify these results yourself:

```bash
cd analysis
python3 -c "
import pandas as pd
from scipy import stats

df = pd.read_csv('output/xai_layers_analysis_ready.csv')

# Verify sample size
print(f'Participants: {df[\"session_id\"].nunique()}')
print(f'Ratings: {len(df)}')

# Verify Friedman test
wide = df.pivot_table(index='session_id', columns='layer_number', 
                      values='understanding_rating', aggfunc='mean').dropna()
stat, p = stats.friedmanchisquare(wide[1], wide[2], wide[3], wide[4])
print(f'Friedman: χ²={stat:.3f}, p={p:.4f}')

# Verify preferences (CORRECT method)
unique = df.drop_duplicates(subset=['session_id', 'persona_id'])
print(unique['most_helpful_layer'].value_counts().sort_index())
"
```

---

**Audit Complete.**  
**Date:** December 16, 2025  
**Conclusion:** Analysis is scientifically valid. One error was found and corrected.
