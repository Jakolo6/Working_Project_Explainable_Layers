/**
 * Centralized value formatting utilities for human-readable display
 * Converts backend values (DM currency, snake_case, etc.) to user-friendly format
 */

// ============================================================================
// CATEGORICAL VALUE MAPPINGS
// ============================================================================

export const CATEGORICAL_VALUE_DISPLAY: Record<string, Record<string, string>> = {
  // Checking Account Status
  'checking_status': {
    'lt_0_dm': 'Less than €0 (Overdrawn)',
    'negative_balance': 'Negative Balance (< €0)',
    '0_to_200_dm': '€0 to €200',
    'lt_200_dm': '€0–200',
    'ge_200_dm': '€200 or more',
    'no_checking': 'No Checking Account'
  },
  
  // Savings Account Status
  'savings_status': {
    'lt_100_dm': 'Less than €100',
    '100_to_500_dm': '€100 to €500',
    'lt_500_dm': '€100–500',
    '500_to_1000_dm': '€500 to €1,000',
    'lt_1000_dm': '€500–1,000',
    'ge_1000_dm': '€1,000 or more',
    'no_savings': 'No Savings Account'
  },
  
  // Credit History
  'credit_history': {
    'no_credits': 'No Credits Taken',
    'all_paid': 'All Credits Paid Back',
    'existing_paid': 'Existing Credits Paid Back',
    'delayed_previously': 'Delayed Previously',
    'critical_account': 'Critical Account'
  },
  
  // Loan Purpose
  'purpose': {
    'new_car': 'New Car',
    'used_car': 'Used Car',
    'furniture': 'Furniture/Equipment',
    'radio_tv': 'Radio/TV',
    'domestic_appliances': 'Domestic Appliances',
    'repairs': 'Repairs',
    'education': 'Education',
    'vacation': 'Vacation',
    'retraining': 'Retraining',
    'business': 'Business',
    'other': 'Other'
  },
  
  // Employment Duration
  'employment': {
    'unemployed': 'Unemployed',
    'lt_1': 'Less than 1 Year',
    '1_to_4': '1–4 Years',
    '4_to_7': '4–7 Years',
    'ge_7': '7+ Years'
  },
  
  // Housing Status
  'housing': {
    'rent': 'Renting',
    'own': 'Own',
    'for_free': 'Rent-Free'
  },
  
  // Property Ownership
  'property_magnitude': {
    'real_estate': 'Real Estate',
    'life_insurance': 'Life Insurance',
    'car': 'Car',
    'unknown_no_property': 'No Property',
    'no_known_property': 'No Property'
  },
  
  // Other Debtors/Guarantors
  'other_parties': {
    'none': 'None',
    'co_applicant': 'Co-Applicant',
    'guarantor': 'Guarantor'
  },
  
  // Other Payment Plans
  'other_payment_plans': {
    'bank': 'Bank',
    'stores': 'Stores',
    'none': 'None'
  },
  
  // Job Type
  'job': {
    'unemp_unskilled': 'Unemployed/Unskilled',
    'unskilled': 'Unskilled Resident',
    'skilled': 'Skilled Employee',
    'high_qualif': 'Management/Highly Qualified'
  },
  
  // Telephone Registration
  'telephone': {
    'yes': 'Yes',
    'no': 'No',
    'none': 'No'
  },
  
  // Foreign Worker
  'foreign_worker': {
    'yes': 'Yes',
    'no': 'No'
  },
  
  // Installment Rate
  'installment_rate': {
    '< 20%': 'Low (< 20%)',
    '20-25%': 'Moderate (20-25%)',
    '25-35%': 'High (25-35%)',
    '>= 35%': 'Very High (≥ 35%)'
  }
}

// ============================================================================
// VALUE FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format a feature value for human-readable display
 * Handles currency conversion (DM → €), categorical mappings, and numeric formatting
 */
export function formatFeatureValue(feature: string, value: string): string {
  // Handle null/undefined
  if (!value || value === 'null' || value === 'undefined') {
    return 'N/A'
  }

  // Clean the value
  const cleanValue = value.trim()
  
  // IMPORTANT: Check for categorical values FIRST before parsing as number
  // This prevents "0–200 DM" from being parsed as just "0"
  const featureKey = feature.toLowerCase().replace(/[\s()]/g, '_').replace(/_+/g, '_')
  const valueKey = cleanValue.toLowerCase().replace(/\s+/g, '_')
  
  // Check all categorical mappings first
  for (const [catKey, catValues] of Object.entries(CATEGORICAL_VALUE_DISPLAY)) {
    if (featureKey.includes(catKey) || catKey.includes(featureKey.split('_')[0])) {
      if (catValues[valueKey]) {
        return catValues[valueKey]
      }
    }
  }
  
  // If value contains non-numeric characters (like "0–200 DM"), return as-is
  // This catches categorical values that aren't in our mapping
  if (cleanValue.match(/[–—-]/) || cleanValue.includes(' to ') || cleanValue.includes('DM')) {
    // Convert DM to € and clean up
    return cleanValue
      .replace(/DM/g, '€')
      .replace(/dm/g, '€')
      .replace(/\b(\d+)\s*€/g, '€$1')  // Move € before number
  }
  
  // Try to parse as number
  const num = parseFloat(cleanValue)
  
  // If it's a valid number, format it appropriately based on feature type
  if (!isNaN(num)) {
    const featureLower = feature.toLowerCase()
    
    // IMPORTANT: Check more specific patterns BEFORE general ones
    // "Employment Duration" must be checked before "ratio" (because "duration" contains "ratio")
    
    // Employment Duration - use "years" not "%"
    if (featureLower.includes('employment')) {
      return `${Math.round(num)} years`  // e.g., 4 years (not 4.0%)
    }
    
    // Duration in months
    if (featureLower.includes('duration') && featureLower.includes('month')) {
      return `${Math.round(num)} months`  // e.g., 18 months
    }
    
    // Age - keep as years
    if (featureLower.includes('age')) {
      return `${Math.round(num)} years`  // e.g., 35 years
    }
    
    // Residence - years
    if (featureLower.includes('residence') || featureLower.includes('years')) {
      return `${Math.round(num)} years`
    }
    
    // Monetary values - use € symbol and comma for thousands (German format)
    if (featureLower.includes('amount') || featureLower.includes('credit')) {
      return `€${num.toLocaleString('de-DE')}`  // e.g., €3.600
    }
    
    // Savings/Checking Account Status - add € symbol
    if (featureLower.includes('savings') || featureLower.includes('checking')) {
      return `€${num.toLocaleString('de-DE')}`  // e.g., €100, €0
    }
    
    // Monthly Payment Burden - simplified format (no formula)
    if (featureLower.includes('burden') || featureLower.includes('payment')) {
      return `€${Math.round(num)}/month`  // e.g., €200/month (not €200.00 (€3600 ÷ 18 months))
    }
    
    // Credit Risk Ratio - use dot for decimal (consistency)
    if (featureLower.includes('ratio')) {
      return `€${num.toFixed(2)}`  // e.g., €1.03 (not €1,03)
    }
    
    // Credit to Income Ratio - simplified (no formula)
    if (featureLower.includes('income')) {
      return `€${num.toFixed(2)}`  // e.g., €102.86 (not €102.86 (€3600 ÷ Age 35))
    }
    
    // Installment Rate - remove unnecessary decimals
    if (featureLower.includes('rate') || featureLower.includes('installment')) {
      return `${Math.round(num)}%`  // e.g., 25% (not 25.0%)
    }
    
    // Duration Risk Score - remove misleading % symbol
    if (featureLower.includes('score') || featureLower.includes('risk')) {
      return `${Math.round(num)}`  // e.g., 64800 (not 64800.0%)
    }
    
    // Default number formatting
    return num.toLocaleString('de-DE')
  }
  
  // If we get here, it's not a number and not in categorical mappings
  // Clean up snake_case and underscores
  if (cleanValue.includes('_')) {
    return cleanValue
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }
  
  // Capitalize first letter if all lowercase
  if (cleanValue === cleanValue.toLowerCase()) {
    return cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1)
  }
  
  // Return as-is if no transformation needed
  return cleanValue
}

/**
 * Extract numeric value from a formatted string
 * Useful for comparisons and calculations
 */
export function extractNumericValue(value: string): number | undefined {
  const match = value.match(/[\d,.]+/)
  if (!match) return undefined
  
  // Handle European number format (1.234,56)
  const cleaned = match[0].replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  
  return isNaN(num) ? undefined : num
}

/**
 * Format currency amount (always in €)
 */
export function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('de-DE')}`
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get human-readable label for a categorical value
 */
export function getCategoricalLabel(feature: string, value: string): string {
  const featureKey = feature.toLowerCase().replace(/[\s()]/g, '_').replace(/_+/g, '_')
  const valueKey = value.toLowerCase().replace(/\s+/g, '_')
  
  for (const [catKey, catValues] of Object.entries(CATEGORICAL_VALUE_DISPLAY)) {
    if (featureKey.includes(catKey) || catKey.includes(featureKey.split('_')[0])) {
      if (catValues[valueKey]) {
        return catValues[valueKey]
      }
    }
  }
  
  return value
}
