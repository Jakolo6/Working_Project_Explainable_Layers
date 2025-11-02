// Registration page for starting an experiment session

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SessionForm {
  participant_name: string
  participant_age: string
  participant_profession: string
  finance_experience: 'none' | 'basic' | 'intermediate' | 'advanced'
  ai_familiarity: 'none' | 'basic' | 'intermediate' | 'advanced'
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const financeOptions: SessionForm['finance_experience'][] = ['none', 'basic', 'intermediate', 'advanced']
const aiOptions: SessionForm['ai_familiarity'][] = ['none', 'basic', 'intermediate', 'advanced']
const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function ExperimentStartPage() {
  const [form, setForm] = useState<SessionForm>({
    participant_name: '',
    participant_age: '',
    participant_profession: '',
    finance_experience: 'none',
    ai_familiarity: 'none',
  })
  const [status, setStatus] = useState<FormStatus>('idle')
  const [sessionId, setSessionId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const existingSessionId = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null
    if (existingSessionId) {
      setSessionId(existingSessionId)
      setStatus('success')
    }
  }, [])

  const handleChange = (field: keyof SessionForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const validateForm = () => {
    if (!form.participant_name.trim()) return 'Please enter your name.'
    const age = Number(form.participant_age)
    if (!Number.isFinite(age) || age < 18 || age > 100) return 'Please enter a valid age between 18 and 100.'
    if (!form.participant_profession.trim()) return 'Please provide your current role or field.'
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
    setSessionId('')

    try {
      const response = await fetch(`${apiUrl}/api/v1/experiment/create_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_name: form.participant_name.trim(),
          participant_age: Number(form.participant_age),
          participant_profession: form.participant_profession.trim(),
          finance_experience: form.finance_experience,
          ai_familiarity: form.ai_familiarity,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.detail ?? 'Failed to create session. Please try again.')
      }

      const result = await response.json()
      setSessionId(result.session_id)
      setStatus('success')
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_STORAGE_KEY, result.session_id)
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create session. Please try again later.')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">← Back to Home</Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-3">Start Experiment Session</h1>
          <p className="text-lg text-gray-600">
            Provide a few details so we can generate a participant session ID. This session ID will link
            all questionnaire responses, predictions, and explanation feedback throughout the study.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="participant_name">
              Full Name
            </label>
            <input
              id="participant_name"
              name="participant_name"
              type="text"
              value={form.participant_name}
              onChange={handleChange('participant_name')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., Alex Johnson"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="participant_age">
                Age
              </label>
              <input
                id="participant_age"
                name="participant_age"
                type="number"
                min={18}
                max={100}
                value={form.participant_age}
                onChange={handleChange('participant_age')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., 32"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="participant_profession">
                Current Profession / Role
              </label>
              <input
                id="participant_profession"
                name="participant_profession"
                type="text"
                value={form.participant_profession}
                onChange={handleChange('participant_profession')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., Financial analyst"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="finance_experience">
                Banking / Finance Experience
              </label>
              <select
                id="finance_experience"
                name="finance_experience"
                value={form.finance_experience}
                onChange={handleChange('finance_experience')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {financeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="ai_familiarity">
                Familiarity with AI Systems
              </label>
              <select
                id="ai_familiarity"
                name="ai_familiarity"
                value={form.ai_familiarity}
                onChange={handleChange('ai_familiarity')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {aiOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {sessionId && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
              <p className="font-semibold mb-2">✓ Session created successfully!</p>
              <p>
                <span className="font-semibold">Session ID:</span>{' '}
                <span className="font-mono text-green-900 bg-white px-2 py-1 rounded">{sessionId}</span>
              </p>
              <p className="mt-3 text-gray-700">
                Your session ID has been saved. Click below to continue to the pre-experiment questionnaire.
              </p>
              <Link
                href="/experiment/pre"
                className="mt-4 inline-block w-full text-center rounded-lg bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 transition"
              >
                Continue to Pre-Experiment Questionnaire →
              </Link>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Creating Session…' : 'Create Session'}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-800">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Copy your Session ID and store it securely.</li>
            <li>Continue to the pre-experiment questionnaire (coming next).</li>
            <li>Use the same Session ID for all subsequent experiment stages.</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
