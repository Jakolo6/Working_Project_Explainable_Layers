# 🎯 ONE-CLICK RETRAINING - Simple Instructions

## ✅ All Code Fixes Complete!

All installment rate encoding fixes have been applied and pushed to GitHub.

---

## 🚀 How to Retrain (3 Simple Steps)

### **Step 1: Wait for Deployment** ⏳

Railway and Vercel are auto-deploying the fixes now (~5 minutes).

Check deployment status:
- **Railway:** https://railway.app (backend)
- **Vercel:** https://vercel.com (frontend)

---

### **Step 2: Go to Admin Page** 🖱️

Once deployed, navigate to:

```
https://your-frontend-url.vercel.app/admin
```

Or locally:
```
http://localhost:3000/admin
```

---

### **Step 3: Click the Button!** 🎯

You'll see a prominent section:

```
╔═══════════════════════════════════════════════════════════╗
║  Retrain Model with Encoding Fix                [REQUIRED]║
║                                                            ║
║  ⚠️ CRITICAL: Installment rate encoding was reversed      ║
║     (1=high ❌ → 1=low ✅)                                 ║
║                                                            ║
║  Old models have backwards SHAP explanations.             ║
║  Retrain to fix: high burden → positive SHAP ✓            ║
║                                                            ║
║                                    [🤖 Retrain Now]       ║
╚═══════════════════════════════════════════════════════════╝
```

**Click:** `🤖 Retrain Now`

---

## ⏱️ What Happens Next

### **During Training (~5-10 minutes):**

The button will show:
```
🔄 Training...
```

The backend will:
1. ✅ Load German Credit dataset
2. ✅ Apply correct installment rate encoding (1=low, 4=high)
3. ✅ Engineer features
4. ✅ Train XGBoost model
5. ✅ Train Logistic model
6. ✅ Calculate metrics
7. ✅ Upload models to R2
8. ✅ Run sanity checks

### **When Complete:**

You'll see:
```
✅ Model retrained and uploaded successfully!
```

Plus detailed metrics:
- XGBoost accuracy, precision, recall
- Logistic accuracy, precision, recall
- Sanity check results

---

## ✅ Verification

### **Automatic Checks:**

The training service automatically verifies:
- ✅ High burden (≥35%) → Higher default rate
- ✅ Low burden (<20%) → Lower default rate
- ✅ SHAP values have correct direction

### **Manual Verification:**

1. **Go to any persona** (Maria or Jonas)
2. **Navigate to Layer 2** (Dashboard)
3. **Find "Installment Rate"** feature
4. **Check SHAP direction:**
   - If value is `ge_35_percent` (≥35%) → Should have **POSITIVE** SHAP (red, increases risk)
   - If value is `lt_20_percent` (<20%) → Should have **NEGATIVE** SHAP (green, decreases risk)

5. **Navigate to Layer 4** (Solution Finder)
6. **Adjust installment rate slider**
7. **Verify:**
   - Higher burden → Higher rejection probability ✅
   - Lower burden → Lower rejection probability ✅

---

## 📊 Expected Results

### **Before Retraining (WRONG):**
- ❌ High burden labeled as "low burden"
- ❌ SHAP values backwards
- ❌ UI misleading

### **After Retraining (CORRECT):**
- ✅ High burden correctly labeled
- ✅ SHAP values accurate
- ✅ UI displays correct information
- ✅ High burden → Positive SHAP (increases risk)
- ✅ Low burden → Negative SHAP (decreases risk)

---

## 🔄 Backend Auto-Reload

After training completes:
- ✅ New models are uploaded to R2
- ✅ Backend automatically loads new models on next prediction
- ✅ No manual restart needed!

---

## ⚠️ Important Notes

### **Old Predictions in Supabase:**

If you have existing predictions:
- **Option 1:** Keep them (they're still valid, just labels were wrong)
- **Option 2:** Clear database and start fresh (recommended if study hasn't started)

To clear (⚠️ DANGER - deletes all data):
```sql
-- In Supabase SQL Editor
DELETE FROM predictions;
DELETE FROM layer_ratings;
DELETE FROM post_questionnaires;
DELETE FROM sessions;
```

### **Rollback Plan:**

If something goes wrong:
1. The old models are still in R2 (not deleted)
2. You can manually restore them if needed
3. Or revert the code: `git revert HEAD`

---

## 🎉 That's It!

**Total time:** ~15-20 minutes
- 5 min: Deployment
- 5-10 min: Training
- 5 min: Verification

**No shell scripts. No manual steps. Just one button!** 🚀

---

## 📚 Additional Documentation

- **Complete plan:** `INSTALLMENT_RATE_FIX_PLAN.md`
- **Validation script:** `validate_bias_standalone.py`
- **Shell script (alternative):** `retrain_models.sh`

---

## 🆘 Troubleshooting

### **Button is disabled:**
- Wait for deployment to complete
- Check that backend is healthy: `/api/v1/experiment/health`

### **Training fails:**
- Check Railway logs for errors
- Verify R2 credentials in environment variables
- Ensure dataset exists in R2: `datasets/german_credit_cleaned.csv`

### **SHAP values still backwards:**
- Check that training completed successfully
- Verify new models were uploaded to R2
- Check model timestamps in R2
- Try hard refresh (Cmd+Shift+R)

---

**Ready? Just click the button!** 🎯
