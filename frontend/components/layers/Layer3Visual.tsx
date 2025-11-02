// Layer 3: Visual - SHAP bar chart showing top 5 features

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

        <div className="space-y-4">
          {top5Features.map((feature, index) => {
            const percentage = (Math.abs(feature.shap_value) / maxAbsShap) * 100
            const isPositive = feature.impact === 'positive'
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{feature.feature}</p>
                    <p className="text-sm text-gray-600">
                      Value: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{feature.value}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      Impact: {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
                    </p>
                  </div>
                </div>
                
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                      isPositive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="h-full flex items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-white">
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

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">
          <strong>How to read this chart:</strong>
        </p>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>
            <strong>Green bars</strong> show factors that increase the likelihood of approval
          </li>
          <li>
            <strong>Red bars</strong> show factors that decrease the likelihood of approval
          </li>
          <li>
            <strong>Bar length</strong> represents the relative strength of each factor's influence
          </li>
          <li>
            The AI considered all these factors together to reach a{' '}
            <span className={isApproved ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
              {decision}
            </span>{' '}
            decision with {(probability * 100).toFixed(1)}% confidence
          </li>
        </ul>
      </div>
    </div>
  )
}
