# Admin Page Guide

## 🎯 **Access Your Admin Panel**

**URL**: https://novaxai.netlify.app/admin

---

## 📋 **Available Scripts (In Order)**

### **0. Clear R2 Bucket** ⚠️ (Danger Zone)
- **Color**: Red
- **Purpose**: Delete ALL files from R2 storage
- **Use When**: Starting fresh or before retraining
- **Warning**: Cannot be undone!
- **Deletes**:
  - All trained models
  - All EDA visualizations
  - Dataset files
  - Model metrics

---

### **1. Download Dataset** 📥
- **Color**: Blue
- **Purpose**: Download German Credit dataset from UCI ML Repository
- **Uploads To**: `data/german_credit_data.csv` in R2
- **Requirements**:
  - ucimlrepo package on backend
  - R2 bucket access
  - Internet connection
- **Duration**: ~30 seconds

---

### **2. Clean Dataset** ✨
- **Color**: Green
- **Purpose**: Map Axx symbolic codes to readable values
- **Input**: `data/german_credit_data.csv`
- **Output**: `data/german_credit_clean.csv` in R2
- **Transformations**:
  - `A11` → `negative_balance`
  - `A40` → `car_new`
  - `A30` → `no_credits`
  - All 20 attributes mapped
- **Duration**: ~10 seconds

---

### **3. Generate EDA** 📊
- **Color**: Purple
- **Purpose**: Create visualizations and statistics
- **Input**: `data/german_credit_clean.csv`
- **Outputs** (uploaded to R2 `eda/` folder):
  - `statistics.json` - Dataset statistics
  - `target_distribution.png`
  - `age_distribution.png`
  - `credit_amount_distribution.png`
  - `correlation_heatmap.png`
  - `purpose_distribution.png`
  - `checking_status_distribution.png`
  - `duration_distribution.png`
- **Duration**: ~1-2 minutes

---

### **4. Train Models** 🤖
- **Color**: Green
- **Purpose**: Train XGBoost + Logistic Regression
- **Input**: `data/german_credit_clean.csv`
- **Outputs** (uploaded to R2 `models/` folder):
  - `xgboost_model.pkl`
  - `logistic_model.pkl`
  - `metrics.json`
- **Process**:
  - Load cleaned dataset
  - Apply one-hot encoding
  - Exclude bias features
  - Train both models
  - Upload to R2
- **Duration**: ~4-8 minutes

---

### **5. Test Notebook Models** 🧪
- **Color**: Indigo
- **Purpose**: Verify notebook-trained models are loaded correctly
- **Tests**:
  - ✓ XGBoost model loaded from R2
  - ✓ Logistic Regression model loaded from R2
  - ✓ Preprocessor fitted on cleaned dataset
  - ✓ Database connection active
- **Duration**: ~5 seconds
- **Use When**: After uploading your notebook-trained models to R2

---

## 🔄 **Typical Workflow**

### **Option A: Use Notebook Models (Current Setup)**
1. ✅ Download Dataset (Step 1)
2. ✅ Clean Dataset (Step 2)
3. ✅ Generate EDA (Step 3)
4. ⏭️ Skip Train Models (you already have them)
5. ✅ Test Notebook Models (Step 5)

**Your models are already in R2**:
- `models/xgboost_model.pkl` ✓
- `models/logistic_model.pkl` ✓
- `models/metrics.json` ✓
- `models/training_documentation.json` ✓

### **Option B: Train New Models**
1. ✅ Download Dataset (Step 1)
2. ✅ Clean Dataset (Step 2)
3. ✅ Generate EDA (Step 3)
4. ✅ Train Models (Step 4)
5. ✅ Test Models (Step 5)

### **Option C: Start Fresh**
1. ⚠️ Clear R2 Bucket (Step 0)
2. ✅ Download Dataset (Step 1)
3. ✅ Clean Dataset (Step 2)
4. ✅ Generate EDA (Step 3)
5. ✅ Train Models (Step 4)
6. ✅ Test Models (Step 5)

---

## 🎨 **Visual Guide**

Each section has:
- **Title with number** (e.g., "2. Clean Dataset")
- **Description** of what it does
- **Requirements box** (blue) - What you need first
- **Info box** (varies by section) - Additional details
- **Action button** - Click to run the script
- **Status box** - Shows success ✅ or error ❌

---

## ⚡ **Quick Tips**

1. **Run scripts in order** - Each step depends on the previous one
2. **Wait for completion** - Don't click multiple buttons at once
3. **Check status messages** - Green ✅ = success, Red ❌ = error
4. **Railway auto-deploys** - Changes pushed to GitHub deploy automatically
5. **Test after changes** - Use "Test Notebook Models" to verify everything works

---

## 🔗 **Important URLs**

- **Admin Panel**: https://novaxai.netlify.app/admin
- **Dataset Page**: https://novaxai.netlify.app/dataset
- **Model Page**: https://novaxai.netlify.app/model
- **Backend API**: https://workingprojectexplainablelayers-production.up.railway.app

---

## 🐛 **Troubleshooting**

### **"EDA not generated" on Dataset page**
→ Run Step 3 (Generate EDA)

### **"Models not loaded" error**
→ Run Step 5 (Test Notebook Models) to check status

### **"Dataset not found" error**
→ Run Step 1 (Download Dataset) first

### **"Cleaned dataset not found" error**
→ Run Step 2 (Clean Dataset)

### **Script takes too long**
→ Check Railway logs for backend errors

---

## 📝 **System Status**

At the bottom of the admin page, you'll see:
- **Backend API URL** - Should show Railway URL
- **Quick links** to Dataset and Model pages

---

**Your admin panel is now fully set up and ready to use!** 🎉
