// Layer 1: Minimal - Single key driver explanation in plain language

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer1MinimalProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature name mappings: technical → human-readable
const FEATURE_LABELS: Record<string, string> = {
  // Checking account status
  'Attribute1_A11': 'Checking account balance',
  'Attribute1_A12': 'Checking account balance',
  'Attribute1_A13': 'Checking account balance',
  'Attribute1_A14': 'Checking account status',
  
  // Credit history
  'Attribute3_A30': 'Credit history',
  'Attribute3_A31': 'Credit history',
  'Attribute3_A32': 'Credit history',
  'Attribute3_A33': 'Credit history',
  'Attribute3_A34': 'Credit history',
  
  // Purpose
  'Attribute4_A40': 'Loan purpose',
  'Attribute4_A41': 'Loan purpose',
  'Attribute4_A42': 'Loan purpose',
  'Attribute4_A43': 'Loan purpose',
  'Attribute4_A44': 'Loan purpose',
  'Attribute4_A45': 'Loan purpose',
  'Attribute4_A46': 'Loan purpose',
  'Attribute4_A48': 'Loan purpose',
  'Attribute4_A49': 'Loan purpose',
  'Attribute4_A410': 'Loan purpose',
  
  // Savings account
  'Attribute6_A61': 'Savings account level',
  'Attribute6_A62': 'Savings account level',
  'Attribute6_A63': 'Savings account level',
  'Attribute6_A64': 'Savings account level',
  'Attribute6_A65': 'Savings account status',
  
  // Employment
  'Attribute7_A71': 'Employment status',
  'Attribute7_A72': 'Employment duration',
  'Attribute7_A73': 'Employment duration',
  'Attribute7_A74': 'Employment duration',
  'Attribute7_A75': 'Employment duration',
  
  // Property
  'Attribute12_A121': 'Property ownership',
  'Attribute12_A122': 'Property ownership',
  'Attribute12_A123': 'Property ownership',
  'Attribute12_A124': 'Property status',
  
  // Housing
  'Attribute15_A151': 'Housing situation',
  'Attribute15_A152': 'Housing situation',
  'Attribute15_A153': 'Housing situation',
  
  // Job
  'Attribute17_A171': 'Employment type',
  'Attribute17_A172': 'Employment type',
  'Attribute17_A173': 'Employment type',
  'Attribute17_A174': 'Employment type',
  
  // Numerical features
  'Duration': 'Loan duration',
  'Credit amount': 'Loan amount',
  'Installment rate': 'Monthly payment burden',
  'Present residence since': 'Residential stability',
  'Age': 'Age',
  'Number of existing credits': 'Existing loans',
  'Number of people being liable to provide maintenance for': 'Number of dependents',
}

// Value descriptions: technical → human-readable
const VALUE_DESCRIPTIONS: Record<string, string> = {
  // Checking account
  'Attribute1_A11': 'Negative balance',
  'Attribute1_A12': 'Low balance (under 200 DM)',
  'Attribute1_A13': 'Good balance (over 200 DM)',
  'Attribute1_A14': 'No checking account',
  
  // Credit history
  'Attribute3_A30': 'No previous credits',
  'Attribute3_A31': 'All credits paid on time',
  'Attribute3_A32': 'Current credits paid on time',
  'Attribute3_A33': 'Past payment delays',
  'Attribute3_A34': 'Critical account or other debts',
  
  // Purpose
  'Attribute4_A40': 'New car purchase',
  'Attribute4_A41': 'Used car purchase',
  'Attribute4_A42': 'Furniture or equipment',
  'Attribute4_A43': 'Radio or television',
  'Attribute4_A44': 'Domestic appliances',
  'Attribute4_A45': 'Repairs',
  'Attribute4_A46': 'Education',
  'Attribute4_A48': 'Retraining',
  'Attribute4_A49': 'Business',
  'Attribute4_A410': 'Other purposes',
  
  // Savings
  'Attribute6_A61': 'Very low savings (under 100 DM)',
  'Attribute6_A62': 'Low savings (100-500 DM)',
  'Attribute6_A63': 'Moderate savings (500-1000 DM)',
  'Attribute6_A64': 'Good savings (over 1000 DM)',
  'Attribute6_A65': 'No savings account',
  
  // Employment
  'Attribute7_A71': 'Unemployed',
  'Attribute7_A72': 'Short employment (under 1 year)',
  'Attribute7_A73': 'Stable employment (1-4 years)',
  'Attribute7_A74': 'Long employment (4-7 years)',
  'Attribute7_A75': 'Very stable employment (over 7 years)',
  
  // Property
  'Attribute12_A121': 'Owns real estate',
  'Attribute12_A122': 'Has savings agreement or life insurance',
  'Attribute12_A123': 'Owns car or other property',
  'Attribute12_A124': 'No property',
  
  // Housing
  'Attribute15_A151': 'Renting',
  'Attribute15_A152': 'Owns home',
  'Attribute15_A153': 'Living rent-free',
  
  // Job
  'Attribute17_A171': 'Unemployed or unskilled',
  'Attribute17_A172': 'Unskilled resident',
  'Attribute17_A173': 'Skilled employee',
  'Attribute17_A174': 'Management or highly qualified',
}

// Contextual explanations for each feature category
const FEATURE_CONTEXT: Record<string, string> = {
  'Checking account balance': 'Banks view account balance as a sign of financial stability.',
  'Checking account status': 'Having a checking account shows financial engagement.',
  'Credit history': 'Past payment behavior is a strong indicator of future reliability.',
  'Loan purpose': 'Different loan purposes carry different levels of risk.',
  'Savings account level': 'Savings provide a financial cushion for unexpected situations.',
  'Savings account status': 'Having savings demonstrates financial planning.',
  'Employment status': 'Stable employment means reliable income.',
  'Employment duration': 'Longer employment history suggests job security.',
  'Property ownership': 'Property serves as collateral and shows financial stability.',
  'Property status': 'Assets reduce lending risk.',
  'Housing situation': 'Homeownership indicates financial responsibility.',
  'Employment type': 'Job type affects income stability and repayment ability.',
  'Loan duration': 'Longer loans carry more uncertainty.',
  'Loan amount': 'Higher amounts mean greater risk for the lender.',
  'Monthly payment burden': 'Higher monthly payments relative to income increase default risk.',
  'Residential stability': 'Longer residence suggests stability.',
  'Age': 'Age correlates with financial experience and stability.',
  'Existing loans': 'Multiple loans can strain repayment capacity.',
  'Number of dependents': 'More dependents mean higher financial obligations.',
}

// Format numeric values with context
function formatValue(feature: string, value: string): string {
  // If it's a categorical feature, use the description
  if (VALUE_DESCRIPTIONS[feature]) {
    return VALUE_DESCRIPTIONS[feature]
  }
  
  // Format numerical values
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration')) {
      return `${numValue} months`
    } else if (feature.includes('Credit amount')) {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age')) {
      return `${numValue} years old`
    } else if (feature.includes('rate')) {
      return `${numValue}% of income`
    } else if (feature.includes('residence')) {
      return `${numValue} years at current address`
    } else if (feature.includes('credits')) {
      return `${numValue} existing loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    }
  }
  
  return value
}

// Get impact strength and direction in plain language
function getImpactDescription(shapValue: number, impact: 'positive' | 'negative'): string {
  const magnitude = Math.abs(shapValue)
  
  let strength = ''
  if (magnitude < 0.3) {
    strength = 'slightly'
  } else if (magnitude < 0.7) {
    strength = 'moderately'
  } else {
    strength = 'strongly'
  }
  
  if (impact === 'positive') {
    return `This factor ${strength} supported approval.`
  } else {
    return `This factor ${strength} reduced the chances of approval.`
  }
}

export default function Layer1Minimal({ decision, probability, shapFeatures }: Layer1MinimalProps) {
  // Get the single most important feature
  const topFeature = shapFeatures[0]
  
  if (!topFeature) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  const featureLabel = FEATURE_LABELS[topFeature.feature] || topFeature.feature
  const valueDescription = formatValue(topFeature.feature, topFeature.value)
  const impactDescription = getImpactDescription(topFeature.shap_value, topFeature.impact)
  const context = FEATURE_CONTEXT[featureLabel] || ''

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
          isApproved ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isApproved ? '✓' : '✗'}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Minimal Explanation
          </h3>
          <p className="text-gray-600">The single most important factor</p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
        <p className="text-lg text-gray-900 mb-3">
          <strong>Key Factor:</strong>
        </p>
        <p className="text-xl font-semibold text-blue-900 mb-3">
          {featureLabel}
        </p>
        <p className="text-gray-700 mb-3">
          <span className="bg-white px-3 py-1.5 rounded border border-gray-200">
            {valueDescription}
          </span>
        </p>
        <p className="text-base text-gray-800 mb-2">
          {impactDescription}
        </p>
        {context && (
          <p className="text-sm text-gray-600 italic">
            {context}
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong>What this means:</strong> The AI {decision} this loan mainly because the applicant's{' '}
          <strong>{featureLabel.toLowerCase()}</strong> ({valueDescription.toLowerCase()}){' '}
          {topFeature.impact === 'positive' ? 'met' : 'did not meet'} the bank's criteria for financial stability.
        </p>
      </div>
    </div>
  )
}
