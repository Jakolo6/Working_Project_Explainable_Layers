# 🔍 DATA COLLECTION AUDIT
**Critical Review of Questionnaire Data Pipeline**  
**Date:** December 6, 2025  
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## 📋 EXECUTIVE SUMMARY

### ❌ **CRITICAL ISSUES FOUND:**
1. **Database schema MISSING new questionnaire fields** (age, gender, financial_relationship, etc.)
2. **Schema mismatch** between frontend, backend, and database
3. **Data loss** - all new questionnaire data is being dropped

### ✅ **WHAT'S WORKING:**
- Frontend collects all data correctly
- Backend receives all data correctly
- Supabase service now saves all data (JUST FIXED)

---

## 🗺️ DATA FLOW MAP

### **1. Initial Session Creation (Start Page)**

#### **Frontend Collects:**
```typescript
// /frontend/app/experiment/start/page.tsx
interface SessionForm {
  // Section 1: Demographics
  age: number                          // ✅ Collected
  gender: string                       // ✅ Collected
  
  // Section 2: Experience & Preferences
  financial_relationship: string       // ✅ Collected
  preferred_explanation_style: string  // ✅ Collected
  
  // Section 3: Trust & Ethics
  ai_trust_instinct: string           // ✅ Collected
  ai_fairness_stance: string          // ✅ Collected
}
```

#### **Frontend Sends:**
```javascript
POST /api/v1/experiment/session
{
  consent_given: boolean,
  age: number,                         // ✅ Sent
  gender: string,                      // ✅ Sent
  financial_relationship: string,      // ✅ Sent
  preferred_explanation_style: string, // ✅ Sent
  ai_trust_instinct: string,          // ✅ Sent
  ai_fairness_stance: string          // ✅ Sent
}
```

#### **Backend Receives:**
```python
# /backend/app/api/experiment_clean.py
class SessionCreate(BaseModel):
    consent_given: bool                      # ✅ Received
    age: int                                 # ✅ Received
    gender: str                              # ✅ Received
    financial_relationship: str              # ✅ Received
    preferred_explanation_style: str         # ✅ Received
    ai_trust_instinct: str                   # ✅ Received
    ai_fairness_stance: str                  # ✅ Received
    # Legacy fields (optional)
    participant_background: Optional[str]    # ✅ Received
    credit_experience: Optional[str]         # ✅ Received
    ai_familiarity: Optional[int]            # ✅ Received
```

#### **Supabase Service Saves:**
```python
# /backend/app/services/supabase_service.py (JUST FIXED!)
clean_record = {
    'session_id': ...,
    'consent_given': ...,
    'age': session_record.get('age'),                              # ✅ NOW SAVED
    'gender': session_record.get('gender'),                        # ✅ NOW SAVED
    'financial_relationship': session_record.get('financial_relationship'),  # ✅ NOW SAVED
    'preferred_explanation_style': session_record.get('preferred_explanation_style'),  # ✅ NOW SAVED
    'ai_trust_instinct': session_record.get('ai_trust_instinct'),  # ✅ NOW SAVED
    'ai_fairness_stance': session_record.get('ai_fairness_stance'), # ✅ NOW SAVED
    # Legacy fields
    'participant_background': ...,                                 # ✅ SAVED
    'credit_experience': ...,                                      # ✅ SAVED
    'ai_familiarity': ...,                                         # ✅ SAVED
}
```

#### **Database Schema:**
```sql
-- /backend/migrations/FINAL_CLEAN_SCHEMA.sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- ❌ MISSING NEW FIELDS:
    -- age INTEGER                          ❌ NOT IN SCHEMA
    -- gender TEXT                          ❌ NOT IN SCHEMA
    -- financial_relationship TEXT          ❌ NOT IN SCHEMA
    -- ai_trust_instinct TEXT               ❌ NOT IN SCHEMA
    -- ai_fairness_stance TEXT              ❌ NOT IN SCHEMA
    
    -- ✅ OLD FIELDS (still present):
    participant_background TEXT,            -- ✅ EXISTS
    credit_experience TEXT,                 -- ✅ EXISTS
    ai_familiarity INTEGER,                 -- ✅ EXISTS
    preferred_explanation_style TEXT,       -- ✅ EXISTS
    background_notes TEXT DEFAULT '',       -- ✅ EXISTS
    
    -- Session tracking
    completed BOOLEAN DEFAULT FALSE,
    current_step TEXT DEFAULT 'consent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

---

### **2. Layer Ratings (After Each Layer)**

#### **Frontend Collects:**
```typescript
// /frontend/app/experiment/personas/[personaId]/layers/LayersClient.tsx
interface LayerRating {
  understanding: number          // 1-5 Likert scale  ✅ Collected
  communicability: number        // 1-5 Likert scale  ✅ Collected
  cognitive_load: number         // 1-5 Likert scale  ✅ Collected
  comment: string               // Optional text     ✅ Collected
  time_spent_seconds: number    // Auto-tracked      ✅ Collected
}
```

#### **Frontend Sends:**
```javascript
POST /api/v1/experiment/rate-layer
{
  session_id: string,
  persona_id: string,
  layer_number: number,
  layer_name: string,
  understanding_rating: number,      // ✅ Sent
  communicability_rating: number,    // ✅ Sent
  cognitive_load_rating: number,     // ✅ Sent
  comment: string,                   // ✅ Sent
  time_spent_seconds: number         // ✅ Sent
}
```

#### **Database Schema:**
```sql
CREATE TABLE layer_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    layer_number INTEGER NOT NULL,
    layer_name TEXT NOT NULL,
    understanding_rating INTEGER NOT NULL,      -- ✅ EXISTS
    communicability_rating INTEGER NOT NULL,    -- ✅ EXISTS
    cognitive_load_rating INTEGER NOT NULL,     -- ✅ EXISTS
    comment TEXT DEFAULT '',                    -- ✅ EXISTS
    time_spent_seconds INTEGER DEFAULT 0,       -- ✅ EXISTS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, persona_id, layer_number)
);
```

**STATUS:** ✅ **FULLY ALIGNED** - All layer rating fields match!

---

### **3. Post-Questionnaire (After Each Persona)**

#### **Frontend Collects:**
```typescript
// /frontend/app/experiment/personas/[personaId]/questionnaire/QuestionnaireClient.tsx
{
  most_helpful_layer: string,        // layer_1 to layer_4  ✅ Collected
  most_trusted_layer: string,        // layer_1 to layer_4  ✅ Collected
  best_for_customer: string,         // layer_1 to layer_4  ✅ Collected
  overall_intuitiveness: number,     // 1-5 Likert scale    ✅ Collected
  ai_usefulness: number,             // 1-5 Likert scale    ✅ Collected
  improvement_suggestions: string    // Optional text       ✅ Collected
}
```

#### **Frontend Sends:**
```javascript
POST /api/v1/experiment/post-questionnaire
{
  session_id: string,
  persona_id: string,
  most_helpful_layer: string,        // ✅ Sent
  most_trusted_layer: string,        // ✅ Sent
  best_for_customer: string,         // ✅ Sent
  overall_intuitiveness: number,     // ✅ Sent
  ai_usefulness: number,             // ✅ Sent
  improvement_suggestions: string    // ✅ Sent
}
```

#### **Database Schema:**
```sql
CREATE TABLE post_questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    most_helpful_layer TEXT NOT NULL,          -- ✅ EXISTS
    most_trusted_layer TEXT NOT NULL,          -- ✅ EXISTS
    best_for_customer TEXT NOT NULL,           -- ✅ EXISTS
    overall_intuitiveness INTEGER NOT NULL,    -- ✅ EXISTS
    ai_usefulness INTEGER NOT NULL,            -- ✅ EXISTS
    improvement_suggestions TEXT DEFAULT '',   -- ✅ EXISTS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, persona_id)
);
```

**STATUS:** ✅ **FULLY ALIGNED** - All post-questionnaire fields match!

---

## 🚨 CRITICAL ISSUES IDENTIFIED

### **Issue #1: Missing Database Columns**
**Severity:** 🔴 **CRITICAL**  
**Impact:** All new questionnaire data is being DROPPED

**Missing columns in `sessions` table:**
```sql
-- NEED TO ADD:
age INTEGER CHECK (age >= 18 AND age <= 99),
gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
financial_relationship TEXT CHECK (financial_relationship IN ('novice', 'consumer', 'financial_literate')),
ai_trust_instinct TEXT CHECK (ai_trust_instinct IN ('automation_bias', 'algorithm_aversion', 'neutral')),
ai_fairness_stance TEXT CHECK (ai_fairness_stance IN ('skeptic', 'conditional', 'optimist')),
```

**Evidence:**
- ✅ Frontend sends these fields
- ✅ Backend receives these fields
- ✅ Supabase service tries to save these fields (JUST FIXED)
- ❌ Database rejects them (columns don't exist)
- ❌ Data is silently dropped

---

### **Issue #2: Schema Documentation Out of Date**
**Severity:** 🟡 **MEDIUM**  
**Impact:** Confusion, maintenance issues

**Problem:**
- `FINAL_CLEAN_SCHEMA.sql` is outdated (dated 2025-12-02)
- Does not reflect current questionnaire design
- Comments mention "4 layers" but we have 6 layers now (Layer 0-5)
- Missing new demographic fields

---

## ✅ FIXES APPLIED

### **Fix #1: Supabase Service Updated** ✅ COMPLETED
**File:** `/backend/app/services/supabase_service.py`  
**Commit:** `e5eb8e6`

**What was fixed:**
- Added all new questionnaire fields to `clean_record`
- Now saves: age, gender, financial_relationship, ai_trust_instinct, ai_fairness_stance
- Maintains backward compatibility with legacy fields

**Status:** ✅ **DEPLOYED** (Railway auto-deploy)

---

## 🔧 FIXES REQUIRED

### **Fix #2: Update Database Schema** ⚠️ **REQUIRED**
**Priority:** 🔴 **CRITICAL - MUST RUN IMMEDIATELY**

**Action Required:**
Run this SQL in Supabase SQL Editor:

```sql
-- Add missing columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 18 AND age <= 99);

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS gender TEXT 
CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS financial_relationship TEXT 
CHECK (financial_relationship IN ('novice', 'consumer', 'financial_literate'));

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS ai_trust_instinct TEXT 
CHECK (ai_trust_instinct IN ('automation_bias', 'algorithm_aversion', 'neutral'));

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS ai_fairness_stance TEXT 
CHECK (ai_fairness_stance IN ('skeptic', 'conditional', 'optimist'));

-- Add comments for documentation
COMMENT ON COLUMN sessions.age IS 'Participant age (18-99)';
COMMENT ON COLUMN sessions.gender IS 'Participant gender for demographic analysis';
COMMENT ON COLUMN sessions.financial_relationship IS 'Relationship with financial decision-making';
COMMENT ON COLUMN sessions.ai_trust_instinct IS 'Initial trust stance toward AI systems';
COMMENT ON COLUMN sessions.ai_fairness_stance IS 'Belief about AI fairness and bias';
```

**After running this:**
- ✅ New sessions will save all questionnaire data
- ✅ Gender/age will appear in Manage Data table
- ✅ Demographic analysis will have complete data
- ❌ Old sessions will still have NULL values (they don't have this data)

---

### **Fix #3: Update Schema Documentation** 📝 **RECOMMENDED**
**Priority:** 🟡 **MEDIUM**

**Action Required:**
Update `/backend/migrations/FINAL_CLEAN_SCHEMA.sql` to:
1. Include all new questionnaire fields
2. Update layer count (6 layers, not 4)
3. Update date to current
4. Add comprehensive comments

---

## 📊 DATA INTEGRITY VERIFICATION

### **Test Plan:**

1. **Run database migration** (Fix #2 above)
2. **Create new test session:**
   - Go to `/experiment/start`
   - Fill out all questionnaire fields
   - Submit
3. **Verify in Supabase:**
   - Check `sessions` table
   - Verify age, gender, financial_relationship, etc. are populated
4. **Verify in Manage Data:**
   - Go to `/results`
   - Check "Manage Data" tab
   - Verify gender shows as ♂️ Male / ♀️ Female / ⚧️ Non-binary
5. **Complete full persona flow:**
   - Rate all 6 layers
   - Submit post-questionnaire
   - Verify all data in database

---

## 📈 EXPECTED RESULTS AFTER FIXES

### **Database State:**

| Table | Fields | Status |
|-------|--------|--------|
| **sessions** | consent_given, age, gender, financial_relationship, preferred_explanation_style, ai_trust_instinct, ai_fairness_stance, participant_background (legacy), credit_experience (legacy), ai_familiarity (legacy) | ✅ **COMPLETE** (after migration) |
| **predictions** | session_id, persona_id, decision, probability, shap_values, input_features | ✅ **COMPLETE** |
| **layer_ratings** | session_id, persona_id, layer_number, layer_name, understanding_rating, communicability_rating, cognitive_load_rating, comment, time_spent_seconds | ✅ **COMPLETE** |
| **post_questionnaires** | session_id, persona_id, most_helpful_layer, most_trusted_layer, best_for_customer, overall_intuitiveness, ai_usefulness, improvement_suggestions | ✅ **COMPLETE** |

### **Data Collection:**

| Questionnaire | Fields Collected | Fields Saved | Status |
|---------------|------------------|--------------|--------|
| **Initial Session** | 6 new + 4 legacy = 10 fields | 10 fields | ✅ **COMPLETE** (after migration) |
| **Layer Ratings** | 5 fields × 6 layers × 2 personas = 60 data points | 60 data points | ✅ **COMPLETE** |
| **Post-Questionnaire** | 6 fields × 2 personas = 12 data points | 12 data points | ✅ **COMPLETE** |
| **TOTAL per participant** | 82 data points | 82 data points | ✅ **100% COVERAGE** |

---

## 🎯 SUMMARY

### **Current Status:**
- ✅ Frontend: Collecting all data correctly
- ✅ Backend: Receiving all data correctly
- ✅ Supabase Service: Saving all data correctly (JUST FIXED)
- ❌ Database Schema: Missing columns (NEEDS MIGRATION)

### **Action Items:**
1. ⚠️ **CRITICAL:** Run database migration (Fix #2) - **DO THIS NOW**
2. 🧪 **TEST:** Create new session and verify data is saved
3. 📝 **OPTIONAL:** Update schema documentation (Fix #3)

### **After Fixes:**
- ✅ 100% data collection coverage
- ✅ All questionnaire responses saved
- ✅ Full demographic analysis possible
- ✅ Research study data integrity guaranteed

---

**END OF AUDIT**
