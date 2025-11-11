# 📚 Documentation Index

**Last Updated**: November 12, 2025

---

## 🎯 **Quick Start**

**New to the project?** Start here:
1. Read [`README.md`](README.md) - Project overview
2. Read [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) - Architecture & status
3. Read [`LOCAL_SCRIPTS_README.md`](LOCAL_SCRIPTS_README.md) - How to run local scripts

---

## 📖 **Core Documentation**

### **1. README.md** 
**Purpose**: High-level project introduction  
**Audience**: Anyone new to the project  
**Contains**:
- Project goal and architecture
- Tech stack overview
- Repository structure
- Links to detailed guides

---

### **2. PROJECT_OVERVIEW.md** ⭐ **MAIN REFERENCE**
**Purpose**: Single source of truth for project status  
**Audience**: Developers, researchers, professor  
**Contains**:
- Current architecture summary
- Local-first workflow explanation
- Implemented features (frontend + backend)
- R2 bucket structure
- Deployment status
- Next steps

**📌 This is the most important document - always keep it updated!**

---

### **3. LOCAL_SCRIPTS_README.md**
**Purpose**: Guide for running local EDA and training scripts  
**Audience**: Developers running local analysis  
**Contains**:
- How to run `eda_local.py`
- How to run `train_models_local.py`
- Output file descriptions
- Manual R2 upload instructions

---

### **4. ADMIN_PAGE_GUIDE.md**
**Purpose**: Guide for using the admin panel  
**Audience**: Developers managing the system  
**Contains**:
- Local-first workflow steps
- Manual upload process
- R2 bucket management
- Verification steps

---

## 🔧 **Technical References**

### **5. CODE_REVIEW_SUMMARY.md**
**Purpose**: Comprehensive codebase review  
**Audience**: Developers doing code review  
**Contains**:
- R2 path consistency check
- Data flow verification
- File inventory (active vs obsolete)
- Issues found and fixed
- Recommendations

---

### **6. IMPLEMENTATION_COMPLETE.md**
**Purpose**: Summary of local-first refactoring  
**Audience**: Developers understanding the refactoring  
**Contains**:
- What was accomplished (4 phases)
- Code statistics (before/after)
- New R2 structure
- Benefits of local-first approach

---

## 📁 **Service-Specific Documentation**

### **Frontend**
- [`frontend/README.md`](frontend/README.md) - How to run, build, deploy frontend

### **Backend**
- [`backend/README.md`](backend/README.md) - How to run, build, deploy backend
- [`backend/scripts/README.md`](backend/scripts/README.md) - Scripts directory (deprecated)

---

## 🗂️ **Archived Documentation**

### **REFACTORING_SUMMARY.md** (Archived)
**Status**: ⚠️ Superseded by `IMPLEMENTATION_COMPLETE.md`  
**Purpose**: Documents the Axx code removal refactoring (older)  
**Note**: Kept for historical reference, but not current

---

## 🎯 **Documentation Workflow**

### **When to Update Each Document**

| Document | Update When... |
|----------|---------------|
| `README.md` | Tech stack or architecture changes |
| `PROJECT_OVERVIEW.md` | ⭐ **Any feature added/changed** |
| `LOCAL_SCRIPTS_README.md` | Local scripts change |
| `ADMIN_PAGE_GUIDE.md` | Admin workflow changes |
| `CODE_REVIEW_SUMMARY.md` | Major code review needed |
| `IMPLEMENTATION_COMPLETE.md` | Major refactoring completed |

---

## 🚀 **For New Developers**

**Recommended Reading Order**:
1. `README.md` - Get the big picture
2. `PROJECT_OVERVIEW.md` - Understand current state
3. `LOCAL_SCRIPTS_README.md` - Learn the workflow
4. `CODE_REVIEW_SUMMARY.md` - Deep dive into codebase
5. `frontend/README.md` + `backend/README.md` - Setup local environment

---

## 🎓 **For Professor Review**

**Recommended Documents**:
1. `README.md` - Project overview
2. `PROJECT_OVERVIEW.md` - Current status and architecture
3. `LOCAL_SCRIPTS_README.md` - How data is generated
4. Training code JSON in R2 (`models/training_code.json`) - Actual code used

---

## 📊 **Documentation Statistics**

**Total Documentation Files**: 7 core + 3 service-specific  
**Lines of Documentation**: ~1,500 lines  
**Last Major Update**: November 12, 2025 (Local-first refactoring)

---

**Need help?** Check the most relevant document from the list above! 📚
