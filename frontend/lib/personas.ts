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
    age: 24,
    occupation: 'Unskilled Resident',
    loanAmount: 7200,
    loanPurpose: 'Furniture purchase',
    description: 'Jonas is a 24-year-old unskilled worker who wants to borrow €7,200 for furniture. He has an overdrawn checking account (< €0), minimal savings (< €100), no property, and is renting. He recently started a new job (< 1 year), has a history of delayed payments, and is requesting a 48-month loan with high installment burden (≥35%). This represents a BORDERLINE REJECTED case (~45% confidence) - the model barely rejects his application due to accumulated risk factors.',
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
    age: 24,                                    // Younger age (less stable)
    checking_account_status: 'less than 0 DM', // Overdrawn (negative)
    savings_account: 'less than 100 DM',       // Minimal savings (negative)
    credit_amount: 7200,                        // Higher amount (negative)
    duration_months: 48,                        // Much longer duration (negative)
    employment_status: 'less than 1 year',      // New job (negative)
    present_residence_since: 1,                 // Low stability
    property: 'unknown/no property',            // No assets (negative)
    housing: 'rent',                            // Renting (negative)
    credit_history: 'delay in paying off in the past', // Some payment issues (negative)
    purpose: 'furniture/equipment',             // Less practical purpose
    installment_rate: 4,                        // High burden (>=35%)
    existing_credits: 3,                        // More existing debt (negative)
    other_debtors: 'none',                      // No guarantor (negative)
    other_installment_plans: 'bank',            // Other obligations (negative)
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
