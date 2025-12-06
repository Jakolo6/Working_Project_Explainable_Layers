# ✅ READY TO RETRAIN - Final Instructions

## Status: Code Fixes Complete ✓

All code fixes have been applied and committed. Your project is now ready for model retraining.

---

## 🎯 What Was Fixed

### **Problem**
The `installment_commitment` feature encoding was **reversed** throughout the entire codebase:
- **Code said:** 1 = ≥35% (high burden), 4 = <20% (low burden)
- **Actual data:** 1 = <20% (LOW burden), 4 = ≥35% (HIGH burden)

This caused SHAP explanations to be backwards and misleading.

### **Solution**
Fixed encoding in **7 files**:
- ✅ `backend/app/services/feature_engineering.py`
- ✅ `backend/app/services/xgboost_service.py`
- ✅ `backend/app/services/logistic_service.py`
- ✅ `backend/app/services/model_training_service.py`
- ✅ `backend/app/services/notebook_preprocessing.py`
- ✅ `frontend/lib/featureDescriptions.ts`
- ✅ `backend/scripts/validate_installment_bias.py`

### **Validation**
Ran `validate_bias_standalone.py`:
- ✅ Confirmed correct encoding (1=low, 4=high)
- ✅ Expected pattern: Higher burden → Higher default (33.4% vs 25.0%)
- ✅ No survivorship bias detected

---

## 🚀 ONE-BUTTON RETRAINING

### **Step 1: Run the Retrain Script**

```bash
./retrain_models.sh
```

This script will:
1. ✅ Validate current encoding
2. ⚠️  Prompt you to delete old models from R2 (manual step)
3. ✅ Retrain XGBoost model with correct encoding
4. ✅ Upload new model to R2
5. ✅ Verify SHAP explanations are correct

### **Step 2: Manual R2 Cleanup (Required)**

When prompted by the script:

1. Go to **Cloudflare R2 Dashboard**
2. Navigate to your bucket
3. **Delete these files:**
   - `models/xgboost_model.pkl`
   - `models/logistic_model.pkl`
4. Press ENTER to continue

**Why?** Old models were trained with wrong encoding. Must retrain fresh.

### **Step 3: Push to GitHub**

```bash
git push origin main
```

This will:
- ✅ Trigger Railway auto-deploy (backend, ~3-5 min)
- ✅ Trigger Vercel auto-deploy (frontend, ~2-3 min)

---

## 🧪 Verification Checklist

After retraining and deployment:

### **Backend Verification**
```bash
# Check health
curl https://your-backend.railway.app/api/v1/experiment/health

# Should return:
# {
#   "status": "healthy",
#   "xgboost_loaded": true,
#   "logistic_loaded": true
# }
```

### **SHAP Direction Verification**

The retrain script automatically tests this, but you can verify manually:

**High Burden (≥35%):**
- ✅ Should have **POSITIVE** SHAP value (increases risk)
- ✅ Should increase probability of rejection

**Low Burden (<20%):**
- ✅ Should have **NEGATIVE** SHAP value (decreases risk)
- ✅ Should decrease probability of rejection

### **Frontend Verification**

1. Go to any persona (Maria or Jonas)
2. Navigate to **Layer 2 (Dashboard)**
3. Find "Installment Rate" feature
4. **Check labels:**
   - If value is `ge_35_percent` → Should show "≥35% (High Burden)"
   - If value is `lt_20_percent` → Should show "<20% (Low Burden)"
   - SHAP direction should match burden level

5. Navigate to **Layer 4 (Solution Finder)**
6. Adjust installment rate
7. **Verify:**
   - Higher burden → Higher rejection probability
   - Lower burden → Lower rejection probability

---

## 📊 Expected Outcomes

### **Before Fix (WRONG)**
- ❌ High burden labeled as "low burden"
- ❌ Low burden labeled as "high burden"
- ❌ SHAP values backwards
- ❌ UI misleading users

### **After Fix (CORRECT)**
- ✅ High burden correctly labeled
- ✅ Low burden correctly labeled
- ✅ SHAP values accurate
- ✅ UI displays correct information
- ✅ Feature behaves as expected (high burden → high risk)

---

## 🔍 What the Retrain Script Does

### **Automatic Steps:**
1. Validates encoding with `validate_bias_standalone.py`
2. Trains new XGBoost model
3. Uploads to R2
4. Tests predictions with high/low burden
5. Verifies SHAP directions are correct
6. Displays summary

### **Manual Step:**
- Delete old models from R2 (you'll be prompted)

### **Output Example:**
```
Testing high burden (≥35%):
  Decision: rejected
  Confidence: 85.2%
  Installment Rate SHAP: 0.1234
  ✓ CORRECT: High burden increases risk (positive SHAP)

Testing low burden (<20%):
  Decision: approved
  Confidence: 72.1%
  Installment Rate SHAP: -0.0987
  ✓ CORRECT: Low burden decreases risk (negative SHAP)
```

---

## ⚠️ Important Notes

### **Data Migration**
If you have existing predictions in Supabase:
- **Option 1:** Keep them (they're still valid, just labels were wrong)
- **Option 2:** Delete and start fresh (recommended if study hasn't started)

```sql
-- DANGER: Only run if you want to clear all data
DELETE FROM predictions;
DELETE FROM layer_ratings;
DELETE FROM post_questionnaires;
DELETE FROM sessions;
```

### **Rollback Plan**
If something goes wrong:
```bash
git revert HEAD
git push origin main
```

Then restore old models from R2 backup (if you made one).

---

## 📝 Timeline

| Step | Time | Status |
|------|------|--------|
| Code fixes | ✅ Done | Complete |
| Commit & push | ✅ Done | Complete |
| Run retrain script | ⏳ Next | ~5-10 min |
| Railway deploy | ⏳ Auto | ~3-5 min |
| Vercel deploy | ⏳ Auto | ~2-3 min |
| Verification | ⏳ Manual | ~5 min |
| **Total** | | **~15-25 min** |

---

## 🎉 Ready to Go!

Everything is prepared. Just run:

```bash
./retrain_models.sh
```

And follow the prompts!

---

## 📚 Documentation

- **Detailed plan:** `INSTALLMENT_RATE_FIX_PLAN.md`
- **Validation script:** `validate_bias_standalone.py`
- **Bias analysis:** `backend/scripts/validate_installment_bias.py`
- **This guide:** `READY_TO_RETRAIN.md`

---

## 🆘 Troubleshooting

### "Model training failed"
- Check that dataset exists: `data/german_credit_clean.csv`
- Check R2 credentials in `.env`
- Check Python dependencies: `pip install -r backend/requirements.txt`

### "SHAP values still backwards"
- Verify you deleted old models from R2
- Verify new model was uploaded
- Check Railway logs for errors

### "Frontend still shows wrong labels"
- Wait for Vercel deployment to complete
- Hard refresh browser (Cmd+Shift+R)
- Check browser console for errors

---

**Questions? Check `INSTALLMENT_RATE_FIX_PLAN.md` for complete details.**

**Ready when you are! 🚀**
