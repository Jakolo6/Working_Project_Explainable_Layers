# PROJECT_OVERVIEW.md

## 1. Architecture Summary
Frontend: Next.js 14 + TypeScript + TailwindCSS  
Backend: FastAPI + Python 3.13  
Database: Supabase (PostgreSQL)  
Storage: Cloudflare R2  
Deployment: Railway (backend) + Netlify (frontend)

## 2. Implemented Features
- [x] Backend API with XGBoost + SHAP explanations
- [x] Frontend experiment interface with credit application form
- [x] Supabase integration for session/response storage
- [x] Cloudflare R2 integration for model/dataset storage
- [x] Railway deployment with Python 3.13 compatibility
- [x] Environment variable configuration
- [x] Fixed .gitignore to include app/models/ code directory

## 3. Next Steps / Tasks
- [ ] Configure Supabase credentials in Railway
- [ ] Configure Cloudflare R2 credentials in Railway
- [ ] Configure Kaggle API credentials in Railway
- [ ] Test backend deployment on Railway
- [ ] Deploy frontend to Netlify
- [ ] Set FRONTEND_URL in Railway environment
- [ ] End-to-end test: form submission → prediction → database storage
