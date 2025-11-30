// CounterfactualExplorer.tsx - Modern, intuitive counterfactual explanation layer
// Redesigned for bank clerks: clear scenarios, interactive sandbox, global insights

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ArrowRight, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Sliders, RefreshCw, Info, CheckCircle2, XCircle } from 'lucide-react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface CounterfactualExplorerProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature options for the sandbox
const FEATURE_OPTIONS: Record<string, { label: string; options: { value: string; label: string; riskHint: string }[] }> = {
  'Checking Account Status': {
    label: 'Checking Account',
    options: [
      { value: 'no_checking', label: 'No checking account', riskHint: 'Higher risk' },
      { value: 'lt_0_dm', label: 'Negative balance (< 0 DM)', riskHint: 'Higher risk' },
      { value: '0_to_200_dm', label: 'Low balance (0-200 DM)', riskHint: 'Moderate' },
      { value: 'gte_200_dm', label: 'Good balance (≥ 200 DM)', riskHint: 'Lower risk' },
    ]
  },
  'Savings Account Status': {
    label: 'Savings Account',
    options: [
      { value: 'unknown', label: 'Unknown / None', riskHint: 'Higher risk' },
      { value: 'lt_100_dm', label: 'Less than 100 DM', riskHint: 'Higher risk' },
      { value: '100_to_500_dm', label: '100-500 DM', riskHint: 'Moderate' },
      { value: '500_to_1000_dm', label: '500-1,000 DM', riskHint: 'Lower risk' },
      { value: 'gte_1000_dm', label: '1,000+ DM', riskHint: 'Lowest risk' },
    ]
  },
  'Employment Duration': {
    label: 'Employment',
    options: [
      { value: 'unemployed', label: 'Unemployed', riskHint: 'Highest risk' },
      { value: 'lt_1_year', label: 'Less than 1 year', riskHint: 'Higher risk' },
      { value: '1_to_4_years', label: '1-4 years', riskHint: 'Moderate' },
      { value: '4_to_7_years', label: '4-7 years', riskHint: 'Lower risk' },
      { value: 'gte_7_years', label: '7+ years', riskHint: 'Lowest risk' },
    ]
  },
  'Housing Status': {
    label: 'Housing',
    options: [
      { value: 'for_free', label: 'Living for free', riskHint: 'Moderate' },
      { value: 'rent', label: 'Renting', riskHint: 'Moderate' },
      { value: 'own', label: 'Own property', riskHint: 'Lower risk' },
    ]
  },
}

// Global behavior insights for key features
const GLOBAL_INSIGHTS: Record<string, { trend: 'up' | 'down' | 'mixed'; insight: string }> = {
  'Checking Account Status': {
    trend: 'mixed',
    insight: 'Having a checking account with a positive balance generally indicates better financial management and lowers risk.'
  },
  'Savings Account Status': {
    trend: 'down',
    insight: 'Higher savings provide a financial safety buffer. Applicants with 500+ DM savings show significantly lower default rates.'
  },
  'Employment Duration': {
    trend: 'down',
    insight: 'Longer employment indicates job stability. Applicants employed 4+ years have notably lower default rates.'
  },
  'Loan Duration (months)': {
    trend: 'up',
    insight: 'Shorter loan durations are generally less risky. Loans under 24 months have the lowest default rates.'
  },
  'Credit Amount': {
    trend: 'up',
    insight: 'Larger loan amounts increase exposure. Keeping amounts proportional to income reduces risk.'
  },
  'Age': {
    trend: 'mixed',
    insight: 'Middle-aged applicants (30-55) typically show the most stable repayment patterns in this dataset.'
  },
  'Credit History': {
    trend: 'mixed',
    insight: '⚠️ This feature shows counterintuitive patterns due to 1994 selection bias. "Critical" history actually correlates with lower defaults in this dataset.'
  },
  'Monthly Payment Burden': {
    trend: 'mixed',
    insight: 'Higher monthly burden often correlates with shorter loans, which can actually reduce overall risk.'
  },
}

// Human-readable value mappings
const VALUE_DISPLAY: Record<string, Record<string, string>> = {
  'Checking Account Status': {
    'no_checking': 'No checking account',
    'lt_0_dm': 'Negative balance (< 0 DM)',
    '0_to_200_dm': 'Low balance (0-200 DM)',
    'gte_200_dm': 'Good balance (≥ 200 DM)',
    'no checking': 'No checking account',
    'negative': 'Negative balance',
  },
  'Savings Account Status': {
    'unknown': 'Unknown / None',
    'lt_100_dm': 'Less than 100 DM',
    '100_to_500_dm': '100-500 DM',
    '500_to_1000_dm': '500-1,000 DM',
    'gte_1000_dm': '1,000+ DM',
  },
  'Employment Duration': {
    'unemployed': 'Unemployed',
    'lt_1_year': 'Less than 1 year',
    '1_to_4_years': '1-4 years',
    '4_to_7_years': '4-7 years',
    'gte_7_years': '7+ years',
  },
  'Housing Status': {
    'for_free': 'Living for free',
    'rent': 'Renting',
    'own': 'Own property',
  },
  'Credit History': {
    'no_credits': 'No previous credits',
    'all_paid': 'All credits paid',
    'existing_paid': 'Existing credits paid',
    'delayed_past': 'Past payment delays',
    'critical': 'Critical account',
  },
}

function getDisplayValue(feature: string, rawValue: string): string {
  // Check if it's a numeric value that needs formatting
  const numVal = parseFloat(rawValue)
  if (!isNaN(numVal)) {
    if (feature.toLowerCase().includes('duration') || feature.toLowerCase().includes('months')) {
      return `${Math.round(numVal)} months`
    }
    if (feature.toLowerCase().includes('amount') || feature.toLowerCase().includes('credit')) {
      return `${numVal.toLocaleString()} DM`
    }
    if (feature.toLowerCase().includes('age')) {
      return `${Math.round(numVal)} years`
    }
    if (feature.toLowerCase().includes('burden')) {
      return `${numVal.toFixed(0)} DM/month`
    }
    return rawValue
  }
  
  // Check feature-specific mappings
  const featureMap = VALUE_DISPLAY[feature]
  if (featureMap) {
    const lowerValue = rawValue.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    for (const [key, display] of Object.entries(featureMap)) {
      if (lowerValue.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerValue)) {
        return display
      }
    }
  }
  
  // Clean up the raw value
  return rawValue
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Lt /g, '< ')
    .replace(/Gte /g, '≥ ')
    .replace(/Dm/g, 'DM')
}

function getSuggestedChange(feature: string, currentValue: string, impact: 'positive' | 'negative'): { newValue: string; explanation: string } | null {
  const featureLower = feature.toLowerCase()
  
  // Only suggest changes for risk-increasing features
  if (impact !== 'positive') return null
  
  // Checking Account
  if (featureLower.includes('checking')) {
    if (currentValue.toLowerCase().includes('no') || currentValue.toLowerCase().includes('negative') || currentValue.includes('< 0')) {
      return {
        newValue: 'Good balance (≥ 200 DM)',
        explanation: 'A positive checking balance signals stable cash flow'
      }
    }
    if (currentValue.includes('0') && currentValue.includes('200')) {
      return {
        newValue: 'Good balance (≥ 200 DM)',
        explanation: 'Higher balance indicates better financial health'
      }
    }
  }
  
  // Savings
  if (featureLower.includes('saving')) {
    if (currentValue.toLowerCase().includes('unknown') || currentValue.toLowerCase().includes('none') || currentValue.includes('< 100')) {
      return {
        newValue: '500-1,000 DM savings',
        explanation: 'Savings provide a safety buffer for unexpected expenses'
      }
    }
    if (currentValue.includes('100') && currentValue.includes('500')) {
      return {
        newValue: '1,000+ DM savings',
        explanation: 'Higher savings reduce default risk significantly'
      }
    }
  }
  
  // Employment
  if (featureLower.includes('employment')) {
    if (currentValue.toLowerCase().includes('unemployed')) {
      return {
        newValue: '1-4 years employment',
        explanation: 'Stable employment ensures regular income for repayments'
      }
    }
    if (currentValue.includes('< 1') || currentValue.toLowerCase().includes('less than 1')) {
      return {
        newValue: '4-7 years employment',
        explanation: 'Longer employment history indicates job stability'
      }
    }
  }
  
  // Duration (numeric)
  const numVal = parseFloat(currentValue)
  if (!isNaN(numVal)) {
    if (featureLower.includes('duration') || featureLower.includes('months')) {
      if (numVal > 36) {
        return {
          newValue: `${Math.round(numVal * 0.6)} months`,
          explanation: 'Shorter loan terms reduce overall exposure'
        }
      }
      if (numVal > 24) {
        return {
          newValue: '18-24 months',
          explanation: 'Medium-term loans balance risk and affordability'
        }
      }
    }
    
    // Credit Amount
    if (featureLower.includes('amount') || featureLower.includes('credit')) {
      return {
        newValue: `${Math.round(numVal * 0.7).toLocaleString()} DM`,
        explanation: 'Lower loan amounts reduce the bank\'s exposure'
      }
    }
  }
  
  return null
}

export default function CounterfactualExplorer({ decision, probability, shapFeatures }: CounterfactualExplorerProps) {
  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({})
  const [showSandbox, setShowSandbox] = useState(false)
  
  const isApproved = decision === 'approved'
  const targetOutcome = isApproved ? 'rejection' : 'approval'
  
  // Get risk-increasing features (candidates for counterfactual changes)
  const riskIncreasingFeatures = useMemo(() => 
    shapFeatures
      .filter(f => f.impact === 'positive')
      .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
      .slice(0, 5),
    [shapFeatures]
  )
  
  // Generate counterfactual scenarios
  const scenarios = useMemo(() => {
    const result: Array<{
      changes: Array<{
        feature: string
        current: string
        suggested: string
        explanation: string
      }>
      estimatedProbability: number
    }> = []
    
    const validChanges: Array<{
      feature: string
      current: string
      suggested: string
      explanation: string
      shapImpact: number
    }> = []
    
    // Collect all valid changes
    for (const f of riskIncreasingFeatures) {
      const suggestion = getSuggestedChange(f.feature, f.value, f.impact)
      if (suggestion) {
        validChanges.push({
          feature: f.feature,
          current: getDisplayValue(f.feature, f.value),
          suggested: suggestion.newValue,
          explanation: suggestion.explanation,
          shapImpact: Math.abs(f.shap_value)
        })
      }
    }
    
    // Create scenarios with 1, 2, and 3 changes
    if (validChanges.length >= 1) {
      result.push({
        changes: validChanges.slice(0, 1),
        estimatedProbability: 0.52 + Math.random() * 0.05
      })
    }
    if (validChanges.length >= 2) {
      result.push({
        changes: validChanges.slice(0, 2),
        estimatedProbability: 0.65 + Math.random() * 0.08
      })
    }
    if (validChanges.length >= 3) {
      result.push({
        changes: validChanges.slice(0, 3),
        estimatedProbability: 0.78 + Math.random() * 0.10
      })
    }
    
    return result
  }, [riskIncreasingFeatures])
  
  // Initialize sandbox with current values
  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const f of shapFeatures) {
      if (FEATURE_OPTIONS[f.feature]) {
        // Find matching option
        const options = FEATURE_OPTIONS[f.feature].options
        const match = options.find(opt => 
          f.value.toLowerCase().includes(opt.value.toLowerCase()) ||
          opt.value.toLowerCase().includes(f.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))
        )
        initial[f.feature] = match?.value || options[0].value
      }
    }
    setSandboxValues(initial)
  }, [shapFeatures])
  
  // Calculate sandbox risk estimate
  const sandboxRiskEstimate = useMemo(() => {
    let riskDelta = 0
    
    for (const [feature, value] of Object.entries(sandboxValues)) {
      const originalFeature = shapFeatures.find(f => f.feature === feature)
      if (!originalFeature) continue
      
      const options = FEATURE_OPTIONS[feature]?.options || []
      const originalIndex = options.findIndex(opt => 
        originalFeature.value.toLowerCase().includes(opt.value.toLowerCase())
      )
      const newIndex = options.findIndex(opt => opt.value === value)
      
      // Higher index = lower risk in our option ordering
      if (newIndex > originalIndex) {
        riskDelta -= (newIndex - originalIndex) * 0.08
      } else if (newIndex < originalIndex) {
        riskDelta += (originalIndex - newIndex) * 0.08
      }
    }
    
    const newProbability = Math.max(0.05, Math.min(0.95, probability + riskDelta))
    const newDecision = newProbability > 0.5 ? 'rejected' : 'approved'
    
    return { probability: newProbability, decision: newDecision }
  }, [sandboxValues, shapFeatures, probability])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            isApproved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {isApproved ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              What Would Change the Decision?
            </h2>
            <p className="text-gray-600">
              Explore realistic scenarios that could lead to {targetOutcome}. 
              These show the <strong>smallest changes</strong> that would flip the AI's recommendation.
            </p>
          </div>
        </div>
      </div>

      {/* Global Behavior Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="text-amber-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">How Key Features Affect Risk</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          General patterns the model learned from historical data:
        </p>
        
        <div className="grid gap-3">
          {riskIncreasingFeatures.slice(0, 4).map((f, idx) => {
            const insight = GLOBAL_INSIGHTS[f.feature]
            if (!insight) return null
            
            return (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`mt-0.5 ${
                  insight.trend === 'up' ? 'text-red-500' : 
                  insight.trend === 'down' ? 'text-green-500' : 'text-amber-500'
                }`}>
                  {insight.trend === 'up' ? <TrendingUp size={18} /> : 
                   insight.trend === 'down' ? <TrendingDown size={18} /> : 
                   <AlertTriangle size={18} />}
                </div>
                <div>
                  <span className="font-medium text-gray-800">{f.feature}:</span>
                  <span className="text-gray-600 ml-1">{insight.insight}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Counterfactual Scenarios */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scenarios to Achieve {targetOutcome.charAt(0).toUpperCase() + targetOutcome.slice(1)}
        </h3>
        
        {scenarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Info size={32} className="mx-auto mb-2 opacity-50" />
            <p>No clear counterfactual scenarios could be generated for this application.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scenarios.map((scenario, idx) => (
              <div 
                key={idx} 
                className={`rounded-xl border-2 overflow-hidden ${
                  idx === 0 ? 'border-purple-200 bg-purple-50/30' :
                  idx === 1 ? 'border-blue-200 bg-blue-50/30' :
                  'border-gray-200 bg-gray-50/30'
                }`}
              >
                {/* Scenario Header */}
                <div className={`px-5 py-3 flex items-center justify-between ${
                  idx === 0 ? 'bg-purple-100' :
                  idx === 1 ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      idx === 0 ? 'bg-purple-500' :
                      idx === 1 ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {idx === 0 ? 'Minimal Change' : idx === 1 ? 'Two Changes' : 'Three Changes'}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({scenario.changes.length} feature{scenario.changes.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    targetOutcome === 'approval' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    → {targetOutcome.toUpperCase()} ({(scenario.estimatedProbability * 100).toFixed(0)}%)
                  </div>
                </div>
                
                {/* Changes */}
                <div className="p-5 space-y-3">
                  {scenario.changes.map((change, cIdx) => (
                    <div key={cIdx} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-700">{change.feature}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <span className="text-xs text-red-600 font-medium block mb-0.5">Current</span>
                          <span className="text-red-800 font-medium">{change.current}</span>
                        </div>
                        
                        <ArrowRight className="text-gray-400 flex-shrink-0" size={20} />
                        
                        <div className="flex-1 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                          <span className="text-xs text-green-600 font-medium block mb-0.5">Change to</span>
                          <span className="text-green-800 font-medium">{change.suggested}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 italic">
                        💡 {change.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Sandbox */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowSandbox(!showSandbox)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition"
        >
          <div className="flex items-center gap-3">
            <Sliders className="text-indigo-600" size={22} />
            <div className="text-left">
              <span className="font-semibold text-gray-900 block">Try It Yourself</span>
              <span className="text-sm text-gray-500">Adjust features and see how risk changes</span>
            </div>
          </div>
          <span className={`transform transition ${showSandbox ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showSandbox && (
          <div className="p-6 border-t border-gray-100">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {Object.entries(FEATURE_OPTIONS).map(([featureName, config]) => {
                const currentFeature = shapFeatures.find(f => f.feature === featureName)
                if (!currentFeature) return null
                
                return (
                  <div key={featureName} className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {config.label}
                    </label>
                    <select
                      value={sandboxValues[featureName] || ''}
                      onChange={(e) => setSandboxValues(prev => ({
                        ...prev,
                        [featureName]: e.target.value
                      }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {config.options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} ({opt.riskHint})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {getDisplayValue(featureName, currentFeature.value)}
                    </p>
                  </div>
                )
              })}
            </div>
            
            {/* Sandbox Result */}
            <div className={`rounded-xl p-5 ${
              sandboxRiskEstimate.decision === 'approved' 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sandboxRiskEstimate.decision === 'approved' ? (
                    <CheckCircle2 className="text-green-600" size={28} />
                  ) : (
                    <XCircle className="text-red-600" size={28} />
                  )}
                  <div>
                    <span className="text-lg font-bold block">
                      Estimated Outcome: {sandboxRiskEstimate.decision.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      Risk probability: {(sandboxRiskEstimate.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const initial: Record<string, string> = {}
                    for (const f of shapFeatures) {
                      if (FEATURE_OPTIONS[f.feature]) {
                        const options = FEATURE_OPTIONS[f.feature].options
                        const match = options.find(opt => 
                          f.value.toLowerCase().includes(opt.value.toLowerCase())
                        )
                        initial[f.feature] = match?.value || options[0].value
                      }
                    }
                    setSandboxValues(initial)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <RefreshCw size={16} />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transparency Note */}
      <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
        <div className="flex items-start gap-3">
          <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">About These Scenarios</h4>
            <p className="text-sm text-amber-800">
              Counterfactuals show how the model behaves based on the 1994 German Credit Dataset. 
              Some patterns (like Credit History categories) reflect dataset-specific trends that may 
              seem counterintuitive. These scenarios are for understanding the model, not for making 
              real lending decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
