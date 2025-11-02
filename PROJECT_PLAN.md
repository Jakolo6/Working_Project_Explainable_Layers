# 🎯 XAI Financial Services - Complete Project Plan

## Project Goal
Build a research platform to study how different XAI (Explainable AI) explanation styles influence human perception of AI-based credit-risk decisions.

---

## 📊 Experiment Flow Overview

```
1. Registration → 2. Pre-Questionnaire → 3. Personas Hub → 
4. Per Persona: [Application → Decision → 5 Layers × Ratings] → 
5. Post-Questionnaire → 6. Completion
```

---

## ✅ Phase 1: Foundation & Setup (COMPLETED)

### Infrastructure
- [x] FastAPI backend on Railway
- [x] Next.js frontend on Netlify
- [x] Supabase PostgreSQL database
- [x] Cloudflare R2 for model/data storage
- [x] XGBoost + Logistic Regression models trained
- [x] Cost-sensitive evaluation metrics

### Data Pipeline
- [x] German Credit Dataset download from UCI
- [x] EDA generation and visualization
- [x] Model training with bias-free features
- [x] SHAP explainer integration
- [x] Feature importance calculation

### Session Management
- [x] Session creation endpoint
- [x] Session ID storage in localStorage
- [x] Session validation
- [x] Pre-experiment questionnaire

---

## 🚧 Phase 2: Personas & Application Flow (IN PROGRESS)

### Personas Hub Page ✅
- [x] Maria (67, retired): €4,000 for home renovation
- [x] Jonas (27, employee): €12,000 for business start-up
- [x] Sofia (44, single parent): €20,000 to consolidate debt
- [x] Bank clerk role-play introduction
- [x] Three persona cards with descriptions

### Individual Persona Pages (NEXT)
**Location:** `/frontend/app/experiment/personas/[personaId]/page.tsx`

**Requirements:**
- [ ] Persona recap card (name, age, loan amount, purpose)
- [ ] Prefilled application form based on persona
  - Maria: Age 67, retired, owns home, €4,000, 24 months, home renovation
  - Jonas: Age 27, employed 3 years, rents, €12,000, 36 months, business
  - Sofia: Age 44, employed, owns home, €20,000, 48 months, debt consolidation
- [ ] Allow 2-3 adjustable fields (duration, loan amount)
- [ ] "Submit Application" button
- [ ] Lock inputs after submission
- [ ] Call prediction API with persona data
- [ ] Display AI decision (Approved/Rejected + probability)
- [ ] Store decision in Supabase
- [ ] Prevent back navigation after submission

**API Endpoint Needed:**
```python
POST /api/v1/experiment/predict_persona
{
  "session_id": "uuid",
  "persona_id": "elderly-woman",
  "application_data": {...},
  "adjustments": {"duration": 36, "amount": 5000}
}
```

---

## 🎨 Phase 3: Explanation Layers (CORE OF PROJECT)

### Layer Architecture
**Location:** `/frontend/app/experiment/personas/[personaId]/layers/`

Each layer is a separate component file for modularity and maintainability.

### Layer 1: Minimal ⭐
**File:** `Layer1Minimal.tsx`

**Content:**
- Single most important feature from SHAP values
- Format: "Key factor: [Feature Name] = [Value]"
- Example: "Key factor: Credit Duration = 24 months"

**Data Source:** Top 1 SHAP feature from backend

---

### Layer 2: Short Text (GPT-4 Generated) ⭐⭐
**File:** `Layer2ShortText.tsx`

**Content:**
- Natural language explanation of top 3 drivers
- Generated using OpenAI GPT-4 API
- Format: One clear sentence summarizing the decision
- Example: "This application was approved because the customer has a stable employment history (4+ years), moderate loan amount (€4,000), and owns property."

**Backend Requirements:**
- [ ] Add OpenAI API key to Railway environment
- [ ] Create GPT-4 prompt template
- [ ] API endpoint to generate explanation
- [ ] Cache explanations to avoid repeated API calls

**API Endpoint:**
```python
POST /api/v1/experiment/generate_text_explanation
{
  "session_id": "uuid",
  "persona_id": "elderly-woman",
  "decision": "approved",
  "top_features": [...]
}
```

---

### Layer 3: Visual (SHAP Bars) ⭐⭐⭐
**File:** `Layer3Visual.tsx`

**Content:**
- Horizontal bar chart showing top 5 SHAP values
- Color-coded: green for positive impact, red for negative
- Feature names + values displayed
- Uses Recharts or similar library

**Data Source:** Top 5 SHAP features from backend

**Component Structure:**
```tsx
<div className="space-y-4">
  <h4>Top 5 Factors Influencing Decision</h4>
  <div className="space-y-2">
    {features.map(f => (
      <div className="flex items-center">
        <span className="w-40">{f.name}</span>
        <div className="flex-1 h-8 bg-gray-200 relative">
          <div 
            className={f.impact > 0 ? 'bg-green-500' : 'bg-red-500'}
            style={{width: `${Math.abs(f.impact) * 100}%`}}
          />
        </div>
        <span className="w-20 text-right">{f.value}</span>
      </div>
    ))}
  </div>
</div>
```

---

### Layer 4: Contextual (Thresholds & Ranges) ⭐⭐⭐⭐
**File:** `Layer4Contextual.tsx`

**Content:**
- Plain text explanation with typical ranges
- Compares applicant's values to dataset statistics
- Example: "Your credit duration (24 months) is below the average (30 months) for approved applications. Your employment status (4+ years) is in the stable range."

**Backend Requirements:**
- [ ] Calculate dataset statistics (mean, median, percentiles)
- [ ] Store thresholds for each feature
- [ ] Generate contextual comparisons

**Data Structure:**
```python
{
  "duration": {
    "value": 24,
    "avg_approved": 30,
    "avg_rejected": 18,
    "percentile": 40
  },
  "employment": {
    "value": "4-7 years",
    "typical_approved": "4+ years",
    "risk_level": "low"
  }
}
```

---

### Layer 5: Counterfactual (What-If Scenarios) ⭐⭐⭐⭐⭐
**File:** `Layer5Counterfactual.tsx`

**Content:**
- Shows how changing one feature would affect the decision
- Example: "If credit duration were increased from 24 to 36 months, the decision would change to REJECTED (probability drops from 0.72 to 0.45)."
- Interactive: allow user to see 2-3 counterfactuals

**Backend Requirements:**
- [ ] Implement counterfactual generation
- [ ] Re-run model with modified features
- [ ] Calculate minimal changes needed to flip decision

**API Endpoint:**
```python
POST /api/v1/experiment/generate_counterfactual
{
  "session_id": "uuid",
  "persona_id": "elderly-woman",
  "original_features": {...},
  "feature_to_change": "duration"
}
```

---

## 📝 Phase 4: Rating System

### Likert Scale Component
**File:** `/frontend/components/LikertScale.tsx`

**Questions (1-5 scale):**
1. **Trust:** "How much do you trust this explanation?"
2. **Understanding:** "How well do you understand the AI's decision?"
3. **Usefulness:** "How useful is this explanation for your work?"
4. **Mental Effort:** "How much mental effort did it take to understand?"

**Component Structure:**
```tsx
<div className="space-y-6">
  <LikertQuestion 
    question="How much do you trust this explanation?"
    value={ratings.trust}
    onChange={(v) => setRatings({...ratings, trust: v})}
  />
  <textarea 
    placeholder="Optional: Any comments about this explanation?"
    className="w-full p-3 border rounded"
  />
  <button onClick={submitRating}>
    Next Explanation →
  </button>
</div>
```

### Data Storage
**Supabase Table:** `layer_ratings`

```sql
CREATE TABLE layer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id),
  persona_id TEXT NOT NULL,
  layer_number INTEGER CHECK (layer_number BETWEEN 1 AND 5),
  layer_type TEXT NOT NULL,
  trust_rating INTEGER CHECK (trust_rating BETWEEN 1 AND 5),
  understanding_rating INTEGER CHECK (understanding_rating BETWEEN 1 AND 5),
  usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),
  mental_effort_rating INTEGER CHECK (mental_effort_rating BETWEEN 1 AND 5),
  comment TEXT,
  time_spent_seconds INTEGER,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🔄 Phase 5: Flow Control & Navigation

### Layer Sequence Manager
**File:** `/frontend/app/experiment/personas/[personaId]/LayerSequence.tsx`

**Features:**
- [ ] Randomize layer order per participant (stored in session)
- [ ] Progress indicator: "Layer 2 of 5"
- [ ] Disable back button after rating
- [ ] Auto-advance to next layer after rating submission
- [ ] Show decision box (collapsed) above each layer for context
- [ ] Track time spent on each layer

**State Management:**
```tsx
const [layerOrder] = useState(() => shuffleArray([1, 2, 3, 4, 5]))
const [currentLayerIndex, setCurrentLayerIndex] = useState(0)
const [startTime, setStartTime] = useState(Date.now())

const handleNextLayer = async () => {
  const timeSpent = Math.floor((Date.now() - startTime) / 1000)
  await submitRating({...ratings, timeSpent})
  setCurrentLayerIndex(prev => prev + 1)
  setStartTime(Date.now())
}
```

### Persona Completion
After 5th layer is rated:
- [ ] Show completion message: "Thanks! Maria's application is complete."
- [ ] Button: "Continue to Next Customer" → back to personas hub
- [ ] Mark persona as completed in session state
- [ ] Update progress indicator on personas hub

---

## 📊 Phase 6: Post-Experiment & Completion

### Post-Experiment Questionnaire
**File:** `/frontend/app/experiment/post/page.tsx`

**Questions:**
1. Which explanation format did you find most helpful overall?
2. Which format seemed most credible/trustworthy?
3. Which format was most useful for your decision-making?
4. How did the different explanations impact your perception of the AI system?
5. Would you recommend any of these formats for real-world use?

### Completion Screen
**File:** `/frontend/app/experiment/complete/page.tsx`

**Content:**
- Thank you message
- Completion code for participant compensation
- Summary of participation (3 personas, 15 layer evaluations)
- Contact information for questions
- Option to download participation certificate

---

## 🔧 Phase 7: Backend API Endpoints

### Required Endpoints

```python
# Persona prediction
POST /api/v1/experiment/predict_persona
- Input: session_id, persona_id, application_data
- Output: decision, probability, shap_values

# Text explanation generation (GPT-4)
POST /api/v1/experiment/generate_text_explanation
- Input: session_id, persona_id, top_features
- Output: natural_language_explanation

# Counterfactual generation
POST /api/v1/experiment/generate_counterfactual
- Input: session_id, persona_id, original_features, feature_to_change
- Output: new_decision, new_probability, changed_value

# Layer rating submission
POST /api/v1/experiment/submit_layer_rating
- Input: session_id, persona_id, layer_number, ratings, time_spent
- Output: success, next_layer_number

# Session progress
GET /api/v1/experiment/session/{session_id}/progress
- Output: completed_personas, current_persona, layer_order

# Post-experiment submission
POST /api/v1/experiment/post_response
- Input: session_id, questionnaire_responses
- Output: completion_code
```

---

## 📈 Phase 8: Admin Dashboard & Data Export

### Admin Features
- [ ] View all sessions and completion status
- [ ] Export ratings data as CSV
- [ ] View aggregated statistics per layer
- [ ] Monitor participant progress in real-time
- [ ] Generate completion codes

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Participants can create sessions
- ✅ Pre-experiment questionnaire works
- ✅ Personas hub displays three customers
- [ ] Each persona has prefilled application form
- [ ] AI generates real predictions (no mock data)
- [ ] All 5 explanation layers display correctly
- [ ] Ratings are collected and stored
- [ ] Layer order is randomized per participant
- [ ] Post-experiment questionnaire works
- [ ] Completion code is generated

### Data Quality
- [ ] All ratings stored with timestamps
- [ ] Time-on-layer tracked accurately
- [ ] No duplicate submissions
- [ ] Session IDs link all data correctly
- [ ] Counterfactuals are mathematically valid

### User Experience
- [ ] Clear instructions at each step
- [ ] No confusing navigation
- [ ] Mobile-responsive design
- [ ] Loading states for API calls
- [ ] Error handling with helpful messages

---

## 📅 Timeline Estimate

- **Phase 2 (Persona Pages):** 2-3 hours
- **Phase 3 (Layers 1-5):** 6-8 hours
- **Phase 4 (Rating System):** 2 hours
- **Phase 5 (Flow Control):** 3 hours
- **Phase 6 (Post & Complete):** 2 hours
- **Phase 7 (Backend APIs):** 4-5 hours
- **Phase 8 (Admin):** 3 hours

**Total:** ~22-26 hours of development

---

## 🚀 Next Immediate Steps

1. ✅ Update personas page (DONE)
2. **Create persona detail pages with prefilled forms**
3. **Build Layer 1 (Minimal)**
4. **Build Layer 2 (GPT-4 text)**
5. **Build Layer 3 (SHAP visual)**
6. **Build Layer 4 (Contextual)**
7. **Build Layer 5 (Counterfactual)**
8. **Implement rating system**
9. **Add flow control & navigation**
10. **Complete post-experiment flow**

---

## 📝 Notes

- **No mock data allowed** - all predictions must come from trained models
- **Layer order randomization** is critical for research validity
- **Time tracking** is essential for measuring cognitive load
- **Mobile responsiveness** ensures broad participant access
- **Error handling** prevents data loss from network issues

---

Last Updated: 2025-11-02
