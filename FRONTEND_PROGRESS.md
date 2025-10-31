# Frontend Implementation Progress

## Completed Pages

### 1. Landing Page (`/app/page.tsx`) ✅
- Project introduction and overview
- Research partners (Nova SBE × zeb Consulting)
- 4-step process explanation
- Ethics & consent information
- Navigation to Dataset, Model, and Experiment pages

### 2. Dataset Page (`/app/dataset/page.tsx`) ✅
- Data source explanation (German Credit Risk Dataset)
- Data preparation and ethics
- Key variables categorized by type
- Data insights and patterns
- Privacy & GDPR compliance

## Pages to Create

### 3. Model Page (`/app/model/page.tsx`)
**Content:**
- Model comparison (Logistic Regression vs XGBoost)
- Training process explanation
- SHAP explainability introduction
- Global vs local explainability
- Trust and fairness discussion

### 4. About Page (`/app/about/page.tsx`)
**Content:**
- Research ethics approval
- Anonymity and voluntary participation
- Data storage and security
- GDPR compliance
- Contact information
- Acknowledgments (Nova SBE, zeb Consulting)

### 5. Results Page (`/app/results/page.tsx`)
**Content (Researcher Dashboard):**
- Total participants and sessions
- Aggregated visualizations
- Demographic breakdowns
- Response tables
- CSV export functionality
- Filters by persona, layer, rating type

### 6. Experiment Flow Pages

#### `/app/experiment/start/page.tsx`
- Registration form (name, age, profession, finance experience, AI familiarity)
- Call `POST /api/v1/experiment/create_session`
- Store session_id in localStorage
- Redirect to pre-questionnaire

#### `/app/experiment/pre/page.tsx`
- 3 open-text questions about AI expectations
- Call `POST /api/v1/experiment/pre_response`
- Redirect to first persona

#### `/app/experiment/persona/[id]/page.tsx`
- Display persona description
- Credit application form
- Call `POST /api/v1/experiment/predict`
- Store prediction results
- Redirect to layer 1

#### `/app/experiment/persona/[id]/layer/[layerId]/page.tsx`
- Display explanation for current layer
- 5 reflection questions
- Call `POST /api/v1/experiment/layer_feedback`
- Navigate to next layer or next persona

#### `/app/experiment/post/page.tsx`
- 5 open-text questions about overall experience
- Call `POST /api/v1/experiment/post_response`
- Mark session complete
- Redirect to thank you page

#### `/app/experiment/complete/page.tsx`
- Thank you message
- Summary of contribution
- Optional: View aggregated results

## Persona Definitions

### Persona 1: Elderly Woman
- Age: 65+
- Status: Retired
- Tech literacy: Low
- Financial situation: Fixed income, conservative

### Persona 2: Young Entrepreneur
- Age: 28-35
- Status: Startup founder
- Tech literacy: High
- Financial situation: Variable income, high risk tolerance

### Persona 3: Middle-Aged Employee
- Age: 45-55
- Status: Stable employment
- Tech literacy: Medium
- Financial situation: Steady income, family obligations

## Explanation Layers

### Layer 1: Basic SHAP
- Bar chart showing feature importance
- Top 5 features with SHAP values
- Simple visual representation

### Layer 2: Textual
- Natural language explanation
- "The decision was made because..."
- Key factors in plain English

### Layer 3: Contextualized
- Persona-specific interpretation
- Relates to persona's situation
- Explains impact on their specific case

### Layer 4: Hybrid
- Combined visual + textual + interactive
- SHAP chart + narrative + comparisons
- Most comprehensive explanation

## Reflection Questions (Per Layer)

1. What did this explanation help you understand about the AI's decision? (open text)
2. What did you still find unclear or difficult to interpret? (open text)
3. How confident would you feel explaining this result to a customer? (open text)
4. How much effort did it take to interpret this explanation? (Likert 1-7)
5. How does this explanation differ from what you expected? (open text)

## Post-Experiment Questions

1. Which explanation format helped you best understand the reasoning overall? Why?
2. Which felt most credible or fair?
3. Which would be most useful in a real customer interaction?
4. Did any explanation make you feel differently about the AI's competence or bias?
5. How should future AI systems communicate credit decisions to bank employees or customers?

## Technical Requirements

### State Management
- Use localStorage to persist:
  - `session_id`
  - `current_persona` (1-3)
  - `current_layer` (1-4)
  - `persona_predictions` (array of prediction results)

### API Integration
- All API calls to: `process.env.NEXT_PUBLIC_API_URL`
- Error handling for network failures
- Loading states for async operations

### Form Validation
- Minimum text length (10 characters for open questions)
- Required fields validation
- Likert scale bounds (1-7)
- Age validation (18-100)

### Navigation Flow
```
Landing → Dataset/Model (optional) → Experiment Start
  ↓
Registration
  ↓
Pre-Questionnaire
  ↓
Persona 1 Input → Layer 1 → Layer 2 → Layer 3 → Layer 4
  ↓
Persona 2 Input → Layer 1 → Layer 2 → Layer 3 → Layer 4
  ↓
Persona 3 Input → Layer 1 → Layer 2 → Layer 3 → Layer 4
  ↓
Post-Questionnaire
  ↓
Complete (Thank You)
```

## Next Steps

1. Install frontend dependencies: `cd frontend && npm install`
2. Create Model page
3. Create About page
4. Create Results dashboard
5. Create Experiment flow pages (7 pages total)
6. Add shared components (forms, progress bar, navigation)
7. Test complete flow end-to-end
8. Deploy to Netlify
