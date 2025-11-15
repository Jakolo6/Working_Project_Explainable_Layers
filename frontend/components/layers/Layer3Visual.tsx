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

// Feature name mappings: backend names → display names
const FEATURE_LABELS: Record<string, string> = {
  // Backend returns human-readable names, map to consistent display names
  'Loan Duration (months)': 'Loan Duration',
  'Credit Amount': 'Credit Amount',
  'Installment Rate': 'Monthly Payment Burden',
  'Years at Residence': 'Residential Stability',
  'Age': 'Age',
  'Existing Credits': 'Existing Loans',
  'Number of Dependents': 'Number of Dependents',
  'Monthly Payment Burden': 'Monthly Payment Burden',
  'Financial Stability Score': 'Financial Stability Score',
  'Credit Risk Ratio': 'Credit Risk Ratio',
  'Credit to Income Ratio': 'Credit to Income Ratio',
  'Duration Risk Score': 'Duration Risk Score',
  'Checking Account Status': 'Checking Account Status',
  'Credit History': 'Credit History',
  'Loan Purpose': 'Loan Purpose',
  'Savings Account Status': 'Savings Account Status',
  'Employment Duration': 'Employment Duration',
  'Other Debtors/Guarantors': 'Other Debtors/Guarantors',
  'Property Ownership': 'Property Ownership',
  'Other Payment Plans': 'Other Payment Plans',
  'Housing Status': 'Housing Status',
  'Job Type': 'Job Type',
  'Telephone Registration': 'Telephone Registration'
}

// Value descriptions: backend values → human-readable descriptions
const VALUE_DESCRIPTIONS: Record<string, string> = {
  // Categorical values are already human-readable from backend
  // This is used for additional formatting if needed
}

// Format numeric values with context
function formatValue(feature: string, value: string): string {
  // Backend already provides human-readable values for categorical features
  // Just format numerical values with appropriate units
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') || feature.includes('months')) {
      return `${numValue} months`
    } else if (feature.includes('Credit Amount') || feature.includes('Amount')) {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age')) {
      return `${numValue} years old`
    } else if (feature.includes('Rate') || feature.includes('Burden')) {
      return `${numValue}% of income`
    } else if (feature.includes('Residence') || feature.includes('Years')) {
      return `${numValue} years`
    } else if (feature.includes('Credits') || feature.includes('Loans')) {
      return `${numValue} loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('Dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('Score') || feature.includes('Ratio')) {
      return numValue.toFixed(2)
    }
  }
  
  // Return the value as-is (backend provides human-readable categorical values)
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
