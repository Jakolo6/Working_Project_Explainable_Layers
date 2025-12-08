// Reusable Decision Header with Risk Assessment
// Shows Interest Rate for approved, Risk Band for rejected

'use client'

import React, { useState } from 'react'
import { Info } from 'lucide-react'
import { getAssessmentDisplay } from '@/lib/riskAssessment'

interface DecisionHeaderProps {
  decision: 'approved' | 'rejected'
  probability: number
}

export default function DecisionHeader({ decision, probability }: DecisionHeaderProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isApproved = decision === 'approved'
  const assessment = getAssessmentDisplay(decision, probability)

  return (
    <div className={`p-6 rounded-lg border-2 ${
      isApproved 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        {/* Left: Decision */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Decision: <span className={isApproved ? 'text-green-700' : 'text-red-700'}>
              {decision.toUpperCase()}
            </span>
          </h2>
        </div>

        {/* Right: Assessment (Interest Rate or Risk Band) */}
        <div className="text-right relative">
          <div className="flex items-center justify-end gap-2 mb-1">
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              {assessment.label}
            </div>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="More information"
            >
              <Info size={16} />
            </button>
          </div>
          
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 z-50 w-64">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                {assessment.tooltip}
                <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
              </div>
            </div>
          )}
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${assessment.bgColor}`}>
            <span className={`text-2xl font-bold ${assessment.color}`}>
              {assessment.value}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {isApproved ? 'Based on risk assessment' : 'Credit risk level'}
          </p>
        </div>
      </div>

      {/* Contextual Message */}
      <div className={`pt-4 border-t ${
        isApproved ? 'border-green-200' : 'border-red-200'
      }`}>
        <p className={`text-sm ${
          isApproved ? 'text-green-800' : 'text-red-800'
        }`}>
          {isApproved ? (
            <>
              <strong>Credit offer available.</strong> The applicant meets our lending criteria. 
              Review the supportive factors below to understand what drove this positive assessment.
            </>
          ) : (
            <>
              <strong>No credit offer available.</strong> The risk factors identified exceed our lending threshold. 
              Review the concerns below to understand what drove this assessment.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
