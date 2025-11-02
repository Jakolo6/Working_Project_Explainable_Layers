// Post-experiment questionnaire and completion page

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function CompletePage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const [responses, setResponses] = useState({
    overall_experience: 0,
    explanation_helpfulness: 0,
    preferred_layer: '',
    would_trust_ai: 0,
    comments: ''
  })

  useEffect(() => {
    // Get session ID
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!storedSessionId) {
      router.push('/experiment')
      return
    }
    setSessionId(storedSessionId)
  }, [router])

  const handleResponseChange = (field: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (responses.overall_experience === 0 || responses.explanation_helpfulness === 0 || 
        responses.would_trust_ai === 0 || !responses.preferred_layer) {
      setError('Please answer all required questions')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/experiment/submit_post_questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          ...responses
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit questionnaire')
      }

      setSubmitted(true)
      
      // Clear session data
      localStorage.removeItem(SESSION_STORAGE_KEY)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit questionnaire')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Participating!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your responses have been recorded successfully. Your contribution to this research 
              on explainable AI in financial decision-making is greatly appreciated.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">
                <strong>What happens next:</strong> Your anonymous data will be analyzed alongside 
                other participants' responses to understand how different explanation styles affect 
                trust and understanding of AI decisions in credit risk assessment.
              </p>
            </div>
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post-Experiment Questionnaire
          </h1>
          <p className="text-gray-600">
            You've completed all three personas! Please share your overall experience.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Question 1: Overall Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. How would you rate your overall experience with this study? *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleResponseChange('overall_experience', value)}
                    className={`flex-1 py-3 rounded-lg border-2 transition ${
                      responses.overall_experience === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>Very poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Question 2: Explanation Helpfulness */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. How helpful were the different explanation styles in understanding the AI decisions? *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleResponseChange('explanation_helpfulness', value)}
                    className={`flex-1 py-3 rounded-lg border-2 transition ${
                      responses.explanation_helpfulness === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>Not helpful</span>
                <span>Very helpful</span>
              </div>
            </div>

            {/* Question 3: Preferred Layer */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                3. Which explanation style did you find most useful? *
              </label>
              <select
                value={responses.preferred_layer}
                onChange={(e) => handleResponseChange('preferred_layer', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select an explanation style...</option>
                <option value="Minimal">Minimal (single key factor)</option>
                <option value="Feature Importance">Feature Importance (natural language summary)</option>
                <option value="Detailed SHAP">Detailed SHAP (visual bar chart)</option>
                <option value="Visual">Visual (contextual benchmarking)</option>
                <option value="Counterfactual">Counterfactual (what-if scenarios)</option>
              </select>
            </div>

            {/* Question 4: Trust in AI */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                4. After this experience, how likely would you be to trust AI-assisted credit decisions in real banking? *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleResponseChange('would_trust_ai', value)}
                    className={`flex-1 py-3 rounded-lg border-2 transition ${
                      responses.would_trust_ai === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>Very unlikely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Question 5: Additional Comments */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                5. Any additional comments or feedback? (Optional)
              </label>
              <textarea
                value={responses.comments}
                onChange={(e) => handleResponseChange('comments', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={4}
                placeholder="Share any thoughts about the study, the explanations, or your experience..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-8 bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Study →'}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            * Required questions
          </p>
        </div>
      </div>
    </main>
  )
}
