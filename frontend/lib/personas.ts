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
    age: 32,
    occupation: 'Skilled Employee',
    loanAmount: 4800,
    loanPurpose: 'Furniture purchase',
    description: 'Maria is a 32-year-old skilled employee who wants to borrow €4,800 for furniture. She has moderate checking account balance (€0-200), modest savings (€100-500), and owns her home. However, she has a relatively high monthly payment burden and moderate credit amount. This represents a BORDERLINE APPROVED case (53% confidence) - the model barely approves her application.',
  },
  'young-entrepreneur': {
    id: 'young-entrepreneur',
    name: 'Jonas',
    age: 28,
    occupation: 'Skilled Employee',
    loanAmount: 6200,
    loanPurpose: 'Used car purchase',
    description: 'Jonas is a 28-year-old skilled employee who wants to borrow €6,200 for a used car. He has an overdrawn checking account (< €0), modest savings (€100-500), and is renting. His higher loan amount and longer duration create concerns despite his good credit history and practical loan purpose. This represents a BORDERLINE REJECTED case (47% confidence) - the model barely rejects his application.',
  },
}

// Prefilled application data for each persona
// Based on German Credit Dataset attributes
export const PERSONA_APPLICATIONS: Record<PersonaId, ApplicationData> = {
  // BORDERLINE APPROVED - Maria
  // Mix of positive and negative factors - barely gets approved
  'elderly-woman': {
    // SHAP Features - Mixed signals
    age: 32,                                    // Moderate age
    checking_account_status: '0 to 200 DM',    // Some savings, not great
    savings_account: '100 to 500 DM',          // Modest savings
    credit_amount: 4800,                        // Moderate amount
    duration_months: 24,                        // Medium duration
    employment_status: '1 to 4 years',          // Moderate employment history
    present_residence_since: 2,                 // Some stability
    property: 'car or other',                   // Some assets, not property
    housing: 'own',                             // Homeowner (positive)
    credit_history: 'existing credits paid back duly', // Good but not perfect
    purpose: 'furniture/equipment',             // Moderate risk purpose
    installment_rate: 2,                        // Moderate burden (20-25%)
    existing_credits: 2,                        // Some existing debt
    other_debtors: 'none',                      // No guarantor (negative)
    other_installment_plans: 'none',            // No other obligations (positive)
    job: 'skilled employee / official',         // Decent job
    
    // Excluded Features (not in SHAP) - Set to neutral
    sex: 'female',                              // Excluded for fairness
    num_dependents: 1,                          // Neutral (average)
    telephone: 'yes',                           // Neutral
    foreign_worker: 'no',                       // Excluded for fairness
  },
  
  // BORDERLINE REJECTED - Jonas
  // Mix of positive and negative factors - barely gets rejected
  'young-entrepreneur': {
    // SHAP Features - Mixed signals, slightly more negative
    age: 28,                                    // Moderate age
    checking_account_status: 'less than 0 DM', // Overdrawn (negative)
    savings_account: '100 to 500 DM',          // Some savings (positive)
    credit_amount: 6200,                        // Higher amount (negative)
    duration_months: 30,                        // Longer duration (negative)
    employment_status: '1 to 4 years',          // Moderate employment
    present_residence_since: 2,                 // Some stability
    property: 'car or other',                   // Some assets
    housing: 'rent',                            // Renting (negative)
    credit_history: 'existing credits paid back duly', // Good payment history (positive)
    purpose: 'car (used)',                      // Practical purpose (positive)
    installment_rate: 3,                        // Moderate-high burden (25-35%)
    existing_credits: 2,                        // Some existing debt
    other_debtors: 'none',                      // No guarantor (negative)
    other_installment_plans: 'bank',            // Other obligations (negative)
    job: 'skilled employee / official',         // Decent job (positive)
    
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
