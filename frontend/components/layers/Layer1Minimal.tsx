// Layer 1: Minimal - Single key driver explanation

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
  const impactText = topFeature.impact === 'positive' 
    ? 'increases approval likelihood' 
    : 'decreases approval likelihood'

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
            Layer 1: Minimal Explanation
          </h3>
          <p className="text-gray-600">Single most important factor</p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
        <p className="text-lg text-gray-900 mb-3">
          <strong>Key Factor:</strong>
        </p>
        <p className="text-xl font-semibold text-blue-900 mb-2">
          {topFeature.feature}
        </p>
        <p className="text-gray-700 mb-2">
          Value: <span className="font-mono bg-white px-2 py-1 rounded">{topFeature.value}</span>
        </p>
        <p className="text-sm text-gray-600">
          This factor {impactText} by{' '}
          <span className="font-semibold">{Math.abs(topFeature.shap_value).toFixed(3)}</span> points.
        </p>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>What this means:</strong> The AI's decision to{' '}
          <span className={isApproved ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
            {decision}
          </span>{' '}
          this application (with {(probability * 100).toFixed(1)}% confidence) was most strongly 
          influenced by the applicant's <strong>{topFeature.feature.toLowerCase()}</strong>.
        </p>
      </div>
    </div>
  )
}
