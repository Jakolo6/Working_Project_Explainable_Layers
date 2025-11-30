// ModelCertaintyExplanation.tsx - Explains what model certainty means in credit decisions
// Reusable component for all explanation layers

'use client'

import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface ModelCertaintyExplanationProps {
  probability: number
  decision: 'approved' | 'rejected'
  compact?: boolean
}

export default function ModelCertaintyExplanation({ 
  probability, 
  decision, 
  compact = false 
}: ModelCertaintyExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Calculate certainty percentage (distance from 50%)
  const certaintyPercent = Math.round(probability * 100)
  const isApproved = decision === 'approved'
  
  // Determine confidence level
  const getConfidenceLevel = () => {
    if (probability > 0.85 || probability < 0.15) return { level: 'High', color: 'text-blue-700 bg-blue-50' }
    if (probability > 0.70 || probability < 0.30) return { level: 'Moderate', color: 'text-amber-700 bg-amber-50' }
    return { level: 'Low', color: 'text-gray-600 bg-gray-100' }
  }
  
  const confidence = getConfidenceLevel()
  
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${confidence.color}`}>
          {confidence.level} certainty
        </span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
          title="What does this mean?"
        >
          <HelpCircle size={14} />
        </button>
        
        {isExpanded && (
          <div className="absolute mt-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs text-xs text-gray-600">
            <p className="mb-2">
              <strong>Model certainty ({certaintyPercent}%)</strong> shows how confidently the system 
              made this {isApproved ? 'approval' : 'rejection'} recommendation.
            </p>
            <p>
              {certaintyPercent > 70 
                ? 'This profile clearly matches patterns in the historical data.'
                : certaintyPercent > 55
                ? 'This is a moderate match to historical patterns.'
                : 'This case is borderline - the profile has mixed signals.'}
            </p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-500" />
          <span className="font-medium text-slate-700">
            What does "{certaintyPercent}% certainty" mean?
          </span>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 text-sm text-slate-600">
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-2">Understanding Model Certainty</h4>
            <p className="mb-3">
              The <strong>{certaintyPercent}%</strong> certainty score indicates how confidently the AI system 
              recommends this {isApproved ? 'approval' : 'rejection'}.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                <p>
                  <strong>High certainty (75%+):</strong> The applicant's profile clearly matches 
                  {isApproved ? ' approved ' : ' rejected '} cases in historical data.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                <p>
                  <strong>Moderate certainty (55-75%):</strong> The profile shows a reasonable match, 
                  but some factors are mixed.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
                <p>
                  <strong>Low certainty (50-55%):</strong> This is a borderline case. The profile 
                  has conflicting signals and could go either way.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-xs">
              <strong>Important:</strong> This certainty score is based on patterns in historical data 
              from 1994. It is a recommendation, not a guarantee. Always apply professional judgment 
              when making final credit decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
