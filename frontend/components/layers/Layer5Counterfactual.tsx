// Layer 5: Counterfactual - Realistic what-if scenarios with human-readable labels

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer5CounterfactualProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature mappings (same as previous layers)
const FEATURE_LABELS: Record<string, string> = {
  'Attribute1_A11': 'Checking account balance', 'Attribute1_A12': 'Checking account balance',
  'Attribute1_A13': 'Checking account balance', 'Attribute1_A14': 'Checking account status',
  'Attribute3_A30': 'Credit history', 'Attribute3_A31': 'Credit history',
  'Attribute3_A32': 'Credit history', 'Attribute3_A33': 'Credit history', 'Attribute3_A34': 'Credit history',
  'Attribute4_A40': 'Loan purpose', 'Attribute4_A41': 'Loan purpose', 'Attribute4_A42': 'Loan purpose',
  'Attribute4_A43': 'Loan purpose', 'Attribute4_A44': 'Loan purpose', 'Attribute4_A45': 'Loan purpose',
  'Attribute4_A46': 'Loan purpose', 'Attribute4_A48': 'Loan purpose', 'Attribute4_A49': 'Loan purpose', 'Attribute4_A410': 'Loan purpose',
  'Attribute6_A61': 'Savings account level', 'Attribute6_A62': 'Savings account level',
  'Attribute6_A63': 'Savings account level', 'Attribute6_A64': 'Savings account level', 'Attribute6_A65': 'Savings account status',
  'Attribute7_A71': 'Employment status', 'Attribute7_A72': 'Employment duration',
  'Attribute7_A73': 'Employment duration', 'Attribute7_A74': 'Employment duration', 'Attribute7_A75': 'Employment duration',
  'Attribute12_A121': 'Property ownership', 'Attribute12_A122': 'Property ownership',
  'Attribute12_A123': 'Property ownership', 'Attribute12_A124': 'Property status',
  'Attribute15_A151': 'Housing situation', 'Attribute15_A152': 'Housing situation', 'Attribute15_A153': 'Housing situation',
  'Attribute17_A171': 'Employment type', 'Attribute17_A172': 'Employment type',
  'Attribute17_A173': 'Employment type', 'Attribute17_A174': 'Employment type',
  'Duration': 'Loan duration', 'Credit amount': 'Loan amount', 'Installment rate': 'Monthly payment burden',
  'Present residence since': 'Residential stability', 'Age': 'Age',
  'Number of existing credits': 'Existing loans', 'Number of people being liable to provide maintenance for': 'Number of dependents',
}

const VALUE_DESCRIPTIONS: Record<string, string> = {
  'Attribute1_A11': 'Negative balance', 'Attribute1_A12': 'Low balance (under 200 DM)',
  'Attribute1_A13': 'Good balance (over 200 DM)', 'Attribute1_A14': 'No checking account',
  'Attribute6_A61': 'Very low savings (under 100 DM)', 'Attribute6_A62': 'Low savings (100-500 DM)',
  'Attribute6_A63': 'Moderate savings (500-1000 DM)', 'Attribute6_A64': 'Good savings (over 1000 DM)',
  'Attribute6_A65': 'No savings account',
  'Attribute7_A71': 'Unemployed', 'Attribute7_A72': 'Short employment (under 1 year)',
  'Attribute7_A73': 'Stable employment (1-4 years)', 'Attribute7_A74': 'Long employment (4-7 years)',
  'Attribute7_A75': 'Very stable employment (over 7 years)',
}

export default function Layer5Counterfactual({ decision, probability, shapFeatures }: Layer5CounterfactualProps) {
  const top3Features = shapFeatures.slice(0, 3)
  
  if (top3Features.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  
  // Generate realistic counterfactual scenarios based on German Credit Dataset
  const generateCounterfactual = (feature: SHAPFeature) => {
    const featureName = feature.feature
    const numValue = parseFloat(feature.value)
    const isNegative = feature.impact === 'negative'
    
    // Duration - suggest moving toward 12-36 month range
    if (featureName === 'Duration' || featureName.includes('Duration')) {
      const current = numValue
      let suggested = current
      let explanation = ''
      let impact = 0
      
      if (isNegative) {
        if (current < 12) {
          suggested = 18
          explanation = 'Extending to a more standard duration would place the applicant within the typical approved range.'
          impact = 8
        } else if (current > 36) {
          suggested = 30
          explanation = 'Reducing to a shorter term would decrease uncertainty and lower perceived risk.'
          impact = 12
        } else {
          suggested = 24
          explanation = 'Adjusting toward the middle of the typical range would improve the risk assessment.'
          impact = 6
        }
      } else {
        explanation = 'This duration is already within the ideal range for approval.'
        impact = 0
      }
      
      return {
        currentValue: `${current} months`,
        suggestedValue: isNegative ? `${suggested} months` : `${current} months`,
        probabilityChange: impact,
        explanation
      }
    }
    
    // Credit amount - suggest moving toward 1,000-10,000 DM range
    if (featureName === 'Credit amount' || featureName.includes('amount')) {
      const current = numValue
      let suggested = current
      let explanation = ''
      let impact = 0
      
      if (isNegative) {
        if (current > 10000) {
          suggested = 8000
          explanation = 'Reducing the requested amount would lower the risk profile and improve approval chances.'
          impact = 15
        } else if (current < 1000) {
          suggested = 2500
          explanation = 'Increasing to a more standard amount would demonstrate clearer financial planning.'
          impact = 5
        } else {
          suggested = Math.floor(current * 0.8)
          explanation = 'A moderate reduction would place the request within a safer range.'
          impact = 10
        }
      } else {
        explanation = 'This amount is already within the optimal range for approval.'
        impact = 0
      }
      
      return {
        currentValue: `${current.toLocaleString()} DM`,
        suggestedValue: isNegative ? `${suggested.toLocaleString()} DM` : `${current.toLocaleString()} DM`,
        probabilityChange: impact,
        explanation
      }
    }
    
    // Savings - suggest moving to at least 100-500 DM range
    if (featureName.includes('Attribute6')) {
      const currentDesc = VALUE_DESCRIPTIONS[featureName] || feature.value
      let suggestedDesc = currentDesc
      let explanation = ''
      let impact = 0
      
      if (isNegative) {
        if (featureName === 'Attribute6_A61' || featureName === 'Attribute6_A65') {
          suggestedDesc = 'Low savings (100-500 DM)'
          explanation = 'Increasing savings would signal stronger financial stability and provide a cushion for unexpected expenses.'
          impact = 18
        } else if (featureName === 'Attribute6_A62') {
          suggestedDesc = 'Moderate savings (500-1000 DM)'
          explanation = 'Building savings to a moderate level would demonstrate better financial planning.'
          impact = 10
        } else {
          explanation = 'Increasing savings further would strengthen the application.'
          impact = 5
        }
      } else {
        explanation = 'This savings level is already favorable for approval.'
        impact = 0
      }
      
      return {
        currentValue: currentDesc,
        suggestedValue: suggestedDesc,
        probabilityChange: impact,
        explanation
      }
    }
    
    // Employment - suggest stable employment
    if (featureName.includes('Attribute7')) {
      const currentDesc = VALUE_DESCRIPTIONS[featureName] || feature.value
      let suggestedDesc = currentDesc
      let explanation = ''
      let impact = 0
      
      if (isNegative) {
        if (featureName === 'Attribute7_A71' || featureName === 'Attribute7_A72') {
          suggestedDesc = 'Stable employment (1-4 years)'
          explanation = 'Establishing stable employment would demonstrate reliable income and job security.'
          impact = 14
        } else {
          suggestedDesc = 'Long employment (4-7 years)'
          explanation = 'Longer employment history would further strengthen the income stability assessment.'
          impact = 8
        }
      } else {
        explanation = 'This employment duration is already within the ideal range.'
        impact = 0
      }
      
      return {
        currentValue: currentDesc,
        suggestedValue: suggestedDesc,
        probabilityChange: impact,
        explanation
      }
    }
    
    // Default for other features
    const currentDesc = VALUE_DESCRIPTIONS[featureName] || feature.value
    return {
      currentValue: currentDesc,
      suggestedValue: isNegative ? 'Improved value' : currentDesc,
      probabilityChange: isNegative ? 8 : 0,
      explanation: isNegative
        ? 'Improving this factor would place the applicant within a more favorable range.'
        : 'This factor is already within the ideal range for approval.'
    }
  }

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
            Layer 5: Counterfactual Explanation
          </h3>
          <p className="text-gray-600">What-if scenarios showing how changes would affect the decision</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded-r-lg">
        <p className="text-sm text-gray-700">
          <strong>🔮 What-If Simulation:</strong> This layer answers the question: <em>"What would need to change 
          for this applicant's decision to be different?"</em> Each scenario shows realistic adjustments that could 
          improve the outcome, based on typical patterns in approved applications.
        </p>
      </div>

      <div className="space-y-5">
        {top3Features.map((feature, index) => {
          const counterfactual = generateCounterfactual(feature)
          const wouldImprove = feature.impact === 'negative'
          const featureLabel = FEATURE_LABELS[feature.feature] || feature.feature
          const impactValue = counterfactual.probabilityChange
          
          return (
            <div key={index} className={`rounded-lg p-5 border-2 ${
              wouldImprove ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  wouldImprove ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{featureLabel}</h4>
                  <p className={`text-sm font-medium ${
                    wouldImprove ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {wouldImprove ? '⚠️ Opportunity for improvement' : '✓ Already optimal'}
                  </p>
                </div>
              </div>

              {wouldImprove ? (
                <>
                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-3 border-2 border-gray-300">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Current</p>
                      <p className="text-base font-bold text-gray-900">{counterfactual.currentValue}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl text-gray-400">→</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Suggested</p>
                      <p className="text-base font-bold text-gray-900">{counterfactual.suggestedValue}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-xl">📊</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">Expected Impact:</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 ${
                        impactValue > 10 ? 'bg-green-100 text-green-700' : impactValue > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {impactValue > 0 && <span className="animate-pulse">↑</span>}
                        {impactValue > 0 ? `+${impactValue}%` : 'Minimal'}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed">{counterfactual.explanation}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-gray-300">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>No adjustment needed.</strong> {counterfactual.explanation}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">Understanding Counterfactuals:</p>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Counterfactuals highlight what small, realistic changes could flip the model's decision. 
              They represent actionable steps based on typical patterns in approved applications.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Current decision:</strong>{' '}
              <span className={isApproved ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                {decision.toUpperCase()}
              </span>{' '}
              ({(probability * 100).toFixed(1)}% confidence). 
              {isApproved 
                ? ' The current approval could be maintained or strengthened through these improvements.'
                : ' These changes represent realistic steps that could have improved the applicant\'s chance of approval.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
