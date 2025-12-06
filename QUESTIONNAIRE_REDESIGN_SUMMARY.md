# Pre-Experiment Questionnaire Redesign

## Summary

Completely redesigned the pre-experiment questionnaire from a 5-question professional background survey to a comprehensive 3-section assessment covering demographics, experience, and AI trust/ethics.

---

## Changes Overview

### **OLD Questionnaire** ❌

1. Professional background (banking/data/student/other)
2. Credit experience (none/some/regular/expert)
3. AI familiarity (1-5 Likert scale)
4. Preferred explanation style
5. Background notes (optional free text)

### **NEW Questionnaire** ✅

**Section 1: Demographics**
- Age (18-99, number input)
- Gender (female/male/non_binary, dropdown)

**Section 2: Experience & Preferences**
- Financial relationship (novice/consumer/financial_literate)
- Preferred explanation style (technical/visual/narrative/action)

**Section 3: Trust & Ethics**
- AI trust instinct (automation_bias/algorithm_aversion/neutral)
- AI fairness stance (skeptic/conditional/optimist)

---

## Detailed Field Mapping

### Section 1: Demographics

#### **Age**
- **Type:** Number input
- **Validation:** 18-99
- **Required:** Yes
- **UI:** Text input with placeholder "18-99"

#### **Gender**
- **Type:** Dropdown
- **Options:**
  - `female` → "Female"
  - `male` → "Male"
  - `non_binary` → "Non-binary"
- **Required:** Yes
- **UI:** Select dropdown

**Layout:** These two fields render **side-by-side** on desktop (grid-cols-2)

---

### Section 2: Experience & Preferences

#### **Financial Relationship**
- **Question:** "Which best describes your relationship with financial decision-making?"
- **Options:**
  - `novice` → "Layperson (No professional knowledge)"
  - `consumer` → "Borrower (I have applied for loans myself)"
  - `financial_literate` → "Financial Background (Student, Consultant, or Analyst)"
- **Required:** Yes
- **UI:** Radio buttons

#### **Preferred Explanation Style**
- **Question:** "Before seeing any explanations, which style do you think you would prefer?"
- **Options:**
  - `technical` → "Technical (raw numbers)"
  - `visual` → "Visual (interactive charts, graphs, distributions)"
  - `narrative` → "Narrative (natural language, storytelling)"
  - `action` → "Action-oriented (what needs to change?)"
- **Required:** Yes
- **UI:** Radio buttons

---

### Section 3: Trust & Ethics

#### **AI Trust Instinct**
- **Question:** "Imagine an AI rejects a loan applicant that you personally liked. What is your immediate instinct?"
- **Options:**
  - `automation_bias` → "Trust the AI (I likely missed a risk factor)"
  - `algorithm_aversion` → "Doubt the AI (It is likely biased or missing context)"
  - `neutral` → "Neutral (I need to see the evidence first)"
- **Required:** Yes
- **UI:** Radio buttons
- **Purpose:** Measures automation bias vs algorithm aversion

#### **AI Fairness Stance**
- **Question:** "What is your general stance on the fairness of AI in banking?"
- **Options:**
  - `skeptic` → "Skeptical: AI often reinforces historical discrimination"
  - `conditional` → "Cautious: AI can be fair, but only with strict human oversight"
  - `optimist` → "Optimistic: AI is generally more objective than humans"
- **Required:** Yes
- **UI:** Radio buttons
- **Purpose:** Measures general AI fairness beliefs

---

## Database Schema Changes

### **Supabase Migration:** `UPDATE_QUESTIONNAIRE_SCHEMA.sql`

#### New Columns Added:
```sql
ALTER TABLE sessions
  ADD COLUMN age INTEGER,
  ADD COLUMN gender TEXT,
  ADD COLUMN financial_relationship TEXT,
  ADD COLUMN ai_trust_instinct TEXT,
  ADD COLUMN ai_fairness_stance TEXT;
```

#### Constraints Added:
```sql
-- Age: 18-99
CHECK (age IS NULL OR (age >= 18 AND age <= 99))

-- Gender: female, male, non_binary
CHECK (gender IS NULL OR gender IN ('female', 'male', 'non_binary'))

-- Financial Relationship: novice, consumer, financial_literate
CHECK (financial_relationship IS NULL OR financial_relationship IN ('novice', 'consumer', 'financial_literate'))

-- AI Trust Instinct: automation_bias, algorithm_aversion, neutral
CHECK (ai_trust_instinct IS NULL OR ai_trust_instinct IN ('automation_bias', 'algorithm_aversion', 'neutral'))

-- AI Fairness Stance: skeptic, conditional, optimist
CHECK (ai_fairness_stance IS NULL OR ai_fairness_stance IN ('skeptic', 'conditional', 'optimist'))
```

#### Backward Compatibility:
- Old columns (`participant_background`, `credit_experience`, `ai_familiarity`, `background_notes`) are **kept** but made **nullable**
- This allows existing data to remain valid
- New sessions will use new fields, old sessions will have NULL in new fields
- No data migration required

---

## Files Modified

### **Frontend**

#### 1. `/frontend/app/experiment/start/page.tsx` ✅
**Changes:**
- Updated `SessionForm` interface with new fields
- Replaced old option constants with new ones
- Updated form validation logic
- Completely redesigned form JSX with 3 sections
- Age/Gender rendered side-by-side
- Added section headers and visual separators

**Before:** 5 questions, professional focus
**After:** 6 questions, 3 sections (Demographics, Experience, Trust)

#### 2. `/frontend/app/results/page.tsx` ⚠️
**Status:** Needs update
**Required Changes:**
- Update stats interface to include new fields
- Update demographic display sections
- Add new visualizations for trust/ethics data

---

### **Backend**

#### 1. `/backend/app/api/experiment_clean.py` ✅
**Changes:**
- Updated `SessionCreate` Pydantic model
- Added new required fields (age, gender, etc.)
- Made old fields optional for backward compatibility
- Updated session record creation to include new fields

**Before:**
```python
class SessionCreate(BaseModel):
    consent_given: bool
    participant_background: str
    credit_experience: str
    ai_familiarity: int
    preferred_explanation_style: str
    background_notes: Optional[str] = ''
```

**After:**
```python
class SessionCreate(BaseModel):
    consent_given: bool
    # Section 1: Demographics
    age: int
    gender: str
    # Section 2: Experience & Preferences
    financial_relationship: str
    preferred_explanation_style: str
    # Section 3: Trust & Ethics
    ai_trust_instinct: str
    ai_fairness_stance: str
    # Legacy fields (optional)
    participant_background: Optional[str] = None
    credit_experience: Optional[str] = None
    ai_familiarity: Optional[int] = None
    background_notes: Optional[str] = None
```

---

## Migration Steps

### **Step 1: Run Supabase Migration** 🗄️

```sql
-- In Supabase SQL Editor, run:
-- backend/migrations/UPDATE_QUESTIONNAIRE_SCHEMA.sql
```

This will:
1. Add new columns to `sessions` table
2. Add constraints for data validation
3. Make old columns nullable
4. Preserve existing data

### **Step 2: Deploy Backend** 🚀

The backend API is already updated to accept both old and new fields, ensuring backward compatibility.

### **Step 3: Deploy Frontend** 🎨

The frontend now sends the new questionnaire fields. Old sessions remain valid.

### **Step 4: Verify** ✅

Test the flow:
1. Go to `/experiment/start`
2. Fill out new questionnaire
3. Check Supabase to verify new fields are populated
4. Verify old sessions still display correctly

---

## Research Benefits

### **Why This Redesign?**

#### **1. Demographics (Age/Gender)**
- **Purpose:** Control variables for analysis
- **Benefit:** Can segment results by age groups and gender
- **Example:** "Do younger participants prefer visual explanations?"

#### **2. Financial Relationship**
- **Purpose:** More nuanced than old "professional background"
- **Benefit:** Captures actual relationship with loans
- **Options:**
  - **Novice:** No professional knowledge
  - **Consumer:** Personal loan experience
  - **Financial Literate:** Professional/academic background
- **Example:** "Do borrowers trust AI differently than analysts?"

#### **3. AI Trust Instinct (Automation Bias vs Algorithm Aversion)**
- **Purpose:** Measure pre-existing bias toward/against AI
- **Benefit:** Can correlate with layer preferences
- **Hypothesis:** People with automation bias may prefer technical layers
- **Example:** "Do algorithm-averse participants rate narrative layers higher?"

#### **4. AI Fairness Stance**
- **Purpose:** Measure general AI ethics beliefs
- **Benefit:** Can correlate with fairness ratings
- **Hypothesis:** Skeptics may rate all layers lower on fairness
- **Example:** "Do optimists have higher reliance intention scores?"

---

## Analysis Possibilities

### **New Research Questions Enabled:**

1. **Age Effects:**
   - Do younger participants prefer interactive dashboards?
   - Do older participants prefer narrative explanations?

2. **Gender Differences:**
   - Are there gender differences in AI trust?
   - Do different genders prefer different explanation styles?

3. **Financial Relationship:**
   - Do borrowers (consumers) rate explanations differently than analysts?
   - Does personal loan experience affect trust in AI?

4. **Automation Bias:**
   - Do automation-biased participants rate all layers higher?
   - Is automation bias correlated with preferred explanation style?

5. **Algorithm Aversion:**
   - Do algorithm-averse participants prefer narrative over technical?
   - Is algorithm aversion correlated with lower fairness ratings?

6. **AI Fairness Stance:**
   - Do skeptics rate the dashboard lower on fairness?
   - Do optimists have higher reliance intention?

---

## Data Export for Analysis

### **SQL Query for New Fields:**

```sql
SELECT 
    session_id,
    -- Demographics
    age,
    gender,
    -- Experience
    financial_relationship,
    preferred_explanation_style,
    -- Trust & Ethics
    ai_trust_instinct,
    ai_fairness_stance,
    -- Metadata
    created_at,
    completed
FROM sessions
WHERE age IS NOT NULL  -- Only new questionnaire responses
ORDER BY created_at DESC;
```

### **Correlation Analysis:**

```sql
-- Example: AI trust instinct vs average fairness ratings
SELECT 
    s.ai_trust_instinct,
    AVG(r.fairness) as avg_fairness_rating,
    COUNT(*) as n
FROM sessions s
JOIN layer_ratings r ON s.session_id = r.session_id
WHERE s.ai_trust_instinct IS NOT NULL
GROUP BY s.ai_trust_instinct;
```

---

## TODO / Next Steps

### **Immediate (Required for Launch):**
- [ ] Run Supabase migration
- [ ] Test new questionnaire flow end-to-end
- [ ] Verify data is being stored correctly

### **Soon (Before Data Collection):**
- [ ] Update results page to display new fields
- [ ] Add new demographic visualizations
- [ ] Update data export scripts

### **Later (After Data Collection):**
- [ ] Drop old columns (participant_background, credit_experience, etc.)
- [ ] Clean up legacy code references
- [ ] Update documentation

---

## Backward Compatibility

✅ **Fully backward compatible!**

- Old sessions remain valid (have NULL in new fields)
- New sessions have NULL in old fields
- Both can coexist in the database
- Results page can handle both (with updates)
- No data loss or migration required

---

## Testing Checklist

- [ ] New questionnaire renders correctly
- [ ] Age validation works (18-99)
- [ ] Gender dropdown works
- [ ] All radio buttons work
- [ ] Form validation catches missing fields
- [ ] Session creation succeeds
- [ ] Data appears in Supabase with correct values
- [ ] Old sessions still display in results page
- [ ] New sessions display in results page

---

## Summary

**Old:** 5-question professional background survey
**New:** 6-question comprehensive assessment (Demographics + Experience + Trust/Ethics)

**Research Value:** Enables analysis of age, gender, financial relationship, automation bias, algorithm aversion, and AI fairness beliefs as predictors of explanation preferences.

**Implementation:** Clean, backward-compatible migration with no data loss.

**Status:** Frontend ✅ | Backend ✅ | Database Migration Ready ✅ | Results Page ⚠️ (needs update)
