# Complete Setup Guide - XAI Financial Services

Step-by-step guide to get the research platform running.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

And accounts for:

- [ ] [Supabase](https://supabase.com) - Free tier works
- [ ] [Cloudflare](https://www.cloudflare.com) - Free R2 tier works
- [ ] [Kaggle](https://www.kaggle.com) - Free account
- [ ] [Railway](https://railway.app) - For backend deployment (optional)
- [ ] [Netlify](https://www.netlify.com) - For frontend deployment (optional)

---

## Part 1: Supabase Setup

### 1.1 Create Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization, name your project
4. Set a strong database password (save it!)
5. Choose a region close to you
6. Wait for project to initialize (~2 minutes)

### 1.2 Get Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 1.3 Create Database Tables

1. Go to SQL Editor in Supabase dashboard
2. Run the following SQL:

```sql
-- Sessions table
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  application_data JSONB
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id),
  decision TEXT,
  probability FLOAT,
  explanation_layer TEXT,
  explanation_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participant responses table
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
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_predictions_session ON predictions(session_id);
CREATE INDEX idx_responses_session ON participant_responses(session_id);
CREATE INDEX idx_responses_layer ON participant_responses(explanation_layer);
```

✅ Supabase setup complete!

---

## Part 2: Cloudflare R2 Setup

### 2.1 Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "R2" in sidebar
3. Click "Create bucket"
4. Name it: `xai-financial-data`
5. Click "Create bucket"

### 2.2 Get API Credentials

1. In R2 dashboard, click "Manage R2 API Tokens"
2. Click "Create API token"
3. Name: "XAI Backend Access"
4. Permissions: "Object Read & Write"
5. Click "Create API Token"
6. Copy and save:
   - Access Key ID
   - Secret Access Key
7. Your Account ID is visible in the R2 dashboard URL

✅ R2 setup complete!

---

## Part 3: Kaggle API Setup

### 3.1 Get API Credentials

1. Go to [Kaggle Account Settings](https://www.kaggle.com/settings)
2. Scroll to "API" section
3. Click "Create New API Token"
4. This downloads `kaggle.json`
5. Open the file and note your:
   - `username`
   - `key`

✅ Kaggle setup complete!

---

## Part 4: Backend Setup

### 4.1 Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4.2 Configure Environment

```bash
cp .env.template .env
```

Edit `.env` with your credentials:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...your-anon-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=xai-financial-data
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com

# Kaggle
KAGGLE_USERNAME=your-kaggle-username
KAGGLE_KEY=your-kaggle-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4.3 Download Dataset

```bash
python scripts/download_dataset.py
```

Expected output:
```
✓ Kaggle credentials configured
✓ Dataset downloaded
✓ Dataset uploaded to R2
✓ Pipeline completed successfully!
```

### 4.4 Train Model

```bash
python scripts/train_model.py
```

Expected output:
```
✓ Dataset loaded
✓ Features preprocessed
✓ Model trained successfully
✓ Model uploaded to R2
```

### 4.5 Start Backend Server

```bash
uvicorn app.main:app --reload
```

Visit `http://localhost:8000` - you should see:
```json
{"message": "XAI Financial Services API", "status": "running"}
```

✅ Backend running!

---

## Part 5: Frontend Setup

### 5.1 Install Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 5.2 Configure Environment

```bash
cp .env.template .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5.3 Start Frontend Server

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the home page!

✅ Frontend running!

---

## Part 6: Test the System

### 6.1 Navigate to Experiment

1. Click "Start Experiment" on home page
2. You should see the credit application form

### 6.2 Submit Test Application

1. Fill in the form (default values are fine)
2. Click "Get Credit Decision"
3. Wait for the AI decision to appear
4. You should see:
   - Decision (approved/rejected)
   - Confidence percentage
   - Top contributing factors with SHAP values

### 6.3 Submit Feedback

1. Adjust the rating sliders
2. Click "Submit Feedback"
3. You should see success message

### 6.4 Verify in Supabase

1. Go to Supabase dashboard
2. Click "Table Editor"
3. Check `sessions`, `predictions`, and `participant_responses` tables
4. You should see your test data!

✅ System working end-to-end!

---

## Part 7: Deployment (Optional)

### 7.1 Deploy Backend to Railway

1. Go to [Railway](https://railway.app)
2. Create new project → "Deploy from GitHub"
3. Select your repository
4. Add all environment variables from your `.env`
5. Add build command: `pip install -r requirements.txt`
6. Add start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Deploy
8. Copy your Railway URL (e.g., `https://xxx.railway.app`)

### 7.2 Deploy Frontend to Netlify

1. Update `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://xxx.railway.app
   ```
2. Go to [Netlify](https://www.netlify.com)
3. Add new site → Import from Git
4. Select your repository
5. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variable: `NEXT_PUBLIC_API_URL`
7. Deploy
8. Your site is live!

---

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.11+)
- Verify all env variables are set in `.env`
- Check R2 credentials are correct

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete `node_modules` and run `npm install` again
- Verify `NEXT_PUBLIC_API_URL` is set

### Model training fails
- Ensure dataset was downloaded to R2
- Check R2 credentials
- Verify dataset format (CSV)

### CORS errors
- Update `FRONTEND_URL` in backend `.env`
- Restart backend server after changes

### Supabase errors
- Verify tables were created correctly
- Check Supabase credentials
- Ensure anon key has correct permissions

---

## Next Steps

Now that Phase 1 is complete, you can:

1. Collect pilot data from test participants
2. Analyze the stored responses
3. Implement layer-specific explanation formatting
4. Add additional pages (landing, dataset overview, etc.)
5. Enhance visualizations

Refer to `PROJECT_OVERVIEW.md` for the full roadmap.
