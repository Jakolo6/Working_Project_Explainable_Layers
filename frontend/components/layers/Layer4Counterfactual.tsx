// Layer 4: Counterfactual Explanation - What-if scenarios showing how to change the decision
// Shows what changes would flip the decision, with consistent probability calculations

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ArrowRight, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Sliders, RefreshCw, Info, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import GlobalModelExplanation from './GlobalModelExplanation'
import SHAPExplanation from '@/components/ui/SHAPExplanation'
import ModelCertaintyExplanation from '@/components/ui/ModelCertaintyExplanation'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface CounterfactualExplorerProps {
  decision: 'approved' | 'rejected'
  probability: number  // This is confidence = max(P(good), P(bad))
  shapFeatures: SHAPFeature[]
}

// Feature options for the sandbox - using DISPLAY VALUES from backend
// riskLevel: positive = increases risk, negative = decreases risk
const FEATURE_OPTIONS: Record<string, { label: string; options: { value: string; label: string; riskLevel: number }[] }> = {
  'Checking Account Status': {
    label: 'Checking Account',
    options: [
      { value: 'No Checking Account', label: 'No checking account', riskLevel: 0.15 },
      { value: 'Negative Balance (< 0 DM)', label: 'Negative balance (< 0 DM)', riskLevel: 0.10 },
      { value: '0–200 DM', label: 'Low balance (0-200 DM)', riskLevel: 0.05 },
      { value: '≥ 200 DM', label: 'Good balance (≥ 200 DM)', riskLevel: -0.10 },
    ]
  },
  'Savings Account Status': {
    label: 'Savings Account',
    options: [
      { value: 'No Savings', label: 'No savings', riskLevel: 0.12 },
      { value: '< 100 DM', label: 'Less than 100 DM', riskLevel: 0.08 },
      { value: '100–500 DM', label: '100-500 DM', riskLevel: 0.02 },
      { value: '500–1000 DM', label: '500-1,000 DM', riskLevel: -0.05 },
      { value: '≥ 1000 DM', label: '1,000+ DM', riskLevel: -0.12 },
    ]
  },
  'Employment Duration': {
    label: 'Employment',
    options: [
      { value: 'Unemployed', label: 'Unemployed', riskLevel: 0.15 },
      { value: '< 1 Year', label: 'Less than 1 year', riskLevel: 0.08 },
      { value: '1–4 Years', label: '1-4 years', riskLevel: 0.02 },
      { value: '4–7 Years', label: '4-7 years', riskLevel: -0.05 },
      { value: '≥ 7 Years', label: '7+ years', riskLevel: -0.10 },
    ]
  },
  'Housing Status': {
    label: 'Housing',
    options: [
      { value: 'Living for Free', label: 'Living for free', riskLevel: 0.05 },
      { value: 'Renting', label: 'Renting', riskLevel: 0.02 },
      { value: 'Own Property', label: 'Own property', riskLevel: -0.08 },
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
    insight: 'Lower loan amounts relative to income are less risky. Very large loans increase default probability.'
  },
  'Age': {
    trend: 'mixed',
    insight: 'Middle-aged applicants (30-50) typically show the most stable repayment patterns.'
  },
  'Credit History': {
    trend: 'mixed',
    insight: '⚠️ This feature shows counterintuitive patterns in the 1994 dataset. Interpret with caution.'
  },
}

// Get human-readable display value
function getDisplayValue(feature: string, value: string): string {
  const featureLower = feature.toLowerCase()
  
  // Try to match with FEATURE_OPTIONS
  const options = FEATURE_OPTIONS[feature]?.options
  if (options) {
    const match = options.find(opt => 
      value.toLowerCase().includes(opt.value.toLowerCase()) ||
      opt.label.toLowerCase().includes(value.toLowerCase())
    )
    if (match) return match.label
  }
  
  // Numeric formatting
  const numVal = parseFloat(value)
  if (!isNaN(numVal)) {
    if (featureLower.includes('duration') || featureLower.includes('months')) {
      return `${numVal} months`
    }
    if (featureLower.includes('amount') || featureLower.includes('credit')) {
      return `${numVal.toLocaleString()} DM`
    }
    if (featureLower.includes('age')) {
      return `${numVal} years old`
    }
  }
  
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Get suggested change for a feature (for counterfactual scenarios)
function getSuggestedChange(feature: string, currentValue: string, impact: 'positive' | 'negative'): { newValue: string; explanation: string; riskReduction: number } | null {
  const featureLower = feature.toLowerCase()
  
  // Only suggest changes for risk-increasing features (positive impact = increases default risk)
  if (impact !== 'positive') return null
  
  // Checking Account
  if (featureLower.includes('checking')) {
    if (currentValue.toLowerCase().includes('no_checking') || currentValue.toLowerCase().includes('no checking')) {
      return {
        newValue: 'Good balance (≥ 200 DM)',
        explanation: 'Having a positive checking balance shows financial stability',
        riskReduction: 0.25
      }
    }
    if (currentValue.includes('< 0') || currentValue.toLowerCase().includes('negative') || currentValue.includes('lt_0')) {
      return {
        newValue: 'Good balance (≥ 200 DM)',
        explanation: 'A positive balance indicates better cash flow management',
        riskReduction: 0.20
      }
    }
    if (currentValue.includes('0') && currentValue.includes('200')) {
      return {
        newValue: 'Good balance (≥ 200 DM)',
        explanation: 'Higher balances provide more financial cushion',
        riskReduction: 0.15
      }
    }
  }
  
  // Savings Account
  if (featureLower.includes('saving')) {
    if (currentValue.toLowerCase().includes('unknown') || currentValue.toLowerCase().includes('none') || currentValue.includes('< 100') || currentValue.includes('lt_100')) {
      return {
        newValue: '500-1,000 DM savings',
        explanation: 'Savings provide a safety buffer for unexpected expenses',
        riskReduction: 0.18
      }
    }
    if (currentValue.includes('100') && currentValue.includes('500')) {
      return {
        newValue: '1,000+ DM savings',
        explanation: 'Higher savings significantly reduce default risk',
        riskReduction: 0.14
      }
    }
  }
  
  // Employment
  if (featureLower.includes('employment')) {
    if (currentValue.toLowerCase().includes('unemployed')) {
      return {
        newValue: '4-7 years employment',
        explanation: 'Stable employment ensures regular income for repayments',
        riskReduction: 0.25
      }
    }
    if (currentValue.includes('< 1') || currentValue.toLowerCase().includes('less than 1') || currentValue.includes('lt_1')) {
      return {
        newValue: '4-7 years employment',
        explanation: 'Longer employment history indicates job stability',
        riskReduction: 0.15
      }
    }
  }
  
  // Duration (numeric) - shorter is better
  const numVal = parseFloat(currentValue)
  if (!isNaN(numVal)) {
    if (featureLower.includes('duration') || featureLower.includes('months')) {
      if (numVal > 36) {
        return {
          newValue: `${Math.round(numVal * 0.5)} months`,
          explanation: 'Shorter loan terms reduce overall exposure',
          riskReduction: 0.12
        }
      }
      if (numVal > 24) {
        return {
          newValue: '18-24 months',
          explanation: 'Medium-term loans balance risk and affordability',
          riskReduction: 0.08
        }
      }
    }
    
    // Credit Amount - lower is better
    if (featureLower.includes('amount') || featureLower.includes('credit')) {
      return {
        newValue: `${Math.round(numVal * 0.6).toLocaleString()} DM`,
        explanation: 'Lower loan amounts reduce the bank\'s exposure',
        riskReduction: 0.10
      }
    }
  }
  
  return null
}

// Calculate estimated probability after changes
// The model uses: P(bad) > 0.5 → rejected, else → approved
// Confidence = max(P(good), P(bad))
function calculateNewProbability(
  originalDecision: 'approved' | 'rejected',
  originalConfidence: number,
  totalRiskReduction: number
): { newConfidence: number; newDecision: 'approved' | 'rejected'; flipped: boolean } {
  // Convert confidence back to P(bad)
  // If approved: confidence = P(good) = 1 - P(bad), so P(bad) = 1 - confidence
  // If rejected: confidence = P(bad)
  let pBad = originalDecision === 'approved' 
    ? (1 - originalConfidence) 
    : originalConfidence
  
  // Apply risk reduction (negative = reduces P(bad))
  let newPBad = Math.max(0.05, Math.min(0.95, pBad - totalRiskReduction))
  
  // Determine new decision
  const newDecision = newPBad > 0.5 ? 'rejected' : 'approved'
  
  // Calculate new confidence
  const newConfidence = newDecision === 'rejected' ? newPBad : (1 - newPBad)
  
  return {
    newConfidence,
    newDecision,
    flipped: newDecision !== originalDecision
  }
}

export default function Layer4Counterfactual({ decision, probability, shapFeatures }: CounterfactualExplorerProps) {
  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({})
  const [showSandbox, setShowSandbox] = useState(false)
  
  const isApproved = decision === 'approved'
  const targetOutcome = isApproved ? 'rejection' : 'approval'
  const confidencePercent = Math.round(probability * 100)
  
  // Get risk-increasing features (candidates for counterfactual changes)
  // positive impact = increases default risk = bad for applicant
  const riskIncreasingFeatures = useMemo(() => 
    shapFeatures
      .filter(f => f.impact === 'positive')
      .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
      .slice(0, 5),
    [shapFeatures]
  )
  
  // Generate counterfactual scenarios with REAL probability calculations
  const scenarios = useMemo(() => {
    const result: Array<{
      changes: Array<{
        feature: string
        current: string
        suggested: string
        explanation: string
        riskReduction: number
      }>
      newConfidence: number
      newDecision: 'approved' | 'rejected'
      flipped: boolean
    }> = []
    
    const validChanges: Array<{
      feature: string
      current: string
      suggested: string
      explanation: string
      riskReduction: number
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
          riskReduction: suggestion.riskReduction,
          shapImpact: Math.abs(f.shap_value)
        })
      }
    }
    
    // Sort by risk reduction (most impactful first)
    validChanges.sort((a, b) => b.riskReduction - a.riskReduction)
    
    // Create scenarios with 1, 2, and 3 changes
    // Each scenario shows cumulative effect
    if (validChanges.length >= 1) {
      const changes = validChanges.slice(0, 1)
      const totalReduction = changes.reduce((sum, c) => sum + c.riskReduction, 0)
      const calc = calculateNewProbability(decision, probability, totalReduction)
      result.push({
        changes,
        newConfidence: calc.newConfidence,
        newDecision: calc.newDecision,
        flipped: calc.flipped
      })
    }
    if (validChanges.length >= 2) {
      const changes = validChanges.slice(0, 2)
      const totalReduction = changes.reduce((sum, c) => sum + c.riskReduction, 0)
      const calc = calculateNewProbability(decision, probability, totalReduction)
      result.push({
        changes,
        newConfidence: calc.newConfidence,
        newDecision: calc.newDecision,
        flipped: calc.flipped
      })
    }
    if (validChanges.length >= 3) {
      const changes = validChanges.slice(0, 3)
      const totalReduction = changes.reduce((sum, c) => sum + c.riskReduction, 0)
      const calc = calculateNewProbability(decision, probability, totalReduction)
      result.push({
        changes,
        newConfidence: calc.newConfidence,
        newDecision: calc.newDecision,
        flipped: calc.flipped
      })
    }
    
    return result
  }, [riskIncreasingFeatures, decision, probability])
  
  // Initialize sandbox with current values
  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const f of shapFeatures) {
      if (FEATURE_OPTIONS[f.feature]) {
        const options = FEATURE_OPTIONS[f.feature].options
        // Direct match on value (backend now returns display values)
        const match = options.find(opt => opt.value === f.value)
        initial[f.feature] = match?.value || options[0].value
      }
    }
    setSandboxValues(initial)
  }, [shapFeatures])
  
  // Calculate sandbox result using SAME logic as scenarios
  const sandboxResult = useMemo(() => {
    let totalRiskDelta = 0
    
    for (const [feature, newValue] of Object.entries(sandboxValues)) {
      const originalFeature = shapFeatures.find(f => f.feature === feature)
      if (!originalFeature) continue
      
      const options = FEATURE_OPTIONS[feature]?.options || []
      
      // Find original option (direct match)
      const originalOption = options.find(opt => opt.value === originalFeature.value)
      
      // Find new option
      const newOption = options.find(opt => opt.value === newValue)
      
      if (originalOption && newOption) {
        // Risk delta = new risk level - original risk level
        // Negative delta = risk reduction (good)
        totalRiskDelta += newOption.riskLevel - originalOption.riskLevel
      }
    }
    
    // Apply the delta (negative delta = risk reduction)
    const calc = calculateNewProbability(decision, probability, -totalRiskDelta)
    
    return calc
  }, [sandboxValues, shapFeatures, decision, probability])

  return (
    <div className="space-y-6">
      {/* Global Model Explanation - How the tool works in general */}
      <GlobalModelExplanation defaultExpanded={false} showVisualizations={true} />

      {/* Simple SHAP Explanation */}
      <SHAPExplanation compact={true} />

      {/* Credit History Disclaimer - above content */}
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
      
      {/* Model Certainty Explanation */}
      <ModelCertaintyExplanation probability={probability} decision={decision} />
      
      {/* Header with clear probability explanation */}
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
            <p className="text-gray-600 mb-3">
              Current: <strong>{decision.toUpperCase()}</strong> with <strong>{confidencePercent}%</strong> confidence
            </p>
            <div className="bg-white/60 rounded-lg p-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <HelpCircle size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>{confidencePercent}% confidence</strong> means the model is {confidencePercent}% sure 
                  this applicant should be {decision}. Below we show changes that could flip this to {targetOutcome}.
                </p>
              </div>
            </div>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Scenarios to Achieve {targetOutcome.charAt(0).toUpperCase() + targetOutcome.slice(1)}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          These scenarios show what changes would be needed to flip the decision.
        </p>
        
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
                  scenario.flipped 
                    ? 'border-green-300 bg-green-50/30' 
                    : 'border-gray-200 bg-gray-50/30'
                }`}
              >
                {/* Scenario Header */}
                <div className={`px-5 py-3 flex items-center justify-between ${
                  scenario.flipped ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      scenario.flipped ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {idx === 0 ? 'Single Change' : idx === 1 ? 'Two Changes' : 'Three Changes'}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({scenario.changes.length} feature{scenario.changes.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      scenario.newDecision === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      → {scenario.newDecision.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(scenario.newConfidence * 100)}% confidence
                    </div>
                  </div>
                </div>
                
                {/* Status indicator */}
                {scenario.flipped ? (
                  <div className="px-5 py-2 bg-green-50 border-b border-green-100 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    This scenario would flip the decision to {scenario.newDecision}
                  </div>
                ) : (
                  <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-500 flex items-center gap-2">
                    <Info size={16} />
                    Not enough to flip the decision (still {decision})
                  </div>
                )}
                
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
              <span className="text-sm text-gray-500">Adjust features and see how the decision changes</span>
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
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Original: {getDisplayValue(featureName, currentFeature.value)}
                    </p>
                  </div>
                )
              })}
            </div>
            
            {/* Sandbox Result */}
            <div className={`rounded-xl p-5 ${
              sandboxResult.newDecision === 'approved' 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sandboxResult.newDecision === 'approved' ? (
                    <CheckCircle2 className="text-green-600" size={28} />
                  ) : (
                    <XCircle className="text-red-600" size={28} />
                  )}
                  <div>
                    <span className="text-lg font-bold block">
                      Estimated: {sandboxResult.newDecision.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.round(sandboxResult.newConfidence * 100)}% confidence in this outcome
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sandboxResult.flipped && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Decision flipped!
                    </span>
                  )}
                  <button
                    onClick={() => {
                      const initial: Record<string, string> = {}
                      for (const f of shapFeatures) {
                        if (FEATURE_OPTIONS[f.feature]) {
                          const options = FEATURE_OPTIONS[f.feature].options
                          const match = options.find(opt => opt.value === f.value)
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
              Probability estimates are approximations based on feature importance patterns.
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
