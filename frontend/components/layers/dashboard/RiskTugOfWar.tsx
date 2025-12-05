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
    <div className="w-full">
      {/* Tug of War Visual */}
      <div className="relative py-8 px-4">
        {/* Central axis line - constrained width */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[calc(100%-120px)] h-1 bg-gray-200 rounded-full" />

        {/* Risk side (Left - Red) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalizedRisk}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 left-[60px] h-4 bg-gradient-to-l from-red-400 to-red-600 rounded-l-full transform -translate-y-1/2"
          style={{ 
            transformOrigin: 'right',
            maxWidth: 'calc(50% - 50px)'
          }}
        />

        {/* Support side (Right - Green) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalizedSupport}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 right-[60px] h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-r-full transform -translate-y-1/2"
          style={{ 
            transformOrigin: 'left',
            maxWidth: 'calc(50% - 50px)'
          }}
        />

        {/* Center pivot point with probability gauge */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${
              isApproved 
                ? 'bg-gradient-to-br from-green-100 via-green-50 to-white ring-4 ring-green-400/50' 
                : 'bg-gradient-to-br from-red-100 via-red-50 to-white ring-4 ring-red-400/50'
            }`}
          >
            <div className="text-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`text-2xl font-bold ${isApproved ? 'text-green-700' : 'text-red-700'}`}
              >
                {confidencePercent}%
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* Arrow indicators */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute top-1/2 left-4 transform -translate-y-1/2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute top-1/2 right-4 transform -translate-y-1/2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-500">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Labels */}
      <div className="flex justify-between items-start mt-2 px-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-left flex-1"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-red-700">Risk Drivers</span>
          </div>
          <span className="text-xl font-bold text-red-600 block">{Math.round(normalizedRisk)}%</span>
          <p className="text-xs text-gray-500">of total influence</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-right flex-1"
        >
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs font-semibold text-green-700">Strengths</span>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
          </div>
          <span className="text-xl font-bold text-green-600 block">{Math.round(normalizedSupport)}%</span>
          <p className="text-xs text-gray-500">of total influence</p>
        </motion.div>
      </div>
    </div>
  )
}
