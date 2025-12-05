// Categorical feature metadata for global context visualizations
// Based on German Credit Dataset (1994) statistics

export interface CategoryStats {
  successRate: number  // Historical approval rate (0-100)
  frequency: number    // How common this category is (0-100)
}

export interface LadderStep {
  label: string
  value: string
  successRate: number
  isUserStep: boolean
}

// Success rates and frequencies for each categorical value
// Data approximated from German Credit Dataset patterns
export const CATEGORICAL_STATS: Record<string, Record<string, CategoryStats>> = {
  // Checking Account Status
  'checking_status': {
    'lt_0_dm': { successRate: 45, frequency: 28 },           // Overdrawn - risky
    '0_to_200_dm': { successRate: 65, frequency: 27 },       // Low balance - moderate
    'ge_200_dm': { successRate: 85, frequency: 6 },          // Good balance - safe
    'no_checking': { successRate: 72, frequency: 39 },       // No account - moderate
  },

  // Savings Account
  'savings_status': {
    'lt_100_dm': { successRate: 62, frequency: 60 },         // Minimal savings
    '100_to_500_dm': { successRate: 72, frequency: 10 },     // Basic savings
    '500_to_1000_dm': { successRate: 78, frequency: 6 },     // Good savings
    'ge_1000_dm': { successRate: 88, frequency: 5 },         // Excellent savings
    'unknown': { successRate: 68, frequency: 19 },           // Unknown
  },

  // Credit History
  'credit_history': {
    'no_credits': { successRate: 75, frequency: 4 },         // No history
    'all_paid': { successRate: 43, frequency: 5 },           // Counterintuitive!
    'existing_paid': { successRate: 70, frequency: 53 },     // Good history
    'delayed_past': { successRate: 68, frequency: 29 },      // Some delays
    'critical': { successRate: 83, frequency: 9 },           // Counterintuitive!
  },

  // Employment Duration
  'employment': {
    'unemployed': { successRate: 62, frequency: 6 },         // No job
    'lt_1_year': { successRate: 66, frequency: 17 },         // New job
    '1_to_4_years': { successRate: 69, frequency: 34 },      // Moderate tenure
    '4_to_7_years': { successRate: 74, frequency: 17 },      // Good tenure
    'ge_7_years': { successRate: 78, frequency: 25 },        // Excellent tenure
  },

  // Job Type
  'job': {
    'unemployed_unskilled': { successRate: 50, frequency: 2 },  // Highest risk
    'unskilled_resident': { successRate: 65, frequency: 20 },   // Low skill
    'skilled': { successRate: 72, frequency: 63 },              // Skilled worker
    'management': { successRate: 80, frequency: 15 },           // Management/self-employed
  },

  // Loan Purpose
  'purpose': {
    'car_new': { successRate: 66, frequency: 23 },          // New car
    'car_used': { successRate: 82, frequency: 10 },         // Used car - practical
    'furniture': { successRate: 65, frequency: 18 },        // Furniture
    'radio_tv': { successRate: 70, frequency: 28 },         // Electronics
    'domestic_appliances': { successRate: 75, frequency: 1 }, // Appliances
    'repairs': { successRate: 72, frequency: 2 },           // Repairs
    'education': { successRate: 78, frequency: 5 },         // Education - good
    'vacation': { successRate: 60, frequency: 0 },          // Vacation - risky
    'retraining': { successRate: 68, frequency: 1 },        // Retraining
    'business': { successRate: 55, frequency: 10 },         // Business - risky
    'other': { successRate: 70, frequency: 2 },             // Other
  },

  // Housing
  'housing': {
    'rent': { successRate: 68, frequency: 18 },             // Renting
    'own': { successRate: 73, frequency: 71 },              // Homeowner - stable
    'for_free': { successRate: 70, frequency: 11 },         // Living free
  },

  // Property Ownership
  'property': {
    'real_estate': { successRate: 78, frequency: 28 },      // Owns property - best
    'savings_agreement': { successRate: 72, frequency: 23 }, // Life insurance/savings
    'car_or_other': { successRate: 68, frequency: 33 },     // Car/other assets
    'unknown_no_property': { successRate: 62, frequency: 15 }, // No property
  },

  // Other Debtors/Guarantors
  'other_debtors': {
    'none': { successRate: 69, frequency: 91 },             // No guarantor
    'co_applicant': { successRate: 75, frequency: 4 },      // Co-applicant
    'guarantor': { successRate: 82, frequency: 5 },         // Has guarantor - best
  },

  // Other Payment Plans
  'other_installment_plans': {
    'none': { successRate: 72, frequency: 81 },             // No other plans
    'bank': { successRate: 65, frequency: 19 },             // Other bank loans
    'stores': { successRate: 60, frequency: 5 },            // Store credit
  },
}

// Risk Ladder definitions for ordered categorical features
export const RISK_LADDERS: Record<string, LadderStep[]> = {
  // Checking Account - ordered by balance
  'checking_status': [
    { label: 'Overdrawn (< 0 DM)', value: 'lt_0_dm', successRate: 45, isUserStep: false },
    { label: 'Low Balance (0-200 DM)', value: '0_to_200_dm', successRate: 65, isUserStep: false },
    { label: 'No Account', value: 'no_checking', successRate: 72, isUserStep: false },
    { label: 'Good Balance (200+ DM)', value: 'ge_200_dm', successRate: 85, isUserStep: false },
  ],

  // Savings Account - ordered by amount
  'savings_status': [
    { label: 'Minimal (< 100 DM)', value: 'lt_100_dm', successRate: 62, isUserStep: false },
    { label: 'Unknown/None', value: 'unknown', successRate: 68, isUserStep: false },
    { label: 'Basic (100-500 DM)', value: '100_to_500_dm', successRate: 72, isUserStep: false },
    { label: 'Good (500-1000 DM)', value: '500_to_1000_dm', successRate: 78, isUserStep: false },
    { label: 'Excellent (1000+ DM)', value: 'ge_1000_dm', successRate: 88, isUserStep: false },
  ],

  // Employment Duration - ordered by tenure
  'employment': [
    { label: 'Unemployed', value: 'unemployed', successRate: 62, isUserStep: false },
    { label: 'Less than 1 year', value: 'lt_1_year', successRate: 66, isUserStep: false },
    { label: '1-4 years', value: '1_to_4_years', successRate: 69, isUserStep: false },
    { label: '4-7 years', value: '4_to_7_years', successRate: 74, isUserStep: false },
    { label: '7+ years', value: 'ge_7_years', successRate: 78, isUserStep: false },
  ],

  // Job Type - ordered by skill/earning potential
  'job': [
    { label: 'Unemployed/Unskilled', value: 'unemployed_unskilled', successRate: 50, isUserStep: false },
    { label: 'Unskilled Resident', value: 'unskilled_resident', successRate: 65, isUserStep: false },
    { label: 'Skilled Employee', value: 'skilled', successRate: 72, isUserStep: false },
    { label: 'Management/Self-Employed', value: 'management', successRate: 80, isUserStep: false },
  ],

  // Property - ordered by asset value
  'property': [
    { label: 'No Property', value: 'unknown_no_property', successRate: 62, isUserStep: false },
    { label: 'Car or Other', value: 'car_or_other', successRate: 68, isUserStep: false },
    { label: 'Life Insurance/Savings', value: 'savings_agreement', successRate: 72, isUserStep: false },
    { label: 'Real Estate', value: 'real_estate', successRate: 78, isUserStep: false },
  ],
}

// Helper function to get stats for a categorical value
export function getCategoryStats(featureKey: string, value: string): CategoryStats | null {
  const normalizedFeature = featureKey.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  
  // Try direct match
  if (CATEGORICAL_STATS[normalizedFeature]?.[normalizedValue]) {
    return CATEGORICAL_STATS[normalizedFeature][normalizedValue]
  }
  
  // Try partial match
  for (const [key, values] of Object.entries(CATEGORICAL_STATS)) {
    if (normalizedFeature.includes(key) || key.includes(normalizedFeature)) {
      for (const [valueKey, stats] of Object.entries(values)) {
        if (normalizedValue.includes(valueKey) || valueKey.includes(normalizedValue)) {
          return stats
        }
      }
    }
  }
  
  return null
}

// Helper function to get risk ladder for a feature
export function getRiskLadder(featureKey: string, userValue: string): LadderStep[] | null {
  const normalizedFeature = featureKey.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const normalizedValue = userValue.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  
  // Try direct match
  if (RISK_LADDERS[normalizedFeature]) {
    const ladder = RISK_LADDERS[normalizedFeature].map(step => ({
      ...step,
      isUserStep: step.value === normalizedValue || 
                  normalizedValue.includes(step.value) || 
                  step.value.includes(normalizedValue)
    }))
    return ladder
  }
  
  // Try partial match
  for (const [key, steps] of Object.entries(RISK_LADDERS)) {
    if (normalizedFeature.includes(key) || key.includes(normalizedFeature)) {
      const ladder = steps.map(step => ({
        ...step,
        isUserStep: step.value === normalizedValue || 
                    normalizedValue.includes(step.value) || 
                    step.value.includes(normalizedValue)
      }))
      return ladder
    }
  }
  
  return null
}

// Check if a feature has a risk ladder
export function hasRiskLadder(featureKey: string): boolean {
  const normalizedFeature = featureKey.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  
  if (RISK_LADDERS[normalizedFeature]) return true
  
  for (const key of Object.keys(RISK_LADDERS)) {
    if (normalizedFeature.includes(key) || key.includes(normalizedFeature)) {
      return true
    }
  }
  
  return false
}
