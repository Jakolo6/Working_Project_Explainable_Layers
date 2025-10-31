# Implementation Guide

## Quick Start

### 1. Database Setup (Supabase)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `backend/supabase_schema.sql`
4. Run the SQL script
5. Verify tables are created in the Table Editor

**Tables created:**
- `sessions`
- `pre_experiment_responses`
- `post_experiment_responses`
- `predictions`
- `layer_feedback`
- `participant_responses` (legacy)

### 2. Backend Deployment (Railway)

1. Go to your Railway project dashboard
2. Navigate to Variables tab
3. Add the following environment variables:

```
SUPABASE_URL=https://yiwgmbpjykwlbysfpxqk.supabase.co
SUPABASE_KEY=your_supabase_anon_key
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=xai-financial-data
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com/xai-financial-data
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_key
FRONTEND_URL=https://novaxai.netlify.app
```

4. Push your backend code to trigger deployment
5. Test the API at: `https://your-railway-app.railway.app/docs`

### 3. Frontend Deployment (Netlify)

1. Go to your Netlify project dashboard
2. Navigate to Site settings > Environment variables
3. Add:

```
NEXT_PUBLIC_API_URL=https://working-project-explainable-layers.up.railway.app
```

4. Ensure build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`

5. Push your code to trigger deployment

### 4. Testing the Backend API

Use the FastAPI docs interface at `https://your-railway-app.railway.app/docs`

**Test sequence:**

1. **Create Session**
   - Endpoint: `POST /api/v1/experiment/create_session`
   - Body:
   ```json
   {
     "participant_name": "Test User",
     "participant_age": 30,
     "participant_profession": "Developer",
     "finance_experience": "Intermediate",
     "ai_familiarity": 3
   }
   ```
   - Save the returned `session_id`

2. **Submit Pre-Experiment Response**
   - Endpoint: `POST /api/v1/experiment/pre_response`
   - Body:
   ```json
   {
     "session_id": "your-session-id",
     "expectation_ai_decision": "I expect clear reasoning...",
     "expectation_fair_explanation": "Fair explanations should...",
     "expectation_role_explanations": "Explanations should help..."
   }
   ```

3. **Get Prediction**
   - Endpoint: `POST /api/v1/experiment/predict`
   - Body: (credit application data)

4. **Submit Layer Feedback**
   - Endpoint: `POST /api/v1/experiment/layer_feedback`
   - Body:
   ```json
   {
     "session_id": "your-session-id",
     "persona_id": "1",
     "layer_id": 1,
     "layer_name": "Basic SHAP",
     "understanding_gained": "I understood...",
     "unclear_aspects": "Still unclear about...",
     "customer_confidence": "I would feel...",
     "interpretation_effort": 4,
     "expectation_difference": "This differed from..."
   }
   ```

5. **Submit Post-Experiment Response**
   - Endpoint: `POST /api/v1/experiment/post_response`
   - Body:
   ```json
   {
     "session_id": "your-session-id",
     "best_format": "The textual format...",
     "most_credible": "The hybrid approach...",
     "most_useful": "For customers, I'd use...",
     "impact_on_perception": "This changed my view...",
     "future_recommendations": "Future systems should..."
   }
   ```

6. **Retrieve Session**
   - Endpoint: `GET /api/v1/experiment/session/{session_id}`

### 5. Frontend Development Checklist

Create the following pages in `frontend/app/experiment/`:

- [ ] `start/page.tsx` - Registration
- [ ] `pre/page.tsx` - Pre-questionnaire
- [ ] `persona/[id]/page.tsx` - Persona input
- [ ] `persona/[id]/layer/[layerId]/page.tsx` - Layer explanations
- [ ] `post/page.tsx` - Post-questionnaire
- [ ] `complete/page.tsx` - Thank you

### 6. Common Issues & Solutions

**Issue: CORS errors**
- Solution: Verify FRONTEND_URL is set correctly in Railway
- Check that CORS middleware allows your Netlify domain

**Issue: Database connection fails**
- Solution: Verify SUPABASE_URL and SUPABASE_KEY in Railway
- Check that tables exist in Supabase

**Issue: 404 on Netlify**
- Solution: Ensure `netlify.toml` is in root directory
- Verify base directory is set to `frontend`

**Issue: API calls fail from frontend**
- Solution: Check NEXT_PUBLIC_API_URL environment variable
- Verify Railway backend is running

### 7. Data Verification

After running a test session, verify in Supabase:

1. Check `sessions` table for participant record
2. Check `pre_experiment_responses` for pre-questionnaire
3. Check `predictions` for model outputs
4. Check `layer_feedback` for layer reflections (should have 12 entries per participant)
5. Check `post_experiment_responses` for post-questionnaire
6. Verify `completed` field is `true` in `sessions` table

### 8. Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Backend API tested and responding
- [ ] Frontend deployed and accessible
- [ ] End-to-end test completed successfully
- [ ] CORS configured for production domains
- [ ] Error handling tested
- [ ] Form validation working
- [ ] Session persistence working
- [ ] All 3 personas × 4 layers tested
- [ ] Data correctly stored in Supabase

## Support

For detailed experimental flow, see `backend/EXPERIMENT_FLOW.md`
For database schema, see `backend/supabase_schema.sql`
For project status, see `PROJECT_OVERVIEW.md`
