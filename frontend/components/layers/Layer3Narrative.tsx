// Layer 3: Narrative LLM Explanation - Natural language combining global + local SHAP

'use client'

import React, { useState, useEffect } from 'react'
import CreditHistoryWarning, { isCreditHistoryFeature } from '@/components/CreditHistoryWarning'
import ExplanationChatbot from '@/components/ExplanationChatbot'
import DecisionHeader from './DecisionHeader'

// Global cache for narrative responses to prevent duplicate API calls
const narrativeCache = new Map<string, { narrative: string; is_llm_generated: boolean }>()

// Global set to track in-flight requests (deduplication)
const inflightRequests = new Map<string, Promise<any>>()

// Interface for SHAP feature data
interface SHAPFeature {
  // Feature name (e.g. 'Credit Score')
  feature: string
  // Feature value (e.g. '720')
  value: string
  // SHAP value (impact on model output)
  shap_value: number
  // 'positive' = increases default risk (bad for applicant) = RED
  // 'negative' = decreases default risk (good for applicant) = GREEN
  impact: 'positive' | 'negative'
}

// Props for Layer3Narrative component
interface Layer3NarrativeProps {
  // Decision outcome ('approved' or 'rejected')
  decision: 'approved' | 'rejected'
  // Model confidence (probability of decision)
  probability: number
  // Array of SHAP feature data
  shapFeatures: SHAPFeature[]
}

export default function Layer3Narrative({ decision, probability, shapFeatures }: Layer3NarrativeProps) {
  const top5Features = shapFeatures.slice(0, 5)
  const [narrative, setNarrative] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLLMGenerated, setIsLLMGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if any credit_history features are in the top features
  const hasCreditHistoryFeature = top5Features.some(f => isCreditHistoryFeature(f.feature))
  
  // Generate cache key from request data
  const getCacheKey = () => {
    return JSON.stringify({
      decision,
      probability: probability.toFixed(4), // Round to avoid float precision issues
      features: top5Features.map(f => ({ feature: f.feature, value: f.value }))
    })
  }
  
  useEffect(() => {
    const fetchNarrative = async () => {
      if (shapFeatures.length === 0) return
      
      const cacheKey = getCacheKey()
      
      // 1. CHECK CACHE FIRST
      const cached = narrativeCache.get(cacheKey)
      if (cached) {
        console.log('[Layer3] Using cached narrative')
        setNarrative(cached.narrative)
        setIsLLMGenerated(cached.is_llm_generated)
        setIsLoading(false)
        return
      }
      
      // 2. CHECK IF REQUEST ALREADY IN-FLIGHT (DEDUPLICATION)
      const existingRequest = inflightRequests.get(cacheKey)
      if (existingRequest) {
        console.log('[Layer3] Reusing in-flight request')
        try {
          const data = await existingRequest
          setNarrative(data.narrative)
          setIsLLMGenerated(data.is_llm_generated || false)
          setIsLoading(false)
          return
        } catch (err) {
          // If the in-flight request failed, we'll make a new one below
          console.warn('[Layer3] In-flight request failed, retrying')
        }
      }
      
      // 3. MAKE NEW REQUEST
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        
        console.log('[Layer3] Fetching new narrative from API')
        
        // Create the fetch promise WITHOUT abort signal (let it complete naturally)
        const fetchPromise = fetch(`${apiUrl}/api/v1/explanations/level2/narrative`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            probability,
            shap_features: top5Features,
            all_features: shapFeatures
          })
          // NO signal - let request complete even if component re-renders
        }).then(async (response) => {
          if (response.ok) {
            return await response.json()
          } else {
            throw new Error(`API returned ${response.status}`)
          }
        })
        
        // Store in-flight request for deduplication
        inflightRequests.set(cacheKey, fetchPromise)
        
        // Wait for response
        const data = await fetchPromise
        
        // Cache the response
        narrativeCache.set(cacheKey, {
          narrative: data.narrative,
          is_llm_generated: data.is_llm_generated || false
        })
        
        // Update state
        setNarrative(data.narrative)
        setIsLLMGenerated(data.is_llm_generated || false)
        setError(null)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate narrative'
        console.error('[ERROR] Narrative API error:', errorMessage)
        setError(errorMessage)
        setNarrative('')
        setIsLLMGenerated(false)
      } finally {
        // Clean up in-flight request
        inflightRequests.delete(cacheKey)
        setIsLoading(false)
      }
    }
    
    fetchNarrative()
  }, [decision, probability, shapFeatures])
  
  if (shapFeatures.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'

  // Parse markdown-like formatting in narrative
  const formatNarrative = (text: string) => {
    return text.split('\n\n').map((paragraph, idx) => {
      // Handle bold markers
      const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <p 
          key={idx} 
          className="mb-3 last:mb-0"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Decision Header with Interest Rate */}
      <DecisionHeader decision={decision} probability={probability} />
      
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            isApproved ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isApproved ? '✓' : '✗'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Narrative Explanation
            </h3>
            <p className="text-gray-600">
              {isLLMGenerated ? 'AI-generated' : 'Structured'} natural language summary
            </p>
          </div>
        </div>

        {/* Main Narrative */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-r-lg mb-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📝</div>
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600">Generating narrative explanation...</p>
                </div>
              ) : error ? (
                <div className="text-red-700">
                  <p className="font-semibold mb-2">⚠️ Failed to Generate Narrative</p>
                  <p className="text-sm">{error}</p>
                  <p className="text-xs text-red-500 mt-2">The backend narrative API must be running and accessible.</p>
                </div>
              ) : narrative ? (
                <div className="text-gray-800 leading-relaxed">
                  {formatNarrative(narrative)}
                </div>
              ) : (
                <p className="text-gray-600">No narrative available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Features Table */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            📊 Top 5 Contributing Factors
          </h4>
          <div className="grid gap-2">
            {top5Features.map((feature, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  feature.impact === 'positive' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    feature.impact === 'positive' 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className={`font-medium ${isCreditHistoryFeature(feature.feature) ? 'text-amber-700' : 'text-slate-800'}`}>
                      {feature.feature}
                      {isCreditHistoryFeature(feature.feature) && <span className="ml-1 text-amber-600">⚠</span>}
                    </span>
                    <span className="text-slate-600 text-sm ml-2">= {feature.value}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono ${
                    feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    feature.impact === 'positive' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {feature.impact === 'positive' ? '↑ Risk' : '↓ Risk'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit History Warning - if applicable */}
        {hasCreditHistoryFeature && (
          <div className="mb-6">
            <CreditHistoryWarning compact={true} />
          </div>
        )}

        {/* Footer Note */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <p className="text-sm text-blue-800">
              <strong>About this explanation:</strong> This narrative combines global model patterns with 
              applicant-specific SHAP values to explain why the AI made this decision. 
              {isLLMGenerated 
                ? ' The text was generated by an AI language model and is faithful to the underlying SHAP analysis.'
                : ' The text is based on structured templates derived from the SHAP analysis.'
              }
            </p>
          </div>
        </div>

        {/* Interactive Chatbot */}
        <ExplanationChatbot
          decision={decision}
          probability={probability}
          shapFeatures={shapFeatures}
        />
      </div>
    </div>
  )
}
