// Pre-experiment questionnaire page - collects expectations before experiment
// Auto-redirects to personas hub after successful submission

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type LikertOption = 1 | 2 | 3 | 4 | 5

interface PreForm {
  session_id: string
  expectation_ai_decision: LikertOption | ''
  expectation_fair_explanation: LikertOption | ''
  expectation_role_explanations: string
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

const likertOptions: LikertOption[] = [1, 2, 3, 4, 5]
const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function PreExperimentPage() {
  const router = useRouter()
  const [form, setForm] = useState<PreForm>({
    session_id: '',
    expectation_ai_decision: '',
    expectation_fair_explanation: '',
    expectation_role_explanations: '',
  })
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Load session ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY)
      if (savedSessionId) {
        setForm((prev) => ({ ...prev, session_id: savedSessionId }))
      }
    }
  }, [])

  const handleInputChange = (
    field: keyof PreForm,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setForm((prev) => ({
      ...prev,
      [field]: field === 'expectation_role_explanations' || field === 'session_id' ? value : (Number(value) as LikertOption),
    }))
  }

  const validateForm = () => {
    if (!form.session_id.trim()) return 'Please enter your session ID.'
    if (form.expectation_ai_decision === '') return 'Please rate your expectations for AI decision quality.'
    if (form.expectation_fair_explanation === '') return 'Please rate your expectations for explanation fairness.'
    if (!form.expectation_role_explanations.trim())
      return 'Please describe the role you expect explanations to play.'
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setStatus('submitting')
    setErrorMessage('')
    try {
      const response = await fetch(`${apiUrl}/api/v1/experiment/pre_response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: form.session_id.trim(),
          expectation_ai_decision: Number(form.expectation_ai_decision),
          expectation_fair_explanation: Number(form.expectation_fair_explanation),
          expectation_role_explanations: form.expectation_role_explanations.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail ?? 'Failed to submit pre-experiment responses.')
      }

      setStatus('success')
      
      // Redirect to personas hub after 2 seconds
      setTimeout(() => {
        router.push('/experiment/personas')
      }, 2000)
    } catch (error) {
      console.error('Pre-experiment submission failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit responses. Please try again later.')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/experiment/start" className="text-blue-600 hover:text-blue-700">
            ← Back to Registration
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-3">Pre-Experiment Questionnaire</h1>
          <p className="text-lg text-gray-600">
            Tell us about your expectations before interacting with the explanation layers. All responses are linked to
            your session ID and stored securely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="session_id">
              Session ID
            </label>
            <input
              id="session_id"
              name="session_id"
              type="text"
              value={form.session_id}
              onChange={handleInputChange('session_id')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Paste the session ID obtained during registration"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="expectation_ai_decision">
                Expected quality of AI credit decisions
              </label>
              <select
                id="expectation_ai_decision"
                name="expectation_ai_decision"
                value={form.expectation_ai_decision}
                onChange={handleInputChange('expectation_ai_decision')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="" disabled>
                  Select a rating (1 = very low, 5 = very high)
                </option>
                {likertOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="expectation_fair_explanation">
                Expected fairness of explanations
              </label>
              <select
                id="expectation_fair_explanation"
                name="expectation_fair_explanation"
                value={form.expectation_fair_explanation}
                onChange={handleInputChange('expectation_fair_explanation')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="" disabled>
                  Select a rating (1 = very unfair, 5 = very fair)
                </option>
                {likertOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="expectation_role_explanations">
              In your own words, what role do you expect explanations to play in AI credit decisions?
            </label>
            <textarea
              id="expectation_role_explanations"
              name="expectation_role_explanations"
              rows={4}
              value={form.expectation_role_explanations}
              onChange={handleInputChange('expectation_role_explanations')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Describe your expectations..."
              required
            ></textarea>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {status === 'success' && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
              <p className="font-semibold mb-2">✓ Thank you! Your pre-experiment responses were recorded.</p>
              <p>
                Redirecting you to the personas hub...
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Pre-Experiment Responses'}
          </button>
        </form>
      </div>
    </main>
  )
}
