# Explainable AI in Credit Decision-Making: A Multi-Layer Approach

**Master Thesis Project**  
**Author:** Jakob Lindner  
**Institution:** Nova SBE
**Year:** 2025

---

## 📋 Abstract

This repository contains the complete implementation of a research study investigating the effectiveness of different explanation layers for AI-driven credit decisions. The system implements a within-subjects experimental design comparing four explanation approaches (Baseline SHAP, Interactive Dashboard, Narrative Explanation, and Counterfactual Analysis) across two borderline credit application scenarios.

**Research Question:** How do different explanation modalities affect user understanding, trust, and perceived fairness in AI credit decision systems?

---

## 🎯 Key Features

### **Experimental Design**
- **Within-subjects design:** Each participant evaluates all explanation layers
- **2 Personas:** Borderline approved (53% confidence) and borderline rejected (47% confidence)
- **4 Explanation Layers:** Progressive disclosure from technical to narrative
- **3 Rating Dimensions:** Understanding, Communicability, Mental Ease (cognitive load inverted)
- **Comprehensive data collection:** Layer ratings, time spent, qualitative feedback

### **Technical Implementation**
- **Frontend:** Next.js 14 (React), TypeScript, TailwindCSS, Framer Motion
- **Backend:** FastAPI (Python), XGBoost ML model, OpenAI GPT-4o-mini for narratives
- **Database:** Supabase (PostgreSQL) with RLS policies
- **ML Model:** XGBoost trained on German Credit Dataset (1994)
- **Explainability:** SHAP (SHapley Additive exPlanations)
- **Deployment:** Railway (backend), Netlify (frontend)

---

## 📊 Explanation Layers

### **Layer 1: Baseline SHAP Table**
- Complete technical table showing all SHAP feature contributions
- Sorted by impact magnitude
- Color-coded risk indicators
- Designed for technical users

### **Layer 2: Interactive Dashboard**
- Visual risk tug-of-war showing factor balance
- Progressive disclosure with expandable feature cards
- Global distribution comparisons for numeric features
- Categorical comparisons with success rates
- Concise AI-generated analytical summary (<50 words)

### **Layer 3: Narrative Explanation**
- Natural language explanation (150-200 words)
- Specific benchmarks and percentiles
- Fairness statement (regulatory compliance)
- Actionable guidance for rejected applications
- Professional, defensible language

### **Layer 4: Counterfactual Analysis**
- "What-if" scenarios showing minimal changes to reverse decision
- Interactive feature adjustment
- Real-time prediction updates
- Exploration of decision boundaries

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Next.js 14 + TypeScript + TailwindCSS + Framer Motion     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Consent    │→ │   Personas   │→ │    Layers    │     │
│  │  & Baseline  │  │  (2 cases)   │  │  (4 types)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           ↓                                  │
│                  ┌──────────────────┐                       │
│                  │ Post-Questionnaire│                       │
│                  └──────────────────┘                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API
┌─────────────────────────┴───────────────────────────────────┐
│                         BACKEND                              │
│              FastAPI + Python + XGBoost                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  XGBoost     │  │    SHAP      │  │   OpenAI     │     │
│  │  Predictor   │→ │  Explainer   │→ │  Narratives  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           ↓                                  │
│                  ┌──────────────────┐                       │
│                  │  Supabase (DB)   │                       │
│                  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.11+
- Supabase account (for database)
- OpenAI API key (for narrative generation)
- Cloudflare R2 account (for model storage)

### **Environment Variables**

Create `.env` files in both `frontend/` and `backend/`:

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend `.env`:**
```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# OpenAI (for narrative generation)
OPENAI_API_KEY=your_openai_key

# Cloudflare R2 (for model storage)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
```

### **Installation**

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### **Database Setup**

Run the schema migration in Supabase SQL Editor:
```bash
# Execute the schema file
psql $DATABASE_URL -f backend/migrations/FINAL_CLEAN_SCHEMA.sql
```

### **Running Locally**

**Backend (Terminal 1):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:3000`

---

## 📁 Repository Structure

```
.
├── README.md                    # This file
├── ARCHITECTURE.md              # Detailed technical architecture
├── PROJECT_OVERVIEW.md          # Research methodology and design
├── SYSTEM_METHODOLOGY.md        # Implementation details
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── api/                 # API endpoints
│   │   │   ├── experiment_clean.py    # Main experiment endpoints
│   │   │   ├── explanations.py        # Narrative & counterfactual
│   │   │   └── admin.py               # Admin utilities
│   │   ├── services/            # Business logic
│   │   │   ├── xgboost_service.py     # ML predictions
│   │   │   ├── shap_service.py        # SHAP explanations
│   │   │   ├── supabase_service.py    # Database operations
│   │   │   ├── context_builder.py     # Narrative context
│   │   │   └── r2_service.py          # Model storage
│   │   ├── models/              # Data models
│   │   ├── config.py            # Configuration
│   │   └── main.py              # FastAPI app
│   ├── migrations/              # Database migrations
│   │   ├── FINAL_CLEAN_SCHEMA.sql     # Production schema
│   │   └── README.md                   # Schema documentation
│   ├── scripts/                 # Utility scripts
│   │   └── validate_installment_bias.py
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Backend documentation
│
├── frontend/                    # Next.js frontend
│   ├── app/                     # Next.js 14 app directory
│   │   ├── page.tsx             # Landing page
│   │   ├── consent/             # Consent & baseline questionnaire
│   │   ├── experiment/          # Main experiment flow
│   │   │   └── personas/[personaId]/
│   │   │       └── layers/      # Layer rating interface
│   │   ├── results/             # Admin results dashboard
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── layers/              # Explanation layer components
│   │   │   ├── Layer1Baseline.tsx
│   │   │   ├── Layer2Dashboard.tsx
│   │   │   ├── Layer3Narrative.tsx
│   │   │   ├── Layer4Counterfactual.tsx
│   │   │   └── dashboard/       # Dashboard subcomponents
│   │   └── ui/                  # Shared UI components
│   ├── lib/                     # Utilities and data
│   │   ├── personas.ts          # Persona definitions
│   │   └── categoricalMetadata.ts
│   ├── package.json             # Node dependencies
│   └── README.md                # Frontend documentation
│
└── .gitignore                   # Git ignore rules
```

---

## 🔬 Research Methodology

### **Participants**
- Target: Bank employees, credit analysts, financial advisors
- Sample size: N = [target sample size]
- Recruitment: [recruitment method]

### **Procedure**
1. **Consent & Demographics** (5 min)
   - Informed consent
   - Background questionnaire (6 questions)
   - AI familiarity and trust baseline

2. **Persona 1: Maria** (15 min)
   - Borderline APPROVED case (53% confidence)
   - View and rate all 4 explanation layers
   - Post-persona questionnaire

3. **Persona 2: Jonas** (15 min)
   - Borderline REJECTED case (47% confidence)
   - View and rate all 4 explanation layers
   - Post-persona questionnaire

4. **Completion** (2 min)
   - Thank you message
   - Debrief information

**Total Time:** ~35-40 minutes per participant

### **Data Collected**

**Per Layer (3 ratings × 4 layers × 2 personas = 24 ratings):**
- Understanding (1-5 Likert)
- Communicability (1-5 Likert)
- Mental Ease (1-5 Likert, inverted cognitive load)
- Time spent (seconds)
- Optional comment

**Per Persona (2 questionnaires):**
- Most helpful layer
- Most trusted layer
- Best for customer communication
- Overall intuitiveness (1-5)
- AI usefulness (1-5)
- Improvement suggestions (open-ended)

---

## 📊 Data Analysis

### **Database Schema**
- `sessions`: Consent and baseline data
- `predictions`: AI predictions and SHAP values
- `layer_ratings`: Per-layer ratings (24 per participant)
- `post_questionnaires`: Post-persona feedback (2 per participant)

### **Analysis Views**
- `experiment_complete_data`: Aggregated session data
- `layer_performance_analysis`: Per-layer statistics with mean/stddev

### **Statistical Tests**
- Repeated measures ANOVA for layer comparisons
- Post-hoc pairwise comparisons (Bonferroni correction)
- Correlation analysis between dimensions
- Qualitative thematic analysis of comments

---

## 🛡️ Ethical Considerations

### **Fairness & Bias**
- **Protected characteristics excluded:** Gender, nationality, foreign worker status
- **Bias validation:** Installment rate bias detected and documented
- **Transparency:** All SHAP values and model decisions fully disclosed
- **Fairness statement:** Included in all narrative explanations

### **Data Privacy**
- No personally identifiable information collected
- Anonymous session IDs
- Secure database with RLS policies
- GDPR compliant

### **Informed Consent**
- Clear explanation of study purpose
- Right to withdraw at any time
- Data usage transparency
- Debrief information provided

---

## 📈 Key Findings

[To be completed after data collection and analysis]

---

## 🔧 Technical Details

### **ML Model**
- **Algorithm:** XGBoost Classifier
- **Dataset:** German Credit Dataset (1994), 1000 samples
- **Features:** 20 features (7 numeric, 13 categorical)
- **Performance:** [accuracy, precision, recall, F1]
- **Explainability:** SHAP TreeExplainer

### **Explanation Generation**
- **SHAP values:** Computed per prediction
- **Global context:** Statistical benchmarks from training data
- **Narrative generation:** OpenAI GPT-4o-mini with structured prompts
- **Counterfactuals:** Heuristic-based minimal changes

### **Frontend Technologies**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Charts:** Recharts
- **State:** React hooks

### **Backend Technologies**
- **Framework:** FastAPI
- **ML:** XGBoost, SHAP
- **Database:** Supabase (PostgreSQL)
- **Storage:** Cloudflare R2
- **LLM:** OpenAI GPT-4o-mini

---

## 📚 References

1. Lundberg, S. M., & Lee, S. I. (2017). A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems*, 30.

2. Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). "Why should I trust you?" Explaining the predictions of any classifier. *Proceedings of the 22nd ACM SIGKDD*, 1135-1144.

3. Miller, T. (2019). Explanation in artificial intelligence: Insights from the social sciences. *Artificial Intelligence*, 267, 1-38.

4. [Add your thesis-specific references]

---

## 📝 Citation

If you use this code or methodology in your research, please cite:

```bibtex
@mastersthesis{lindner2025explainable,
  author = {Lindner, Jakob},
  title = {Explainable AI in Credit Decision-Making: A Multi-Layer Approach},
  school = {[Your University]},
  year = {2025},
  type = {Master's Thesis}
}
```

---

## 📧 Contact

**Jakob Lindner**  
Email: [your.email@university.edu]  
GitHub: [@Jakolo6](https://github.com/Jakolo6)

---

## 📄 License

This project is part of a master's thesis and is provided for academic purposes.  
[Specify your license: MIT, Academic Use Only, etc.]

---

## 🙏 Acknowledgments

- [Your supervisor/advisor]
- [Your university/department]
- [Any funding sources]
- Open-source libraries: XGBoost, SHAP, FastAPI, Next.js, and many others

---

**Last Updated:** December 2025
