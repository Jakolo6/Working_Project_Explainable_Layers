'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface RiskTugOfWarProps {
  riskPercent: number      // Aggregate % of all concerns
  supportPercent: number   // Aggregate % of all supportive factors
  probability: number      // Model confidence (0-1)
  decision: 'approved' | 'rejected'
}

export default function RiskTugOfWar({
  riskPercent,
  supportPercent,
  probability,
  decision
}: RiskTugOfWarProps) {
  const confidencePercent = Math.round(probability * 100)
  const isApproved = decision === 'approved'

  // Normalize percentages to ensure they sum to 100
  const total = riskPercent + supportPercent
  const normalizedRisk = total > 0 ? (riskPercent / total) * 100 : 50
  const normalizedSupport = total > 0 ? (supportPercent / total) * 100 : 50

  return (
    <div className="w-full space-y-4">
      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
        <p>
          <strong>Factor Balance:</strong> This shows how positive and negative factors contributed to the decision. 
          The model confidence ({confidencePercent}%) reflects the overall certainty of the {decision} decision.
        </p>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {/* Risk Drivers Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-700">Risk Drivers</span>
            </div>
            <span className="text-lg font-bold text-red-600">{Math.round(normalizedRisk)}%</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${normalizedRisk}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-700 mt-1">Factors increasing default risk</p>
        </div>

        {/* Strengths Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-700">Strengths</span>
            </div>
            <span className="text-lg font-bold text-green-600">{Math.round(normalizedSupport)}%</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${normalizedSupport}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-700 mt-1">Factors reducing default risk</p>
        </div>
      </div>
    </div>
  )
}
