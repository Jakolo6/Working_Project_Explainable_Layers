# Explainable AI in Financial Services

Research platform for studying how different XAI explanation layers influence human perception of AI-based credit risk decisions.

**Collaboration:** Nova SBE × zeb Consulting

---

## Quick Start

Follow **SETUP_GUIDE.md** for detailed step-by-step instructions.

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.template .env
# Edit .env with your credentials
python scripts/download_dataset.py
python scripts/train_model.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.template .env.local
# Edit .env.local with backend URL
npm run dev
```

Visit `http://localhost:3000/experiment`

---

## Project Structure

```
.
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   └── experiment.py  # Prediction & response APIs
│   │   ├── models/            # Pydantic schemas
│   │   │   └── schemas.py     # Request/response models
│   │   ├── services/          # Business logic
│   │   │   ├── xgboost_model.py    # Model training & prediction
│   │   │   ├── shap_service.py     # SHAP explanations
│   │   │   └── supabase_service.py # Database operations
│   │   ├── config.py          # Environment config
│   │   └── main.py            # FastAPI app entry
│   ├── scripts/
│   │   ├── download_dataset.py    # Kaggle → R2 pipeline
│   │   └── train_model.py         # Model training script
│   ├── requirements.txt       # Python dependencies
│   ├── .env.template          # Environment template
│   └── README.md              # Backend setup guide
│
├── frontend/                   # Next.js React frontend
│   ├── app/
│   │   ├── experiment/
│   │   │   └── page.tsx       # Main experiment UI
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── package.json           # Node dependencies
│   ├── .env.template          # Environment template
│   └── README.md              # Frontend setup guide
│
├── PROJECT_OVERVIEW.md         # Single source of truth
├── SETUP_GUIDE.md             # Step-by-step setup
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 + TypeScript + TailwindCSS |
| Backend | FastAPI + Python 3.11 |
| Database | Supabase (PostgreSQL) |
| Storage | Cloudflare R2 |
| ML Model | XGBoost + SHAP |
| Dataset | UCI German Credit (via Kaggle) |
| Deployment | Netlify (frontend) + Railway (backend) |

---

## Features Implemented (Phase 1)

### Backend
✅ Modular FastAPI structure  
✅ XGBoost model training (excluding sensitive features)  
✅ SHAP explanation generation with 5 layer types  
✅ Kaggle dataset download automation  
✅ Cloudflare R2 integration  
✅ Supabase database storage  
✅ REST API endpoints for prediction & feedback  

### Frontend
✅ Credit application input form  
✅ Real-time API integration  
✅ AI decision display  
✅ SHAP explanation visualization  
✅ Four rating sliders (trust, understanding, usefulness, mental effort)  
✅ Responsive TailwindCSS design  

### Documentation
✅ Complete setup guides  
✅ Environment templates  
✅ Supabase SQL schemas  
✅ Deployment instructions  

---

## API Endpoints

**Base URL:** `http://localhost:8000` (development)

### Prediction
```http
POST /api/v1/experiment/predict
Content-Type: application/json

{
  "age": 30,
  "employment_duration": 24,
  "income": 3000,
  "credit_amount": 5000,
  "duration": 24,
  "existing_credits": 1,
  "dependents": 0,
  "housing": "own",
  "job": "skilled",
  "purpose": "car"
}
```

**Response:**
```json
{
  "decision": "approved",
  "probability": 0.85,
  "explanation_layer": "numerical_shap",
  "explanation": [
    {
      "feature": "income",
      "value": 3000,
      "contribution": 0.42
    }
  ],
  "session_id": "uuid-here"
}
```

### Feedback Submission
```http
POST /api/v1/experiment/response
Content-Type: application/json

{
  "session_id": "uuid-here",
  "trust_rating": 5,
  "understanding_rating": 6,
  "usefulness_rating": 5,
  "mental_effort_rating": 3,
  "decision": "approved",
  "probability": 0.85,
  "explanation_layer": "numerical_shap"
}
```

---

## Five Explanation Layers

The system randomly assigns one of these explanation types:

1. **feature_importance** - Simple feature ranking
2. **numerical_shap** - Numerical SHAP values
3. **visual_bar** - Bar chart explanation (placeholder)
4. **counterfactual** - What-if scenarios (placeholder)
5. **textual_narrative** - Natural language (placeholder)

*Note: Layers 3-5 currently return SHAP data; custom formatting will be implemented in future phases.*

---

## Database Schema

### Tables in Supabase

**sessions** - Experiment sessions
- `session_id` (UUID, PK)
- `created_at` (timestamp)
- `application_data` (JSONB)

**predictions** - AI predictions
- `id` (UUID, PK)
- `session_id` (UUID, FK)
- `decision` (text)
- `probability` (float)
- `explanation_layer` (text)
- `explanation_data` (JSONB)
- `timestamp` (timestamp)

**participant_responses** - Participant feedback
- `id` (UUID, PK)
- `session_id` (UUID, FK)
- `trust_rating` (1-7)
- `understanding_rating` (1-7)
- `usefulness_rating` (1-7)
- `mental_effort_rating` (1-7)
- `decision` (text)
- `probability` (float)
- `explanation_layer` (text)
- `submitted_at` (timestamp)

---

## Required Credentials

### Supabase
- Project URL
- Anon/public API key

### Cloudflare R2
- Account ID
- Access Key ID
- Secret Access Key
- Bucket name

### Kaggle
- Username
- API key

See **SETUP_GUIDE.md** for where to get these.

---

## Development Workflow

1. **Setup** - Follow SETUP_GUIDE.md
2. **Dataset** - Run `download_dataset.py`
3. **Training** - Run `train_model.py`
4. **Backend** - Start FastAPI server
5. **Frontend** - Start Next.js dev server
6. **Test** - Submit test applications
7. **Verify** - Check Supabase for stored data

---

## Deployment

### Backend → Railway
```bash
# Railway will auto-detect FastAPI
# Add all environment variables
# Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend → Netlify
```bash
# Base directory: frontend
# Build command: npm run build
# Publish directory: .next
# Environment: NEXT_PUBLIC_API_URL
```

---

## Next Steps

See **PROJECT_OVERVIEW.md** for complete roadmap.

**Immediate:**
- Test locally
- Deploy to staging
- Collect pilot data

**Future:**
- Implement layer-specific formatting
- Add landing page
- Add dataset/model overview pages
- Build admin dashboard
- Export data functionality

---

## Support

For setup issues, check:
1. SETUP_GUIDE.md troubleshooting section
2. backend/README.md
3. frontend/README.md

---

## License

Research project for Nova SBE × zeb Consulting collaboration.
