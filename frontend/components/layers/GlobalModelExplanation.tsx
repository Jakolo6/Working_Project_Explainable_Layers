// GlobalModelExplanation.tsx - Bank-clerk-friendly explanation of how the model works globally
// This component appears at the top of ALL explanation layers with identical content

'use client'

import React, { useState, useEffect } from 'react'

interface GlobalExplanationData {
  model_name: string
  what_tool_does: string
  how_it_decides: string
  approval_patterns: string[]
  risk_patterns: string[]
  uncertainty_note: string
  important_note: string
}

interface GlobalModelExplanationProps {
  defaultExpanded?: boolean
}

// Fallback data in case API fails
const FALLBACK_DATA: GlobalExplanationData = {
  model_name: "Credit Risk Assessment Tool",
  what_tool_does: "This tool analyzes credit applications based on historical lending patterns. It looks at factors like employment stability, credit history, savings, and the loan details to estimate how likely an applicant is to repay successfully.",
  how_it_decides: "The tool learned from thousands of past credit decisions. It identified which factors were most associated with successful repayment versus payment difficulties. For each new application, it checks how the applicant's profile matches these patterns.",
  approval_patterns: [
    "Stable employment history (4+ years at current job)",
    "Clean credit history with all previous loans paid on time",
    "Positive checking account balance",
    "Established savings account",
    "Moderate loan amount relative to financial profile",
    "Shorter loan duration (under 24 months)"
  ],
  risk_patterns: [
    "Negative or no checking account balance",
    "Short or unstable employment history",
    "Previous payment delays or credit problems",
    "Very high loan amount relative to profile",
    "Long loan duration (over 36 months)",
    "No savings or very low savings"
  ],
  uncertainty_note: "The tool is most confident when applicants clearly fit established patterns. For applicants with mixed indicators, the tool may be less certain, and human judgment becomes more important.",
  important_note: "This tool identifies patterns from historical data - it does not make guarantees or personal judgments. It is designed to support, not replace, your professional assessment."
}

export default function GlobalModelExplanation({ defaultExpanded = false }: GlobalModelExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [data, setData] = useState<GlobalExplanationData>(FALLBACK_DATA)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGlobalExplanation = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/api/v1/explanations/global`)
        
        if (response.ok) {
          const result = await response.json()
          setData({
            model_name: result.model_name,
            what_tool_does: result.what_tool_does,
            how_it_decides: result.how_it_decides,
            approval_patterns: result.approval_patterns,
            risk_patterns: result.risk_patterns,
            uncertainty_note: result.uncertainty_note,
            important_note: result.important_note
          })
        }
      } catch (error) {
        console.log('Using fallback global explanation data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGlobalExplanation()
  }, [])

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏦</span>
          <div className="text-left">
            <h3 className="font-bold text-lg">How This Tool Works</h3>
            <p className="text-sm text-blue-100 opacity-90">
              General information about the credit assessment system
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
          <svg 
            className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="bg-blue-50 border-x border-b border-blue-200 rounded-b-xl p-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-blue-800">Quick summary:</span>{' '}
            {data.what_tool_does.substring(0, 150)}...
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-white border-x border-b border-blue-200 rounded-b-xl shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-500">Loading explanation...</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* What the Tool Does */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-5 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📋</span> What This Tool Does
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {data.what_tool_does}
                </p>
              </div>

              {/* Two Column Layout for Factors */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Approval Factors */}
                <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">✅</span> Factors That Usually Support Approval
                  </h4>
                  <ul className="space-y-2">
                    {data.approval_patterns.slice(0, 6).map((pattern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                <div className="bg-amber-50 rounded-lg p-5 border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">⚠️</span> Factors That Usually Increase Risk
                  </h4>
                  <ul className="space-y-2">
                    {data.risk_patterns.slice(0, 6).map((pattern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* How It Decides */}
              <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔍</span> How the Assessment Works
                </h4>
                <p className="text-indigo-900 leading-relaxed mb-4">
                  {data.how_it_decides}
                </p>
                
                {/* Confidence Level Guide */}
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <h5 className="font-semibold text-indigo-800 mb-2 text-sm">Understanding Confidence Levels</h5>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-center py-1 bg-green-100 text-green-800 rounded font-medium">
                        70%+
                      </span>
                      <span className="text-slate-700">Clear pattern match - tool is confident</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-center py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                        50-70%
                      </span>
                      <span className="text-slate-700">Mixed indicators - human review especially valuable</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-center py-1 bg-red-100 text-red-800 rounded font-medium">
                        &lt;50%
                      </span>
                      <span className="text-slate-700">Would suggest opposite decision</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uncertainty Note */}
              <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h5 className="font-semibold text-slate-800 mb-1">When the Tool is Less Certain</h5>
                    <p className="text-sm text-slate-600">
                      {data.uncertainty_note}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h5 className="font-bold text-blue-900 mb-1">Important to Remember</h5>
                    <p className="text-blue-800">
                      {data.important_note}
                    </p>
                  </div>
                </div>
              </div>

              {/* Historical Data Note */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📜</span>
                  <div>
                    <h5 className="font-bold text-amber-900 mb-1">About the Historical Data</h5>
                    <p className="text-amber-800 text-sm mb-2">
                      This model was trained on the <strong>German Credit Dataset from 1994</strong>. 
                      Some patterns in this historical data may not reflect modern credit practices.
                    </p>
                    <p className="text-amber-700 text-sm">
                      <strong>Notable finding:</strong> The &apos;credit_history&apos; feature shows counterintuitive patterns 
                      due to historical selection bias (banks were more cautious with certain applicants). 
                      Features marked with ⚠ may show unexpected risk directions compared to modern expectations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
