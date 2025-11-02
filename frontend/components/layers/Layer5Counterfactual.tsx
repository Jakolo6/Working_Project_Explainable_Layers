// Layer 5: Counterfactual - What-if scenarios showing how changes would affect the decision

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

export default function Layer5Counterfactual({ decision, probability, shapFeatures }: Layer5CounterfactualProps) {
  // Get top 3 features for counterfactual scenarios
  const top3Features = shapFeatures.slice(0, 3)
  
  if (top3Features.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  
  // Generate counterfactual scenarios
  // In production, these would come from re-running the model with modified features
  const generateCounterfactual = (feature: SHAPFeature) => {
    const featureName = feature.feature.toLowerCase()
    
    // Simplified counterfactual generation
    // In production, this would involve actual model predictions
    if (featureName.includes('duration') || featureName.includes('month')) {
      const currentValue = parseInt(feature.value) || 24
      const suggestedValue = feature.impact === 'positive' 
        ? Math.max(12, currentValue - 6)
        : Math.min(48, currentValue + 6)
      
      return {
        currentValue: `${currentValue} months`,
        suggestedValue: `${suggestedValue} months`,
        expectedImpact: feature.impact === 'positive'
          ? 'Slightly decrease approval probability'
          : 'Increase approval probability',
        probabilityChange: feature.impact === 'positive' ? '-5%' : '+8%',
        explanation: feature.impact === 'positive'
          ? 'Shorter durations are generally preferred but this is already good'
          : 'A more standard duration would improve the assessment'
      }
    }
    
    if (featureName.includes('amount') || featureName.includes('credit')) {
      const currentMatch = feature.value.match(/[\d,]+/)
      const currentValue = currentMatch ? parseInt(currentMatch[0].replace(/,/g, '')) : 5000
      const suggestedValue = feature.impact === 'positive'
        ? currentValue
        : Math.floor(currentValue * 0.75)
      
      return {
        currentValue: `€${currentValue.toLocaleString()}`,
        suggestedValue: `€${suggestedValue.toLocaleString()}`,
        expectedImpact: feature.impact === 'positive'
          ? 'Maintain current approval likelihood'
          : 'Significantly increase approval probability',
        probabilityChange: feature.impact === 'positive' ? '0%' : '+15%',
        explanation: feature.impact === 'positive'
          ? 'This amount is already within the optimal range'
          : 'Reducing the requested amount would lower the risk profile'
      }
    }
    
    // Default counterfactual
    return {
      currentValue: feature.value,
      suggestedValue: 'Improved value',
      expectedImpact: feature.impact === 'positive'
        ? 'Maintain approval likelihood'
        : 'Improve approval likelihood',
      probabilityChange: feature.impact === 'positive' ? '0%' : '+10%',
      explanation: feature.impact === 'positive'
        ? 'This factor is already favorable'
        : 'Improving this factor would help the application'
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
          <strong>🔮 What-If Analysis:</strong> These scenarios show how the decision might change if 
          certain factors were different. This helps understand which changes would have the most impact 
          on the outcome.
        </p>
      </div>

      <div className="space-y-6">
        {top3Features.map((feature, index) => {
          const counterfactual = generateCounterfactual(feature)
          const wouldImprove = feature.impact === 'negative'
          
          return (
            <div key={index} className={`rounded-lg p-6 border-2 ${
              wouldImprove ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  wouldImprove ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{feature.feature}</h4>
                  <p className={`text-sm font-medium ${
                    wouldImprove ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {wouldImprove ? '⚠️ Opportunity for improvement' : '✓ Already optimal'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Value</p>
                  <p className="text-lg font-bold text-gray-900">{counterfactual.currentValue}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-3xl text-gray-400">→</span>
                </div>
                <div className={`rounded-lg p-4 border-2 ${
                  wouldImprove ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {wouldImprove ? 'Suggested Value' : 'Optimal Value'}
                  </p>
                  <p className="text-lg font-bold text-gray-900">{counterfactual.suggestedValue}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">Expected Impact:</p>
                    <p className="text-sm text-gray-600">{counterfactual.expectedImpact}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    wouldImprove ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {counterfactual.probabilityChange}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Explanation:</p>
                    <p className="text-sm text-gray-600">{counterfactual.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Understanding Counterfactuals:</p>
            <p className="text-sm text-gray-700 mb-3">
              Counterfactual explanations answer the question: <em>"What would need to change for the 
              decision to be different?"</em> They show the minimal changes needed to flip the outcome.
            </p>
            <p className="text-sm text-gray-700">
              <strong>Current decision:</strong>{' '}
              <span className={isApproved ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                {decision.toUpperCase()}
              </span>{' '}
              with {(probability * 100).toFixed(1)}% confidence. The scenarios above show how specific 
              changes could {isApproved ? 'maintain or improve' : 'improve'} this outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
