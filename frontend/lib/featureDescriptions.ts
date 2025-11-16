// Feature descriptions and explanations for tooltips and dataset information

export interface FeatureDescription {
  name: string
  description: string
  values?: { [key: string]: string }
}

export const FEATURE_DESCRIPTIONS: { [key: string]: FeatureDescription } = {
  // Checking Account Status
  'Checking Account Status': {
    name: 'Checking Account Status',
    description: 'Status of existing checking account',
    values: {
      'lt_0_dm': 'Less than 0 DM – account is currently overdrawn',
      '0_to_200_dm': '0 to under 200 DM – small positive balance',
      'gte_200_dm': '200 DM or more / salary paid in – regular account activity or incoming salary',
      'no_account': 'No checking account – no regular bank account information available'
    }
  },

  // Duration
  'Loan Duration (months)': {
    name: 'Loan Duration (months)',
    description: 'The number of months for which the credit is planned. Indicates how long repayment will run.'
  },

  // Credit History
  'Credit History': {
    name: 'Credit History',
    description: 'Previous credit repayment behavior',
    values: {
      'no_credits_all_paid': 'No previous credits or all repaid on time – consistent past repayment',
      'all_paid_this_bank': 'All credits at this bank repaid on time – good internal repayment record',
      'existing_paid': 'Existing credits currently repaid as agreed – ongoing repayment without issues',
      'delay_past': 'Delays in repayment in the past – repayment was not always on schedule',
      'critical_other_existing': 'Critical account or credits outside this bank – other active credit relationships exist'
    }
  },

  // Purpose
  'Loan Purpose': {
    name: 'Loan Purpose',
    description: 'Intended use of the loan',
    values: {
      'new_car': 'Car (new) – loan intended for a new vehicle',
      'used_car': 'Car (used) – loan intended for a used vehicle',
      'furniture': 'Furniture/equipment – household or personal items',
      'radio_tv': 'Radio/television – consumer electronics',
      'appliances': 'Domestic appliances – household devices',
      'repairs': 'Repairs – renovation or repair expenses',
      'education': 'Education – training or study-related costs',
      'retraining': 'Retraining – qualification or career change training',
      'business': 'Business – business-related expenses',
      'others': 'Others – other purposes not listed'
    }
  },

  // Credit Amount
  'Credit Amount': {
    name: 'Credit Amount',
    description: 'The total loan amount requested. Shows the size of the credit need.'
  },

  // Savings Account
  'Savings Account Status': {
    name: 'Savings Account/Bonds',
    description: 'Level of savings or bonds held',
    values: {
      'lt_100_dm': 'Less than 100 DM – low savings recorded',
      '100_to_500_dm': '100 to under 500 DM – moderate savings',
      '500_to_1000_dm': '500 to under 1,000 DM – higher savings',
      'gte_1000_dm': '1,000 DM or more – substantial savings',
      'unknown': 'Unknown or no savings account – no savings information available'
    }
  },

  // Employment Duration
  'Employment Duration': {
    name: 'Present Employment Since',
    description: 'Duration of current employment',
    values: {
      'unemployed': 'Unemployed – currently no employment',
      'lt_1_year': 'Employed less than 1 year – short employment duration',
      '1_to_4_years': 'Employed 1 to under 4 years – medium employment duration',
      '4_to_7_years': 'Employed 4 to under 7 years – long employment duration',
      'gte_7_years': 'Employed 7 years or more – very long, stable employment situation'
    }
  },

  // Installment Rate (percentage of income)
  'Installment Rate': {
    name: 'Installment Rate',
    description: 'Percentage of available income used for monthly installments. Shows how much of the person\'s income goes into repayment.'
  },

  // Personal Status
  'Personal Status': {
    name: 'Personal Status and Sex',
    description: 'Marital and gender status as recorded',
    values: {
      'male_divorced': 'Male, divorced or separated',
      'female_divorced': 'Female, divorced/separated/married',
      'male_single': 'Male, single – single-person household',
      'male_married': 'Male, married or widowed',
      'female_single': 'Female, single – single-person household'
    }
  },

  // Other Debtors
  'Other Debtors': {
    name: 'Other Debtors/Guarantors',
    description: 'Additional parties responsible for the loan',
    values: {
      'none': 'None – only the applicant is responsible',
      'co_applicant': 'Co-applicant – another person applies jointly',
      'guarantor': 'Guarantor – another person guarantees repayment'
    }
  },

  // Residential Stability
  'Residential Stability': {
    name: 'Present Residence Since',
    description: 'Number of years at the current address. Gives insight into residential stability.'
  },

  // Property Ownership
  'Property Ownership': {
    name: 'Property',
    description: 'Type of property or assets owned',
    values: {
      'real_estate': 'Real estate – owns property',
      'savings_insurance': 'Savings agreement or life insurance – owns long-term financial assets',
      'car_other': 'Car or other assets – owns movable assets',
      'unknown': 'Unknown or no property – no property information available'
    }
  },

  // Age
  'Age': {
    name: 'Age in Years',
    description: 'The applicant\'s age. Reflects current life stage.'
  },

  // Other Installments
  'Other Installment Plans': {
    name: 'Other Installment Plans',
    description: 'Additional installment commitments',
    values: {
      'bank': 'Bank – additional installments with a bank',
      'stores': 'Stores – installment payments at retail stores',
      'none': 'None – no additional installment commitments'
    }
  },

  // Housing Status
  'Housing Status': {
    name: 'Housing',
    description: 'Housing situation',
    values: {
      'rent': 'Rent – pays rent for housing',
      'own': 'Own – lives in owned property',
      'free': 'For free – no housing costs recorded'
    }
  },

  // Existing Credits
  'Existing Credits': {
    name: 'Number of Existing Credits at This Bank',
    description: 'Shows how many credits the applicant already has here. Indicates existing credit relationships with the bank.'
  },

  // Employment Type
  'Employment Type': {
    name: 'Job',
    description: 'Employment classification',
    values: {
      'unemployed_unskilled': 'Unemployed or unskilled, non-resident',
      'unskilled_resident': 'Unskilled, resident',
      'skilled': 'Skilled employee or official – trained or qualified employment',
      'management': 'Management, self-employed, highly qualified, or officer – advanced job roles'
    }
  },

  // Dependents
  'Number of Dependents': {
    name: 'Number of People Being Liable to Provide Maintenance For',
    description: 'Number of individuals the applicant supports financially. Indicates dependents or family responsibilities.'
  },

  // Telephone
  'Telephone': {
    name: 'Telephone',
    description: 'Telephone registration status',
    values: {
      'none': 'None – no telephone listed',
      'yes': 'Yes – telephone registered under the applicant\'s name'
    }
  },

  // Foreign Worker
  'Foreign Worker': {
    name: 'Foreign Worker',
    description: 'Foreign worker status',
    values: {
      'yes': 'Yes – applicant recorded as foreign worker',
      'no': 'No – applicant recorded as not a foreign worker'
    }
  },

  // Engineered Features (Calculated Risk Metrics)
  'Monthly Payment Burden': {
    name: 'Monthly Payment Burden',
    description: 'Monthly payment amount calculated as Credit Amount ÷ Duration. Shows the actual monthly payment burden in DM/month. Higher values indicate larger monthly payments that may strain finances.'
  },

  'Financial Stability Score': {
    name: 'Financial Stability Score', 
    description: 'Combined stability metric calculated as Age × Employment Years. Reflects overall life and employment stability. Higher scores indicate more established, stable borrowers with longer employment history.'
  },

  'Credit Risk Ratio': {
    name: 'Credit Risk Ratio',
    description: 'Risk metric calculated as Credit Amount ÷ (Age × 100). Measures credit amount relative to borrower maturity and earning potential. Higher ratios indicate larger loans relative to expected income capacity.'
  },

  'Credit to Income Ratio': {
    name: 'Credit to Income Ratio', 
    description: 'Simple income proxy calculated as Credit Amount ÷ Age. Estimates credit burden relative to life stage and earning potential. Higher values suggest loans that may be challenging to repay given life circumstances.'
  },

  'Duration Risk Score': {
    name: 'Duration Risk Score',
    description: 'Combined risk metric calculated as Duration × Credit Amount. Captures total financial exposure over loan lifetime. Higher scores indicate larger total commitments that compound risk over time.'
  }
}

// Helper function to get feature description
export function getFeatureDescription(featureName: string): FeatureDescription | null {
  return FEATURE_DESCRIPTIONS[featureName] || null
}

// Helper function to get value description
export function getValueDescription(featureName: string, value: string): string | null {
  const feature = FEATURE_DESCRIPTIONS[featureName]
  if (feature && feature.values && feature.values[value]) {
    return feature.values[value]
  }
  return null
}
