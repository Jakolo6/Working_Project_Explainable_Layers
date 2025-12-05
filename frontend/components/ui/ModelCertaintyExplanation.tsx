// ModelCertaintyExplanation.tsx - Explains what model certainty means in credit decisions
// Reusable component for all explanation layers
// IMPORTANT: probability = confidence = max(P(good), P(bad)) from the model
// Decision rule: if P(bad) > 0.5 → rejected, else → approved

'use client'

import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface ModelCertaintyExplanationProps {
  probability: number  // This is actually "confidence" = max(P(good), P(bad))
  decision: 'approved' | 'rejected'
  compact?: boolean
}

export default function ModelCertaintyExplanation({ 
  probability, 
  decision, 
  compact = false 
}: ModelCertaintyExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // The probability passed is the model's confidence (max of the two class probabilities)
  const confidencePercent = Math.round(probability * 100)
  const isApproved = decision === 'approved'
  
  // Determine confidence level based on how far from 50% the decision is
  const getConfidenceLevel = () => {
    if (probability >= 0.80) return { level: 'High', color: 'text-blue-700 bg-blue-50' }
    if (probability >= 0.65) return { level: 'Moderate', color: 'text-amber-700 bg-amber-50' }
    return { level: 'Low', color: 'text-gray-600 bg-gray-100' }
  }
  
  const confidence = getConfidenceLevel()
  
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${confidence.color}`}>
          {confidence.level} confidence
        </span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-600"
          title="What does this mean?"
        >
          <HelpCircle size={14} />
        </button>
        
        {isExpanded && (
          <div className="absolute mt-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs text-xs text-gray-600">
            <p className="mb-2">
              <strong>Model confidence ({confidencePercent}%)</strong> shows how certain the system 
              is about this {isApproved ? 'approval' : 'rejection'} recommendation.
            </p>
            <p>
              {confidencePercent >= 80 
                ? 'This profile clearly matches patterns in the historical data.'
                : confidencePercent >= 65
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
          <HelpCircle size={18} className="text-slate-600" />
          <span className="font-medium text-slate-700">
            What does "{confidencePercent}% confidence" mean?
          </span>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-600" />}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 text-sm text-slate-600">
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-2">Understanding Model Confidence</h4>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-blue-900">
                <strong>{confidencePercent}%</strong> = The model is {confidencePercent}% confident that 
                this applicant should be <strong>{isApproved ? 'APPROVED' : 'REJECTED'}</strong>.
              </p>
              <p className="text-blue-700 text-xs mt-1">
                {isApproved 
                  ? 'Lower percentages (closer to 50%) mean the decision is less certain.'
                  : 'Lower percentages (closer to 50%) mean the decision is less certain.'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                <p>
                  <strong>High confidence (80%+):</strong> The applicant's profile clearly matches 
                  {isApproved ? ' approved ' : ' rejected '} cases in historical data.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                <p>
                  <strong>Moderate confidence (65-80%):</strong> The profile shows a reasonable match, 
                  but some factors are mixed.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
                <p>
                  <strong>Low confidence (50-65%):</strong> This is a borderline case. The profile 
                  has conflicting signals and could go either way.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-xs">
              <strong>Important:</strong> This confidence score is based on patterns in historical data 
              from 1994. It is a recommendation, not a guarantee. Always apply professional judgment 
              when making final credit decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
