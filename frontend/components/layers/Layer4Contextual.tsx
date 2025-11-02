// Layer 4: Contextual - Thresholds and ranges with dataset comparisons

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer4ContextualProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

export default function Layer4Contextual({ decision, probability, shapFeatures }: Layer4ContextualProps) {
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
  
  // Generate contextual information for each feature
  // In production, this would come from backend with real dataset statistics
  const getContextualInfo = (feature: SHAPFeature) => {
    const featureName = feature.feature.toLowerCase()
    
    // Simplified contextual information
    // In production, these would be calculated from the actual dataset
    if (featureName.includes('duration') || featureName.includes('month')) {
      return {
        typical: '12-36 months',
        yourValue: feature.value,
        comparison: feature.impact === 'positive' 
          ? 'within the typical range for approved applications'
          : 'outside the optimal range',
        recommendation: feature.impact === 'positive'
          ? 'This duration is considered manageable'
          : 'Shorter or longer durations might improve approval chances'
      }
    }
    
    if (featureName.includes('amount') || featureName.includes('credit')) {
      return {
        typical: '€2,000 - €10,000',
        yourValue: feature.value,
        comparison: feature.impact === 'positive'
          ? 'within the typical range for approved applications'
          : 'may be considered high risk',
        recommendation: feature.impact === 'positive'
          ? 'This amount aligns with successful applications'
          : 'Lower amounts typically have higher approval rates'
      }
    }
    
    if (featureName.includes('age')) {
      return {
        typical: '25-55 years',
        yourValue: feature.value,
        comparison: feature.impact === 'positive'
          ? 'in the stable age range'
          : 'outside the typical range',
        recommendation: feature.impact === 'positive'
          ? 'This age group shows stable credit behavior'
          : 'Age alone does not determine creditworthiness'
      }
    }
    
    // Default contextual info
    return {
      typical: 'Varies by case',
      yourValue: feature.value,
      comparison: feature.impact === 'positive'
        ? 'positively influences the decision'
        : 'raises some concerns',
      recommendation: feature.impact === 'positive'
        ? 'This factor supports approval'
        : 'This factor may need attention'
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
            Layer 4: Contextual Explanation
          </h3>
          <p className="text-gray-600">Comparison with typical ranges and thresholds</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <p className="text-sm text-gray-700">
          <strong>📊 Understanding the context:</strong> This explanation shows how the applicant's 
          characteristics compare to typical patterns in approved and rejected applications. 
          It provides benchmarks to understand what's considered "normal" or "risky."
        </p>
      </div>

      <div className="space-y-6">
        {top5Features.map((feature, index) => {
          const context = getContextualInfo(feature)
          
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  feature.impact === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{feature.feature}</h4>
                  <p className={`text-sm font-medium ${
                    feature.impact === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {feature.impact === 'positive' ? '↑ Positive Impact' : '↓ Negative Impact'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Value</p>
                  <p className="text-lg font-bold text-gray-900">{context.yourValue}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Typical Range</p>
                  <p className="text-lg font-bold text-gray-900">{context.typical}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">📍</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Comparison:</p>
                    <p className="text-sm text-gray-600">Your value is {context.comparison}.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Context:</p>
                    <p className="text-sm text-gray-600">{context.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <p className="text-sm text-gray-700">
          <strong>🎯 How to interpret this:</strong> Each factor is compared against typical patterns 
          from historical data. Values within "typical ranges" for approved applications generally 
          support approval, while outliers may require additional consideration. The AI weighs all 
          these factors together to reach a{' '}
          <span className={isApproved ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
            {decision}
          </span>{' '}
          decision with {(probability * 100).toFixed(1)}% confidence.
        </p>
      </div>
    </div>
  )
}
