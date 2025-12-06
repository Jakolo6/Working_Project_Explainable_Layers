// Layer 1: Baseline SHAP Explanation - Simple global context + SHAP values table
// Minimal styling, serves as the baseline for comparison with other layers

'use client'

import React from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { getFeatureDescription } from '@/lib/featureDescriptions'
import { isCreditHistoryFeature, CREDIT_HISTORY_WARNING_TEXT } from '@/components/CreditHistoryWarning'
import DecisionHeader from './DecisionHeader'

// Simple display name mapping (same as in Layer2Dashboard)
const FEATURE_DISPLAY_MAP: Record<string, string> = {
  'Checking Account Status': 'Checking Account',
  'Savings Account Status': 'Savings Account',
  'Credit History': 'Credit History',
  'Loan Purpose': 'Loan Purpose',
  'Employment Duration': 'Employment',
  'Housing Status': 'Housing',
  'Property Ownership': 'Property',
  'Other Debtors/Guarantors': 'Guarantors',
  'Other Payment Plans': 'Other Plans',
  'Job Type': 'Job Type',
  'Telephone Registration': 'Telephone',
  'Loan Duration (months)': 'Loan Duration',
  'Credit Amount': 'Credit Amount',
  'Installment Rate': 'Installment Rate',
  'Years at Residence': 'Residence',
  'Age': 'Age',
  'Existing Credits': 'Existing Credits',
  'Number of Dependents': 'Dependents',
  'Monthly Payment Burden': 'Monthly Burden',
  'Financial Stability Score': 'Stability Score',
  'Credit Risk Ratio': 'Risk Ratio',
  'Credit to Income Ratio': 'Credit/Income',
  'Duration Risk Score': 'Duration Risk',
}

function getDisplayName(rawName: string): string {
  if (FEATURE_DISPLAY_MAP[rawName]) return FEATURE_DISPLAY_MAP[rawName]
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_MAP)) {
    if (rawName.toLowerCase().includes(key.toLowerCase())) return value
  }
  return rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

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
      {/* Decision Header with Interest Rate */}
      <DecisionHeader decision={decision} probability={probability} />


      {/* Complete SHAP Values Table - with fixed height and scroll */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
          <h3 className="font-semibold text-gray-900">
            All Feature Contributions (sorted by impact magnitude)
          </h3>
        </div>
        
        <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Feature</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  <Tooltip content="SHAP (SHapley Additive exPlanations) values show how much each feature pushed the prediction toward approval (negative values) or rejection (positive values). Larger absolute values = stronger influence.">
                    <span className="cursor-help border-b border-dotted border-gray-400">SHAP Value</span>
                  </Tooltip>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedFeatures.map((feature, idx) => {
                const isCreditHistory = isCreditHistoryFeature(feature.feature)
                const description = getFeatureDescription(feature.feature) || getFeatureDescription(getDisplayName(feature.feature))
                const tooltipContent = isCreditHistory
                  ? `${description?.description || feature.feature}\n\n⚠️ ${CREDIT_HISTORY_WARNING_TEXT}`
                  : description?.description || 'This factor influenced the credit decision.'
                
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-600 font-mono">
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
