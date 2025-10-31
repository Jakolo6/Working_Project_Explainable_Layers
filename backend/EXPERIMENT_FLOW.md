# Experiment Flow Documentation

## Overview
This document describes the complete experimental flow for the XAI Financial Services research platform.

## Experimental Structure

### Phase 1: Login & Participant Registration
**Route:** `/experiment/start`  
**Backend Endpoint:** `POST /api/create_session`  
**Database Table:** `sessions`

**Collected Data:**
- Participant name
- Age
- Profession
- Experience with finance
- AI familiarity (Likert 1-5)

**Flow:**
1. User enters demographic information
2. System creates unique `session_id`
3. Participant metadata stored in `sessions` table
4. Automatic redirect to Pre-Experiment Questionnaire

---

### Phase 2: Pre-Experiment Questionnaire
**Route:** `/experiment/pre`  
**Backend Endpoint:** `POST /api/pre_response`  
**Database Table:** `pre_experiment_responses`

**Questions:**
1. What do you expect an AI-based decision system to show when rejecting or approving a credit application?
2. What kind of explanation would help you feel the AI's decision is fair?
3. When you think about AI support in banking, what role should explanations play?

**Flow:**
1. Display open text fields for each question
2. On submit, save responses with `session_id`
3. Automatic redirect to Persona 1 introduction

---

### Phase 3: Persona Cycle (Repeated 3 Times)

#### Personas:
1. **Persona 1:** Elderly Woman (65+, retired, low tech literacy)
2. **Persona 2:** Young Entrepreneur (28-35, startup founder, high risk tolerance)
3. **Persona 3:** Middle-Aged Employee (45-55, stable income, family obligations)

#### Step 3.1: Input Phase
**Route:** `/experiment/persona/[persona_id]`  
**Backend Endpoint:** `POST /api/predict`  
**Database Table:** `predictions`

**Input Features:**
- Age
- Income
- Loan amount
- Credit score
- Employment status
- Existing debt
- Loan purpose

**Model Output:**
- Decision (approve/reject)
- Confidence score (0-1)
- Local SHAP values (top features)

**Flow:**
1. Display persona description
2. Participant enters credit application data
3. Submit to backend for prediction
4. Store prediction with SHAP values in `predictions` table
5. Move to Explanation Phase

#### Step 3.2: Explanation Phase (4 Layers)
**Route:** `/experiment/persona/[persona_id]/layer/[layer_id]`  
**Backend Endpoint:** `POST /api/layer_feedback`  
**Database Table:** `layer_feedback`

**Explanation Layers:**
1. **Layer 1 - Basic SHAP:** Bar chart showing feature importance
2. **Layer 2 - Textual:** Natural language explanation of decision
3. **Layer 3 - Contextualized:** Persona-specific interpretation
4. **Layer 4 - Hybrid:** Combined visual + textual + interactive elements

**Per-Layer Questions:**
1. What did this explanation help you understand about the AI's decision? (open text)
2. What did you still find unclear or difficult to interpret? (open text)
3. How confident would you feel explaining this result to a customer? (open text)
4. How much effort did it take to interpret this explanation? (Likert 1-7)
5. How does this explanation differ from what you expected? (open text)

**Flow:**
1. Display explanation layer for current persona
2. Show reflection questions
3. On submit, save to `layer_feedback` table
4. If layer < 4: move to next layer
5. If layer = 4: move to next persona or post-questionnaire

#### Step 3.3: Transition
- After completing all 4 layers for a persona, automatically move to next persona
- After completing all 3 personas (12 total layer feedbacks), move to Post-Experiment

---

### Phase 4: Post-Experiment Reflection
**Route:** `/experiment/post`  
**Backend Endpoint:** `POST /api/post_response`  
**Database Table:** `post_experiment_responses`

**Questions:**
1. Which explanation format helped you best understand the reasoning overall? Why?
2. Which felt most credible or fair?
3. Which would be most useful in a real customer interaction?
4. Did any explanation make you feel differently about the AI's competence or bias?
5. How should future AI systems communicate credit decisions to bank employees or customers?

**Flow:**
1. Display open text fields + Likert items
2. On submit, save responses with `session_id`
3. Mark session as `completed = TRUE` in `sessions` table
4. Show "Thank you" page

---

## Data Collection Summary

### Per Participant:
- **1** registration entry (`sessions`)
- **1** pre-experiment questionnaire (`pre_experiment_responses`)
- **3** predictions (one per persona) (`predictions`)
- **12** layer feedback entries (3 personas × 4 layers) (`layer_feedback`)
- **1** post-experiment questionnaire (`post_experiment_responses`)

### Total Records per Participant: 18

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Table |
|----------|--------|---------|-------|
| `/api/create_session` | POST | Create participant session | `sessions` |
| `/api/pre_response` | POST | Save pre-experiment responses | `pre_experiment_responses` |
| `/api/predict` | POST | Get model prediction + SHAP | `predictions` |
| `/api/layer_feedback` | POST | Save layer reflection | `layer_feedback` |
| `/api/post_response` | POST | Save post-experiment responses | `post_experiment_responses` |
| `/api/session/{session_id}` | GET | Retrieve session data | `sessions` |

---

## Frontend Routes

| Route | Purpose |
|-------|---------|
| `/experiment/start` | Registration page |
| `/experiment/pre` | Pre-experiment questionnaire |
| `/experiment/persona/1` | Persona 1 input |
| `/experiment/persona/1/layer/1-4` | Persona 1 explanation layers |
| `/experiment/persona/2` | Persona 2 input |
| `/experiment/persona/2/layer/1-4` | Persona 2 explanation layers |
| `/experiment/persona/3` | Persona 3 input |
| `/experiment/persona/3/layer/1-4` | Persona 3 explanation layers |
| `/experiment/post` | Post-experiment questionnaire |
| `/experiment/complete` | Thank you page |

---

## Session State Management

The frontend should track:
- `session_id` (from registration)
- `current_persona` (1-3)
- `current_layer` (1-4)
- `persona_predictions` (store prediction results for each persona)

Use localStorage or session storage to persist state across page refreshes.

---

## Validation Rules

1. All registration fields are required except age
2. AI familiarity must be 1-5
3. Pre/post questionnaire text fields must have minimum 10 characters
4. Layer feedback effort rating must be 1-7
5. Cannot skip layers or personas
6. Cannot submit post-questionnaire until all personas/layers complete
