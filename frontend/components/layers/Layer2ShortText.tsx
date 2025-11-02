// Layer 2: Short Text - GPT-4 generated natural language explanation

'use client'

import React, { useState, useEffect } from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer2ShortTextProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

export default function Layer2ShortText({ decision, probability, shapFeatures }: Layer2ShortTextProps) {
  // Get top 3 features
  const top3Features = shapFeatures.slice(0, 3)
  const [gptExplanation, setGptExplanation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [useFallback, setUseFallback] = useState(false)
  
  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/api/v1/experiment/generate_explanation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decision,
            probability,
            top_features: top3Features
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate explanation')
        }
        
        const data = await response.json()
        setGptExplanation(data.explanation)
        setUseFallback(!data.success)
      } catch (error) {
        console.error('Error fetching GPT explanation:', error)
        // Fallback explanation
        const fallback = `The decision was based on the applicant's ${top3Features.map(f => f.feature.toLowerCase()).join(', ')}.`
        setGptExplanation(fallback)
        setUseFallback(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (top3Features.length > 0) {
      fetchExplanation()
    }
  }, [decision, probability, top3Features])
  
  if (top3Features.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
          isApproved ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isApproved ? '✓' : '✗'}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Layer 2: Natural Language Explanation
          </h3>
          <p className="text-gray-600">AI-generated summary of top 3 factors</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💬</div>
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-600">Generating explanation...</p>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-gray-800">
                {gptExplanation}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Key Factors Breakdown:</h4>
        <div className="space-y-3">
          {top3Features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                feature.impact === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{feature.feature}</p>
                <p className="text-sm text-gray-600">
                  Value: <span className="font-mono bg-white px-2 py-0.5 rounded">{feature.value}</span>
                  {' • '}
                  Impact: <span className={feature.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                    {feature.impact === 'positive' ? 'Increases' : 'Decreases'} approval likelihood
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>💡 About this explanation:</strong> This natural language summary was {useFallback ? 'generated' : 'created by AI'} to translate the 
          mathematical decision into plain English. It focuses on the three most important factors and 
          explains how they contributed to the{' '}
          <span className={isApproved ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
            {decision}
          </span>{' '}
          decision.
        </p>
      </div>
    </div>
  )
}
