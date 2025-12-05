'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import GlobalDistributionLine from './GlobalDistributionLine'
import InfoTooltip from './InfoTooltip'

// Feature benchmark data structure
export interface FeatureBenchmark {
  min: number
  max: number
  typicalRange: [number, number]
  unit: string
  higherIsBetter: boolean
}

// Default benchmarks for common features (from German Credit Dataset)
export const FEATURE_BENCHMARKS: Record<string, FeatureBenchmark> = {
  'duration': {
    min: 4,
    max: 72,
    typicalRange: [10, 21],
    unit: 'months',
    higherIsBetter: false
  },
  'loan duration': {
    min: 4,
    max: 72,
    typicalRange: [10, 21],
    unit: 'months',
    higherIsBetter: false
  },
  'credit_amount': {
    min: 250,
    max: 18500,
    typicalRange: [1200, 3500],
    unit: '€',
    higherIsBetter: false
  },
  'credit amount': {
    min: 250,
    max: 18500,
    typicalRange: [1200, 3500],
    unit: '€',
    higherIsBetter: false
  },
  'age': {
    min: 19,
    max: 75,
    typicalRange: [28, 44],
    unit: 'years',
    higherIsBetter: true
  },
  'present_residence_since': {
    min: 1,
    max: 4,
    typicalRange: [2, 4],
    unit: 'years',
    higherIsBetter: true
  },
  'years at residence': {
    min: 1,
    max: 4,
    typicalRange: [2, 4],
    unit: 'years',
    higherIsBetter: true
  },
  'existing_credits': {
    min: 1,
    max: 4,
    typicalRange: [1, 2],
    unit: 'credits',
    higherIsBetter: false
  },
  'existing credits': {
    min: 1,
    max: 4,
    typicalRange: [1, 2],
    unit: 'credits',
    higherIsBetter: false
  },
}

// Feature narrative explanations
const FEATURE_NARRATIVES: Record<string, { risk: string; support: string }> = {
  'duration': {
    risk: 'Longer loan durations increase the time exposure to potential default. The model sees extended repayment periods as higher risk.',
    support: 'A shorter loan duration means faster repayment and less time for financial circumstances to change adversely.'
  },
  'loan duration': {
    risk: 'Longer loan durations increase the time exposure to potential default. The model sees extended repayment periods as higher risk.',
    support: 'A shorter loan duration means faster repayment and less time for financial circumstances to change adversely.'
  },
  'credit_amount': {
    risk: 'Higher loan amounts represent greater financial exposure. The requested amount may be high relative to the applicant\'s profile.',
    support: 'The loan amount is within a manageable range for the applicant\'s financial profile.'
  },
  'credit amount': {
    risk: 'Higher loan amounts represent greater financial exposure. The requested amount may be high relative to the applicant\'s profile.',
    support: 'The loan amount is within a manageable range for the applicant\'s financial profile.'
  },
  'age': {
    risk: 'Age can indicate life stage stability. Very young or very old applicants may have different risk profiles.',
    support: 'The applicant\'s age suggests a stable life stage with established financial patterns.'
  },
  'checking_status': {
    risk: 'The checking account status suggests limited financial buffer or irregular cash flow patterns.',
    support: 'A healthy checking account balance indicates stable cash flow and financial management.'
  },
  'checking account': {
    risk: 'The checking account status suggests limited financial buffer or irregular cash flow patterns.',
    support: 'A healthy checking account balance indicates stable cash flow and financial management.'
  },
  'savings_status': {
    risk: 'Limited savings reduce the financial safety net available for unexpected expenses.',
    support: 'Adequate savings provide a buffer against financial shocks and demonstrate fiscal discipline.'
  },
  'savings account': {
    risk: 'Limited savings reduce the financial safety net available for unexpected expenses.',
    support: 'Adequate savings provide a buffer against financial shocks and demonstrate fiscal discipline.'
  },
  'credit_history': {
    risk: 'Note: This model shows counterintuitive patterns for credit history due to historical data characteristics.',
    support: 'The credit history pattern indicates experience with managing credit obligations.'
  },
  'credit history': {
    risk: 'Note: This model shows counterintuitive patterns for credit history due to historical data characteristics.',
    support: 'The credit history pattern indicates experience with managing credit obligations.'
  },
  'employment': {
    risk: 'Employment duration or status may indicate income stability concerns.',
    support: 'Stable employment suggests reliable income for loan repayment.'
  },
  'employment duration': {
    risk: 'Shorter employment tenure may indicate less income stability.',
    support: 'Long-term employment demonstrates job security and stable income.'
  },
  'housing': {
    risk: 'Housing situation may affect financial stability assessment.',
    support: 'Stable housing indicates established roots and financial responsibility.'
  },
  'housing status': {
    risk: 'Housing situation may affect financial stability assessment.',
    support: 'Stable housing indicates established roots and financial responsibility.'
  },
  'property': {
    risk: 'Limited property ownership reduces available collateral.',
    support: 'Property ownership provides additional financial security and collateral.'
  },
  'property ownership': {
    risk: 'Limited property ownership reduces available collateral.',
    support: 'Property ownership provides additional financial security and collateral.'
  },
}

interface FeatureRowAccordionProps {
  featureName: string
  displayName: string
  value: string
  numericValue?: number
  contributionPercent: number
  impact: 'positive' | 'negative'  // positive = risk, negative = supportive
  isExpanded: boolean
  onToggle: () => void
  isCreditHistory?: boolean
}

export default function FeatureRowAccordion({
  featureName,
  displayName,
  value,
  numericValue,
  contributionPercent,
  impact,
  isExpanded,
  onToggle,
  isCreditHistory = false
}: FeatureRowAccordionProps) {
  const isRisk = impact === 'positive'
  
  // Get benchmark data for this feature
  const featureKey = featureName.toLowerCase().replace(/[()]/g, '').trim()
  const benchmark = FEATURE_BENCHMARKS[featureKey] || 
    Object.entries(FEATURE_BENCHMARKS).find(([key]) => 
      featureKey.includes(key) || key.includes(featureKey)
    )?.[1]
  
  // Get narrative for this feature
  const narrativeKey = featureKey.split(' ')[0]
  const narrative = FEATURE_NARRATIVES[featureKey] || 
    FEATURE_NARRATIVES[narrativeKey] ||
    Object.entries(FEATURE_NARRATIVES).find(([key]) => 
      featureKey.includes(key) || key.includes(featureKey)
    )?.[1]

  const narrativeText = narrative 
    ? (isRisk ? narrative.risk : narrative.support)
    : (isRisk 
        ? 'This factor contributed to increased risk assessment.'
        : 'This factor supported a favorable assessment.')

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isExpanded 
        ? isRisk 
          ? 'border-red-300 bg-red-50/50 shadow-md' 
          : 'border-green-300 bg-green-50/50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}>
      {/* Collapsed Row - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center gap-4 text-left"
      >
        {/* Impact indicator */}
        <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
          isRisk ? 'bg-red-500' : 'bg-green-500'
        }`} />

        {/* Feature name and value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 truncate">
              {displayName}
            </span>
            {isCreditHistory && (
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-sm text-gray-600">{value}</span>
        </div>

        {/* Contribution bar */}
        <div className="w-32 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(contributionPercent * 2, 100)}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  isRisk ? 'bg-red-500' : 'bg-green-500'
                }`}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold w-10 text-right ${
                isRisk ? 'text-red-600' : 'text-green-600'
              }`}>
                {contributionPercent.toFixed(0)}%
              </span>
              <InfoTooltip content="How much this factor influenced the final result, relative to all other factors." />
            </div>
          </div>
        </div>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </button>

      {/* Expanded Content - The "Glass Box" */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              {/* Narrative explanation */}
              <div className={`p-3 rounded-lg mb-4 ${
                isRisk ? 'bg-red-100/50' : 'bg-green-100/50'
              }`}>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {narrativeText}
                </p>
              </div>

              {/* Global Distribution Visual - only for numeric features with benchmarks */}
              {benchmark && numericValue !== undefined && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    How You Compare
                  </h4>
                  <GlobalDistributionLine
                    min={benchmark.min}
                    max={benchmark.max}
                    value={numericValue}
                    typicalRange={benchmark.typicalRange}
                    unit={benchmark.unit}
                    higherIsBetter={benchmark.higherIsBetter}
                  />
                </div>
              )}

              {/* Credit History Warning */}
              {isCreditHistory && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      <strong>Historical Data Note:</strong> Credit history patterns in this model 
                      may appear counterintuitive due to survivorship bias in the original 1994 dataset.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
