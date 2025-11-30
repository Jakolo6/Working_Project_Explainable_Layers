// GlobalModelExplanation.tsx - Bank-clerk-friendly explanation of how the model works globally
// Fetches global explanation data from R2 storage via admin API
// Displays narrative, feature importance, and SHAP visualizations

'use client'

import React, { useState, useEffect } from 'react'

interface GlobalExplanationR2Data {
  available: boolean
  narrative?: string
  dataset_summary?: {
    top_features: string[]
    feature_importance: Record<string, number>
    disclaimers: {
      historical_data: string
      credit_history_anomaly: string
      not_for_production: string
      bias_warning: string
    }
  }
}

interface GlobalModelExplanationProps {
  defaultExpanded?: boolean
  showVisualizations?: boolean
}

// Plain-language feature names for bank clerks
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  'checking_status': 'Checking Account Balance',
  'duration': 'Loan Duration',
  'savings_status': 'Savings Account',
  'purpose': 'Loan Purpose',
  'monthly_burden': 'Monthly Payment Burden',
  'credit_history': 'Credit History',
  'stability_score': 'Financial Stability',
  'property_magnitude': 'Property Ownership',
  'credit_amount': 'Loan Amount',
  'risk_ratio': 'Credit-to-Age Ratio',
  'employment': 'Employment Duration',
  'age': 'Applicant Age',
  'housing': 'Housing Situation',
  'installment_commitment': 'Installment Rate',
  'other_debtors': 'Guarantors',
}

function getDisplayName(feature: string): string {
  return FEATURE_DISPLAY_NAMES[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function GlobalModelExplanation({ defaultExpanded = false, showVisualizations = false }: GlobalModelExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [data, setData] = useState<GlobalExplanationR2Data | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'visualizations'>('overview')
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const fetchGlobalExplanation = async () => {
      try {
        if (!apiUrl) {
          throw new Error('API URL not configured')
        }
        
        // Fetch from R2-based endpoint
        const response = await fetch(`${apiUrl}/api/v1/admin/global-explanation`)
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        setData(result)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load global explanation'
        console.error('[ERROR] Global explanation fetch failed:', errorMessage)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGlobalExplanation()
  }, [apiUrl])

  // Parse markdown narrative into sections
  const parseNarrative = (markdown: string) => {
    const sections: { title: string; content: string }[] = []
    const lines = markdown.split('\n')
    let currentTitle = ''
    let currentContent: string[] = []
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentTitle) {
          sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
        }
        currentTitle = line.replace('## ', '').trim()
        currentContent = []
      } else if (line.startsWith('# ')) {
        // Skip main title
      } else {
        currentContent.push(line)
      }
    }
    
    if (currentTitle) {
      sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
    }
    
    return sections
  }

  // Format markdown content to JSX
  const formatContent = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim())
    return lines.map((line, idx) => {
      // Handle bullet points
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/)
        if (match) {
          return (
            <li key={idx} className="flex items-start gap-2 mb-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>{match[1]}:</strong> {match[2]}</span>
            </li>
          )
        }
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} className="flex items-start gap-2 mb-1">
            <span className="text-blue-500 mt-1">•</span>
            <span>{line.substring(2)}</span>
          </li>
        )
      }
      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[-–]?\s*(.*)/)
        if (match) {
          return (
            <li key={idx} className="flex items-start gap-2 mb-2">
              <span className="text-blue-600 font-bold min-w-[20px]">{line.match(/^\d+/)?.[0]}.</span>
              <span><strong>{match[1]}</strong> – {match[2]}</span>
            </li>
          )
        }
      }
      // Handle bold text in paragraphs
      if (line.includes('**')) {
        const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        return <p key={idx} className="mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />
      }
      return <p key={idx} className="mb-2">{line}</p>
    })
  }

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
          {error ? (
            <p className="text-sm text-red-600">
              <span className="font-medium">Error:</span> {error}
            </p>
          ) : data?.available && data.dataset_summary ? (
            <p className="text-sm text-slate-600">
              <span className="font-medium text-blue-800">Quick summary:</span>{' '}
              The model focuses most on {data.dataset_summary.top_features.slice(0, 3).map(f => getDisplayName(f)).join(', ')}.
              Click to learn more about how the credit assessment works.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <p className="text-sm text-slate-500">Global explanation not available. Generate it from the admin panel.</p>
          )}
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
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <p className="text-red-700 font-semibold mb-2">Failed to Load Global Explanation</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-slate-500 text-xs mt-2">Generate the global explanation from the admin panel first.</p>
            </div>
          ) : !data?.available ? (
            <div className="p-8 text-center">
              <div className="text-amber-500 text-4xl mb-3">📊</div>
              <p className="text-amber-700 font-semibold mb-2">Global Explanation Not Generated</p>
              <p className="text-slate-600 text-sm">Go to the admin panel and click &quot;Generate Global Explanation&quot; to create the model overview.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Tab Navigation */}
              {showVisualizations && (
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📋 Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('visualizations')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                      activeTab === 'visualizations'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📊 SHAP Visualizations
                  </button>
                </div>
              )}

              {/* Visualizations Tab */}
              {activeTab === 'visualizations' && showVisualizations && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>About these charts:</strong> These visualizations show how the model weighs different factors 
                      when making credit decisions. They are generated from real SHAP analysis of the trained model.
                    </p>
                  </div>
                  
                  {/* Feature Importance Chart */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800">Feature Importance</h4>
                      <p className="text-sm text-gray-600">Which factors have the biggest impact on decisions</p>
                    </div>
                    <div className="p-4">
                      <img 
                        src={`${apiUrl}/api/v1/admin/global-explanation-image/feature_importance.png`}
                        alt="Feature Importance Chart"
                        className="w-full rounded"
                      />
                    </div>
                  </div>

                  {/* SHAP Summary Plot */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800">SHAP Summary</h4>
                      <p className="text-sm text-gray-600">How each feature affects risk (red = increases risk, blue = decreases risk)</p>
                    </div>
                    <div className="p-4">
                      <img 
                        src={`${apiUrl}/api/v1/admin/global-explanation-image/shap_summary.png`}
                        alt="SHAP Summary Plot"
                        className="w-full rounded"
                      />
                    </div>
                  </div>

                  {/* Feature Distributions */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800">Feature Distributions</h4>
                      <p className="text-sm text-gray-600">Distribution of key features in the training data</p>
                    </div>
                    <div className="p-4">
                      <img 
                        src={`${apiUrl}/api/v1/admin/global-explanation-image/distributions.png`}
                        alt="Feature Distributions"
                        className="w-full rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Top Features Summary */}
                  {data.dataset_summary && (
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-5 border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="text-xl">🎯</span> Most Important Factors
                      </h4>
                      <p className="text-slate-700 leading-relaxed mb-4">
                        The model pays most attention to these factors when making credit decisions:
                      </p>
                      <div className="grid md:grid-cols-2 gap-3">
                        {data.dataset_summary.top_features.slice(0, 6).map((feature, idx) => (
                          <div key={feature} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
                            <span className="text-blue-600 font-bold text-lg">#{idx + 1}</span>
                            <span className="text-slate-800">{getDisplayName(feature)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Narrative Sections */}
                  {data.narrative && parseNarrative(data.narrative).map((section, idx) => {
                    // Skip certain sections or customize display
                    if (section.title === 'Overview') {
                      return (
                        <div key={idx} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-5 border border-slate-200">
                          <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">📋</span> What This Tool Does
                          </h4>
                          <div className="text-slate-700 leading-relaxed">
                            {formatContent(section.content)}
                          </div>
                        </div>
                      )
                    }
                    
                    if (section.title === 'Patterns That Support Approval') {
                      return (
                        <div key={idx} className="bg-green-50 rounded-lg p-5 border border-green-200">
                          <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">✅</span> {section.title}
                          </h4>
                          <ul className="text-green-900 leading-relaxed">
                            {formatContent(section.content)}
                          </ul>
                        </div>
                      )
                    }
                    
                    if (section.title === 'Patterns That Increase Risk') {
                      return (
                        <div key={idx} className="bg-amber-50 rounded-lg p-5 border border-amber-200">
                          <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">⚠️</span> {section.title}
                          </h4>
                          <ul className="text-amber-900 leading-relaxed">
                            {formatContent(section.content)}
                          </ul>
                        </div>
                      )
                    }
                    
                    if (section.title === 'Understanding Confidence Levels') {
                      return (
                        <div key={idx} className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                          <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">🔍</span> {section.title}
                          </h4>
                          <div className="bg-white rounded-lg p-4 border border-indigo-100">
                            <div className="grid gap-2 text-sm">
                              <div className="flex items-center gap-3">
                                <span className="w-20 text-center py-1 bg-green-100 text-green-800 rounded font-medium">70%+</span>
                                <span className="text-slate-700">Clear pattern match - tool is confident</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-20 text-center py-1 bg-yellow-100 text-yellow-800 rounded font-medium">50-70%</span>
                                <span className="text-slate-700">Mixed indicators - human review especially valuable</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-20 text-center py-1 bg-red-100 text-red-800 rounded font-medium">&lt;50%</span>
                                <span className="text-slate-700">Would suggest opposite decision</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    if (section.title === 'Important Limitations') {
                      return (
                        <div key={idx} className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">ℹ️</span>
                            <div>
                              <h5 className="font-bold text-blue-900 mb-1">{section.title}</h5>
                              <div className="text-blue-800 text-sm">
                                {formatContent(section.content)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    // Skip "What the Model Learned" as we show top features instead
                    if (section.title === 'What the Model Learned') {
                      return null
                    }
                    
                    return null
                  })}

                  {/* Historical Data Note */}
                  {data.dataset_summary?.disclaimers && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-300">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">📜</span>
                        <div>
                          <h5 className="font-bold text-amber-900 mb-1">About the Historical Data</h5>
                          <p className="text-amber-800 text-sm mb-2">
                            {data.dataset_summary.disclaimers.historical_data}
                          </p>
                          <p className="text-amber-700 text-sm">
                            <strong>Notable finding:</strong> The &apos;credit_history&apos; feature shows counterintuitive patterns 
                            due to historical selection bias. Features marked with ⚠ may show unexpected risk directions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
