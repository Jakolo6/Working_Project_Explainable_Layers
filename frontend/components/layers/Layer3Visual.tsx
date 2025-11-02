// Layer 3: Visual - SHAP bar chart showing top 5 features with human-readable labels

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer3VisualProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature name mappings: technical → human-readable (same as Layer 1)
const FEATURE_LABELS: Record<string, string> = {
  // Checking account
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
  
  // Savings
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

// Format numeric values with context
function formatValue(feature: string, value: string): string {
  // Check if it's a categorical feature
  if (VALUE_DESCRIPTIONS[feature]) {
    return VALUE_DESCRIPTIONS[feature]
  }
  
  // Format numerical values
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') || feature === 'Duration') {
      return `${numValue} months`
    } else if (feature.includes('Credit amount') || feature === 'Credit amount') {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age') || feature === 'Age') {
      return `${numValue} years old`
    } else if (feature.toLowerCase().includes('rate')) {
      return `${numValue}% of income`
    } else if (feature.toLowerCase().includes('residence')) {
      return `${numValue} years`
    } else if (feature.toLowerCase().includes('credits')) {
      return `${numValue} loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.toLowerCase().includes('dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    }
  }
  
  return value
}

export default function Layer3Visual({ decision, probability, shapFeatures }: Layer3VisualProps) {
  // Get top 5 features
  const top5Features = shapFeatures.slice(0, 5)
  
  if (top5Features.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  
  // Find max absolute SHAP value for scaling
  const maxAbsShap = Math.max(...top5Features.map(f => Math.abs(f.shap_value)))

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
            Layer 3: Visual Explanation
          </h3>
          <p className="text-gray-600">Top 5 factors with impact visualization</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Feature Impact Analysis</h4>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Increases approval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Decreases approval</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {top5Features.map((feature, index) => {
            const percentage = (Math.abs(feature.shap_value) / maxAbsShap) * 100
            const isPositive = feature.impact === 'positive'
            const featureLabel = FEATURE_LABELS[feature.feature] || feature.feature
            const valueDescription = formatValue(feature.feature, feature.value)
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base">{featureLabel}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {valueDescription}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      {isPositive ? 'Increased' : 'Decreased'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
                    </p>
                  </div>
                </div>
                
                <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${
                      isPositive 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="h-full flex items-center justify-end pr-3">
                      <span className="text-sm font-bold text-white drop-shadow">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">
              How to read this visualization:
            </p>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong className="text-green-700">Green bars</strong> show factors that increased the likelihood of approval, 
                while <strong className="text-red-700">red bars</strong> decreased it.
              </p>
              <p>
                <strong>Longer bars</strong> indicate stronger influence on the decision.
              </p>
              <p>
                The AI considered all these factors together to reach a{' '}
                <span className={isApproved ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                  {decision}
                </span>{' '}
                decision with <strong>{(probability * 100).toFixed(1)}% confidence</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
