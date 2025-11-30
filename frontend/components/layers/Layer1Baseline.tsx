// Layer 1: Baseline SHAP Explanation - Simple global context + SHAP values table
// Minimal styling, serves as the baseline for comparison with other layers

'use client'

import React from 'react'
import GlobalModelExplanation from './GlobalModelExplanation'
import Tooltip from '@/components/ui/Tooltip'
import { getFeatureDescription } from '@/lib/featureDescriptions'
import { isCreditHistoryFeature, CREDIT_HISTORY_WARNING_TEXT } from '@/components/CreditHistoryWarning'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer1BaselineProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

export default function Layer1Baseline({ decision, probability, shapFeatures }: Layer1BaselineProps) {
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
  const confidencePercent = Math.round(probability * 100)

  return (
    <div className="space-y-6">
      {/* Global Model Explanation - How the AI works in general */}
      <GlobalModelExplanation defaultExpanded={true} showVisualizations={false} />

      {/* Decision Summary */}
      <div className={`p-5 rounded-lg border-2 ${
        isApproved 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Decision: <span className={isApproved ? 'text-green-700' : 'text-red-700'}>
                {decision.toUpperCase()}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Based on analysis of {shapFeatures.length} factors
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{confidencePercent}%</div>
            <p className="text-sm text-gray-500">Model Confidence</p>
          </div>
        </div>
      </div>

      {/* SHAP Value Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 How to Read SHAP Values</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 mt-1 rounded bg-red-500 flex-shrink-0"></span>
            <div>
              <span className="font-medium text-red-700">Positive SHAP (+)</span>
              <p className="text-gray-600 text-xs">Increases default risk → pushes toward rejection</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-3 h-3 mt-1 rounded bg-green-500 flex-shrink-0"></span>
            <div>
              <span className="font-medium text-green-700">Negative SHAP (−)</span>
              <p className="text-gray-600 text-xs">Decreases default risk → supports approval</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{shapFeatures.length}</div>
          <div className="text-sm text-gray-600">Total Factors</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">{positiveFeatures.length}</div>
          <div className="text-sm text-red-600">Risk Increasing</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{negativeFeatures.length}</div>
          <div className="text-sm text-green-600">Risk Decreasing</div>
        </div>
      </div>

      {/* Complete SHAP Values Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            All Feature Contributions (sorted by impact magnitude)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Feature</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">SHAP Value</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedFeatures.map((feature, idx) => {
                const isCreditHistory = isCreditHistoryFeature(feature.feature)
                const description = getFeatureDescription(feature.feature)
                const tooltipContent = isCreditHistory
                  ? `${description?.description || feature.feature}\n\n⚠️ ${CREDIT_HISTORY_WARNING_TEXT}`
                  : description?.description || 'This factor influenced the credit decision.'
                
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip content={tooltipContent}>
                        <span className={`font-medium cursor-help hover:text-blue-600 ${
                          isCreditHistory ? 'text-amber-700' : 'text-gray-900'
                        }`}>
                          {feature.feature}
                          {isCreditHistory && <span className="ml-1 text-amber-500">⚠</span>}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {feature.value}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${
                      feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        feature.impact === 'positive' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {feature.impact === 'positive' ? '↑ Risk' : '↓ Risk'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit History Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-lg">⚠️</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">About Historical Data</h4>
            <p className="text-sm text-amber-800">
              This model uses patterns from 1994 German banking data. Some factors, 
              especially credit history categories, may behave differently than modern expectations.
              Features marked with ⚠ should be interpreted with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> SHAP (SHapley Additive exPlanations) values show how much each 
          feature contributed to the model's prediction. Larger absolute values indicate stronger influence.
          Hover over feature names to see descriptions.
        </p>
      </div>
    </div>
  )
}
