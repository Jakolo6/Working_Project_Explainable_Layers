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
    description: 'Maria is a 35-year-old skilled employee who wants to borrow €2,500 for a reliable used car over 12 months. She has a healthy checking account (€200+), excellent savings (€1000+), owns real estate, and has perfect credit history with a guarantor. With stable employment (7+ years) and no existing debt, she represents a CLEAR APPROVED case (~94% confidence) - a low-risk, reliable borrower.',
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
  // CLEAR APPROVED - Maria (~94% confidence)
  // Strong positive factors - low-risk borrower
  'elderly-woman': {
    // SHAP Features - Strong positive signals
    age: 35,                                    // Mature age (positive)
    checking_account_status: '200 DM or more', // Healthy checking account (strong positive)
    savings_account: '1000 DM or more',        // Excellent savings (strong positive)
    credit_amount: 2500,                        // Small amount (positive)
    duration_months: 12,                        // Short duration (positive)
    employment_status: '7 years or more',       // Excellent employment history (strong positive)
    present_residence_since: 4,                 // High stability (positive)
    property: 'real estate',                    // Owns property (strong positive)
    housing: 'own',                             // Homeowner (positive)
    credit_history: 'existing credits paid back duly', // Perfect credit history (strong positive)
    purpose: 'car (used)',                      // Practical purpose (positive)
    installment_rate: 4,                        // Low burden (<20%) (positive)
    existing_credits: 1,                        // Minimal existing debt (positive)
    other_debtors: 'guarantor',                 // Has guarantor (positive)
    other_installment_plans: 'none',            // No other obligations (positive)
    job: 'skilled employee / official',         // Skilled job (positive)
    
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
