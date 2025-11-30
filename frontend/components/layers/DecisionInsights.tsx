// DecisionInsights.tsx - Bank-clerk-friendly analytics layer
// Transforms technical SHAP data into intuitive, empathetic explanations

'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronDown, ChevronUp, Filter, TrendingUp, TrendingDown, HelpCircle, Sparkles, AlertTriangle, CheckCircle, XCircle, Info, Wallet, Clock, Home, CreditCard } from 'lucide-react'
import GlobalModelExplanation from './GlobalModelExplanation'
import ModelCertaintyExplanation from '@/components/ui/ModelCertaintyExplanation'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface DecisionInsightsProps {
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

// Global insights for features (simplified, human-friendly)
const GLOBAL_INSIGHTS: Record<string, string> = {
  'Checking Account Status': 'Applicants with positive checking balances typically have stronger profiles.',
  'Savings Account Status': 'Higher savings provide a safety buffer and are viewed favorably.',
  'Employment Duration': 'Longer employment history indicates job stability.',
  'Credit Amount': 'Loan amounts proportional to the applicant\'s profile are preferred.',
  'Loan Duration (months)': 'Shorter loan terms are generally considered lower risk.',
  'Age': 'Middle-aged applicants (30-55) often show the most stable patterns.',
  'Housing Status': 'Property ownership can indicate financial stability.',
  'Credit History': '⚠️ This factor shows unusual patterns in historical data. Interpret with caution.',
  'Monthly Payment Burden': 'Monthly payments relative to income affect repayment capacity.',
  'Years at Residence': 'Longer residence suggests stability.',
  'Installment Rate': 'Lower installment rates leave more room for unexpected expenses.',
}

// Human-friendly impact descriptions
function getImpactLabel(impact: 'positive' | 'negative', strength: 'strong' | 'moderate' | 'slight'): string {
  if (impact === 'negative') {
    return strength === 'strong' ? 'Strongly supported approval' :
           strength === 'moderate' ? 'Supported approval' : 'Slightly helpful'
  } else {
    return strength === 'strong' ? 'Raised significant concerns' :
           strength === 'moderate' ? 'Raised some concerns' : 'Minor concern'
  }
}

// Get strength from SHAP value
function getStrength(shapValue: number, maxShap: number): 'strong' | 'moderate' | 'slight' {
  const ratio = Math.abs(shapValue) / maxShap
  if (ratio > 0.6) return 'strong'
  if (ratio > 0.3) return 'moderate'
  return 'slight'
}

// Format values for display
function formatValue(feature: string, value: string): string {
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') && feature.includes('months')) return `${numValue} months`
    if (feature.includes('Amount')) return `${numValue.toLocaleString()} DM`
    if (feature.includes('Age')) return `${numValue} years old`
    if (feature.includes('Burden')) return `${numValue.toLocaleString()} DM/month`
    if (feature.includes('Residence')) return `${numValue} years`
  }
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Get confidence label - probability is the model's confidence in its decision
function getConfidenceLabel(probability: number): { label: string; color: string } {
  if (probability >= 0.80) return { label: 'High confidence', color: 'text-blue-700' }
  if (probability >= 0.65) return { label: 'Moderate confidence', color: 'text-amber-700' }
  return { label: 'Borderline case', color: 'text-gray-600' }
}

// Get category for a feature
function getCategory(featureName: string): string {
  for (const [cat, config] of Object.entries(FEATURE_CATEGORIES)) {
    if (config.features.some(f => featureName.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(featureName.toLowerCase()))) {
      return cat
    }
  }
  return 'household'
}

// Check if credit history feature
function isCreditHistory(name: string): boolean {
  return name.toLowerCase().includes('credit history') || name.toLowerCase().includes('credit_history')
}

type FilterType = 'all' | 'supportive' | 'concerns' | 'important'

export default function DecisionInsights({ decision, probability, shapFeatures }: DecisionInsightsProps) {
  const [filter, setFilter] = useState<FilterType>('important')
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const featureRefs = useRef<Record<number, HTMLDivElement | null>>({})
  
  const isApproved = decision === 'approved'
  const confidence = getConfidenceLabel(probability)
  
  // Sort and analyze features
  const sortedFeatures = useMemo(() => 
    [...shapFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)),
    [shapFeatures]
  )
  
  const maxShap = Math.max(...sortedFeatures.map(f => Math.abs(f.shap_value)))
  
  const supportiveFeatures = sortedFeatures.filter(f => f.impact === 'negative')
  const concernFeatures = sortedFeatures.filter(f => f.impact === 'positive')
  
  // Top factors for story
  const topSupportive = supportiveFeatures.slice(0, 2)
  const topConcerns = concernFeatures.slice(0, 2)
  
  // Filter features
  const filteredFeatures = useMemo(() => {
    switch (filter) {
      case 'supportive': return supportiveFeatures
      case 'concerns': return concernFeatures
      case 'important': return sortedFeatures.slice(0, 8)
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
  
  // Generate AI summary (optional, short) - with fallback if API fails
  useEffect(() => {
    const generateSummary = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      // Generate local fallback summary
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
      
      // If no API URL, use local fallback immediately
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
          // API returned error, use local fallback
          setAiSummary(generateLocalSummary())
        }
      } catch {
        // Network error, use local fallback
        setAiSummary(generateLocalSummary())
      } finally {
        setIsLoadingSummary(false)
      }
    }
    
    generateSummary()
  }, [decision, probability, topSupportive, topConcerns])
  
  // Toggle card expansion
  const toggleCard = (idx: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }
  
  // Scroll to feature card
  const scrollToFeature = (idx: number) => {
    const ref = featureRefs.current[idx]
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setExpandedCards(prev => new Set(prev).add(idx))
    }
  }
  
  // Build decision story
  const decisionStory = useMemo(() => {
    const lines: string[] = []
    
    if (topSupportive.length > 0) {
      const names = topSupportive.map(f => f.feature.replace(/[()]/g, '')).join(' and ')
      lines.push(`Your ${names.toLowerCase()} helped strengthen your application.`)
    }
    
    if (topConcerns.length > 0) {
      const names = topConcerns.map(f => f.feature.replace(/[()]/g, '')).join(' and ')
      lines.push(`The assessment was more cautious regarding your ${names.toLowerCase()}.`)
    }
    
    if (supportiveFeatures.length > concernFeatures.length) {
      lines.push('Overall, the supportive factors outweighed the concerns.')
    } else if (concernFeatures.length > supportiveFeatures.length) {
      lines.push('Overall, the concerns outweighed the supportive factors.')
    } else {
      lines.push('The factors were closely balanced in this assessment.')
    }
    
    return lines
  }, [topSupportive, topConcerns, supportiveFeatures.length, concernFeatures.length])

  return (
    <div className="space-y-6">
      {/* Global Model Explanation - How the tool works in general */}
      <GlobalModelExplanation defaultExpanded={false} showVisualizations={true} />
      
      {/* Decision Summary Card */}
      <div className={`rounded-2xl p-6 ${isApproved ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isApproved ? 'bg-green-100' : 'bg-red-100'}`}>
            {isApproved ? <CheckCircle className="text-green-600" size={32} /> : <XCircle className="text-red-600" size={32} />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
                Application {isApproved ? 'Approved' : 'Not Approved'}
              </h2>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {confidence.label}
              </span>
            </div>
            
            {/* AI Mini-Summary */}
            {isLoadingSummary ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Sparkles size={16} className="animate-pulse" />
                <span>Preparing summary...</span>
              </div>
            ) : aiSummary ? (
              <p className="text-gray-700 leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-gray-600">
                {isApproved 
                  ? `This application meets the criteria based on ${supportiveFeatures.length} supportive factors.`
                  : `This application raised ${concernFeatures.length} concerns that affected the outcome.`
                }
              </p>
            )}
            
            {/* Confidence explanation */}
            <p className="text-xs text-gray-500 mt-3">
              {Math.round(probability * 100)}% confidence = model is this certain the applicant should be {decision}
            </p>
          </div>
        </div>
        
      </div>

      {/* Model Certainty Explanation */}
      <ModelCertaintyExplanation probability={probability} decision={decision} />

      {/* Decision Story */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} />
          Understanding This Decision
        </h3>
        <div className="space-y-2">
          {decisionStory.map((line, idx) => (
            <p key={idx} className="text-gray-700 flex items-start gap-2">
              <span className="text-indigo-400 mt-1">•</span>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Interactive Waterfall */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Factor Impact Overview
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Click any bar to see more details about that factor.
        </p>
        
        <div className="space-y-2">
          {sortedFeatures.slice(0, 8).map((feature, idx) => {
            const barWidth = (Math.abs(feature.shap_value) / maxShap) * 100
            const isPositive = feature.impact === 'positive'
            const strength = getStrength(feature.shap_value, maxShap)
            
            return (
              <button
                key={idx}
                onClick={() => scrollToFeature(idx)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition group text-left"
              >
                <span className="w-36 text-sm text-gray-700 truncate group-hover:text-indigo-600">
                  {feature.feature}
                </span>
                
                <div className="flex-1 h-8 relative flex items-center">
                  {/* Center line */}
                  <div className="absolute left-1/2 h-full w-px bg-gray-200" />
                  
                  {/* Bar */}
                  <div
                    className={`absolute h-6 rounded-lg transition-all group-hover:opacity-80 ${
                      isPositive 
                        ? 'bg-gradient-to-r from-red-300 to-red-400' 
                        : 'bg-gradient-to-r from-green-300 to-green-400'
                    }`}
                    style={{
                      width: `${Math.max(barWidth / 2, 3)}%`,
                      left: isPositive ? '50%' : `${50 - barWidth / 2}%`,
                    }}
                  />
                  
                  {/* Hover tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {isPositive 
                        ? strength === 'strong' ? 'Raised significant concerns' : 'Raised some concerns'
                        : strength === 'strong' ? 'Strongly supported approval' : 'Supported approval'
                      }
                    </div>
                  </div>
                </div>
                
                <span className={`w-24 text-right text-xs font-medium ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                  {isPositive ? 'Concern' : 'Supportive'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {[
          { key: 'important', label: 'Most Important' },
          { key: 'supportive', label: 'Supportive Factors' },
          { key: 'concerns', label: 'Concerns' },
          { key: 'all', label: 'All Factors' },
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

      {/* Feature Cards by Category */}
      {Object.entries(groupedFeatures).map(([category, features]) => {
        const config = FEATURE_CATEGORIES[category]
        if (!config || features.length === 0) return null
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-indigo-500">{config.icon}</span>
              <h4 className="font-semibold">{config.label}</h4>
              <span className="text-sm text-gray-400">({features.length})</span>
            </div>
            
            <div className="grid gap-3">
              {features.map((feature, idx) => {
                const globalIdx = sortedFeatures.findIndex(f => f.feature === feature.feature)
                const isExpanded = expandedCards.has(globalIdx)
                const strength = getStrength(feature.shap_value, maxShap)
                const isCreditHistoryFeature = isCreditHistory(feature.feature)
                
                return (
                  <div
                    key={idx}
                    ref={el => { featureRefs.current[globalIdx] = el }}
                    className={`bg-white rounded-xl border overflow-hidden transition ${
                      isCreditHistoryFeature ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-gray-900">{feature.feature}</h5>
                            {isCreditHistoryFeature && (
                              <AlertTriangle size={14} className="text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Value: <span className="font-medium">{formatValue(feature.feature, feature.value)}</span>
                          </p>
                        </div>
                        
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          feature.impact === 'positive' 
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {feature.impact === 'positive' ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
                          {getImpactLabel(feature.impact, strength)}
                        </div>
                      </div>
                      
                      {/* Global insight on hover/always visible */}
                      {GLOBAL_INSIGHTS[feature.feature] && (
                        <p className="mt-2 text-xs text-gray-500 italic">
                          💡 {GLOBAL_INSIGHTS[feature.feature]}
                        </p>
                      )}
                    </div>
                    
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleCard(globalIdx)}
                      className="w-full px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {isExpanded ? 'Show less' : 'Learn more'}
                    </button>
                    
                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600 space-y-2">
                        <p>
                          <strong>What this means:</strong> This factor reflects {feature.feature.toLowerCase()} in the applicant's profile.
                        </p>
                        <p>
                          <strong>How it affected this decision:</strong> {
                            feature.impact === 'positive'
                              ? 'This aspect of the profile raised some caution in the assessment.'
                              : 'This aspect of the profile contributed positively to the assessment.'
                          }
                        </p>
                        {isCreditHistoryFeature && (
                          <p className="text-amber-700 bg-amber-50 p-2 rounded">
                            <strong>⚠️ Note:</strong> This dataset contains historical credit categories from 1994 that behaved differently from today's standards. Please interpret this factor with caution.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Why Not the Opposite? */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="text-gray-500" size={20} />
          Why Not {isApproved ? 'Rejected' : 'Approved'}?
        </h3>
        
        {isApproved ? (
          <div className="space-y-2 text-gray-700">
            <p>
              While there were {concernFeatures.length} factors that raised some concerns, 
              the {supportiveFeatures.length} supportive factors were strong enough to result in approval.
            </p>
            {topConcerns.length > 0 && (
              <p className="text-sm text-gray-500">
                The main areas of caution were: {topConcerns.map(f => f.feature).join(', ')}.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-gray-700">
            <p>
              The factors that most influenced this outcome were: {topConcerns.slice(0, 2).map(f => f.feature).join(' and ')}.
            </p>
            {topSupportive.length > 0 && (
              <p className="text-sm text-gray-500">
                Positive aspects like {topSupportive.map(f => f.feature).join(' and ')} were noted, 
                but weren't sufficient to change the overall assessment.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Simplified Credit History Disclaimer */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-medium text-amber-900 mb-1">About Historical Data</h4>
            <p className="text-sm text-amber-800">
              This assessment uses patterns from 1994 German banking data. Some factors, 
              especially credit history categories, may behave differently than modern expectations. 
              Please use professional judgment when discussing these with applicants.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
