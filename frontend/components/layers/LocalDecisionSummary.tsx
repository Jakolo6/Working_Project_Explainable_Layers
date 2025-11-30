// LocalDecisionSummary.tsx - Shows the LOCAL decision summary for THIS specific applicant
// Note: This is about the individual decision, not how the model works globally

'use client'

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  // 'positive' = increases default risk (bad for applicant) = RED
  // 'negative' = decreases default risk (good for applicant) = GREEN
  impact: 'positive' | 'negative'
}

interface LocalDecisionSummaryProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
  compact?: boolean
}

export default function LocalDecisionSummary({ 
  decision, 
  probability, 
  shapFeatures,
  compact = false 
}: LocalDecisionSummaryProps) {
  // Sort features by absolute SHAP value
  const sortedFeatures = [...shapFeatures].sort((a, b) => 
    Math.abs(b.shap_value) - Math.abs(a.shap_value)
  )
  
  // Split by impact: positive = risk-increasing (bad), negative = risk-decreasing (good)
  const riskIncreasingFeatures = sortedFeatures.filter(f => f.impact === 'positive')
  const riskDecreasingFeatures = sortedFeatures.filter(f => f.impact === 'negative')
  
  // Get top 5 for compact view
  const topFeatures = sortedFeatures.slice(0, 5)
  const maxAbsShap = Math.max(...topFeatures.map(f => Math.abs(f.shap_value)))

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            This Application's Summary
          </h3>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
              decision === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {decision.toUpperCase()} ({(probability * 100).toFixed(0)}% confidence)
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Model is {(probability * 100).toFixed(0)}% confident in this {decision}
            </p>
          </div>
        </div>
        
        {/* Mini bar chart */}
        <div className="space-y-1.5">
          {topFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-32 truncate text-slate-600" title={feature.feature}>
                {feature.feature}
              </span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    feature.impact === 'positive' ? 'bg-red-400' : 'bg-green-400'
                  }`}
                  style={{ 
                    width: `${(Math.abs(feature.shap_value) / maxAbsShap) * 100}%` 
                  }}
                />
              </div>
              <span className={`w-12 text-right font-mono ${
                feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
              }`}>
                {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
          <span>{shapFeatures.length} features analyzed</span>
          <span className="text-red-500">{riskIncreasingFeatures.length} risk-increasing</span>
          <span className="text-green-500">{riskDecreasingFeatures.length} risk-decreasing</span>
        </div>
      </div>
    )
  }

  // Full version
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            📊 This Application's Analysis
          </h3>
          <p className="text-sm text-slate-600">
            How this specific applicant's {shapFeatures.length} factors influenced the decision
          </p>
        </div>
        <div className="text-right">
          <div className={`px-4 py-2 rounded-lg text-lg font-bold inline-block ${
            decision === 'approved' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {decision.toUpperCase()}
            <span className="text-sm font-normal ml-2">
              ({(probability * 100).toFixed(0)}% confidence)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Model is {(probability * 100).toFixed(0)}% confident in this {decision}
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 text-center border border-slate-200">
          <div className="text-2xl font-bold text-slate-800">{shapFeatures.length}</div>
          <div className="text-xs text-slate-500 uppercase">Total Features</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{riskIncreasingFeatures.length}</div>
          <div className="text-xs text-slate-500 uppercase">Risk Increasing</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">{riskDecreasingFeatures.length}</div>
          <div className="text-xs text-slate-500 uppercase">Risk Decreasing</div>
        </div>
      </div>

      {/* Top 5 Features Bar Chart */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Top 5 Influential Features</h4>
        <div className="space-y-2">
          {topFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-8 text-sm font-bold text-slate-400">#{idx + 1}</span>
              <span className="w-40 text-sm text-slate-700 truncate" title={feature.feature}>
                {feature.feature}
              </span>
              <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    feature.impact === 'positive' 
                      ? 'bg-gradient-to-r from-red-400 to-red-500' 
                      : 'bg-gradient-to-r from-green-400 to-green-500'
                  }`}
                  style={{ 
                    width: `${(Math.abs(feature.shap_value) / maxAbsShap) * 100}%` 
                  }}
                />
              </div>
              <span className={`w-16 text-right text-sm font-mono font-semibold ${
                feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
              }`}>
                {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400"></div>
          <span>Red = Factor increased risk for this applicant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400"></div>
          <span>Green = Factor decreased risk for this applicant</span>
        </div>
      </div>
    </div>
  )
}
