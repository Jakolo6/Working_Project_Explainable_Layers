# Backend - XAI Financial Services API

FastAPI backend for the Explainable AI in Financial Services research platform.

## Prerequisites

- Python 3.11+
- pip or conda
- Supabase account
- Cloudflare R2 account
- Kaggle API credentials

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.template` to `.env`:

```bash
cp .env.template .env
```

Fill in your credentials:

- **Supabase**: Get from your [Supabase project settings](https://app.supabase.com)
  - `SUPABASE_URL`: Your project URL
  - `SUPABASE_KEY`: Your anon/public key

- **Cloudflare R2**: Create bucket and get credentials from [Cloudflare dashboard](https://dash.cloudflare.com)
  - `R2_ACCOUNT_ID`: Your Cloudflare account ID
  - `R2_ACCESS_KEY_ID`: R2 access key
  - `R2_SECRET_ACCESS_KEY`: R2 secret key
  - `R2_BUCKET_NAME`: Your bucket name (default: `xai-financial-data`)

- **Kaggle API**: Get from [Kaggle account settings](https://www.kaggle.com/settings)
  - `KAGGLE_USERNAME`: Your Kaggle username
  - `KAGGLE_KEY`: Your Kaggle API key

### 3. Setup Supabase Database

Create the following tables in your Supabase project:

**Sessions Table:**
```sql
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE,
  application_data JSONB
);
```

**Predictions Table:**
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id),
  decision TEXT,
  probability FLOAT,
  explanation_layer TEXT,
  explanation_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE
);
```

**Participant Responses Table:**
```sql
CREATE TABLE participant_responses (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(session_id),
  trust_rating INTEGER CHECK (trust_rating BETWEEN 1 AND 7),
  understanding_rating INTEGER CHECK (understanding_rating BETWEEN 1 AND 7),
  usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 7),
  mental_effort_rating INTEGER CHECK (mental_effort_rating BETWEEN 1 AND 7),
  decision TEXT,
  probability FLOAT,
  explanation_layer TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE
);
```

### 4. Download Dataset and Train Model

Run the dataset download script:

```bash
python scripts/download_dataset.py
```

This will:
- Download the German Credit dataset from Kaggle
- Upload it to your Cloudflare R2 bucket

Train the XGBoost model:

```bash
python scripts/train_model.py
```

This will:
- Load the dataset from R2
- Train an XGBoost classifier
- Save the model to R2

## Running the Server

### Development

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
- `GET /` - API status
- `GET /health` - Health check

### Experiment
- `POST /api/v1/experiment/predict` - Get credit decision with explanation
- `POST /api/v1/experiment/response` - Submit participant feedback

## Deployment (Railway)

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables from your `.env` file
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Deploy

## Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   ├── models/           # Pydantic schemas
│   ├── services/         # Business logic
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
├── scripts/              # Utility scripts
├── requirements.txt      # Python dependencies
└── .env                  # Environment variables
```

## Notes

- Model and dataset are stored in Cloudflare R2 for persistence
- SHAP explanations are computed on-demand
- Five explanation layers are randomly assigned to participants
