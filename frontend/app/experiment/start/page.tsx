// Registration page for starting an experiment session with consent

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SessionForm {
  participant_background: string
  credit_experience: string
  ai_familiarity: number
  preferred_explanation_style: string
  background_notes: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const BACKGROUND_OPTIONS = [
  { value: 'banking', label: 'Banking / Credit / Risk / Retail Banking' },
  { value: 'data_analytics', label: 'Data / Analytics / BI / Machine Learning' },
  { value: 'student', label: 'Student (Business / Analytics / related fields)' },
  { value: 'other', label: 'Other' }
]

const CREDIT_EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'some', label: 'Some (case studies / projects / junior experience)' },
  { value: 'regular', label: 'Regular part of my work' },
  { value: 'expert', label: 'Expert level' }
]

const EXPLANATION_STYLE_OPTIONS = [
  { value: 'technical', label: 'Technical' },
  { value: 'visual', label: 'Visual' },
  { value: 'narrative', label: 'Narrative' },
  { value: 'action_oriented', label: 'Action-oriented ("what needs to change?")' }
]

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function ExperimentStartPage() {
  const [consentGiven, setConsentGiven] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SessionForm>({
    participant_background: '',
    credit_experience: '',
    ai_familiarity: 0,
    preferred_explanation_style: '',
    background_notes: '',
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

  const handleChange = (field: keyof SessionForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = field === 'ai_familiarity' ? Number(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleConsentContinue = () => {
    if (consentGiven) {
      setShowForm(true)
    }
  }

  const validateForm = () => {
    if (!form.participant_background) return 'Please select your background.'
    if (!form.credit_experience) return 'Please select your credit experience level.'
    if (form.ai_familiarity === 0) return 'Please rate your familiarity with AI decision systems.'
    if (!form.preferred_explanation_style) return 'Please select your preferred explanation style.'
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
      const response = await fetch(`${apiUrl}/api/v1/experiment/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent_given: consentGiven,
          participant_background: form.participant_background,
          credit_experience: form.credit_experience,
          ai_familiarity: form.ai_familiarity,
          preferred_explanation_style: form.preferred_explanation_style,
          background_notes: form.background_notes.trim(),
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
        // Clear any previous persona completion flags for fresh start
        window.localStorage.removeItem('completed_elderly-woman')
        window.localStorage.removeItem('completed_young-entrepreneur')
        window.localStorage.removeItem('completed_middle-aged-employee')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create session. Please try again later.')
      setStatus('error')
    }
  }

  // Consent screen
  if (!showForm) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="mb-8">
            <Link href="/" className="text-blue-600 hover:text-blue-700">← Back to Home</Link>
            <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-3">Research Consent</h1>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
              <p className="text-gray-700 leading-relaxed">
                By participating in this study, you agree that your anonymized answers may be used for 
                academic research within the Master's program at Nova School of Business and Economics. 
                No personal data will be shared or attributed to you.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-8">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">
                I agree and want to participate
              </span>
            </label>

            <button
              onClick={handleConsentContinue}
              disabled={!consentGiven}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Questionnaire →
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">← Back to Home</Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-3">Baseline Questionnaire</h1>
          <p className="text-lg text-gray-600">
            Please answer these questions before viewing any AI explanations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Q1: Participant Background */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. What best describes your professional background? *
            </label>
            <div className="space-y-2">
              {BACKGROUND_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="participant_background"
                    value={option.value}
                    checked={form.participant_background === option.value}
                    onChange={handleChange('participant_background')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q2: Credit Experience */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. What is your experience with credit-related decision-making? *
            </label>
            <div className="space-y-2">
              {CREDIT_EXPERIENCE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="credit_experience"
                    value={option.value}
                    checked={form.credit_experience === option.value}
                    onChange={handleChange('credit_experience')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Q3: AI Familiarity (Likert 1-5) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              3. How familiar are you with AI decision systems? *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, ai_familiarity: value }))}
                  className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                    form.ai_familiarity === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not familiar at all</span>
              <span>Very familiar</span>
            </div>
          </div>

          {/* Q4: Preferred Explanation Style */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              4. Before seeing any explanations, which style do you think you would prefer? *
            </label>
            <div className="space-y-2">
              {EXPLANATION_STYLE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="preferred_explanation_style"
                    value={option.value}
                    checked={form.preferred_explanation_style === option.value}
                    onChange={handleChange('preferred_explanation_style')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional: Background Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="background_notes">
              5. In one sentence: anything about your background that may influence how you interpret explanations? (Optional)
            </label>
            <textarea
              id="background_notes"
              name="background_notes"
              rows={2}
              value={form.background_notes}
              onChange={handleChange('background_notes')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., I have worked with SHAP values before..."
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {sessionId && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
              <p className="font-semibold mb-2">✓ Session created successfully!</p>
              <p className="mt-3 text-gray-700">
                Your responses have been saved. Click below to start reviewing the credit applicants.
              </p>
              <Link
                href="/experiment/personas"
                className="mt-4 inline-block w-full text-center rounded-lg bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 transition"
              >
                Continue to Credit Applicants →
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
          <h2 className="text-lg font-semibold text-blue-900 mb-2">What's Next</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>You will review 3 credit applicant profiles</li>
            <li>For each applicant, you'll see 4 different AI explanation styles</li>
            <li>Rate each explanation on understanding, fairness, and usefulness</li>
            <li>Complete a short final questionnaire</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
