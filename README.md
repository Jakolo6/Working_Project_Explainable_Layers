# XAI Credit Risk Research Platform

> **Master's Thesis Project**: Studying how different explanation styles influence human perception of AI-powered credit decisions.

---

## 🎯 **Project Goal**

Evaluate trust, fairness, and usefulness of layered explanations around a credit-risk model trained on the German Credit dataset.

---

## 🏗️ **Architecture**

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 14 + TypeScript + TailwindCSS |
| **Backend** | FastAPI + Python 3.11 |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Cloudflare R2 |
| **Deployment** | Netlify (frontend) + Railway (backend) |

---

## 📁 **Repository Structure**

```
├── frontend/          Next.js application (experiment UI, dashboards)
├── backend/           FastAPI application (API, model services)
├── eda_local.py       Local EDA generation script
├── train_models_local.py  Local model training script
└── PROJECT_OVERVIEW.md    📌 Single source of truth
```

---

## 🚀 **Quick Start**

### **For Developers**
1. Read [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) - Current status & architecture
2. Read [`LOCAL_SCRIPTS_README.md`](LOCAL_SCRIPTS_README.md) - How to run local scripts
3. Setup: [`frontend/README.md`](frontend/README.md) + [`backend/README.md`](backend/README.md)

### **For Researchers/Professor**
1. Read [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) - Project status
2. Check deployed app: [https://novaxai.netlify.app](https://novaxai.netlify.app)
3. Review training code: `models/training_code.json` in R2 bucket

---

## 📚 **Documentation**

**Main Reference**: [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md) - Complete documentation guide

**Key Documents**:
- [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) ⭐ - Architecture, features, status
- [`LOCAL_SCRIPTS_README.md`](LOCAL_SCRIPTS_README.md) - Local workflow guide
- [`ADMIN_PAGE_GUIDE.md`](ADMIN_PAGE_GUIDE.md) - Admin panel usage

---

## ✨ **Key Features**

- ✅ **Local-First Workflow** - Run EDA and training locally, upload manually
- ✅ **Real Model Metrics** - XGBoost & Logistic Regression on German Credit data
- ✅ **Interactive Experiment** - Participant flow with pre/post questionnaires
- ✅ **Layered Explanations** - Multiple explanation styles (visual, textual, interactive)
- ✅ **Data Persistence** - Supabase for sessions, responses, predictions

---

## 🔗 **Live Deployment**

- **Frontend**: [https://novaxai.netlify.app](https://novaxai.netlify.app)
- **Backend API**: [https://workingprojectexplainablelayers-production.up.railway.app](https://workingprojectexplainablelayers-production.up.railway.app)

---

## 📊 **Project Status**

**Current Phase**: ✅ Production Ready  
**Last Updated**: November 12, 2025  
**Workflow**: Local-First (run scripts locally, manual R2 upload)

See [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) for detailed status.

---

## 📖 **Learn More**

- **Full Documentation**: [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md)
- **Code Review**: [`CODE_REVIEW_SUMMARY.md`](CODE_REVIEW_SUMMARY.md)
- **Implementation Details**: [`IMPLEMENTATION_COMPLETE.md`](IMPLEMENTATION_COMPLETE.md)

---

## 💻 **Local Development**

### **Prerequisites**
- Node.js 18+ and npm (frontend)
- Python 3.11+ (backend)

### **Setup**

1. **Configure environment variables**
   ```bash
   # Frontend
   cp frontend/.env.template frontend/.env.local
   
   # Backend
   cp backend/.env.template backend/.env
   ```

2. **Run services**
   ```bash
   # Frontend (terminal 1)
   cd frontend
   npm install
   npm run dev
   
   # Backend (terminal 2)
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Access locally**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

**Detailed setup**: See [`frontend/README.md`](frontend/README.md) + [`backend/README.md`](backend/README.md)

---

**Questions?** Check [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md) for the right guide! 📚
