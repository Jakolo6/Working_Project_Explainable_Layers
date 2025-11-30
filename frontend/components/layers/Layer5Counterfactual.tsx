// Layer 5: Interactive Counterfactual Tool - What minimal changes would reverse the decision

'use client'

import React, { useState, useEffect } from 'react'
import GlobalModelExplanation from './GlobalModelExplanation'
import LocalDecisionSummary from './LocalDecisionSummary'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  // 'positive' = increases default risk (bad for applicant) = RED
  // 'negative' = decreases default risk (good for applicant) = GREEN
  impact: 'positive' | 'negative'
}

interface CounterfactualScenario {
  features: Record<string, string>
  deltas: Record<string, { original: string; changed: string }>
  prediction: string
  probability: number
}

interface Layer5CounterfactualProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}


export default function Layer5Counterfactual({ decision, probability, shapFeatures }: Layer5CounterfactualProps) {
  const [counterfactuals, setCounterfactuals] = useState<CounterfactualScenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Features with negative impact (risk-increasing) - candidates for change
  const negativeImpactFeatures = shapFeatures.filter(f => f.impact === 'positive').slice(0, 5)
  
  useEffect(() => {
    const fetchCounterfactuals = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/api/v1/explanations/level3/counterfactuals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            probability,
            shap_features: shapFeatures,
            target: decision === 'rejected' ? 'approved' : 'rejected'
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setCounterfactuals(data.counterfactuals || [])
        } else {
          throw new Error('API error')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to compute counterfactuals'
        console.error('[ERROR] Counterfactual API error:', errorMessage)
        setError(errorMessage)
        setCounterfactuals([])
      } finally {
        setIsLoading(false)
      }
    }
    
    if (shapFeatures.length > 0) {
      fetchCounterfactuals()
    }
  }, [decision, probability, shapFeatures])
  
  if (shapFeatures.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  const targetDecision = isApproved ? 'rejection' : 'approval'

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
      
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            isApproved ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isApproved ? '✓' : '✗'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Interactive Counterfactual Analysis
            </h3>
            <p className="text-gray-600">
              What minimal changes would lead to {targetDecision}?
            </p>
          </div>
        </div>

        {/* Explanation Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔮</span>
            <p className="text-sm text-gray-700">
              <strong>What-If Analysis:</strong> These scenarios show the <em>minimal, plausible changes</em> to 
              the applicant's profile that would reverse the AI's decision. Each scenario highlights which 
              features would need to change and by how much.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Computing counterfactuals...</span>
          </div>
        )}

        {/* Counterfactual Scenarios */}
        {!isLoading && counterfactuals.length > 0 && (
          <div className="space-y-6">
            {counterfactuals.map((scenario, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">
                    Scenario {idx + 1}: {Object.keys(scenario.deltas).length} Change{Object.keys(scenario.deltas).length !== 1 ? 's' : ''}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    scenario.prediction === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    → {scenario.prediction.toUpperCase()} ({(scenario.probability * 100).toFixed(0)}%)
                  </span>
                </div>

                {/* Changes Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Feature</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Original</th>
                        <th className="px-4 py-2 text-center font-semibold text-slate-700">→</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700">Changed To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(scenario.deltas).map(([feature, delta], fIdx) => (
                        <tr key={fIdx} className="border-t border-slate-200">
                          <td className="px-4 py-3 font-medium text-slate-800">{feature}</td>
                          <td className="px-4 py-3">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono text-xs">
                              {delta.original}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-purple-500 font-bold">→</td>
                          <td className="px-4 py-3">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono text-xs">
                              {delta.changed}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-3">⚠️</div>
            <p className="text-red-700 font-semibold mb-2">Failed to Compute Counterfactuals</p>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-2">The backend counterfactual API must be running and accessible.</p>
          </div>
        )}

        {/* No Counterfactuals */}
        {!isLoading && !error && counterfactuals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No counterfactual scenarios could be generated for this prediction.</p>
          </div>
        )}

        {/* Risk-Increasing Features Summary */}
        <div className="mt-6 bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">
            ⚠️ Key Risk-Increasing Factors (Candidates for Change)
          </h4>
          <div className="grid gap-2">
            {negativeImpactFeatures.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100">
                <span className="text-sm text-slate-700">{f.feature}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">{f.value}</span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                    +{f.shap_value.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <p className="text-sm text-blue-800">
              <strong>About Counterfactuals:</strong> These scenarios identify the <em>smallest</em> set of 
              realistic changes that would flip the model's decision. They help understand what factors 
              most directly influence the outcome and what actionable steps could change it.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
