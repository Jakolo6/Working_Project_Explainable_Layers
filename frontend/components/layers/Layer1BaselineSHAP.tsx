// Layer 1: Baseline SHAP Values - Simple, minimal presentation of raw SHAP data
// No visualizations, no dashboard - just the essential SHAP information

'use client'

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer1BaselineSHAPProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

export default function Layer1BaselineSHAP({ decision, probability, shapFeatures }: Layer1BaselineSHAPProps) {
  // Sort features by absolute SHAP value (most impactful first)
  const sortedFeatures = [...shapFeatures].sort((a, b) => 
    Math.abs(b.shap_value) - Math.abs(a.shap_value)
  )
  
  const positiveFeatures = sortedFeatures.filter(f => f.impact === 'positive')
  const negativeFeatures = sortedFeatures.filter(f => f.impact === 'negative')
  
  if (shapFeatures.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  const confidencePercent = (probability * 100).toFixed(0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Simple Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          SHAP Feature Analysis
        </h2>
        <p className="text-gray-600 text-sm">
          Raw SHAP values showing how each feature influenced the credit decision.
        </p>
      </div>

      {/* Decision Summary */}
      <div className={`p-4 rounded-lg mb-6 ${
        isApproved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Decision:</span>
            <span className={`ml-2 font-bold ${isApproved ? 'text-green-700' : 'text-red-700'}`}>
              {decision.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Model Confidence:</span>
            <span className="ml-2 font-bold text-gray-900">{confidencePercent}%</span>
          </div>
        </div>
      </div>

      {/* SHAP Value Legend */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How to Read SHAP Values:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded"></span>
            <span><strong>Positive (+)</strong> = Increases risk → pushes toward rejection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            <span><strong>Negative (−)</strong> = Decreases risk → supports approval</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{shapFeatures.length}</div>
          <div className="text-xs text-gray-600">Total Features</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">{positiveFeatures.length}</div>
          <div className="text-xs text-red-600">Risk Increasing</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{negativeFeatures.length}</div>
          <div className="text-xs text-green-600">Risk Decreasing</div>
        </div>
      </div>

      {/* Complete SHAP Values Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            All Feature Contributions (sorted by impact)
          </h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Rank</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Feature</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Value</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">SHAP Value</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedFeatures.map((feature, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2 text-gray-900 font-medium">
                    {feature.feature}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {feature.value}
                  </td>
                  <td className={`px-4 py-2 text-right font-mono font-medium ${
                    feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      feature.impact === 'positive' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {feature.impact === 'positive' ? '↑ Risk' : '↓ Risk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple Footer Note */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <strong>Note:</strong> SHAP (SHapley Additive exPlanations) values show how much each 
        feature contributed to the model's prediction. Larger absolute values indicate stronger influence.
      </div>
    </div>
  )
}
