# Admin Page Guide (Local-First Workflow)

## 🎯 Overview

The admin page now uses a **local-first approach**. Instead of running scripts on the server, you run them locally and manually upload results to R2.

**Admin Page URL**: https://novaxai.netlify.app/admin

---

## 📋 Manual Upload Workflow

### **Step 1: Run Local Scripts**

```bash
cd "/Users/jakob.lindner/Documents/Git Projects/Working_Project_Explainable_Layers"
conda activate creditrisk
python eda_local.py
python train_models_local.py
```

**Duration**: EDA ~30 seconds | Training ~2-3 minutes

---

### **Step 2: Review Generated Files**

Check the output:

```bash
ls -lh data/eda/      # 9 files (8 PNGs + 1 JSON)
ls -lh data/models/   # 9 files (4 PKLs + 3 PNGs + 2 JSONs)
```

---

### **Step 3: Manual Upload to R2**

Upload files to your Cloudflare R2 bucket:

- `data/eda/*` → R2 `eda/` folder
- `data/models/*` → R2 `models/` folder

---

### **Step 4: Verify**

Visit these pages to confirm data loaded:
- https://novaxai.netlify.app/dataset
- https://novaxai.netlify.app/model

---

## 🗑️ Danger Zone

The admin page has a **"Clear R2 Bucket"** button that deletes all files from R2. Use this before re-uploading to ensure a clean state.

⚠️ **Warning**: This action cannot be undone!

---

## ✅ Benefits

1. ✅ **Reproducible** - Same inputs = same outputs
2. ✅ **Transparent** - Review all files before upload
3. ✅ **Professor-Friendly** - Source code included in JSON
4. ✅ **No Cloud Dependencies** - Run offline
5. ✅ **Simpler Backend** - No complex upload logic

---

## 📖 Full Documentation

See `LOCAL_SCRIPTS_README.md` for complete instructions on running the local scripts.

---

**The admin page no longer has script execution buttons. All work is done locally!** 🚀
