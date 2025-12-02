// Simple SHAP explanation component - easy to understand version
// Used across all layers that display SHAP values

'use client'

import React from 'react'
import { Info } from 'lucide-react'

interface SHAPExplanationProps {
  compact?: boolean
}

export default function SHAPExplanation({ compact = false }: SHAPExplanationProps) {
  if (compact) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-blue-800">
            <strong>SHAP values</strong> show how much each factor pushed the decision toward approval or rejection. 
            <span className="text-green-600 font-medium"> Green = helps approval</span>, 
            <span className="text-red-600 font-medium"> Red = raises concerns</span>.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-blue-900 mb-2">What are SHAP Values?</h4>
          <p className="text-sm text-blue-800 mb-2">
            SHAP values explain <strong>how much each factor influenced</strong> the AI's decision. 
            Think of it like a scorecard showing what helped and what hurt the application.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span className="text-gray-700"><strong className="text-green-700">Negative SHAP</strong> = Supports approval</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              <span className="text-gray-700"><strong className="text-red-700">Positive SHAP</strong> = Raises concerns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
