'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Users } from 'lucide-react'

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
    </div>
  )
}
