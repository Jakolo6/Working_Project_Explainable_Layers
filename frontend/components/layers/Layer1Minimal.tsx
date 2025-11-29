// Layer 1: Analytical SHAP Dashboard - Technical information-dense SHAP interface

'use client'

import React from 'react'
import GlobalModelExplanation from './GlobalModelExplanation'
import LocalDecisionSummary from './LocalDecisionSummary'
import Tooltip from '@/components/ui/Tooltip'
import { getFeatureDescription } from '@/lib/featureDescriptions'

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

// Format numeric values with context
function formatValue(feature: string, value: string): string {
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') && feature.includes('months')) {
      return `${numValue} months`
    } else if (feature.includes('Credit Amount') || feature.includes('Amount')) {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age')) {
      return `${numValue} years`
    } else if (feature.includes('Monthly Payment Burden')) {
      return `${numValue.toLocaleString()} DM/month`
    } else if (feature.includes('Score') || feature.includes('Ratio')) {
      return numValue.toFixed(2)
    }
  }
  return value
}

export default function Layer1Minimal({ decision, probability, shapFeatures }: Layer1MinimalProps) {
  // Sort features by absolute SHAP value
  const sortedFeatures = [...shapFeatures].sort((a, b) => 
    Math.abs(b.shap_value) - Math.abs(a.shap_value)
  )
  
  const maxAbsShap = Math.max(...sortedFeatures.map(f => Math.abs(f.shap_value)))
  const baseValue = 0 // Base prediction value
  
  // Calculate cumulative SHAP for waterfall
  let cumulative = baseValue
  const waterfallData = sortedFeatures.slice(0, 10).map(f => {
    const start = cumulative
    cumulative += f.shap_value
    return { ...f, start, end: cumulative }
  })
  
  if (shapFeatures.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'

  return (
    <div className="space-y-6">
      {/* Global Model Explanation - How the tool works in general */}
      <GlobalModelExplanation defaultExpanded={false} />
      
      {/* Local Decision Summary - This specific applicant */}
      <div className="border-t-4 border-indigo-200 pt-4">
        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>👤</span> This Applicant's Decision
        </h3>
        <LocalDecisionSummary
          decision={decision}
          probability={probability}
          shapFeatures={shapFeatures}
          compact={true}
        />
      </div>
      
      {/* Header */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            isApproved ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isApproved ? '✓' : '✗'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Analytical SHAP Dashboard
            </h3>
            <p className="text-gray-600">Technical analysis of local feature contributions</p>
          </div>
        </div>

        {/* Waterfall Plot (CSS-based) */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            📊 Local SHAP Waterfall Plot (Top 10 Features)
          </h4>
          
          <div className="space-y-2">
            {/* Base value */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="w-40">Base prediction</span>
              <span className="font-mono">{baseValue.toFixed(3)}</span>
            </div>
            
            {waterfallData.map((feature, idx) => {
              const barWidth = (Math.abs(feature.shap_value) / maxAbsShap) * 100
              const isPositive = feature.shap_value > 0
              
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Tooltip content={getFeatureDescription(feature.feature)?.description || feature.feature}>
                    <span className="w-40 text-sm text-slate-700 truncate cursor-help">
                      {feature.feature}
                    </span>
                  </Tooltip>
                  
                  {/* Waterfall bar */}
                  <div className="flex-1 h-6 relative">
                    <div className="absolute inset-0 flex items-center">
                      {/* Center line */}
                      <div className="absolute left-1/2 h-full w-px bg-slate-300" />
                      
                      {/* Bar */}
                      <div
                        className={`absolute h-5 rounded ${
                          isPositive 
                            ? 'bg-gradient-to-r from-red-400 to-red-500' 
                            : 'bg-gradient-to-r from-green-400 to-green-500'
                        }`}
                        style={{
                          width: `${barWidth / 2}%`,
                          left: isPositive ? '50%' : `${50 - barWidth / 2}%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  <span className={`w-20 text-right text-sm font-mono ${
                    isPositive ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {isPositive ? '+' : ''}{feature.shap_value.toFixed(3)}
                  </span>
                </div>
              )
            })}
            
            {/* Final prediction */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-200">
              <span className="w-40">Final prediction</span>
              <span className="font-mono">{cumulative.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Numeric Feature Contributions Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              📋 Complete Feature Contributions
            </h4>
          </div>
          
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Feature</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Value</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">SHAP</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">|SHAP|</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFeatures.map((feature, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <Tooltip content={getFeatureDescription(feature.feature)?.description || 'No description'}>
                        <span className="text-slate-700 cursor-help hover:text-blue-600">
                          {feature.feature}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                      {formatValue(feature.feature, feature.value)}
                    </td>
                    <td className={`px-4 py-2 text-right font-mono text-xs ${
                      feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-slate-500">
                      {Math.abs(feature.shap_value).toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        feature.impact === 'positive' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {feature.impact === 'positive' ? '↑' : '↓'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technical Legend */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📖 Technical Reference</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p><strong>SHAP Value:</strong> Additive contribution of each feature to the model output</p>
            <p><strong>↑ Positive:</strong> Increases bad credit risk (pushes toward rejection)</p>
            <p><strong>↓ Negative:</strong> Decreases bad credit risk (pushes toward approval)</p>
            <p><strong>Waterfall:</strong> Shows how features cumulatively shift the prediction from the base value</p>
          </div>
        </div>
      </div>
    </div>
  )
}
