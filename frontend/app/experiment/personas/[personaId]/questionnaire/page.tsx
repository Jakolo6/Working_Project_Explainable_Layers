// Per-persona post-questionnaire page
// Shown after completing all 4 layers for a persona
// Updated: 2025-12-02

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPersona, type PersonaInfo } from '@/lib/personas'

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function PersonaQuestionnairePage() {
  const params = useParams()
  const router = useRouter()
  const personaId = params.personaId as string
  
  const [persona, setPersona] = useState<PersonaInfo | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [responses, setResponses] = useState({
    most_helpful_layer: '',
    most_trusted_layer: '',
    best_for_customer: '',
    overall_intuitiveness: 0,
    ai_usefulness: 0,
    improvement_suggestions: ''
  })

  useEffect(() => {
    // Load persona
    const personaData = getPersona(personaId)
    if (!personaData) {
      router.push('/experiment/personas')
      return
    }
    setPersona(personaData)
    
    // Get session ID
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!storedSessionId) {
      router.push('/experiment/start')
      return
    }
    setSessionId(storedSessionId)
  }, [personaId, router])

  const handleResponseChange = (field: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!responses.most_helpful_layer || !responses.most_trusted_layer || 
        !responses.best_for_customer || responses.overall_intuitiveness === 0 ||
        responses.ai_usefulness === 0) {
      setError('Please answer all required questions')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/experiment/post-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          persona_id: personaId,
          ...responses
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit questionnaire')
      }

      // Mark persona as completed
      localStorage.setItem(`completed_${personaId}`, 'true')
      
      // Navigate back to persona hub
      router.push('/experiment/personas')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit questionnaire')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!persona || !sessionId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Questionnaire for {persona.name}
          </h1>
          <p className="text-gray-600">
            You've completed all explanation layers for {persona.name}. Please share your experience with this persona.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Question 1: Most Helpful Layer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. Which explanation layer was the most helpful for understanding {persona.name}'s decision? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'layer_1', label: 'Layer 1: Baseline SHAP Explanation (technical table)' },
                  { value: 'layer_2', label: 'Layer 2: Interactive Dashboard (visual charts)' },
                  { value: 'layer_3', label: 'Layer 3: Narrative Explanation (natural language + chatbot)' },
                  { value: 'layer_4', label: 'Layer 4: Counterfactual Analysis (what-if scenarios)' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="most_helpful_layer"
                      value={option.value}
                      checked={responses.most_helpful_layer === option.value}
                      onChange={(e) => handleResponseChange('most_helpful_layer', e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 2: Most Trusted Layer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. Which explanation layer did you trust the most for {persona.name}'s case? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'layer_1', label: 'Layer 1: Baseline SHAP Explanation' },
                  { value: 'layer_2', label: 'Layer 2: Interactive Dashboard' },
                  { value: 'layer_3', label: 'Layer 3: Narrative Explanation' },
                  { value: 'layer_4', label: 'Layer 4: Counterfactual Analysis' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="most_trusted_layer"
                      value={option.value}
                      checked={responses.most_trusted_layer === option.value}
                      onChange={(e) => handleResponseChange('most_trusted_layer', e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: Best for Customer Communication */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                3. Which explanation layer would be most suitable for explaining the decision to {persona.name}? *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'layer_1', label: 'Layer 1: Baseline SHAP Explanation' },
                  { value: 'layer_2', label: 'Layer 2: Interactive Dashboard' },
                  { value: 'layer_3', label: 'Layer 3: Narrative Explanation' },
                  { value: 'layer_4', label: 'Layer 4: Counterfactual Analysis' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="best_for_customer"
                      value={option.value}
                      checked={responses.best_for_customer === option.value}
                      onChange={(e) => handleResponseChange('best_for_customer', e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 4: Overall Intuitiveness */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                4. How intuitive were the explanations for {persona.name}'s case? *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleResponseChange('overall_intuitiveness', value)}
                    className={`flex-1 py-3 rounded-lg border-2 transition ${
                      responses.overall_intuitiveness === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>Not intuitive at all</span>
                <span>Very intuitive</span>
              </div>
            </div>

            {/* Question 5: AI Usefulness */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                5. How useful would this AI explanation system be for handling cases like {persona.name}'s? *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleResponseChange('ai_usefulness', value)}
                    className={`flex-1 py-3 rounded-lg border-2 transition ${
                      responses.ai_usefulness === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>Not useful at all</span>
                <span>Extremely useful</span>
              </div>
            </div>

            {/* Question 6: Improvement Suggestions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                6. Any suggestions for improving the explanations for this type of applicant? (Optional)
              </label>
              <textarea
                value={responses.improvement_suggestions}
                onChange={(e) => handleResponseChange('improvement_suggestions', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="Share your suggestions..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-8 bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Complete & Continue to Next Persona →'}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            * Required questions
          </p>
        </div>
      </div>
    </main>
  )
}
