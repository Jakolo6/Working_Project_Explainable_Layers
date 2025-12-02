// Layer 2: Interactive SHAP Dashboard - Visual analytics with grouped insights
// Merges visual dashboard elements with category grouping and AI summary

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, ChevronDown, ChevronUp, AlertTriangle, Info, Zap, Sparkles, Wallet, Clock, Home, CreditCard, Filter } from 'lucide-react'
import GlobalModelExplanation from './GlobalModelExplanation'
import Tooltip from '@/components/ui/Tooltip'
import SHAPExplanation from '@/components/ui/SHAPExplanation'
import ModelCertaintyExplanation from '@/components/ui/ModelCertaintyExplanation'
import { getFeatureDescription } from '@/lib/featureDescriptions'
import { isCreditHistoryFeature, CREDIT_HISTORY_WARNING_TEXT } from '@/components/CreditHistoryWarning'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer2DashboardProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature categories for grouping
const FEATURE_CATEGORIES: Record<string, { label: string; icon: React.ReactNode; features: string[] }> = {
  financial: {
    label: 'Financial Situation',
    icon: <Wallet size={18} />,
    features: ['Checking Account Status', 'Savings Account Status', 'Credit Amount', 'Monthly Payment Burden', 'Installment Rate']
  },
  stability: {
    label: 'Stability Indicators',
    icon: <Clock size={18} />,
    features: ['Employment Duration', 'Years at Residence', 'Age', 'Financial Stability Score']
  },
  credit: {
    label: 'Credit & Payment History',
    icon: <CreditCard size={18} />,
    features: ['Credit History', 'Existing Credits', 'Other Payment Plans', 'Loan Duration (months)', 'Duration Risk Score']
  },
  household: {
    label: 'Account & Household',
    icon: <Home size={18} />,
    features: ['Housing Status', 'Property Ownership', 'Number of Dependents', 'Telephone Registration', 'Other Debtors/Guarantors', 'Job Type', 'Loan Purpose']
  }
}

// Feature display name mapping
const FEATURE_DISPLAY_MAP: Record<string, string> = {
  'Checking Account Status': 'Checking Account',
  'Savings Account Status': 'Savings Account',
  'Credit History': 'Credit History',
  'Loan Purpose': 'Loan Purpose',
  'Employment Duration': 'Employment',
  'Housing Status': 'Housing',
  'Property Ownership': 'Property',
  'Other Debtors/Guarantors': 'Guarantors',
  'Other Payment Plans': 'Other Plans',
  'Job Type': 'Job Type',
  'Telephone Registration': 'Telephone',
  'Loan Duration (months)': 'Loan Duration',
  'Credit Amount': 'Credit Amount',
  'Installment Rate': 'Installment Rate',
  'Years at Residence': 'Residence',
  'Age': 'Age',
  'Existing Credits': 'Existing Credits',
  'Number of Dependents': 'Dependents',
  'Monthly Payment Burden': 'Monthly Burden',
  'Financial Stability Score': 'Stability Score',
  'Credit Risk Ratio': 'Risk Ratio',
  'Credit to Income Ratio': 'Credit/Income',
  'Duration Risk Score': 'Duration Risk',
}

function getDisplayName(rawName: string): string {
  if (FEATURE_DISPLAY_MAP[rawName]) return FEATURE_DISPLAY_MAP[rawName]
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_MAP)) {
    if (rawName.toLowerCase().includes(key.toLowerCase())) return value
  }
  return rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(feature: string, value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  if (feature.includes('Duration') && feature.includes('months')) return `${num} mo`
  if (feature.includes('Amount')) return `${num.toLocaleString()} DM`
  if (feature.includes('Age')) return `${num} yrs`
  if (feature.includes('Burden')) return `${num.toLocaleString()} DM/mo`
  if (feature.includes('Residence')) return `${num} yrs`
  if (feature.includes('Rate')) return `${num.toFixed(1)}%`
  return num.toFixed(1)
}

function getCategory(featureName: string): string {
  for (const [cat, config] of Object.entries(FEATURE_CATEGORIES)) {
    if (config.features.some(f => featureName.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(featureName.toLowerCase()))) {
      return cat
    }
  }
  return 'household'
}

type FilterType = 'all' | 'supportive' | 'concerns'

export default function Layer2Dashboard({ decision, probability, shapFeatures }: Layer2DashboardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('chart')
  const [selectedFeature, setSelectedFeature] = useState<SHAPFeature | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  
  const isApproved = decision === 'approved'
  const confidencePercent = Math.round(probability * 100)
  
  // Computed values
  const sortedFeatures = useMemo(() => 
    [...shapFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)),
    [shapFeatures]
  )
  
  const supportiveFeatures = useMemo(() => 
    sortedFeatures.filter(f => f.impact === 'negative'),
    [sortedFeatures]
  )
  
  const concernFeatures = useMemo(() => 
    sortedFeatures.filter(f => f.impact === 'positive'),
    [sortedFeatures]
  )
  
  const topSupportive = useMemo(() => supportiveFeatures.slice(0, 2), [supportiveFeatures])
  const topConcerns = useMemo(() => concernFeatures.slice(0, 2), [concernFeatures])
  
  // Calculate net impact
  const totalSupportive = useMemo(() => 
    supportiveFeatures.reduce((sum, f) => sum + Math.abs(f.shap_value), 0),
    [supportiveFeatures]
  )
  
  const totalConcerns = useMemo(() => 
    concernFeatures.reduce((sum, f) => sum + Math.abs(f.shap_value), 0),
    [concernFeatures]
  )
  
  const netImpact = totalSupportive - totalConcerns
  const balancePercent = (totalSupportive + totalConcerns) > 0 
    ? Math.round((totalSupportive / (totalSupportive + totalConcerns)) * 100) 
    : 50
  
  const maxShap = Math.max(...sortedFeatures.map(f => Math.abs(f.shap_value)))

  // Filter features
  const filteredFeatures = useMemo(() => {
    switch (filter) {
      case 'supportive': return supportiveFeatures
      case 'concerns': return concernFeatures
      default: return sortedFeatures
    }
  }, [filter, sortedFeatures, supportiveFeatures, concernFeatures])

  // Group filtered features by category
  const groupedFeatures = useMemo(() => {
    const groups: Record<string, typeof filteredFeatures> = {}
    for (const f of filteredFeatures) {
      const cat = getCategory(f.feature)
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(f)
    }
    return groups
  }, [filteredFeatures])

  // Generate AI summary - only once when component mounts
  useEffect(() => {
    // Skip if we already have a summary
    if (aiSummary) return
    
    const generateSummary = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      const generateLocalSummary = () => {
        const supportiveNames = topSupportive.slice(0, 2).map(f => f.feature.toLowerCase()).join(' and ')
        const concernNames = topConcerns.slice(0, 2).map(f => f.feature.toLowerCase()).join(' and ')
        
        if (decision === 'approved') {
          if (supportiveNames) {
            return `This application was approved based on positive indicators including ${supportiveNames}. The overall profile met the criteria for approval.`
          }
          return "This application was approved. The applicant's profile met the necessary criteria."
        } else {
          if (concernNames) {
            return `This application was not approved primarily due to concerns about ${concernNames}. These factors outweighed the positive aspects.`
          }
          return "This application was not approved. The overall profile did not meet the required criteria."
        }
      }
      
      if (!apiUrl) {
        setAiSummary(generateLocalSummary())
        return
      }
      
      setIsLoadingSummary(true)
      try {
        const response = await fetch(`${apiUrl}/api/v1/explanations/insights-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            probability,
            top_supportive: topSupportive.map(f => ({ feature: f.feature, value: f.value })),
            top_concerns: topConcerns.map(f => ({ feature: f.feature, value: f.value }))
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setAiSummary(data.summary)
        } else {
          setAiSummary(generateLocalSummary())
        }
      } catch {
        setAiSummary(generateLocalSummary())
      } finally {
        setIsLoadingSummary(false)
      }
    }
    
    generateSummary()
  }, [decision, probability, topSupportive, topConcerns, aiSummary])

  return (
    <div className="space-y-6">
      {/* Global Model Explanation */}
      <GlobalModelExplanation defaultExpanded={false} showVisualizations={true} />

      {/* Simple SHAP Explanation */}
      <SHAPExplanation />

      {/* Credit History Disclaimer - moved above dashboard */}
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

      {/* Understanding the Dashboard - moved above dashboard */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Info className="text-slate-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">Understanding This Dashboard</p>
            <ul className="space-y-1">
              <li><strong className="text-green-600">Green/Negative SHAP</strong> = Factor supports approval (reduces default risk)</li>
              <li><strong className="text-red-600">Red/Positive SHAP</strong> = Factor raises concerns (increases default risk)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive hint - prominent callout */}
      <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 text-white rounded-full p-2">
            <Zap size={20} />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Interactive Dashboard</p>
            <p className="text-sm text-blue-800">
              <strong>Click on any factor card below</strong> to see detailed explanations and understand how it affects the decision.
            </p>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD HEADER - Decision Summary with AI Summary
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl p-6 ${isApproved 
        ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200' 
        : 'bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 border-2 border-red-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isApproved ? 'bg-green-100' : 'bg-red-100'}`}>
            {isApproved ? <CheckCircle2 className="text-green-600" size={36} /> : <XCircle className="text-red-600" size={36} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Credit Decision: {decision.toUpperCase()}
              </h1>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {confidencePercent}% confidence
              </span>
            </div>
            
            {/* AI Summary */}
            {isLoadingSummary ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Sparkles size={16} className="animate-pulse" />
                <span>Preparing summary...</span>
              </div>
            ) : aiSummary ? (
              <p className="text-gray-700 leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-gray-600">
                {shapFeatures.length} factors analyzed • {supportiveFeatures.length} supportive • {concernFeatures.length} concerns
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Model Certainty Explanation */}
      <ModelCertaintyExplanation probability={probability} decision={decision} />

      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD WIDGETS - Key Metrics Row
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="text-indigo-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{shapFeatures.length}</div>
              <div className="text-xs text-gray-500">Factors Analyzed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingDown className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{supportiveFeatures.length}</div>
              <div className="text-xs text-gray-500">Supportive</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingUp className="text-red-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{concernFeatures.length}</div>
              <div className="text-xs text-gray-500">Concerns</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netImpact >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Activity className={netImpact >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Net Impact</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          VISUAL CHARTS ROW - Balance Meter & Key Factors
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Balance Meter */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-500" size={18} />
            <h3 className="font-semibold text-gray-900">Influence Balance</h3>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#22c55e" strokeWidth="12"
                  strokeDasharray={`${balancePercent * 2.51} 251`}
                  strokeLinecap="round"
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#ef4444" strokeWidth="12"
                  strokeDasharray={`${(100 - balancePercent) * 2.51} 251`}
                  strokeDashoffset={`${-balancePercent * 2.51}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">{balancePercent}%</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Supportive
                </span>
                <span className="font-semibold text-green-600">{balancePercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Concerns
                </span>
                <span className="font-semibold text-red-600">{100 - balancePercent}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Factors Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-amber-500" size={18} />
            <h3 className="font-semibold text-gray-900">Key Factors</h3>
          </div>
          
          <div className="space-y-3">
            {topSupportive[0] && (
              <div 
                className="p-3 bg-green-50 rounded-lg border border-green-100 cursor-pointer hover:bg-green-100 transition"
                onClick={() => setSelectedFeature(topSupportive[0])}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 font-medium">Strongest Supportive</div>
                    <div className="font-semibold text-gray-900">{getDisplayName(topSupportive[0].feature)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{topSupportive[0].shap_value.toFixed(3)}</div>
                    <div className="text-xs text-gray-500">{formatValue(topSupportive[0].feature, topSupportive[0].value)}</div>
                  </div>
                </div>
              </div>
            )}
            
            {topConcerns[0] && (
              <div 
                className="p-3 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:bg-red-100 transition"
                onClick={() => setSelectedFeature(topConcerns[0])}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-red-600 font-medium">Strongest Concern</div>
                    <div className="font-semibold text-gray-900">
                      {getDisplayName(topConcerns[0].feature)}
                      {isCreditHistoryFeature(topConcerns[0].feature) && <span className="ml-1 text-amber-500">⚠</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">+{topConcerns[0].shap_value.toFixed(3)}</div>
                    <div className="text-xs text-gray-500">{formatValue(topConcerns[0].feature, topConcerns[0].value)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SHAP IMPACT CHART
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'chart' ? null : 'chart')}
          className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-500" size={18} />
            <h3 className="font-semibold text-gray-900">SHAP Impact Chart (Top 10)</h3>
          </div>
          {expandedSection === 'chart' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {expandedSection === 'chart' && (
          <div className="p-5">
            <div className="flex items-center gap-4 text-xs mb-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> Supportive
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> Concern
              </span>
            </div>
            
            <div className="space-y-2">
              {sortedFeatures.slice(0, 10).map((feature, idx) => {
                const barWidth = (Math.abs(feature.shap_value) / maxShap) * 100
                const displayName = getDisplayName(feature.feature)
                const isCreditHistory = isCreditHistoryFeature(feature.feature)
                
                return (
                  <Tooltip
                    key={idx}
                    content={
                      isCreditHistory
                        ? `${getFeatureDescription(displayName)?.description || 'This factor influenced the decision.'}\n\n⚠️ ${CREDIT_HISTORY_WARNING_TEXT}`
                        : getFeatureDescription(displayName)?.description || 'This factor influenced the decision.'
                    }
                  >
                    <div 
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                        selectedFeature?.feature === feature.feature 
                          ? 'bg-indigo-50 ring-2 ring-indigo-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <div className="w-32 text-sm font-medium text-gray-700 truncate flex items-center gap-1">
                        {displayName}
                        {isCreditHistory && <AlertTriangle size={12} className="text-amber-500" />}
                      </div>
                      <div className="flex-1 flex items-center">
                        {feature.impact === 'negative' ? (
                          <>
                            <div className="flex-1 flex justify-end">
                              <div 
                                className="h-6 bg-gradient-to-l from-green-500 to-green-400 rounded-l"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <div className="w-px h-8 bg-gray-300 mx-1" />
                            <div className="flex-1" />
                          </>
                        ) : (
                          <>
                            <div className="flex-1" />
                            <div className="w-px h-8 bg-gray-300 mx-1" />
                            <div className="flex-1">
                              <div 
                                className="h-6 bg-gradient-to-r from-red-400 to-red-500 rounded-r"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`w-20 text-right text-sm font-mono font-semibold ${
                        feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
                      </div>
                    </div>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Feature Detail Panel */}
      {selectedFeature && (
        <div className="bg-indigo-50 rounded-xl border-2 border-indigo-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {getDisplayName(selectedFeature.feature)}
                {isCreditHistoryFeature(selectedFeature.feature) && (
                  <span className="text-amber-500"><AlertTriangle size={16} /></span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {getFeatureDescription(selectedFeature.feature)?.description || getFeatureDescription(getDisplayName(selectedFeature.feature))?.description || 'This factor influenced the credit decision.'}
              </p>
            </div>
            <button 
              onClick={() => setSelectedFeature(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500">Current Value</div>
              <div className="font-semibold text-gray-900">{formatValue(selectedFeature.feature, selectedFeature.value)}</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500">SHAP Impact</div>
              <div className={`font-semibold ${selectedFeature.impact === 'positive' ? 'text-red-600' : 'text-green-600'}`}>
                {selectedFeature.shap_value > 0 ? '+' : ''}{selectedFeature.shap_value.toFixed(4)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500">Effect</div>
              <div className={`font-semibold ${selectedFeature.impact === 'positive' ? 'text-red-600' : 'text-green-600'}`}>
                {selectedFeature.impact === 'positive' ? 'Raised concerns' : 'Supported approval'}
              </div>
            </div>
          </div>
          
          {isCreditHistoryFeature(selectedFeature.feature) && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>⚠️ Note:</strong> {CREDIT_HISTORY_WARNING_TEXT}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FILTER & GROUPED FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {[
          { key: 'all', label: 'All Factors' },
          { key: 'supportive', label: 'Supportive' },
          { key: 'concerns', label: 'Concerns' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === key 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grouped Feature Cards */}
      {Object.entries(groupedFeatures).map(([category, features]) => {
        const config = FEATURE_CATEGORIES[category]
        if (!config || features.length === 0) return null
        
        return (
          <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === category ? null : category)}
              className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-500">{config.icon}</span>
                <span className="font-semibold text-gray-900">{config.label}</span>
                <span className="text-sm text-gray-400">({features.length})</span>
              </div>
              {expandedSection === category ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSection === category && (
              <div className="p-4 grid gap-2">
                {features.map((f, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                      f.impact === 'positive' 
                        ? 'bg-red-50/50 hover:bg-red-50 border border-red-100' 
                        : 'bg-green-50/50 hover:bg-green-50 border border-green-100'
                    }`}
                    onClick={() => setSelectedFeature(f)}
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {getDisplayName(f.feature)}
                        {isCreditHistoryFeature(f.feature) && <span className="ml-1 text-amber-500">⚠</span>}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">{formatValue(f.feature, f.value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-semibold ${f.impact === 'positive' ? 'text-red-600' : 'text-green-600'}`}>
                        {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        f.impact === 'positive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {f.impact === 'positive' ? 'Concern' : 'Supportive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

    </div>
  )
}
