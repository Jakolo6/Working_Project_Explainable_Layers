'use client'

import React, { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  content: string
  size?: number
}

export default function InfoTooltip({ content, size = 14 }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label="More information"
      >
        <Info size={size} />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs whitespace-normal">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}

// Predefined tooltips for common terms
export const TOOLTIPS = {
  modelConfidence: "How certain the AI is about this specific decision. Higher percentages indicate stronger confidence.",
  impactPercent: "How much this specific factor influenced the final result, relative to all other factors analyzed.",
  riskDrivers: "Factors that increased the perceived risk of default. These pushed the decision toward rejection.",
  strengths: "Factors that supported approval. These reduced the perceived risk of default.",
  typicalRange: "The range of values typically seen in approved applications from the historical dataset.",
  shapValue: "A measure of how much this factor pushed the prediction toward approval (negative) or rejection (positive).",
  interestRate: "Your personalized APR is calculated from your risk profile: Base Rate (4.5%) + Risk Adjustment. Lower default risk = lower rate.",
  defaultRisk: "The estimated probability that this applicant would fail to repay the loan, based on the model's analysis.",
}
