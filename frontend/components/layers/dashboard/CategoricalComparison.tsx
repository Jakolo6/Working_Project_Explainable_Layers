'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Users, ArrowUp, ArrowDown } from 'lucide-react'
import { CATEGORICAL_STATS } from '@/lib/categoricalMetadata'

interface CategoricalComparisonProps {
  featureName: string
  userValue: string
  successRate: number  // 0-100: Historical approval rate for this category
  frequency: number    // 0-100: How common is this choice
  isRiskIncreasing: boolean
}

export default function CategoricalComparison({
  featureName,
  userValue,
  successRate,
  frequency,
  isRiskIncreasing
}: CategoricalComparisonProps) {
  
  // Get comparison data for this feature
  const getComparisonData = () => {
    const featureKey = featureName.toLowerCase().replace(/[^a-z_]/g, '_').replace(/_+/g, '_')
    const featureStats = CATEGORICAL_STATS[featureKey]
    
    if (!featureStats) return null
    
    // Find best performing alternative (excluding user's current value)
    const valueKey = userValue.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_')
    let bestAlternative: { label: string; rate: number; isCommon: boolean } | null = null
    let bestRate = 0
    
    for (const [key, stats] of Object.entries(featureStats)) {
      if (key !== valueKey && stats.successRate > bestRate) {
        bestRate = stats.successRate
        bestAlternative = {
          label: formatCategoryLabel(key),
          rate: stats.successRate,
          isCommon: stats.frequency >= 20
        }
      }
    }
    
    if (!bestAlternative) return null
    
    const rateDiff = bestAlternative.rate - successRate
    const isUserBetter = successRate >= bestAlternative.rate
    
    return {
      alternative: bestAlternative,
      rateDiff: Math.abs(rateDiff),
      isUserBetter
    }
  }
  
  const formatCategoryLabel = (key: string): string => {
    // Convert snake_case to readable format
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/Dm/g, 'DM')
      .replace(/Lt/g, '<')
      .replace(/Ge/g, '≥')
  }
  
  const comparisonData = getComparisonData()
  
  // Determine color based on success rate
  const getSuccessColor = (rate: number) => {
    if (rate >= 75) return 'green'
    if (rate >= 50) return 'blue'
    return 'orange'
  }

  const color = getSuccessColor(successRate)
  
  return (
    <div className="space-y-4">
      {/* Success Rate Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {isRiskIncreasing ? (
              <TrendingDown className="text-red-500" size={16} />
            ) : (
              <TrendingUp className="text-green-500" size={16} />
            )}
            Historical Success Rate
          </h4>
          <span className={`text-lg font-bold ${
            color === 'green' ? 'text-green-700' :
            color === 'blue' ? 'text-blue-700' :
            'text-orange-700'
          }`}>
            {successRate}%
          </span>
        </div>

        {/* Success Rate Bar */}
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              color === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' :
              color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">
              {successRate}% of applicants with "{userValue}" were approved
            </span>
          </div>
        </div>

        {/* Interpretation */}
        <p className="text-xs text-gray-600 mt-2">
          {successRate >= 75 ? (
            <span className="text-green-700">
              ✓ <strong>Strong category.</strong> This choice historically shows high approval rates.
            </span>
          ) : successRate >= 50 ? (
            <span className="text-blue-700">
              → <strong>Moderate category.</strong> This choice has average approval rates.
            </span>
          ) : (
            <span className="text-orange-700">
              ⚠ <strong>Challenging category.</strong> This choice historically shows lower approval rates.
            </span>
          )}
        </p>
      </div>

      {/* Frequency/Social Proof */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-slate-600" size={16} />
            <span className="text-sm text-gray-700">How common is this choice?</span>
          </div>
          <span className="text-sm font-semibold text-slate-700">{frequency}% of applicants</span>
        </div>
        
        {/* Frequency Bar */}
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${frequency}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full"
          />
        </div>
        
        <p className="text-xs text-gray-600 mt-1">
          {frequency >= 30 ? (
            <span>Very common choice among applicants</span>
          ) : frequency >= 10 ? (
            <span>Moderately common choice</span>
          ) : (
            <span>Less common choice</span>
          )}
        </p>
      </div>

      {/* Compact Contrastive Comparison */}
      {comparisonData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`rounded-lg p-3 border-2 ${
            comparisonData.isUserBetter 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Your Category */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Choice</span>
                {comparisonData.isUserBetter && (
                  <ArrowUp className="text-green-600" size={14} />
                )}
              </div>
              <div className="text-sm font-bold text-gray-900 truncate">{userValue}</div>
              <div className={`text-xs font-semibold mt-0.5 ${
                color === 'green' ? 'text-green-700' :
                color === 'blue' ? 'text-blue-700' :
                'text-orange-700'
              }`}>
                {successRate}% approval
              </div>
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center px-2">
              <div className="text-xs text-gray-400 font-medium">vs</div>
              {!comparisonData.isUserBetter && (
                <ArrowDown className="text-amber-600 mt-1" size={14} />
              )}
            </div>

            {/* Alternative Category */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {comparisonData.isUserBetter ? 'Alternative' : 'Better Option'}
                </span>
                {!comparisonData.isUserBetter && (
                  <ArrowUp className="text-green-600" size={14} />
                )}
              </div>
              <div className="text-sm font-bold text-gray-900 truncate">{comparisonData.alternative.label}</div>
              <div className="text-xs font-semibold text-green-700 mt-0.5">
                {comparisonData.alternative.rate}% approval
                {!comparisonData.isUserBetter && (
                  <span className="text-gray-600 ml-1">(+{comparisonData.rateDiff}%)</span>
                )}
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className={`mt-2 pt-2 border-t text-xs ${
            comparisonData.isUserBetter 
              ? 'border-green-200 text-green-800' 
              : 'border-amber-200 text-amber-800'
          }`}>
            {comparisonData.isUserBetter ? (
              <span>✓ Your choice performs {comparisonData.rateDiff > 5 ? 'significantly' : 'slightly'} better than alternatives</span>
            ) : (
              <span>
                ⚠ Switching to "{comparisonData.alternative.label}" could improve approval odds by {comparisonData.rateDiff}%
                {comparisonData.alternative.isCommon && ' (common choice)'}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
