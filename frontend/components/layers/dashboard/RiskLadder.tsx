'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, CheckCircle2, AlertCircle } from 'lucide-react'

interface LadderStep {
  label: string
  value: string
  successRate: number
  isUserStep: boolean
}

interface RiskLadderProps {
  featureName: string
  steps: LadderStep[]
  userStepIndex: number
}

export default function RiskLadder({
  featureName,
  steps,
  userStepIndex
}: RiskLadderProps) {
  
  const nextStepIndex = userStepIndex < steps.length - 1 ? userStepIndex + 1 : null
  const improvementPotential = nextStepIndex !== null 
    ? steps[nextStepIndex].successRate - steps[userStepIndex].successRate 
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          Risk Progression Ladder
        </h4>
        {nextStepIndex !== null && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            +{improvementPotential}% to next level
          </span>
        )}
      </div>

      {/* Ladder Steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isUserStep = idx === userStepIndex
          const isPassed = idx < userStepIndex
          const isFuture = idx > userStepIndex
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                isUserStep 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-md' 
                  : isPassed
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Step Number/Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                isUserStep 
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                  : isPassed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {isPassed ? (
                  <CheckCircle2 size={20} />
                ) : isUserStep ? (
                  <span className="text-lg">👤</span>
                ) : (
                  <ArrowUp size={20} />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    isUserStep ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    {step.label}
                  </span>
                  <span className={`text-sm font-bold ${
                    step.successRate >= 75 ? 'text-green-600' :
                    step.successRate >= 50 ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {step.successRate}% success
                  </span>
                </div>
                
                {isUserStep && (
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    ← You are here
                  </p>
                )}
                
                {isFuture && idx === userStepIndex + 1 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Next level: Improve by {improvementPotential}%
                  </p>
                )}
              </div>

              {/* Success Rate Bar */}
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${step.successRate}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                  className={`h-full rounded-full ${
                    step.successRate >= 75 ? 'bg-green-500' :
                    step.successRate >= 50 ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Improvement Suggestion */}
      {nextStepIndex !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-800">
              <strong>Improvement Tip:</strong> Moving from "{steps[userStepIndex].label}" to 
              "{steps[nextStepIndex].label}" could increase your approval chances by approximately{' '}
              <strong>{improvementPotential}%</strong>.
            </p>
          </div>
        </div>
      )}

      {userStepIndex === steps.length - 1 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-green-800">
              <strong>Excellent!</strong> You're at the highest level for this category.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
