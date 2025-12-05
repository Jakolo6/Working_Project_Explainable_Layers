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
    description: 'The balance status of the applicant\'s checking account. A healthy checking account with regular deposits suggests stable cash flow and lower default risk. Overdrawn accounts or no account may indicate financial stress.',
    values: {
      'lt_0_dm': 'Less than €0 – account is currently overdrawn',
      '0_to_200_dm': '€0 to under €200 – small positive balance',
      'gte_200_dm': '€200 or more / salary paid in – regular account activity or incoming salary',
      'no_account': 'No checking account – no regular bank account information available'
    }
  },

  // Duration
  'Loan Duration (months)': {
    name: 'Loan Duration (months)',
    description: 'How long the loan will be repaid over. Longer durations mean more time for circumstances to change, potentially increasing risk. Shorter loans are typically seen as lower risk but require higher monthly payments.'
  },

  // Credit History
  'Credit History': {
    name: 'Credit History',
    description: '⚠️ IMPORTANT: This feature shows COUNTERINTUITIVE patterns in this 1994 dataset due to historical selection bias. The model learned that "critical" history correlates with LOWER default rates (17%) while "all_paid" shows HIGHER rates (57%). This reflects how banks in 1994 were more cautious with risky-looking applicants. Do NOT use this feature\'s direction for real-world decisions.',
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
    description: 'What the loan will be used for. Different purposes carry different risk profiles. Cars and real estate serve as collateral, while education may indicate future earning potential. Vacation or consumer goods loans are typically higher risk.',
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
    description: 'The total loan amount requested in Euros (€). Larger loans represent greater financial exposure for the bank. The risk depends on whether the amount is proportional to the applicant\'s income and assets.'
  },

  // Savings Account
  'Savings Account Status': {
    name: 'Savings Account/Bonds',
    description: 'The applicant\'s savings buffer. Higher savings indicate financial discipline and a safety net for unexpected expenses. This reduces default risk as the applicant can draw on savings if income is disrupted.',
    values: {
      'lt_100_dm': 'Less than €100 – low savings recorded',
      '100_to_500_dm': '€100 to under €500 – moderate savings',
      '500_to_1000_dm': '€500 to under €1,000 – higher savings',
      'gte_1000_dm': '€1,000 or more – substantial savings',
      'unknown': 'Unknown or no savings account – no savings information available'
    }
  },

  // Employment Duration
  'Employment Duration': {
    name: 'Present Employment Since',
    description: 'How long the applicant has been in their current job. Longer employment suggests job stability and reliable income. Frequent job changes or unemployment increases uncertainty about future repayment ability.',
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
    description: 'What percentage of disposable income goes to loan payments. Higher rates (3-4) mean the applicant is stretching their budget thin, leaving less room for unexpected expenses. Lower rates (1-2) suggest comfortable repayment capacity.'
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
    description: 'What assets the applicant owns. Real estate ownership indicates wealth accumulation and can serve as collateral. Having no property or only unknown assets suggests limited financial security.',
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
    description: 'The applicant\'s age in years. Middle-aged applicants (35-55) often have established careers and stable income. Very young applicants may lack credit history, while older applicants approaching retirement may have reduced future income.'
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
    description: 'The applicant\'s living situation. Homeowners have demonstrated ability to manage large financial commitments. Renters have ongoing housing costs that compete with loan payments. Free housing reduces monthly expenses.',
    values: {
      'rent': 'Rent – pays rent for housing',
      'own': 'Own – lives in owned property',
      'free': 'For free – no housing costs recorded'
    }
  },

  // Existing Credits
  'Existing Credits': {
    name: 'Number of Existing Credits at This Bank',
    description: 'How many active loans the applicant has with this bank. Multiple existing credits mean the applicant is already managing debt obligations. Too many credits may indicate over-extension.'
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
    description: 'How many people financially depend on the applicant (children, elderly parents, etc.). More dependents mean higher living expenses, leaving less disposable income for loan repayment.'
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
    description: 'The monthly payment amount (Credit Amount ÷ Duration). This is what the applicant must pay each month. Higher burdens strain monthly budgets and increase default risk if income drops. Lower burdens are more manageable.'
  },

  'Financial Stability Score': {
    name: 'Financial Stability Score', 
    description: 'A combined metric (Age × Employment Years) measuring life stability. Higher scores indicate mature applicants with long job tenure - typically the most reliable borrowers. Low scores suggest young or job-hopping applicants with less predictable income.'
  },

  'Credit Risk Ratio': {
    name: 'Credit Risk Ratio',
    description: 'Loan size relative to age-based earning potential (Credit Amount ÷ Age × 100). High ratios mean the applicant is borrowing a lot relative to their life stage. Young people with large loans have high ratios and higher risk.'
  },

  'Credit to Income Ratio': {
    name: 'Credit to Income Ratio', 
    description: 'Simple income proxy calculated as Credit Amount ÷ Age. Estimates credit burden relative to life stage and earning potential. Higher values suggest loans that may be challenging to repay given life circumstances.'
  },

  'Duration Risk Score': {
    name: 'Duration Risk Score',
    description: 'Total exposure metric (Duration × Credit Amount). Large loans over long periods create maximum risk exposure. A 48-month loan for €10,000 has much higher duration risk than a 12-month loan for €2,000.'
  },

  // Additional features that may appear
  'Years at Residence': {
    name: 'Years at Current Residence',
    description: 'How long the applicant has lived at their current address. Longer residence indicates stability and makes the applicant easier to contact. Frequent moves may suggest instability or difficulty paying rent.'
  },

  'Other Debtors/Guarantors': {
    name: 'Other Debtors/Guarantors',
    description: 'Whether someone else shares responsibility for the loan. A guarantor or co-applicant provides additional security - if the primary borrower defaults, the bank can pursue the guarantor.'
  },

  'Other Payment Plans': {
    name: 'Other Payment Plans',
    description: 'Whether the applicant has other installment commitments (store credit, other bank loans). Additional payment obligations reduce available income for this loan and increase overall debt burden.'
  },

  'Job Type': {
    name: 'Job Type',
    description: 'The applicant\'s employment classification. Management and skilled positions typically offer higher, more stable income. Unskilled or unemployed applicants have less predictable earning capacity.'
  },

  'Telephone Registration': {
    name: 'Telephone Registration',
    description: 'Whether the applicant has a registered telephone. In 1994, having a phone registered in your name indicated residential stability and made you contactable for payment reminders.'
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
