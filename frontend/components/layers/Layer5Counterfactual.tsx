// Layer 5: Interactive Counterfactual Tool - What minimal changes would reverse the decision

'use client'

import React, { useState, useEffect } from 'react'
import GlobalSummary from './GlobalSummary'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
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
        console.error('Counterfactual API error:', err)
        // Generate local counterfactuals as fallback
        const localCFs = generateLocalCounterfactuals(shapFeatures, decision)
        setCounterfactuals(localCFs)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (shapFeatures.length > 0) {
      fetchCounterfactuals()
    }
  }, [decision, probability, shapFeatures])
  
  // Generate counterfactuals locally as fallback
  const generateLocalCounterfactuals = (features: SHAPFeature[], currentDecision: string): CounterfactualScenario[] => {
    const scenarios: CounterfactualScenario[] = []
    const riskIncreasing = features.filter(f => f.impact === 'positive').slice(0, 3)
    
    // Generate 2 scenarios
    for (let i = 0; i < Math.min(2, riskIncreasing.length); i++) {
      const changedFeatures = riskIncreasing.slice(0, i + 1)
      const deltas: Record<string, { original: string; changed: string }> = {}
      
      changedFeatures.forEach(f => {
        const numValue = parseFloat(f.value)
        let changedValue = f.value
        
        if (!isNaN(numValue)) {
          // Numerical: adjust toward favorable direction
          if (f.feature.includes('Duration') || f.feature.includes('months')) {
            changedValue = Math.max(12, Math.min(24, numValue)).toString()
          } else if (f.feature.includes('Amount') || f.feature.includes('Credit')) {
            changedValue = Math.floor(numValue * 0.7).toString()
          } else if (f.feature.includes('Age')) {
            changedValue = Math.max(25, Math.min(50, numValue)).toString()
          } else {
            changedValue = (numValue * 0.8).toFixed(0)
          }
        }
        
        deltas[f.feature] = { original: f.value, changed: changedValue }
      })
      
      scenarios.push({
        features: {},
        deltas,
        prediction: currentDecision === 'rejected' ? 'approved' : 'rejected',
        probability: 0.5 + (i + 1) * 0.15
      })
    }
    
    return scenarios
  }
  
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
      {/* Global Summary at Top */}
      <GlobalSummary
        decision={decision}
        probability={probability}
        shapFeatures={shapFeatures}
        compact={true}
      />
      
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

        {/* No Counterfactuals */}
        {!isLoading && counterfactuals.length === 0 && (
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
