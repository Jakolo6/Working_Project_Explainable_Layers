# Deployment Steps - XAI Financial Services Platform

## Quick Fix for Current 404 Error

Your Netlify site is showing 404 because the deployment needs to be triggered with the correct configuration. Follow these steps:

---

## Step 1: Fix Netlify Deployment (IMMEDIATE)

### A. Go to Netlify Dashboard
1. Visit: https://app.netlify.com
2. Find your site: `novaxai` or similar
3. Click on the site

### B. Verify Build Settings
1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. Confirm these settings:

   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/.next
   ```

3. If different, click **Edit settings** and update them

### C. Add Environment Variable
1. Go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Add:
   ```
   Key: NEXT_PUBLIC_API_URL
   Value: https://working-project-explainable-layers.up.railway.app
   ```
4. Click **Save**

### D. Trigger New Deploy
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for build to complete (2-5 minutes)
4. Monitor the build log for errors

### E. Expected Build Log Output
```
✓ Building...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### F. Test Your Site
Once deployed, visit: `https://novaxai.netlify.app`

You should see:
- ✅ Landing page with "Explainable AI in Financial Services"
- ✅ Navigation to Dataset, Model, About pages
- ✅ No 404 errors

---

## Step 2: Deploy Backend to Railway (CRITICAL)

### A. Check Railway Dashboard
1. Visit: https://railway.app/dashboard
2. Find your project: `Working_Project_Explainable_Layers`
3. Click on the backend service

### B. Verify GitHub Connection
1. Go to **Settings** → **Source**
2. Confirm it's connected to your GitHub repo
3. Confirm branch is set to `main`
4. Confirm root directory is set to `/backend` or `/`

### C. Add All Environment Variables
1. Go to **Variables** tab
2. Click **+ New Variable**
3. Add each of these (copy from your local `.env` file):

   ```bash
   SUPABASE_URL=https://yiwgmbpjykwlbysfpxqk.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpd2dtYnBqeWt3bGJ5c2ZweHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODg1MTQsImV4cCI6MjA3NzA2NDUxNH0.lfB2PmAfYHfRJlKfxmT_nhtYtJ_Efvqz8tLeHfDfFho
   
   R2_ACCOUNT_ID=ff9c5d15c3296ba6a3aa9a96d1163cfe
   R2_ACCESS_KEY_ID=58df651c2650ad40980aee11b9537146
   R2_SECRET_ACCESS_KEY=e28f2e1d94035dfd814b79159dcadf82a33b926fe1f481becd1a50da9d2caa18
   R2_BUCKET_NAME=xai-financial-data
   R2_ENDPOINT_URL=https://ff9c5d15c3296ba6a3aa9a96d1163cfe.r2.cloudflarestorage.com/xai-financial-data
   
   KAGGLE_USERNAME=jaakoob6
   KAGGLE_KEY=20564917d23bed39607e4e27250fb5bb
   
   FRONTEND_URL=https://novaxai.netlify.app
   CORS_ALLOWED_ORIGINS=https://novaxai.netlify.app,http://localhost:3000
   ```

4. Click **Add** for each variable

### D. Trigger Deployment
1. Go to **Deployments** tab
2. Click **Deploy** or wait for auto-deploy from Git push
3. Monitor deployment logs

### E. Expected Deployment Log
```
✓ Installing dependencies
✓ Building application
✓ Starting server
✓ Health check passed
```

### F. Get Your Railway URL
1. Once deployed, go to **Settings** → **Domains**
2. Copy the Railway domain (e.g., `working-project-explainable-layers.up.railway.app`)
3. Test it: `https://working-project-explainable-layers.up.railway.app/docs`

### G. Verify Backend is Running
```bash
# Test in browser or terminal
curl https://working-project-explainable-layers.up.railway.app/

# Should return: {"message": "XAI Financial Services API"}

# Test API docs
curl https://working-project-explainable-layers.up.railway.app/docs

# Should return HTML with FastAPI documentation
```

---

## Step 3: Update CORS Settings

### A. After Both Are Deployed
1. Go back to Railway
2. Update `CORS_ALLOWED_ORIGINS` variable to include your actual Netlify URL:
   ```
   CORS_ALLOWED_ORIGINS=https://novaxai.netlify.app,http://localhost:3000
   ```

### B. Redeploy Backend
Railway will auto-redeploy when you change environment variables

---

## Step 4: Test End-to-End Connection

### A. Open Your Frontend
Visit: `https://novaxai.netlify.app`

### B. Open Browser DevTools
- Press F12 (or Cmd+Option+I on Mac)
- Go to **Console** tab

### C. Navigate to Pages
1. Click "Learn About the Data" → Should load Dataset page
2. Click "Understand the Model" → Should load Model page
3. Click "About This Research" → Should load About page

### D. Check for Errors
- ✅ No 404 errors
- ✅ No CORS errors
- ✅ Pages load correctly

---

## Step 5: Verify Database Connection

### A. Test Session Creation (Once Backend is Running)

Open browser console on your frontend and run:

```javascript
fetch('https://working-project-explainable-layers.up.railway.app/api/v1/experiment/create_session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participant_name: "Test User",
    participant_age: 30,
    participant_profession: "Developer",
    finance_experience: "Intermediate",
    ai_familiarity: 3
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

Expected response:
```json
{
  "session_id": "some-uuid-here",
  "success": true,
  "message": "Session created successfully"
}
```

### B. Verify in Supabase
1. Go to Supabase dashboard
2. Navigate to **Table Editor** → `sessions`
3. You should see 1 row with your test data

---

## Common Issues & Solutions

### Issue 1: Netlify 404 Error
**Symptoms:** All pages show "Page not found"

**Solutions:**
1. Check build logs for errors
2. Verify `netlify.toml` is in root directory
3. Confirm base directory is `frontend`
4. Clear cache and redeploy

### Issue 2: Railway 404 Error
**Symptoms:** Backend API returns 404

**Solutions:**
1. Check deployment logs for errors
2. Verify `requirements.txt` includes all dependencies
3. Check that `main.py` or `app/main.py` exists
4. Verify Railway is using correct start command

### Issue 3: CORS Errors
**Symptoms:** "Access-Control-Allow-Origin" error in browser console

**Solutions:**
1. Verify `FRONTEND_URL` in Railway matches your Netlify URL exactly
2. Update `CORS_ALLOWED_ORIGINS` to include Netlify URL
3. Redeploy backend after changing CORS settings

### Issue 4: Database Connection Error
**Symptoms:** "Could not connect to database" errors

**Solutions:**
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` in Railway
2. Check Supabase project is active (not paused)
3. Test connection with system audit script

### Issue 5: Build Failures
**Symptoms:** Netlify or Railway build fails

**Netlify Solutions:**
- Check Node.js version (should be 18+)
- Verify `package.json` exists in `frontend/`
- Check for TypeScript errors in build log

**Railway Solutions:**
- Check Python version (should be 3.11+)
- Verify `requirements.txt` exists in `backend/`
- Check for import errors in build log

---

## Deployment Verification Checklist

### Frontend (Netlify)
- [ ] Site builds successfully
- [ ] No build errors in logs
- [ ] Landing page loads at root URL
- [ ] Dataset page loads at `/dataset`
- [ ] Model page loads at `/model`
- [ ] About page loads at `/about`
- [ ] No 404 errors
- [ ] No console errors in browser DevTools

### Backend (Railway)
- [ ] Deployment successful
- [ ] No deployment errors in logs
- [ ] Root endpoint returns JSON
- [ ] `/docs` shows FastAPI documentation
- [ ] All environment variables set
- [ ] Database connection works
- [ ] R2 storage accessible

### Integration
- [ ] Frontend can call backend API
- [ ] No CORS errors
- [ ] Session creation works
- [ ] Data saves to Supabase
- [ ] System audit passes all checks

---

## Next Steps After Deployment

1. **Run System Audit Again**
   ```bash
   cd backend
   python3 scripts/system_audit.py
   ```
   - Should show ✅ for Backend API
   - Should show ✅ for Frontend

2. **Download Dataset**
   ```bash
   cd backend
   python3 scripts/download_dataset.py
   ```

3. **Train Model**
   ```bash
   python3 scripts/train_model.py
   ```

4. **Test Prediction Endpoint**
   - Use FastAPI docs at `/docs`
   - Test `POST /api/v1/experiment/predict`
   - Verify SHAP explanations are generated

5. **Build Experiment Flow Pages**
   - Create registration page
   - Create questionnaire pages
   - Create persona/layer pages
   - Test complete user journey

---

## Support & Monitoring

### Check Deployment Status
- **Netlify:** https://app.netlify.com → Your site → Deploys
- **Railway:** https://railway.app/dashboard → Your project → Deployments

### View Logs
- **Netlify:** Deploy log in Deploys tab
- **Railway:** Deployment logs in Deployments tab
- **Supabase:** Logs in Dashboard → Logs

### Monitor Errors
- **Frontend:** Browser DevTools Console
- **Backend:** Railway deployment logs
- **Database:** Supabase logs and Table Editor

---

**Last Updated:** October 31, 2024  
**Status:** Awaiting deployment  
**Next Action:** Deploy to Netlify and Railway
