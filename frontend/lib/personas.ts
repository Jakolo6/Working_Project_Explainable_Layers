// Persona definitions and prefilled application data for the experiment

export type PersonaId = 'elderly-woman' | 'young-entrepreneur'

export interface PersonaInfo {
  id: PersonaId
  name: string
  age: number
  occupation: string
  loanAmount: number
  loanPurpose: string
  description: string
}

export interface ApplicationData {
  // Demographics
  age: number
  sex: string
  
  // Financial Status
  checking_account_status: string
  savings_account: string
  credit_amount: number
  duration_months: number
  
  // Employment & Housing
  employment_status: string
  present_residence_since: number
  property: string
  housing: string
  
  // Credit History
  credit_history: string
  purpose: string
  installment_rate: number
  existing_credits: number
  
  // Other
  other_debtors: string
  other_installment_plans: string
  job: string
  num_dependents: number
  telephone: string
  foreign_worker: string
}

export const PERSONAS: Record<PersonaId, PersonaInfo> = {
  'elderly-woman': {
    id: 'elderly-woman',
    name: 'Maria',
    age: 35,
    occupation: 'Skilled Employee',
    loanAmount: 3600,
    loanPurpose: 'Furniture purchase',
    description: 'Maria is a 35-year-old skilled employee who wants to borrow €3,600 for furniture over 24 months. She has a modest checking account (€0-200), decent savings (€100-500), owns her home, and has paid back existing credits. With stable employment (4-7 years) but no guarantor and a moderate loan burden, she represents a BORDERLINE APPROVED case (~60% confidence) - the model narrowly approves due to employment stability and homeownership, despite some financial concerns.',
  },
  'young-entrepreneur': {
    id: 'young-entrepreneur',
    name: 'Jonas',
    age: 26,
    occupation: 'Unskilled Resident',
    loanAmount: 4200,
    loanPurpose: 'Furniture purchase',
    description: 'Jonas is a 26-year-old unskilled worker who wants to borrow €4,200 for furniture over 24 months. He has an overdrawn checking account (< €0), minimal savings (< €100), no property, and is renting. He has some employment history (1-4 years) and a history of delayed payments, but with a manageable loan amount and moderate installment burden (20-25%). This represents a BORDERLINE REJECTED case (~48% confidence) - the model narrowly rejects due to current financial stress, despite some mitigating factors.',
  },
}

// Prefilled application data for each persona
// Based on German Credit Dataset attributes
export const PERSONA_APPLICATIONS: Record<PersonaId, ApplicationData> = {
  // BORDERLINE APPROVED - Maria (~60% confidence)
  // Mixed factors - narrowly approved
  'elderly-woman': {
    // SHAP Features - Balanced signals, slightly more positive
    age: 35,                                    // Mature age (positive)
    checking_account_status: '0 to 200 DM',    // Modest checking (neutral)
    savings_account: '100 to 500 DM',          // Decent savings (mild positive)
    credit_amount: 3600,                        // Moderate amount (neutral)
    duration_months: 24,                        // Moderate duration (mild negative)
    employment_status: '4 to 7 years',          // Good employment (positive)
    present_residence_since: 3,                 // Moderate stability (neutral)
    property: 'car or other',                   // Some assets (mild positive)
    housing: 'own',                             // Homeowner (positive)
    credit_history: 'existing credits paid back duly', // Good credit history (positive, not dominant)
    purpose: 'furniture/equipment',             // Standard purpose (neutral)
    installment_rate: 2,                        // Moderate burden (20-25%) (mild negative)
    existing_credits: 1,                        // Some existing debt (neutral)
    other_debtors: 'none',                      // No guarantor (mild negative)
    other_installment_plans: 'none',            // No other obligations (neutral)
    job: 'skilled employee / official',         // Skilled job (positive)
    
    // Excluded Features (not in SHAP) - Set to neutral
    sex: 'female',                              // Excluded for fairness
    num_dependents: 1,                          // Neutral (average)
    telephone: 'yes',                           // Neutral
    foreign_worker: 'no',                       // Excluded for fairness
  },
  
  // BORDERLINE REJECTED - Jonas (~48% confidence)
  // Mixed factors - narrowly rejected
  'young-entrepreneur': {
    // SHAP Features - Balanced signals, slightly more negative
    age: 26,                                    // Young adult (neutral)
    checking_account_status: 'less than 0 DM', // Overdrawn (negative)
    savings_account: 'less than 100 DM',       // Minimal savings (negative)
    credit_amount: 4200,                        // Manageable amount (mild positive)
    duration_months: 24,                        // Moderate duration (neutral)
    employment_status: '1 to 4 years',          // Some employment (mild positive)
    present_residence_since: 2,                 // Some stability (neutral)
    property: 'unknown/no property',            // No assets (negative)
    housing: 'rent',                            // Renting (negative)
    credit_history: 'delay in paying off in the past', // Delayed payments (mild negative, not dominant)
    purpose: 'furniture/equipment',             // Standard purpose (neutral)
    installment_rate: 3,                        // Moderate burden (20-25%) (mild negative)
    existing_credits: 2,                        // Some existing debt (mild negative)
    other_debtors: 'none',                      // No guarantor (mild negative)
    other_installment_plans: 'none',            // No other obligations (neutral)
    job: 'unskilled - resident',                // Lower skill level (negative)
    
    // Excluded Features (not in SHAP) - Set to neutral
    sex: 'male',                                // Excluded for fairness
    num_dependents: 1,                          // Neutral (average)
    telephone: 'yes',                           // Neutral
    foreign_worker: 'no',                       // Excluded for fairness
  },
}

// Fields that participants can adjust
// All fields are editable to allow full exploration of the model
export const ADJUSTABLE_FIELDS = [
  'age',
  'checking_account_status',
  'savings_account',
  'credit_amount',
  'duration_months',
  'employment_status',
  'present_residence_since',
  'property',
  'housing',
  'credit_history',
  'purpose',
  'installment_rate',
  'existing_credits',
  'other_debtors',
  'other_installment_plans',
  'job',
  'num_dependents',
  'telephone'
  // Note: sex and foreign_worker excluded to prevent bias manipulation
]

// Helper to get persona by ID
export function getPersona(id: string): PersonaInfo | null {
  return PERSONAS[id as PersonaId] || null
}

// Helper to get application data by persona ID
export function getPersonaApplication(id: string): ApplicationData | null {
  return PERSONA_APPLICATIONS[id as PersonaId] || null
}
