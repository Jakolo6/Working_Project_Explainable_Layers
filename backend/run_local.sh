#!/bin/bash
export SUPABASE_URL="https://yiwgmbpjykwlbysfpxqk.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpd2dtYnBqeWt3bGJ5c2ZweHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODg1MTQsImV4cCI6MjA3NzA2NDUxNH0.lfB2PmAfYHfRJlKfxmT_nhtYtJ_Efvqz8tLeHfDfFho"
export R2_ACCOUNT_ID="ff9c5d15c3296ba6a3aa9a96d1163cfe"
export R2_ACCESS_KEY_ID="58df651c2650ad40980aee11b9537146"
export R2_SECRET_ACCESS_KEY="e28f2e1d94035dfd814b79159dcadf82a33b926fe1f481becd1a50da9d2caa18"
export R2_BUCKET_NAME="xai-financial-data"
export R2_ENDPOINT_URL="https://ff9c5d15c3296ba6a3aa9a96d1163cfe.r2.cloudflarestorage.com"
export FRONTEND_URL="http://localhost:3000"
export MODEL_PATH="models/xgboost_credit_model.pkl"
export DATASET_PATH="data/german_credit_data.csv"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,https://novaxai.netlify.app"

conda run -n creditrisk python -m uvicorn app.main:app --reload --port 8000
