// ModelOverviewCard.tsx - Minimalist "How the AI Works" card for personas page
// Scannable in 5 seconds - visual-first design with minimal text

'use client'

import React, { useState, useEffect } from 'react'

interface ModelOverviewData {
  available: boolean
  dataset_summary?: {
    top_features: string[]
    feature_importance: Record<string, number>
  }
}

// Feature display names and their importance (will be fetched from API)
const FEATURE_LABELS: Record<string, string> = {
  'checking_status': 'Checking Account',
  'duration': 'Loan Duration',
  'credit_history': 'Credit History',
  'savings_status': 'Savings Account',
  'employment': 'Employment',
  'credit_amount': 'Credit Amount',
  'purpose': 'Loan Purpose',
  'monthly_burden': 'Monthly Burden',
  'stability_score': 'Stability Score',
  'property_magnitude': 'Property',
  'age': 'Age',
  'housing': 'Housing',
}

// Fallback data if API is unavailable
const FALLBACK_TOP_FEATURES = [
  { name: 'Checking Account', importance: 35 },
  { name: 'Loan Duration', importance: 22 },
  { name: 'Credit History', importance: 16 },
  { name: 'Savings Account', importance: 14 },
  { name: 'Employment', importance: 13 },
]

export default function ModelOverviewCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [topFeatures, setTopFeatures] = useState(FALLBACK_TOP_FEATURES)
  const [isLoading, setIsLoading] = useState(true)
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!apiUrl) return
        
        const response = await fetch(`${apiUrl}/api/v1/admin/global-explanation`)
        if (!response.ok) return
        
        const data: ModelOverviewData = await response.json()
        
        if (data.available && data.dataset_summary?.feature_importance) {
          // Convert to sorted array and take top 5
          const sorted = Object.entries(data.dataset_summary.feature_importance)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
          
          // Normalize to percentages (sum to ~100)
          const total = sorted.reduce((sum, [, val]) => sum + val, 0)
          const features = sorted.map(([key, val]) => ({
            name: FEATURE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            importance: Math.round((val / total) * 100)
          }))
          
          setTopFeatures(features)
        }
      } catch (err) {
        // Use fallback feature data
      } finally{
        setIsLoading(false)
      }
    }

    fetchData()
  }, [apiUrl])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">How the AI Works</h3>
            <p className="text-sm text-slate-600">ML model trained on historical credit data • ~75% accuracy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 hidden sm:inline">
            {isExpanded ? 'Hide details' : 'Show details'}
          </span>
          <svg 
            className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-5 space-y-6 border-t border-slate-100">
          {/* Section 1: Top Factors Bar Chart */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>📊</span> Top 5 Factors Influencing Decisions
            </h4>
            <div className="space-y-2">
              {topFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-slate-600 text-right flex-shrink-0">{feature.name}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${feature.importance}%` }}
                    />
                  </div>
                  <span className="w-10 text-sm font-medium text-slate-700 text-right">{feature.importance}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Two-Column Pattern Boxes */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Approval Patterns - Green */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Patterns Supporting Approval
              </h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <span className="font-medium text-green-900">Stable Checking Account</span>
                    <p className="text-green-700 text-xs">&gt; €200 balance maintained</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <span className="font-medium text-green-900">Long Employment</span>
                    <p className="text-green-700 text-xs">&gt; 4 years at current job</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <span className="font-medium text-green-900">Savings Present</span>
                    <p className="text-green-700 text-xs">Any savings account balance</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Risk Patterns - Orange */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <h5 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Patterns Increasing Risk
              </h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <div>
                    <span className="font-medium text-amber-900">No Checking Account</span>
                    <p className="text-amber-700 text-xs">Or negative balance</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <div>
                    <span className="font-medium text-amber-900">Long Loan Duration</span>
                    <p className="text-amber-700 text-xs">&gt; 24 months increases risk</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <div>
                    <span className="font-medium text-amber-900">High Credit Amount</span>
                    <p className="text-amber-700 text-xs">Relative to income/stability</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <span>ℹ️</span>
              <span>
                This model was trained on the German Credit Dataset (1994). It identifies patterns from historical data 
                but should be used as a decision-support tool, not a final decision maker.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
