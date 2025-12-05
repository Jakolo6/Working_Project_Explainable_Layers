'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import GlobalDistributionLine from './GlobalDistributionLine'
import CategoricalComparison from './CategoricalComparison'
import RiskLadder from './RiskLadder'
import InfoTooltip from './InfoTooltip'
import { getCategoryStats, getRiskLadder, hasRiskLadder } from '@/lib/categoricalMetadata'

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

// Value-specific narratives for categorical features
const CATEGORICAL_VALUE_NARRATIVES: Record<string, Record<string, { risk: string; support: string }>> = {
  'checking_status': {
    'lt_0_dm': {
      risk: 'An overdrawn checking account (negative balance) indicates current financial stress and cash flow challenges, which raises concerns about repayment capacity.',
      support: 'While the account is overdrawn, having an active checking account shows engagement with the banking system.'
    },
    '0_to_200_dm': {
      risk: 'A modest checking balance suggests limited financial buffer for unexpected expenses or payment disruptions.',
      support: 'Maintaining a positive checking balance demonstrates basic financial management and regular cash flow.'
    },
    'ge_200_dm': {
      risk: 'Even with a healthy balance, other factors may indicate risk.',
      support: 'A checking balance of 200 DM or more provides a solid financial cushion and indicates good cash flow management.'
    },
    'no_checking': {
      risk: 'Without a checking account, there\'s no visible track record of managing regular cash flows and bill payments.',
      support: 'Some applicants successfully manage finances through alternative methods.'
    }
  },
  'savings_status': {
    'lt_100_dm': {
      risk: 'Minimal savings (under 100 DM) provide little safety net for emergencies, making loan repayment vulnerable to unexpected events.',
      support: 'Having some savings, even if modest, shows an effort toward financial planning.'
    },
    '100_to_500_dm': {
      risk: 'While better than no savings, this amount may not cover major unexpected expenses during the loan period.',
      support: 'Savings of 100-500 DM demonstrate financial discipline and provide a basic emergency buffer.'
    },
    '500_to_1000_dm': {
      risk: 'Moderate savings may be insufficient for larger emergencies.',
      support: 'Savings of 500-1000 DM show strong financial planning and provide a meaningful safety net for loan repayment.'
    },
    'ge_1000_dm': {
      risk: 'Even with substantial savings, other risk factors may be present.',
      support: 'Savings of 1000 DM or more indicate excellent financial discipline and provide a robust buffer against payment disruptions.'
    },
    'unknown': {
      risk: 'Unknown savings status creates uncertainty about the applicant\'s financial resilience and emergency preparedness.',
      support: 'Lack of savings information doesn\'t necessarily indicate poor financial management.'
    }
  },
  'credit_history': {
    'critical': {
      risk: 'A critical account history or existing problematic credits at other banks signals serious repayment difficulties.',
      support: 'Note: Historical data patterns may show counterintuitive results for this category.'
    },
    'delayed_past': {
      risk: 'Past payment delays indicate previous struggles with meeting financial obligations on time.',
      support: 'Past delays, if resolved, can demonstrate learning and improved financial management.'
    },
    'existing_paid': {
      risk: 'While current credits are being paid, the model may see this as additional financial burden.',
      support: 'Successfully managing existing credits demonstrates proven ability to handle debt obligations.'
    },
    'all_paid': {
      risk: 'Even with a clean payment history, other factors may indicate risk.',
      support: 'A perfect payment history across all credits shows exceptional financial reliability and discipline.'
    },
    'no_credits': {
      risk: 'No credit history means no proven track record of managing debt obligations.',
      support: 'A clean slate with no credit issues can be viewed positively in some contexts.'
    }
  },
  'employment': {
    'unemployed': {
      risk: 'Unemployment means no stable income source to support loan repayment, creating significant default risk.',
      support: 'Some unemployed applicants may have other income sources or assets.'
    },
    'lt_1_year': {
      risk: 'Less than one year of employment suggests an unstable or newly established income stream.',
      support: 'Recent employment shows initiative and income potential, even if not yet proven over time.'
    },
    '1_to_4_years': {
      risk: 'While showing some stability, 1-4 years may not demonstrate long-term job security.',
      support: 'Employment of 1-4 years indicates developing job stability and consistent income.'
    },
    '4_to_7_years': {
      risk: 'Even with solid employment history, other factors may present concerns.',
      support: 'Employment of 4-7 years demonstrates strong job stability and reliable income for repayment.'
    },
    'ge_7_years': {
      risk: 'Despite long employment, other risk factors may be present.',
      support: 'Employment of 7+ years shows exceptional job security and long-term income stability.'
    }
  },
  'job': {
    'unemployed_unskilled': {
      risk: 'Being unemployed and unskilled creates the highest employment risk, with limited income prospects and job market competitiveness.',
      support: 'Potential for improvement through training or job placement programs.'
    },
    'unskilled_resident': {
      risk: 'Unskilled positions typically offer lower wages and less job security, affecting repayment capacity.',
      support: 'Stable residence combined with employment shows commitment and local ties.'
    },
    'skilled': {
      risk: 'While skilled employment is positive, other factors may indicate risk.',
      support: 'Skilled employment indicates better earning potential, job security, and career advancement opportunities.'
    },
    'management': {
      risk: 'Even high-level positions may have other risk factors.',
      support: 'Management or self-employment demonstrates high earning capacity, professional achievement, and financial sophistication.'
    }
  },
  'purpose': {
    'car_new': {
      risk: 'New car purchases depreciate quickly and may indicate lifestyle spending beyond means.',
      support: 'A new car for reliable transportation can support employment stability and income generation.'
    },
    'car_used': {
      risk: 'Used car loans may indicate budget constraints or the vehicle may have reliability issues.',
      support: 'Choosing a used car shows financial prudence and practical decision-making.'
    },
    'furniture': {
      risk: 'Furniture purchases don\'t generate income and may indicate discretionary spending.',
      support: 'Essential furniture for a stable home environment can support overall life stability.'
    },
    'education': {
      risk: 'Education loans carry risk if the training doesn\'t lead to improved income.',
      support: 'Investment in education demonstrates forward-thinking and potential for increased earning capacity.'
    },
    'business': {
      risk: 'Business loans carry higher risk as new ventures have uncertain outcomes and income variability.',
      support: 'Entrepreneurial activity can lead to significant income growth and demonstrates ambition.'
    },
    'repairs': {
      risk: 'Needing a loan for repairs may indicate lack of emergency savings or financial planning.',
      support: 'Addressing necessary repairs shows responsible property maintenance and problem-solving.'
    }
  },
  'housing': {
    'rent': {
      risk: 'Renting provides no equity buildup and may indicate less financial stability than homeownership.',
      support: 'Renting can demonstrate flexibility and responsible housing choices within budget.'
    },
    'own': {
      risk: 'Even homeowners may face other financial challenges.',
      support: 'Homeownership demonstrates financial achievement, stability, and provides collateral value.'
    },
    'for_free': {
      risk: 'Living rent-free may indicate financial dependency or inability to afford independent housing.',
      support: 'Living arrangements without rent allow for better debt repayment capacity and savings accumulation.'
    }
  },
  'property_magnitude': {
    'real_estate': {
      risk: 'Even with real estate, other factors may present concerns.',
      support: 'Real estate ownership provides substantial collateral, demonstrates financial success, and indicates long-term stability.'
    },
    'savings_agreement': {
      risk: 'Building society savings, while positive, may not provide immediate liquidity for emergencies.',
      support: 'Life insurance or building society savings show long-term financial planning and asset accumulation.'
    },
    'car_or_other': {
      risk: 'Cars depreciate quickly and provide limited collateral value compared to real estate.',
      support: 'Owning a car or other property shows some asset accumulation and financial responsibility.'
    },
    'unknown_no_property': {
      risk: 'No known property means no collateral and may indicate limited financial resources or asset building.',
      support: 'Lack of property doesn\'t necessarily indicate poor financial management, especially for younger applicants.'
    }
  }
}

// Feature narrative explanations (fallback for features without value-specific narratives)
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

  // Try to get value-specific narrative first
  const featureKeyNormalized = featureKey.replace(/_/g, ' ')
  const valueKeyNormalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
  
  let narrativeText = ''
  
  // Check for value-specific categorical narratives
  for (const [catKey, catNarratives] of Object.entries(CATEGORICAL_VALUE_NARRATIVES)) {
    if (featureKeyNormalized.includes(catKey.replace(/_/g, ' ')) || catKey.includes(featureKey.split('_')[0])) {
      // Try exact value match
      if (catNarratives[valueKeyNormalized]) {
        narrativeText = isRisk ? catNarratives[valueKeyNormalized].risk : catNarratives[valueKeyNormalized].support
        break
      }
      // Try partial match
      for (const [valKey, valNarrative] of Object.entries(catNarratives)) {
        if (valueKeyNormalized.includes(valKey) || valKey.includes(valueKeyNormalized)) {
          narrativeText = isRisk ? valNarrative.risk : valNarrative.support
          break
        }
      }
      if (narrativeText) break
    }
  }
  
  // Fallback to feature-level narrative
  if (!narrativeText) {
    narrativeText = narrative 
      ? (isRisk ? narrative.risk : narrative.support)
      : (isRisk 
          ? 'This factor contributed to increased risk assessment.'
          : 'This factor supported a favorable assessment.')
  }

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
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        {/* Impact indicator */}
        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
          isRisk ? 'bg-red-500' : 'bg-green-500'
        }`} />

        {/* Feature name and value */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {displayName}
            </span>
            {isCreditHistory && (
              <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-gray-600 block truncate">{value}</span>
        </div>

        {/* Contribution percentage and bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Percentage */}
          <span className={`text-sm font-bold min-w-[2.5rem] text-right ${
            isRisk ? 'text-red-600' : 'text-green-600'
          }`}>
            {contributionPercent.toFixed(0)}%
          </span>
          
          {/* Tooltip */}
          <div className="hidden sm:block">
            <InfoTooltip content="How much this factor influenced the final result, relative to all other factors." />
          </div>
          
          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} className="text-gray-400" />
          </motion.div>
        </div>
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
            <div className="px-4 pb-4 pt-3 border-t border-gray-100">
              {/* Narrative explanation */}
              <div className={`p-3.5 rounded-lg mb-3 ${
                isRisk ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'
              }`}>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {narrativeText}
                </p>
              </div>

              {/* Global Distribution Visual - only for numeric features with benchmarks */}
              {benchmark && numericValue !== undefined && (
                <div className="bg-white rounded-lg border border-gray-200 p-3.5 overflow-hidden">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    How You Compare
                  </h4>
                  <div className="overflow-x-auto">
                    <GlobalDistributionLine
                      min={benchmark.min}
                      max={benchmark.max}
                      value={numericValue}
                      typicalRange={benchmark.typicalRange}
                      unit={benchmark.unit}
                      higherIsBetter={benchmark.higherIsBetter}
                    />
                  </div>
                </div>
              )}

              {/* Categorical Comparison - for categorical features */}
              {!benchmark && numericValue === undefined && (() => {
                const categoryStats = getCategoryStats(featureKey, value)
                const riskLadder = getRiskLadder(featureKey, value)
                const hasLadder = hasRiskLadder(featureKey)
                
                if (!categoryStats) return null
                
                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-3.5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      How You Compare
                    </h4>
                    
                    {/* Show Risk Ladder if available, otherwise show basic comparison */}
                    {hasLadder && riskLadder ? (
                      <RiskLadder
                        featureName={featureName}
                        steps={riskLadder}
                        userStepIndex={riskLadder.findIndex(step => step.isUserStep)}
                      />
                    ) : (
                      <CategoricalComparison
                        featureName={featureName}
                        userValue={value}
                        successRate={categoryStats.successRate}
                        frequency={categoryStats.frequency}
                        isRiskIncreasing={impact === 'positive'}
                      />
                    )}
                  </div>
                )
              })()}

              {/* Credit History Warning */}
              {isCreditHistory && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
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
