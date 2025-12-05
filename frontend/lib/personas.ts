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
    loanAmount: 2500,
    loanPurpose: 'Used car purchase',
    description: 'Maria is a 35-year-old skilled employee who wants to borrow €2,500 for a reliable used car. She has stable employment, good savings, and an excellent payment history. This represents a LOW RISK profile.',
  },
  'young-entrepreneur': {
    id: 'young-entrepreneur',
    name: 'Jonas',
    age: 23,
    occupation: 'Recently Employed',
    loanAmount: 15000,
    loanPurpose: 'Business start-up',
    description: 'Jonas is a 23-year-old who wants to borrow €15,000 to start a business. He has limited employment history, minimal savings, and an overdrawn checking account. This represents a HIGH RISK profile.',
  },
}

// Prefilled application data for each persona
// Based on German Credit Dataset attributes
export const PERSONA_APPLICATIONS: Record<PersonaId, ApplicationData> = {
  // LOW RISK PROFILE - Maria
  // Designed to get APPROVED with high confidence
  'elderly-woman': {
    // SHAP Features (shown to user) - All favorable
    age: 35,                                    // Stable age
    checking_account_status: '200 DM or more', // Excellent cash flow
    savings_account: '1000 DM or more',        // Strong safety net
    credit_amount: 2500,                        // Modest, manageable amount
    duration_months: 12,                        // Short duration (low risk)
    employment_status: '7 years or more',       // Very stable employment
    present_residence_since: 4,                 // Established residence
    property: 'real estate',                    // Owns property (collateral)
    housing: 'own',                             // Homeowner (stability)
    credit_history: 'all credits paid back duly', // Perfect payment history
    purpose: 'car (used)',                      // Practical, low-risk purpose
    installment_rate: 1,                        // Low burden (< 20%)
    existing_credits: 1,                        // Minimal existing debt
    other_debtors: 'guarantor',                 // Has guarantor (security)
    other_installment_plans: 'none',            // No other obligations
    job: 'management/self-employed',            // High earning capacity
    
    // Excluded Features (not in SHAP) - Set to neutral
    sex: 'female',                              // Excluded for fairness
    num_dependents: 1,                          // Neutral (average)
    telephone: 'yes',                           // Neutral
    foreign_worker: 'no',                       // Excluded for fairness
  },
  
  // HIGH RISK PROFILE - Jonas
  // Designed to get REJECTED or low confidence approval
  'young-entrepreneur': {
    // SHAP Features (shown to user) - All unfavorable
    age: 23,                                    // Young (less stability)
    checking_account_status: 'less than 0 DM', // Overdrawn (financial stress)
    savings_account: 'less than 100 DM',       // Minimal safety net
    credit_amount: 15000,                       // Large amount
    duration_months: 48,                        // Long duration (high risk)
    employment_status: 'less than 1 year',      // Unstable employment
    present_residence_since: 1,                 // Recently moved
    property: 'unknown/no property',            // No collateral
    housing: 'rent',                            // No homeownership
    credit_history: 'delay in paying off in the past', // Payment issues
    purpose: 'business',                        // High-risk purpose
    installment_rate: 4,                        // High burden (≥ 35%)
    existing_credits: 3,                        // Multiple existing debts
    other_debtors: 'none',                      // No guarantor
    other_installment_plans: 'bank',            // Other payment obligations
    job: 'unskilled - resident',                // Lower earning potential
    
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
