// Layer 2: Progressive Disclosure Dashboard
// Strategic overview with drill-down into global context for each factor
// Uses relative impact % instead of raw SHAP values

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Sparkles, FileText, Percent, Star, ShieldAlert } from 'lucide-react'
import RiskTugOfWar from './dashboard/RiskTugOfWar'
import FeatureRowAccordion from './dashboard/FeatureRowAccordion'
import InfoTooltip, { TOOLTIPS } from './dashboard/InfoTooltip'

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
  'Duration Risk Score': 'Duration Risk',
}

function getDisplayName(rawName: string): string {
  if (FEATURE_DISPLAY_MAP[rawName]) return FEATURE_DISPLAY_MAP[rawName]
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_MAP)) {
    if (rawName.toLowerCase().includes(key.toLowerCase())) return value
  }
  return rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Enhanced categorical value display mapping
const CATEGORICAL_VALUE_DISPLAY: Record<string, Record<string, string>> = {
  'checking_status': {
    'lt_0_dm': 'Less than 0 DM (overdrawn)',
    '0_to_200_dm': '0 to 200 DM',
    'ge_200_dm': '200 DM or more',
    'no_checking': 'No checking account'
  },
  'savings_status': {
    'lt_100_dm': 'Less than 100 DM',
    '100_to_500_dm': '100 to 500 DM',
    '500_to_1000_dm': '500 to 1000 DM',
    'ge_1000_dm': '1000 DM or more',
    'unknown': 'Unknown/No savings'
  },
  'credit_history': {
    'no_credits': 'No credits taken',
    'all_paid': 'All credits paid back',
    'existing_paid': 'Existing credits paid',
    'delayed_past': 'Delay in paying off',
    'critical': 'Critical account'
  },
  'employment': {
    'unemployed': 'Unemployed',
    'lt_1_year': 'Less than 1 year',
    '1_to_4_years': '1 to 4 years',
    '4_to_7_years': '4 to 7 years',
    'ge_7_years': '7 years or more'
  },
  'job': {
    'unemployed_unskilled': 'Unemployed/Unskilled',
    'unskilled_resident': 'Unskilled - Resident',
    'skilled': 'Skilled employee',
    'management': 'Management/Self-employed'
  },
  'purpose': {
    'car_new': 'New car',
    'car_used': 'Used car',
    'furniture': 'Furniture/Equipment',
    'radio_tv': 'Radio/Television',
    'domestic_appliances': 'Domestic appliances',
    'repairs': 'Repairs',
    'education': 'Education',
    'retraining': 'Retraining',
    'business': 'Business',
    'others': 'Other purpose'
  },
  'property_magnitude': {
    'real_estate': 'Real estate',
    'savings_agreement': 'Building society savings',
    'car_or_other': 'Car or other',
    'unknown_no_property': 'Unknown/No property'
  },
  'housing': {
    'rent': 'Rent',
    'own': 'Own',
    'for_free': 'For free'
  },
  'other_debtors': {
    'none': 'None',
    'co_applicant': 'Co-applicant',
    'guarantor': 'Guarantor'
  },
  'other_payment_plans': {
    'none': 'None',
    'bank': 'Bank',
    'stores': 'Stores'
  },
  'own_telephone': {
    'yes': 'Yes (registered)',
    'none': 'No'
  },
  'installment_commitment': {
    'lt_20_percent': 'Less than 20%',
    '20_to_25_percent': '20-25%',
    '25_to_35_percent': '25-35%',
    'ge_35_percent': '35% or more'
  }
}

function formatValue(feature: string, value: string): string {
  // Try to parse as number first
  const num = parseFloat(value)
  
  // If it's a valid number, format it appropriately
  if (!isNaN(num)) {
    if (feature.toLowerCase().includes('duration') && feature.toLowerCase().includes('month')) return `${num} months`
    if (feature.toLowerCase().includes('amount')) return `€${num.toLocaleString()}`
    if (feature.toLowerCase().includes('age')) return `${num} years`
    if (feature.toLowerCase().includes('burden')) return `€${num.toLocaleString()}/mo`
    if (feature.toLowerCase().includes('residence')) return `${num} years`
    if (feature.toLowerCase().includes('rate')) return `${num.toFixed(1)}%`
    return num.toFixed(1)
  }
  
  // For categorical values, try to find a display mapping
  const featureKey = feature.toLowerCase().replace(/[\s()]/g, '_').replace(/_+/g, '_')
  const valueKey = value.toLowerCase().trim()
  
  // Check all categorical mappings
  for (const [catKey, catValues] of Object.entries(CATEGORICAL_VALUE_DISPLAY)) {
    if (featureKey.includes(catKey) || catKey.includes(featureKey.split('_')[0])) {
      if (catValues[valueKey]) return catValues[valueKey]
    }
  }
  
  // Fallback: Clean up underscores and capitalize
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function extractNumericValue(value: string): number | undefined {
  const match = value.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : undefined
}

function isCreditHistoryFeature(featureName: string): boolean {
  return featureName.toLowerCase().includes('credit history') || 
         featureName.toLowerCase().includes('credit_history')
}

// ═══════════════════════════════════════════════════════════════════════
// RISK-BASED PRICING CALCULATOR
// ═══════════════════════════════════════════════════════════════════════

interface InterestRateResult {
  rate: string           // Formatted rate (e.g., "9.50%")
  rateValue: number      // Numeric rate for comparison
  tier: 'prime' | 'standard' | 'high-risk'
  tierLabel: string
  tierEmoji: string
}

function calculateInterestRate(
  decision: 'approved' | 'rejected',
  confidence: number
): InterestRateResult | null {
  // Step A: Handle Rejection - No credit offered
  if (decision === 'rejected') {
    return null
  }

  // Step B: Calculate Risk
  // confidence is the probability of the winning class (approval)
  // defaultRisk = probability of default = 1 - confidence
  const defaultRisk = 1.0 - confidence

  // Step C: The "Forgiving" Formula
  // Base Rate: 4.5% (floor for best applicants)
  // Risk Multiplier: 20 (scales risk to reasonable rate range)
  const BASE_RATE = 4.5
  const RISK_MULTIPLIER = 20
  const rateValue = BASE_RATE + (defaultRisk * RISK_MULTIPLIER)

  // Step D: Determine Tier
  let tier: 'prime' | 'standard' | 'high-risk'
  let tierLabel: string
  let tierEmoji: string

  if (rateValue < 7) {
    tier = 'prime'
    tierLabel = 'Prime Rate'
    tierEmoji = '🌟'
  } else if (rateValue < 11) {
    tier = 'standard'
    tierLabel = 'Standard Rate'
    tierEmoji = '✓'
  } else {
    tier = 'high-risk'
    tierLabel = 'High Risk Rate'
    tierEmoji = '⚠️'
  }

  return {
    rate: `${rateValue.toFixed(2)}%`,
    rateValue,
    tier,
    tierLabel,
    tierEmoji
  }
}

// Processed feature with contribution percentage
interface ProcessedFeature extends SHAPFeature {
  displayName: string
  formattedValue: string
  numericValue?: number
  contributionPercent: number
  isCreditHistory: boolean
}

export default function Layer2Dashboard({ decision, probability, shapFeatures }: Layer2DashboardProps) {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  
  const isApproved = decision === 'approved'
  const confidencePercent = Math.round(probability * 100)
  
  // Calculate personalized interest rate (only for approved applicants)
  const interestRate = useMemo(() => 
    calculateInterestRate(decision, probability),
    [decision, probability]
  )

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: Data Transformation - Relative Impact % Logic
  // ═══════════════════════════════════════════════════════════════════════
  
  // Calculate total absolute SHAP impact
  const totalImpact = useMemo(() => 
    shapFeatures.reduce((sum, f) => sum + Math.abs(f.shap_value), 0),
    [shapFeatures]
  )

  // Process features with contribution percentages
  const processedFeatures = useMemo((): ProcessedFeature[] => {
    return shapFeatures.map(f => ({
      ...f,
      displayName: getDisplayName(f.feature),
      formattedValue: formatValue(f.feature, f.value),
      numericValue: extractNumericValue(f.value),
      contributionPercent: totalImpact > 0 ? (Math.abs(f.shap_value) / totalImpact) * 100 : 0,
      isCreditHistory: isCreditHistoryFeature(f.feature)
    }))
  }, [shapFeatures, totalImpact])

  // Split into concerns (risk) and supportive, sorted by contribution %
  const concernFeatures = useMemo(() => 
    processedFeatures
      .filter(f => f.impact === 'positive')
      .sort((a, b) => b.contributionPercent - a.contributionPercent),
    [processedFeatures]
  )

  const supportiveFeatures = useMemo(() => 
    processedFeatures
      .filter(f => f.impact === 'negative')
      .sort((a, b) => b.contributionPercent - a.contributionPercent),
    [processedFeatures]
  )

  // Aggregate percentages for Tug of War
  const riskPercent = useMemo(() => 
    concernFeatures.reduce((sum, f) => sum + f.contributionPercent, 0),
    [concernFeatures]
  )

  const supportPercent = useMemo(() => 
    supportiveFeatures.reduce((sum, f) => sum + f.contributionPercent, 0),
    [supportiveFeatures]
  )

  // ═══════════════════════════════════════════════════════════════════════
  // AI Summary Generation
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (aiSummary) return
    
    const generateSummary = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      const generateLocalSummary = () => {
        const topConcern = concernFeatures[0]?.displayName?.toLowerCase()
        const topStrength = supportiveFeatures[0]?.displayName?.toLowerCase()
        
        if (decision === 'approved') {
          if (topStrength) {
            return `This application shows a favorable risk profile. The strongest supporting factor is the applicant's ${topStrength}, which significantly contributed to the positive assessment.${topConcern ? ` While ${topConcern} was noted as an area of attention, the overall balance favors approval.` : ''}`
          }
          return "This application demonstrates an acceptable risk profile based on the analyzed factors."
        } else {
          if (topConcern) {
            return `The primary concern in this application is the ${topConcern}, which carries significant weight in the risk assessment.${topStrength ? ` Despite positive indicators like ${topStrength}, the risk factors outweigh the strengths.` : ''}`
          }
          return "The combination of risk factors in this application exceeds the acceptable threshold."
        }
      }
      
      if (!apiUrl) {
        setAiSummary(generateLocalSummary())
        return
      }
      
      setIsLoadingSummary(true)
      try {
        const response = await fetch(`${apiUrl}/api/v1/explanations/level2/narrative`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            probability,
            shap_features: shapFeatures.slice(0, 5),
            all_features: shapFeatures
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setAiSummary(data.narrative)
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
  }, [decision, probability, shapFeatures, concernFeatures, supportiveFeatures, aiSummary])

  // Toggle accordion
  const handleToggle = (featureName: string) => {
    setExpandedFeature(prev => prev === featureName ? null : featureName)
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          PERSONALIZED RATE/RISK - Always at Top
          ═══════════════════════════════════════════════════════════════════════ */}
      
      {/* Interest Rate Card (Approved) - ALWAYS FIRST */}
      {interestRate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className={`rounded-2xl p-6 border-2 ${
            interestRate.tier === 'prime' 
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
              : interestRate.tier === 'standard'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
              : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'
          }`}
        >
          <div className="flex items-start justify-between">
            {/* Left: Rate Display */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                interestRate.tier === 'prime' 
                  ? 'bg-emerald-100'
                  : interestRate.tier === 'standard'
                  ? 'bg-blue-100'
                  : 'bg-orange-100'
              }`}>
                {interestRate.tier === 'prime' ? (
                  <Star className="text-emerald-600" size={28} />
                ) : interestRate.tier === 'standard' ? (
                  <Percent className="text-blue-600" size={28} />
                ) : (
                  <ShieldAlert className="text-orange-600" size={28} />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Personalized Rate</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${
                    interestRate.tier === 'prime' 
                      ? 'text-emerald-700'
                      : interestRate.tier === 'standard'
                      ? 'text-blue-700'
                      : 'text-orange-700'
                  }`}>
                    {interestRate.rate}
                  </span>
                  <span className="text-gray-500 text-lg">APR</span>
                </div>
              </div>
            </div>

            {/* Right: Tier Badge */}
            <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
              interestRate.tier === 'prime' 
                ? 'bg-emerald-100 text-emerald-800'
                : interestRate.tier === 'standard'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-orange-100 text-orange-800'
            }`}>
              <span>{interestRate.tierEmoji}</span>
              <span>{interestRate.tierLabel}</span>
            </div>
          </div>

          {/* Rate Explanation */}
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-start gap-2">
              <InfoTooltip 
                content={`This rate is calculated from your risk profile. Base rate (4.5%) + Risk adjustment (${((1 - probability) * 20).toFixed(1)}%). Lower risk = lower rate.`}
              />
              <p className="text-sm text-gray-600">
                Based on your <strong>{confidencePercent}% repayment probability</strong>. 
                {interestRate.tier === 'high-risk' ? (
                  <span className="text-orange-700"> Improving factors like Savings or reducing Loan Duration can lower this rate.</span>
                ) : interestRate.tier === 'standard' ? (
                  <span className="text-blue-700"> Good standing. Minor improvements could qualify you for our Prime rate.</span>
                ) : (
                  <span className="text-emerald-700"> Excellent! You qualify for our best available rate.</span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rejection Risk Gauge (Rejected Only) - ALWAYS FIRST */}
      {!isApproved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <ShieldAlert className="text-red-600" size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Estimated Risk Level</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-red-700">
                  {Math.round((1 - probability) * 100)}%
                </span>
                <span className="text-gray-500 text-lg">Default Risk</span>
              </div>
            </div>
          </div>
          
          {/* Risk Bar */}
          <div className="mt-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(1 - probability) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-red-700">
            <strong>No credit offer available.</strong> The risk factors identified exceed our lending threshold. 
            Review the concerns below to understand what drove this assessment.
          </p>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DECISION EXPLANATION - After Rate/Risk Card
          ═══════════════════════════════════════════════════════════════════════ */}
      
      {/* Decision Header with Tug of War */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 ${isApproved 
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200' 
          : 'bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 border-2 border-red-200'}`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isApproved ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isApproved 
              ? <CheckCircle2 className="text-green-600" size={32} /> 
              : <XCircle className="text-red-600" size={32} />
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Credit Decision: <span className={isApproved ? 'text-green-700' : 'text-red-700'}>
                {decision.toUpperCase()}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">Model Confidence:</span>
              <span className={`font-bold ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
                {confidencePercent}%
              </span>
              <InfoTooltip content={TOOLTIPS.modelConfidence} />
            </div>
          </div>
        </div>

        {/* Tug of War Visual */}
        <RiskTugOfWar
          riskPercent={riskPercent}
          supportPercent={supportPercent}
          probability={probability}
          decision={decision}
        />
      </motion.div>

      {/* AI-Generated Analyst Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-bl-full" />
        
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            {/* AI Icon */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="text-white" size={18} />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="text-sm font-bold text-indigo-900">AI Analyst Summary</h3>
                {isLoadingSummary && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
              
              {/* Content */}
              {isLoadingSummary ? (
                <div className="space-y-2">
                  <div className="h-3 bg-indigo-200/50 rounded animate-pulse w-full" />
                  <div className="h-3 bg-indigo-200/50 rounded animate-pulse w-11/12" />
                  <div className="h-3 bg-indigo-200/50 rounded animate-pulse w-4/5" />
                </div>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  {aiSummary?.split('\n').map((paragraph, idx) => {
                    // Convert **bold** markdown to HTML
                    const formattedText = paragraph.replace(
                      /\*\*(.+?)\*\*/g,
                      '<strong class="font-semibold text-gray-900">$1</strong>'
                    )
                    return (
                      <p
                        key={idx}
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INTERACTIVE FEATURE LIST - The Core
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* Risk Drivers Section */}
      {concernFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingUp className="text-red-600" size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Risk Drivers</h2>
            <span className="text-sm text-gray-500">({concernFeatures.length} factors)</span>
            <InfoTooltip content={TOOLTIPS.riskDrivers} />
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {concernFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <FeatureRowAccordion
                    featureName={feature.feature}
                    displayName={feature.displayName}
                    value={feature.formattedValue}
                    numericValue={feature.numericValue}
                    contributionPercent={feature.contributionPercent}
                    impact={feature.impact}
                    isExpanded={expandedFeature === feature.feature}
                    onToggle={() => handleToggle(feature.feature)}
                    isCreditHistory={feature.isCreditHistory}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Strengths Section */}
      {supportiveFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingDown className="text-green-600" size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Strengths</h2>
            <span className="text-sm text-gray-500">({supportiveFeatures.length} factors)</span>
            <InfoTooltip content={TOOLTIPS.strengths} />
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {supportiveFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <FeatureRowAccordion
                    featureName={feature.feature}
                    displayName={feature.displayName}
                    value={feature.formattedValue}
                    numericValue={feature.numericValue}
                    contributionPercent={feature.contributionPercent}
                    impact={feature.impact}
                    isExpanded={expandedFeature === feature.feature}
                    onToggle={() => handleToggle(feature.feature)}
                    isCreditHistory={feature.isCreditHistory}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER - Summary Stats
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100"
      >
        Analysis based on {shapFeatures.length} factors • 
        {concernFeatures.length} risk drivers ({riskPercent.toFixed(0)}% influence) • 
        {supportiveFeatures.length} strengths ({supportPercent.toFixed(0)}% influence)
      </motion.div>
    </div>
  )
}
