// Persona definitions and prefilled application data for the experiment

export type PersonaId = 'elderly-woman' | 'young-entrepreneur' | 'middle-aged-employee'

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
    age: 67,
    occupation: 'Retired',
    loanAmount: 4000,
    loanPurpose: 'Home renovation (bathroom accessibility)',
    description: 'Maria is a 67-year-old retiree who wants to borrow €4,000 to renovate her bathroom for better accessibility. She has a modest pension and some savings, but is concerned about taking on debt at her age.',
  },
  'young-entrepreneur': {
    id: 'young-entrepreneur',
    name: 'Jonas',
    age: 27,
    occupation: 'Employee',
    loanAmount: 12000,
    loanPurpose: 'Business start-up (online business)',
    description: 'Jonas is a 27-year-old employee who wants to borrow €12,000 to start a small online business alongside his current job. He has been employed for 3 years and has a stable income.',
  },
  'middle-aged-employee': {
    id: 'middle-aged-employee',
    name: 'Sofia',
    age: 44,
    occupation: 'Single Parent / Full-time Employee',
    loanAmount: 20000,
    loanPurpose: 'Debt consolidation',
    description: 'Sofia is a 44-year-old single parent who wants to borrow €20,000 to consolidate multiple smaller debts into one manageable payment. She works full-time and supports two children.',
  },
}

// Prefilled application data for each persona
// Based on German Credit Dataset attributes
export const PERSONA_APPLICATIONS: Record<PersonaId, ApplicationData> = {
  'elderly-woman': {
    age: 67,
    sex: 'female',
    checking_account_status: '0 to 200 DM',
    savings_account: '100 to 500 DM',
    credit_amount: 4000,
    duration_months: 24,
    employment_status: 'unemployed', // retired
    present_residence_since: 4,
    property: 'real estate',
    housing: 'own',
    credit_history: 'delay in paying off in the past',
    purpose: 'repairs',
    installment_rate: 2,
    existing_credits: 1,
    other_debtors: 'none',
    other_installment_plans: 'none',
    job: 'skilled employee',
    num_dependents: 1,
    telephone: 'yes',
    foreign_worker: 'no',
  },
  'young-entrepreneur': {
    age: 27,
    sex: 'male',
    checking_account_status: '0 to 200 DM',
    savings_account: 'less than 100 DM',
    credit_amount: 12000,
    duration_months: 36,
    employment_status: '1 to 4 years',
    present_residence_since: 2,
    property: 'car or other',
    housing: 'rent',
    credit_history: 'delay in paying off in the past',
    purpose: 'business',
    installment_rate: 3,
    existing_credits: 2,
    other_debtors: 'none',
    other_installment_plans: 'none',
    job: 'skilled employee',
    num_dependents: 1,
    telephone: 'yes',
    foreign_worker: 'no',
  },
  'middle-aged-employee': {
    age: 44,
    sex: 'female',
    checking_account_status: 'less than 0 DM',
    savings_account: '100 to 500 DM',
    credit_amount: 20000,
    duration_months: 48,
    employment_status: '4 to 7 years',
    present_residence_since: 3,
    property: 'real estate',
    housing: 'own',
    credit_history: 'delay in paying off in the past',
    purpose: 'retraining', // closest to debt consolidation
    installment_rate: 4,
    existing_credits: 3,
    other_debtors: 'none',
    other_installment_plans: 'bank',
    job: 'skilled employee',
    num_dependents: 2,
    telephone: 'yes',
    foreign_worker: 'no',
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
