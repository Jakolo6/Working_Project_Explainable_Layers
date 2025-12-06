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
    description: 'Maria is a 35-year-old skilled employee who wants to borrow €3,600 for furniture over 18 months. She has a modest checking account (€0-200), some savings (€100-500), and owns her home. With stable employment (4-7 years) and minimal existing debt, she represents a BORDERLINE APPROVED case (~53% confidence) - the model barely approves her application.',
  },
  'young-entrepreneur': {
    id: 'young-entrepreneur',
    name: 'Jonas',
    age: 26,
    occupation: 'Unskilled Resident',
    loanAmount: 5400,
    loanPurpose: 'Furniture purchase',
    description: 'Jonas is a 26-year-old unskilled worker who wants to borrow €5,400 for furniture over 36 months. He has an overdrawn checking account (< €0), minimal savings (< €100), no property, and is renting. He has some employment history (1-4 years) but a history of delayed payments, with moderate-high installment burden (25-35%). This represents a BORDERLINE REJECTED case (~48% confidence) - the model barely rejects his application due to accumulated risk factors.',
  },
}

// Prefilled application data for each persona
// Based on German Credit Dataset attributes
export const PERSONA_APPLICATIONS: Record<PersonaId, ApplicationData> = {
  // BORDERLINE APPROVED - Maria
  // Mix of positive and negative factors - barely gets approved
  'elderly-woman': {
    // SHAP Features - Mixed signals, slightly more positive
    age: 35,                                    // More mature age (positive)
    checking_account_status: '0 to 200 DM',    // Some savings, not great
    savings_account: '100 to 500 DM',          // Modest savings
    credit_amount: 3600,                        // Lower amount (positive)
    duration_months: 18,                        // Shorter duration (positive)
    employment_status: '4 to 7 years',          // Better employment history (positive)
    present_residence_since: 3,                 // More stability (positive)
    property: 'car or other',                   // Some assets, not property
    housing: 'own',                             // Homeowner (positive)
    credit_history: 'existing credits paid back duly', // Good but not perfect
    purpose: 'furniture/equipment',             // Moderate risk purpose
    installment_rate: 2,                        // Moderate burden (20-25%)
    existing_credits: 1,                        // Less existing debt (positive)
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
    age: 26,                                    // Slightly older (less negative)
    checking_account_status: 'less than 0 DM', // Overdrawn (negative)
    savings_account: 'less than 100 DM',       // Minimal savings (negative)
    credit_amount: 5400,                        // Lower amount (less negative)
    duration_months: 36,                        // Shorter duration (less negative)
    employment_status: '1 to 4 years',          // Better employment (less negative)
    present_residence_since: 2,                 // More stability (less negative)
    property: 'unknown/no property',            // No assets (negative)
    housing: 'rent',                            // Renting (negative)
    credit_history: 'delay in paying off in the past', // Some payment issues (negative)
    purpose: 'furniture/equipment',             // Less practical purpose
    installment_rate: 3,                        // Moderate-high burden (25-35%)
    existing_credits: 2,                        // Less existing debt (less negative)
    other_debtors: 'none',                      // No guarantor (negative)
    other_installment_plans: 'none',            // No other obligations (positive)
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
