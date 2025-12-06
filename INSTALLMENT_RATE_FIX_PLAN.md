# 🔧 Installment Rate Encoding Fix - Complete Repair Plan

## Executive Summary

**Problem:** The `installment_commitment` feature encoding is **reversed** throughout the entire codebase.

**Current (WRONG):**
- 1 = ≥35% (highest burden)
- 2 = 25-35%
- 3 = 20-25%
- 4 = <20% (lowest burden)

**Actual Data:**
- 1 = <20% (LOWEST burden) → 25.0% default
- 2 = 20-25% → 26.8% default
- 3 = 25-35% → 28.7% default
- 4 = ≥35% (HIGHEST burden) → 33.4% default

**Impact:** 
- ✅ Model predictions are CORRECT (trained with consistent wrong mapping)
- ❌ SHAP explanations are MISLEADING (labels are backwards)
- ❌ UI displays are WRONG (showing opposite burden levels)
- ❌ Feature descriptions are INCORRECT

**Solution:** Fix encoding everywhere, retrain model with correct mapping, redeploy.

---

## 📋 Complete Fix Checklist

### Phase 1: Backend Core Services (CRITICAL)

#### ✅ **1.1 Feature Engineering (Shared Module)**
**File:** `backend/app/services/feature_engineering.py`

**Current:**
```python
INSTALLMENT_RATE_MAP = {
    1: 'ge_35_percent',      # ≥35% (highest burden)
    2: '25_to_35_percent',   # 25-35%
    3: '20_to_25_percent',   # 20-25%
    4: 'lt_20_percent'       # <20% (lowest burden)
}
```

**Fix to:**
```python
INSTALLMENT_RATE_MAP = {
    1: 'lt_20_percent',      # <20% (LOWEST burden)
    2: '20_to_25_percent',   # 20-25%
    3: '25_to_35_percent',   # 25-35%
    4: 'ge_35_percent'       # ≥35% (HIGHEST burden)
}
```

**Impact:** This is the MASTER definition - all other services import from here.

---

#### ✅ **1.2 XGBoost Service**
**File:** `backend/app/services/xgboost_service.py`

**Lines to fix:**
- Line 35-40: `INSTALLMENT_RATE_MAP` definition
- Line 273-277: Value labels in `VALUE_LABELS` dict

**Current:**
```python
self.INSTALLMENT_RATE_MAP = {
    1: 'ge_35_percent',      # ≥35% (highest burden)
    2: '25_to_35_percent',   # 25-35%
    3: '20_to_25_percent',   # 20-25%
    4: 'lt_20_percent'       # <20% (lowest burden)
}
```

**Fix to:**
```python
self.INSTALLMENT_RATE_MAP = {
    1: 'lt_20_percent',      # <20% (LOWEST burden)
    2: '20_to_25_percent',   # 20-25%
    3: '25_to_35_percent',   # 25-35%
    4: 'ge_35_percent'       # ≥35% (HIGHEST burden)
}
```

**Also fix VALUE_LABELS:**
```python
'installment_commitment': {
    'lt_20_percent': '<20% (Low Burden)',
    '20_to_25_percent': '20-25% (Moderate)',
    '25_to_35_percent': '25-35% (Moderate-High)',
    'ge_35_percent': '≥35% (High Burden)'
}
```

---

#### ✅ **1.3 Logistic Service**
**File:** `backend/app/services/logistic_service.py`

**Lines to fix:**
- Line 33-38: `INSTALLMENT_RATE_MAP` definition

**Same fix as XGBoost Service**

---

#### ✅ **1.4 Model Training Service**
**File:** `backend/app/services/model_training_service.py`

**Lines to fix:**
- Line 73-77: `INSTALLMENT_RATE_MAP` definition
- Line 56: `CATEGORICAL_VALUES` order (already correct!)

**Note:** The `CATEGORICAL_VALUES` on line 56 is ALREADY CORRECT:
```python
'installment_commitment': ['lt_20_percent', '20_to_25_percent', '25_to_35_percent', 'ge_35_percent']
```

This is the **risk-ordered** list (low → high risk), which is correct!

---

#### ✅ **1.5 Notebook Preprocessing**
**File:** `backend/app/services/notebook_preprocessing.py`

**Lines to fix:**
- Line 50: Imports `INSTALLMENT_RATE_MAP` from feature_engineering (will auto-fix)
- Line 129-132: `RISK_ORDERED_CATEGORIES` (already correct!)

**Note:** The risk-ordered categories are ALREADY CORRECT:
```python
'installment_commitment': [
    'lt_20_percent',      # Best: <20% burden (lowest risk)
    '20_to_25_percent',   # 20-25% burden
    '25_to_35_percent',   # 25-35% burden
    'ge_35_percent'       # Worst: ≥35% burden (highest risk)
]
```

---

### Phase 2: Frontend (UI Display)

#### ✅ **2.1 Feature Descriptions**
**File:** `frontend/lib/featureDescriptions.ts`

**Lines to fix:**
- Line 94: Description text
- Line 96-99: Value labels

**Current:**
```typescript
description: 'Percentage of disposable income dedicated to loan payments. Categories: 1 (≥35%, high burden), 2 (25-35%), 3 (20-25%), 4 (<20%, low burden). Lower percentages indicate more comfortable repayment capacity and reduced risk of default.',
values: {
  'ge_35_percent': '≥35% – High burden, stretching budget',
  '25_to_35_percent': '25-35% – Moderate-high burden',
  '20_to_25_percent': '20-25% – Moderate burden',
  'lt_20_percent': '<20% – Low burden, comfortable'
}
```

**Fix to:**
```typescript
description: 'Percentage of disposable income dedicated to loan payments. Categories: 1 (<20%, low burden), 2 (20-25%), 3 (25-35%), 4 (≥35%, high burden). Higher percentages indicate tighter budget and increased risk of default.',
values: {
  'lt_20_percent': '<20% – Low burden, comfortable',
  '20_to_25_percent': '20-25% – Moderate burden',
  '25_to_35_percent': '25-35% – Moderate-high burden',
  'ge_35_percent': '≥35% – High burden, stretching budget'
}
```

---

### Phase 3: Scripts & Validation

#### ✅ **3.1 Bias Validation Script**
**File:** `backend/scripts/validate_installment_bias.py`

**Lines to fix:**
- Line 31-36: `INSTALLMENT_RATE_MAP`
- Line 38-42: `INSTALLMENT_RATE_LABELS`
- Line 8-9: Update hypothesis comment

**Current hypothesis is now INVALID:**
```python
# Hypothesis: High burden (Rate 4 / ge_35_percent) correlates with lower default 
# rates because banks in 1994 only approved high-burden loans for "Super-Prime" applicants.
```

**Fix to:**
```python
# Hypothesis: ENCODING VALIDATION - Determine if installment_commitment encoding
# is correct (1=low burden or 1=high burden) and check for survivorship bias.
```

**Fix INSTALLMENT_RATE_MAP:**
```python
INSTALLMENT_RATE_MAP = {
    1: 'lt_20_percent',      # <20% - Lowest burden
    2: '20_to_25_percent',   # 20-25%
    3: '25_to_35_percent',   # 25-35%
    4: 'ge_35_percent'       # ≥35% - Highest burden
}

INSTALLMENT_RATE_LABELS = {
    1: '<20% (Lowest Burden)',
    2: '20-25% (Moderate Burden)',
    3: '25-35% (Moderate-High Burden)',
    4: '≥35% (Highest Burden)'
}
```

---

#### ✅ **3.2 Standalone Validation Script**
**File:** `validate_bias_standalone.py`

**Already correct!** This script discovered the issue.

**Action:** Keep as reference, or delete after fix is complete.

---

### Phase 4: Model Retraining (CRITICAL!)

#### ✅ **4.1 Delete Old Models**

**Models to delete from R2:**
- `models/xgboost_model.pkl`
- `models/logistic_model.pkl`

**Why:** These were trained with the WRONG encoding. Must retrain.

---

#### ✅ **4.2 Retrain XGBoost Model**

**Command:**
```bash
cd backend
python -m app.services.model_training_service
```

**Or use the training endpoint:**
```bash
curl -X POST http://localhost:8000/api/v1/admin/train-model \
  -H "Content-Type: application/json" \
  -d '{"model_type": "xgboost"}'
```

**Expected output:**
- New model trained with CORRECT encoding
- Uploaded to R2: `models/xgboost_model.pkl`
- Training metrics logged

---

#### ✅ **4.3 Retrain Logistic Model**

**Command:**
```bash
curl -X POST http://localhost:8000/api/v1/admin/train-model \
  -H "Content-Type: application/json" \
  -d '{"model_type": "logistic"}'
```

---

### Phase 5: Data Validation

#### ✅ **5.1 Verify Dataset**

**Check that dataset has correct encoding:**
```bash
python -c "
import pandas as pd
df = pd.read_csv('data/german_credit_clean.csv')
print('Installment commitment values:', sorted(df['installment_commitment'].unique()))
print('Value counts:')
print(df['installment_commitment'].value_counts().sort_index())
"
```

**Expected:** Values 1, 2, 3, 4 (numeric)

---

#### ✅ **5.2 Run Validation Script**

**After fixing all code:**
```bash
python validate_bias_standalone.py
```

**Expected output:**
```
CONCLUSION: Encoding A is correct
  1 = <20% (lowest burden)
  2 = 20-25%
  3 = 25-35%
  4 = ≥35% (highest burden)

✓ Higher numbers → Higher burden → Higher default (as expected)

Survivorship Bias: NO - Not detected
```

---

### Phase 6: Testing & Verification

#### ✅ **6.1 Backend API Tests**

**Test prediction with known values:**
```bash
curl -X POST http://localhost:8000/api/v1/experiment/predict_persona \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "persona_id": "test",
    "application_data": {
      "installment_commitment": "ge_35_percent",
      "duration": 48,
      "credit_amount": 15000,
      ...
    }
  }'
```

**Check SHAP values:**
- `ge_35_percent` (high burden) should have POSITIVE SHAP (increases risk)
- `lt_20_percent` (low burden) should have NEGATIVE SHAP (decreases risk)

---

#### ✅ **6.2 Frontend UI Tests**

**Test Layer 2 (Dashboard):**
1. Go to any persona
2. Navigate to Layer 2 (Dashboard)
3. Find "Installment Rate" feature
4. **Verify labels:**
   - If value is `ge_35_percent` → Should show "≥35% (High Burden)"
   - If value is `lt_20_percent` → Should show "<20% (Low Burden)"

**Test Layer 4 (Solution Finder):**
1. Navigate to Layer 4
2. Adjust installment rate slider
3. **Verify:**
   - Higher burden → Higher probability of rejection
   - Lower burden → Lower probability of rejection

---

#### ✅ **6.3 SHAP Explanation Tests**

**Verify SHAP direction:**
```python
# In Python console
from app.services.xgboost_service import XGBoostService
from app.config import get_settings

config = get_settings()
xgb = XGBoostService(config)
xgb.load_model_from_r2()

# Test high burden
high_burden_app = {
    'installment_commitment': 'ge_35_percent',  # High burden
    'duration': 24,
    'credit_amount': 5000,
    # ... other features
}

explanation = xgb.explain_prediction(high_burden_app)
print("High burden SHAP:", explanation['top_features'])
# Should show POSITIVE SHAP for installment_commitment (increases risk)

# Test low burden
low_burden_app = {
    'installment_commitment': 'lt_20_percent',  # Low burden
    'duration': 24,
    'credit_amount': 5000,
    # ... other features
}

explanation = xgb.explain_prediction(low_burden_app)
print("Low burden SHAP:", explanation['top_features'])
# Should show NEGATIVE SHAP for installment_commitment (decreases risk)
```

---

### Phase 7: Deployment

#### ✅ **7.1 Backend Deployment**

**Railway (Auto-deploys from GitHub):**
1. Push all fixes to GitHub
2. Railway auto-deploys
3. Wait ~3-5 minutes
4. Verify health: `https://your-backend.railway.app/api/v1/experiment/health`

**Manual verification:**
```bash
curl https://your-backend.railway.app/api/v1/experiment/health
```

Expected:
```json
{
  "status": "healthy",
  "xgboost_loaded": true,
  "logistic_loaded": true
}
```

---

#### ✅ **7.2 Frontend Deployment**

**Vercel (Auto-deploys from GitHub):**
1. Push all fixes to GitHub
2. Vercel auto-deploys
3. Wait ~2-3 minutes
4. Test on production URL

---

### Phase 8: Data Migration (If Needed)

#### ⚠️ **8.1 Check Existing Predictions**

**If you have existing predictions in Supabase with wrong encoding:**

```sql
-- Check if any predictions exist
SELECT COUNT(*) FROM predictions;

-- If > 0, you may need to migrate
```

**Options:**
1. **Delete all predictions** (if study hasn't started)
2. **Keep predictions** (they're still valid, just labels are wrong)
3. **Migrate SHAP values** (complex, probably not worth it)

**Recommendation:** If study hasn't started, DELETE all predictions and start fresh.

```sql
-- DANGER: This deletes all predictions!
DELETE FROM predictions;
DELETE FROM layer_ratings;
DELETE FROM post_questionnaires;
DELETE FROM sessions;
```

---

## 🚀 One-Button Fix Script

Create this script to automate the entire fix:

**File:** `fix_installment_encoding.sh`

```bash
#!/bin/bash

echo "🔧 INSTALLMENT RATE ENCODING FIX"
echo "================================"
echo ""

# Step 1: Backup
echo "Step 1: Creating backup..."
git add -A
git commit -m "backup: Before installment rate encoding fix"
echo "✓ Backup created"
echo ""

# Step 2: Apply fixes (you'll need to run the multi_edit commands)
echo "Step 2: Applying code fixes..."
echo "⚠️  Run the code fixes manually (see INSTALLMENT_RATE_FIX_PLAN.md)"
echo ""

# Step 3: Delete old models from R2
echo "Step 3: Deleting old models from R2..."
# This requires R2 CLI or manual deletion
echo "⚠️  Manually delete models/xgboost_model.pkl from R2"
echo "⚠️  Manually delete models/logistic_model.pkl from R2"
echo ""

# Step 4: Retrain models
echo "Step 4: Retraining XGBoost model..."
cd backend
python -m app.services.model_training_service
echo "✓ XGBoost model retrained"
echo ""

# Step 5: Validate
echo "Step 5: Running validation..."
cd ..
python validate_bias_standalone.py
echo "✓ Validation complete"
echo ""

# Step 6: Commit and push
echo "Step 6: Committing fixes..."
git add -A
git commit -m "fix: Correct installment_commitment encoding (1=low, 4=high)"
git push origin main
echo "✓ Pushed to GitHub"
echo ""

echo "🎉 FIX COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Wait for Railway/Vercel to deploy (~5 min)"
echo "2. Test predictions on production"
echo "3. Verify SHAP explanations are correct"
echo "4. Clear Supabase data if needed (see Phase 8)"
```

---

## 📊 Verification Checklist

After completing all fixes:

- [ ] **Code fixes applied** to all 6 backend files
- [ ] **Frontend description** updated
- [ ] **Old models deleted** from R2
- [ ] **New models trained** with correct encoding
- [ ] **Validation script** passes (no paradox detected)
- [ ] **Backend deployed** to Railway
- [ ] **Frontend deployed** to Vercel
- [ ] **API health check** passes
- [ ] **SHAP values** show correct direction (high burden → positive SHAP)
- [ ] **UI labels** display correctly
- [ ] **Solution Finder** behaves correctly (high burden → higher rejection)
- [ ] **Supabase data** cleared (if needed)

---

## 🎯 Expected Outcomes

### Before Fix:
- ❌ High burden (≥35%) labeled as "low burden"
- ❌ Low burden (<20%) labeled as "high burden"
- ❌ SHAP explanations backwards
- ❌ UI misleading users

### After Fix:
- ✅ High burden (≥35%) correctly labeled
- ✅ Low burden (<20%) correctly labeled
- ✅ SHAP explanations accurate
- ✅ UI displays correct information
- ✅ No survivorship bias detected
- ✅ Feature behaves as expected (high burden → high risk)

---

## 📝 Summary

**Total files to fix:** 7
- 5 backend Python files
- 1 frontend TypeScript file
- 1 validation script

**Critical actions:**
1. Fix `INSTALLMENT_RATE_MAP` in all files
2. Delete old models from R2
3. Retrain both models
4. Deploy to production
5. Verify SHAP explanations

**Time estimate:** 30-45 minutes

**Risk level:** Medium (requires model retraining)

**Rollback plan:** Git revert + restore old models from R2 backup

---

**Ready to proceed? I can start applying the fixes now!**
