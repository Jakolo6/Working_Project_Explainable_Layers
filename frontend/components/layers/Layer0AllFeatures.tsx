// Layer 0: All Features - Complete SHAP values for all features

'use client'

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer0AllFeaturesProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Helper function to format feature values
function formatValue(feature: string, value: string): string {
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') || feature.includes('months')) {
      return `${numValue} months`
    } else if (feature.includes('Credit Amount') || feature.includes('Amount')) {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age')) {
      return `${numValue} years old`
    } else if (feature.toLowerCase().includes('rate') || feature.includes('Burden')) {
      return `${numValue.toFixed(2)}% of income`
    } else if (feature.toLowerCase().includes('residence')) {
      return `${numValue} years`
    } else if (feature.toLowerCase().includes('credits')) {
      return `${numValue} loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.toLowerCase().includes('dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('Score') || feature.includes('Ratio')) {
      return numValue.toLocaleString()
    }
  }
  
  return value
}

// Helper function to get impact color
function getImpactColor(impact: 'positive' | 'negative'): string {
  return impact === 'positive' ? 'text-red-600' : 'text-green-600'
}

// Helper function to get impact description
function getImpactDescription(impact: 'positive' | 'negative', decision: string): string {
  if (decision === 'rejected') {
    return impact === 'positive' ? 'Increases rejection risk' : 'Decreases rejection risk'
  } else {
    return impact === 'positive' ? 'Supports approval' : 'Against approval'
  }
}

export default function Layer0AllFeatures({ decision, probability, shapFeatures }: Layer0AllFeaturesProps) {
  // Sort features by absolute SHAP value (most important first)
  const sortedFeatures = [...shapFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
  
  // Split into positive and negative impact features
  const positiveFeatures = sortedFeatures.filter(f => f.impact === 'positive')
  const negativeFeatures = sortedFeatures.filter(f => f.impact === 'negative')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete SHAP Analysis
        </h2>
        <p className="text-gray-600">
          All {shapFeatures.length} features analyzed with their individual impact on the decision
        </p>
        <div className={`inline-flex items-center px-4 py-2 rounded-lg mt-3 ${
          decision === 'approved' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <span className="font-semibold">
            Decision: {decision.toUpperCase()} ({(probability * 100).toFixed(1)}% confidence)
          </span>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{shapFeatures.length}</div>
          <div className="text-sm text-gray-600">Total Features</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{positiveFeatures.length}</div>
          <div className="text-sm text-gray-600">Risk Increasing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{negativeFeatures.length}</div>
          <div className="text-sm text-gray-600">Risk Decreasing</div>
        </div>
      </div>

      {/* All Features Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Feature Analysis
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Features sorted by impact magnitude (most influential first)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SHAP Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visual
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedFeatures.map((feature, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{feature.feature}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatValue(feature.feature, feature.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    <span className={getImpactColor(feature.impact)}>
                      {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      feature.impact === 'positive' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getImpactDescription(feature.impact, decision)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            feature.impact === 'positive' ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.abs(feature.shap_value) / Math.max(...sortedFeatures.map(f => Math.abs(f.shap_value))) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Understanding SHAP Values</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>SHAP Value:</strong> Measures how much each feature contributes to the final decision</p>
          <p><strong>Positive values:</strong> <span className="text-red-600">Increase rejection risk</span> (push toward rejection)</p>
          <p><strong>Negative values:</strong> <span className="text-green-600">Decrease rejection risk</span> (push toward approval)</p>
          <p><strong>Magnitude:</strong> Larger absolute values indicate stronger influence on the decision</p>
        </div>
      </div>
    </div>
  )
}
