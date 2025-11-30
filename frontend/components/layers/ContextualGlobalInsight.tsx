// ContextualGlobalInsight.tsx - Contextualized global explanation for each layer
// Provides layer-specific framing of global model behavior using R2-stored SHAP data
// Uses progressive disclosure to avoid cognitive overload

'use client'

import React, { useState, useEffect } from 'react'

// Layer context types for different framing
export type LayerContext = 
  | 'dashboard'      // SHAP dashboard - sidebar/top note
  | 'narrative'      // Narrative layer - preface/tooltip
  | 'counterfactual' // Counterfactual - info button
  | 'features'       // All features layer - summary header

interface GlobalInsightData {
  available: boolean
  topFeatures?: string[]
  featureImportance?: Record<string, number>
  narrative?: string
}

interface ContextualGlobalInsightProps {
  context: LayerContext
  className?: string
}

// Plain-language feature names for bank clerks
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  'duration': 'loan duration',
  'credit_amount': 'loan amount',
  'monthly_burden': 'monthly payment burden',
  'checking_status': 'checking account balance',
  'credit_history': 'credit history',
  'age': 'applicant age',
  'employment': 'employment duration',
  'savings_status': 'savings account',
  'purpose': 'loan purpose',
  'installment_commitment': 'installment rate',
  'stability_score': 'financial stability',
  'risk_ratio': 'credit-to-age ratio',
  'housing': 'housing situation',
  'property_magnitude': 'property ownership',
  'other_debtors': 'guarantors or co-applicants',
}

function getDisplayName(feature: string): string {
  // Try exact match first
  if (FEATURE_DISPLAY_NAMES[feature]) {
    return FEATURE_DISPLAY_NAMES[feature]
  }
  // Try partial match
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_NAMES)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }
  // Fallback: clean up the feature name
  return feature.replace(/_/g, ' ').toLowerCase()
}

export default function ContextualGlobalInsight({ context, className = '' }: ContextualGlobalInsightProps) {
  const [data, setData] = useState<GlobalInsightData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTechnical, setShowTechnical] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        if (!apiUrl) return
        
        // Fetch global explanation data from R2
        const response = await fetch(`${apiUrl}/api/v1/admin/global-explanation`)
        
        if (response.ok) {
          const result = await response.json()
          
          if (result.available && result.dataset_summary) {
            const summary = result.dataset_summary
            setData({
              available: true,
              topFeatures: summary.top_features || [],
              featureImportance: summary.feature_importance || {},
              narrative: result.narrative || ''
            })
          } else {
            setData({ available: false })
          }
        } else {
          setData({ available: false })
        }
      } catch (err) {
        console.error('[ContextualGlobalInsight] Failed to fetch:', err)
        setData({ available: false })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGlobalData()
  }, [apiUrl])

  // Show loading state briefly, then nothing if no data
  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Loading global context...</span>
        </div>
      </div>
    )
  }
  
  // Don't render if data not available
  if (!data?.available) {
    return null
  }

  // Generate plain-language summary of top features
  const topFeatureNames = (data.topFeatures || [])
    .slice(0, 5)
    .map(f => getDisplayName(f))
  
  const summaryText = topFeatureNames.length > 0
    ? `In general, the model pays most attention to ${topFeatureNames.slice(0, -1).join(', ')}${topFeatureNames.length > 1 ? ', and ' : ''}${topFeatureNames[topFeatureNames.length - 1]}.`
    : 'The model considers multiple factors when making credit decisions.'

  // Context-specific rendering
  if (context === 'dashboard') {
    // SHAP Dashboard: Sidebar/top note style
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 ${className}`}>
        {/* Summary Header - Always Visible */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🎯</span>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-1">What the Model Focuses On</h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                {summaryText}
              </p>
            </div>
          </div>
        </div>

        {/* Why This Matters - Expandable */}
        <div className="border-t border-blue-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-blue-700 hover:bg-blue-100/50 transition"
          >
            <span className="font-medium">💡 Why this matters</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="px-4 pb-4 space-y-2">
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Helps you explain why the AI often focuses on certain factors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Shows what features matter most in general—not just for this customer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Builds confidence when communicating decisions to applicants</span>
                </li>
              </ul>

              {/* Technical Summary - Collapsed */}
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1"
              >
                <span>{showTechnical ? '▼' : '▶'}</span>
                <span>View detailed importance scores</span>
              </button>
              
              {showTechnical && data.featureImportance && (
                <div className="mt-2 bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 mb-2">
                    Average impact of each factor on decisions (higher = more influential):
                  </p>
                  <div className="space-y-1">
                    {Object.entries(data.featureImportance)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([feature, importance]) => (
                        <div key={feature} className="flex items-center gap-2 text-xs">
                          <span className="w-32 truncate text-gray-700">{getDisplayName(feature)}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${Math.min(importance * 100, 100)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-gray-500">{(importance * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (context === 'narrative') {
    // Narrative Layer: Preface style
    return (
      <div className={`bg-slate-50 rounded-lg border border-slate-200 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">📊</span>
          <div>
            <p className="text-slate-700 text-sm leading-relaxed">
              <span className="font-medium text-slate-800">General context: </span>
              {summaryText}
              {' '}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {isExpanded ? 'Show less' : 'Learn more'}
              </button>
            </p>
            
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-600 mb-2">
                  <strong>Why this helps:</strong> Understanding what the model typically focuses on 
                  helps you communicate decisions more accurately and confidently.
                </p>
                <p className="text-xs text-slate-500">
                  The narrative below explains this specific applicant&apos;s assessment, 
                  while the general factors above apply to all applications.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (context === 'counterfactual') {
    // Counterfactual Layer: Info button style
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm text-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Model&apos;s general focus</span>
        </button>
        
        {isExpanded && (
          <div className="absolute z-10 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800 text-sm">What the Model Focuses On</h4>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 text-sm mb-3">{summaryText}</p>
            <div className="bg-indigo-50 rounded p-2 text-xs text-indigo-800">
              <strong>Tip:</strong> When exploring &quot;what-if&quot; scenarios, focus on the factors 
              the model weighs most heavily for the biggest impact.
            </div>
          </div>
        )}
      </div>
    )
  }

  if (context === 'features') {
    // All Features Layer: Summary header style
    return (
      <div className={`bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🔍</span>
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-900 text-sm mb-1">Understanding the Full Picture</h4>
            <p className="text-emerald-800 text-sm leading-relaxed mb-2">
              {summaryText}
            </p>
            <p className="text-emerald-700 text-xs">
              The table below shows how each factor influenced <em>this specific</em> decision. 
              Green factors supported approval; red factors raised concerns.
            </p>
            
            {/* Expandable "Why This Matters" */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>Why understanding global patterns helps</span>
            </button>
            
            {isExpanded && (
              <ul className="mt-2 text-xs text-emerald-700 space-y-1 pl-4">
                <li>• Helps you spot when this applicant differs from typical patterns</li>
                <li>• Makes it easier to explain decisions to customers</li>
                <li>• Builds your intuition for how the AI thinks</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
