// Layer 2: Short Text - GPT-4 generated natural language explanation

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer2ShortTextProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

export default function Layer2ShortText({ decision, probability, shapFeatures }: Layer2ShortTextProps) {
  // Get top 3 features
  const top3Features = shapFeatures.slice(0, 3)
  
  if (top3Features.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  
  // Generate natural language explanation based on top 3 features
  // In production, this would come from GPT-4 API
  // For now, we'll generate a structured explanation
  const generateExplanation = () => {
    const decisionText = isApproved ? 'approved' : 'rejected'
    const confidenceText = `${(probability * 100).toFixed(0)}%`
    
    // Build explanation from top 3 features
    const feature1 = top3Features[0]
    const feature2 = top3Features[1]
    const feature3 = top3Features[2]
    
    const impact1 = feature1.impact === 'positive' ? 'positively influenced' : 'negatively influenced'
    const impact2 = feature2.impact === 'positive' ? 'supported' : 'raised concerns about'
    const impact3 = feature3.impact === 'positive' ? 'further strengthened' : 'also affected'
    
    return `This credit application was ${decisionText} with ${confidenceText} confidence. The decision was primarily ${impact1} by the applicant's ${feature1.feature.toLowerCase()} (${feature1.value}), which was the strongest factor. Additionally, the ${feature2.feature.toLowerCase()} (${feature2.value}) ${impact2} the decision. Finally, the ${feature3.feature.toLowerCase()} (${feature3.value}) ${impact3} the overall assessment.`
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
            Layer 2: Natural Language Explanation
          </h3>
          <p className="text-gray-600">AI-generated summary of top 3 factors</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💬</div>
          <div className="flex-1">
            <p className="text-lg leading-relaxed text-gray-800">
              {generateExplanation()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Key Factors Breakdown:</h4>
        <div className="space-y-3">
          {top3Features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                feature.impact === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{feature.feature}</p>
                <p className="text-sm text-gray-600">
                  Value: <span className="font-mono bg-white px-2 py-0.5 rounded">{feature.value}</span>
                  {' • '}
                  Impact: <span className={feature.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                    {feature.impact === 'positive' ? 'Increases' : 'Decreases'} approval likelihood
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>💡 About this explanation:</strong> This natural language summary translates the AI's 
          mathematical decision into plain English. It focuses on the three most important factors and 
          explains how they contributed to the{' '}
          <span className={isApproved ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
            {decision}
          </span>{' '}
          decision.
        </p>
      </div>
    </div>
  )
}
