// GlobalModelExplanation.tsx - Visual-first explanation with reduced cognitive load
// Simple bar chart + scannable pattern boxes for quick understanding

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface GlobalModelExplanationProps {
  defaultExpanded?: boolean
}

// Dummy data for top factors
const TOP_FACTORS = [
  { name: 'Checking Account', percentage: 35 },
  { name: 'Duration', percentage: 20 },
  { name: 'Savings Account', percentage: 15 },
  { name: 'Loan Purpose', percentage: 15 },
  { name: 'Monthly Burden', percentage: 10 },
]

// Approval patterns (green box)
const APPROVAL_PATTERNS = [
  { label: 'Stable Checking', rule: '> €200 balance maintained' },
  { label: 'Long Employment', rule: '> 4 years at current job' },
  { label: 'Financial Buffer', rule: 'Savings account exists (> €100)' },
  { label: 'Short Duration', rule: 'Loan term < 24 months' },
]

// Risk patterns (orange box)
const RISK_PATTERNS = [
  { label: 'Account Issues', rule: 'Negative balance or no checking account' },
  { label: 'Unstable Job', rule: 'Unemployed or < 1 year tenure' },
  { label: 'No Buffer', rule: 'No savings available' },
  { label: 'Long Duration', rule: 'Loan term > 36 months' },
]

export default function GlobalModelExplanation({ defaultExpanded = false }: GlobalModelExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

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
              Key patterns the model looks for
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
          <p className="text-sm text-slate-600">
            <span className="font-medium text-blue-800">Quick summary:</span>{' '}
            The model focuses on {TOP_FACTORS.slice(0, 3).map(f => f.name).join(', ')}.
            Click to learn more about the key patterns.
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-x border-b border-blue-200 rounded-b-xl shadow-sm p-6 space-y-6"
        >
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 1: THE BIG PICTURE - Horizontal Bar Chart
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              Top 5 Factors Influencing Decisions
            </h4>
            <div className="space-y-3">
              {TOP_FACTORS.map((factor, idx) => (
                <motion.div
                  key={factor.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-3"
                >
                  {/* Feature Label */}
                  <div className="w-40 text-sm font-medium text-gray-700 text-right">
                    {factor.name}
                  </div>
                  
                  {/* Bar Container */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.percentage * 2}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2"
                      >
                        <span className="text-white text-xs font-semibold">
                          {factor.percentage}%
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: THE LOGIC - Two Pattern Boxes
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Green Box - Approval Patterns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✅</span>
                <h5 className="font-bold text-green-800 text-lg">
                  Patterns that Support Approval
                </h5>
              </div>
              <div className="space-y-3">
                {APPROVAL_PATTERNS.map((pattern, idx) => (
                  <motion.div
                    key={pattern.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <strong className="text-green-800">{pattern.label}:</strong>{' '}
                      {pattern.rule}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Orange Box - Risk Patterns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <h5 className="font-bold text-orange-800 text-lg">
                  Patterns that Increase Risk
                </h5>
              </div>
              <div className="space-y-3">
                {RISK_PATTERNS.map((pattern, idx) => (
                  <motion.div
                    key={pattern.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <strong className="text-orange-800">{pattern.label}:</strong>{' '}
                      {pattern.rule}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> This model uses patterns from 1994 German banking data. 
              Some patterns (especially credit history) may appear counterintuitive due to historical selection bias.
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
