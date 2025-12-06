// Registration page for starting an experiment session with consent

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SessionForm {
  // Section 1: Demographics
  age: number
  gender: string
  
  // Section 2: Experience & Preferences
  financial_relationship: string
  preferred_explanation_style: string
  
  // Section 3: Trust & Ethics
  ai_trust_instinct: string
  ai_fairness_stance: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

// Section 1: Demographics
const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' }
]

// Section 2: Experience & Preferences
const FINANCIAL_RELATIONSHIP_OPTIONS = [
  { value: 'novice', label: 'Layperson (No professional knowledge)' },
  { value: 'consumer', label: 'Borrower (I have applied for loans myself)' },
  { value: 'financial_literate', label: 'Financial Background (Student, Consultant, or Analyst)' }
]

const EXPLANATION_STYLE_OPTIONS = [
  { value: 'technical', label: 'Technical (raw numbers)' },
  { value: 'visual', label: 'Visual (interactive charts, graphs, distributions)' },
  { value: 'narrative', label: 'Narrative (natural language, storytelling)' },
  { value: 'action', label: 'Action-oriented (what needs to change?)' }
]

// Section 3: Trust & Ethics
const AI_TRUST_INSTINCT_OPTIONS = [
  { value: 'automation_bias', label: 'Trust the AI (I likely missed a risk factor)' },
  { value: 'algorithm_aversion', label: 'Doubt the AI (It is likely biased or missing context)' },
  { value: 'neutral', label: 'Neutral (I need to see the evidence first)' }
]

const AI_FAIRNESS_STANCE_OPTIONS = [
  { value: 'skeptic', label: 'Skeptical: AI often reinforces historical discrimination' },
  { value: 'conditional', label: 'Cautious: AI can be fair, but only with strict human oversight' },
  { value: 'optimist', label: 'Optimistic: AI is generally more objective than humans' }
]

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function ExperimentStartPage() {
  const [consentGiven, setConsentGiven] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SessionForm>({
    age: 0,
    gender: '',
    financial_relationship: '',
    preferred_explanation_style: '',
    ai_trust_instinct: '',
    ai_fairness_stance: ''
  })
  const [status, setStatus] = useState<FormStatus>('idle')
  const [sessionId, setSessionId] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'instant' })
    
    const existingSessionId = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null
    if (existingSessionId) {
      setSessionId(existingSessionId)
      setStatus('success')
    }
  }, [])

  const handleChange = (field: keyof SessionForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = field === 'age' ? Number(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleConsentContinue = () => {
    if (consentGiven) {
      setShowForm(true)
    }
  }

  const validateForm = () => {
    if (!form.age || form.age < 18 || form.age > 99) return 'Please enter a valid age (18-99).'
    if (!form.gender) return 'Please select your gender.'
    if (!form.financial_relationship) return 'Please select your relationship with financial decision-making.'
    if (!form.preferred_explanation_style) return 'Please select your preferred explanation style.'
    if (!form.ai_trust_instinct) return 'Please answer the AI trust question.'
    if (!form.ai_fairness_stance) return 'Please select your stance on AI fairness.'
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
          age: form.age,
          gender: form.gender,
          financial_relationship: form.financial_relationship,
          preferred_explanation_style: form.preferred_explanation_style,
          ai_trust_instinct: form.ai_trust_instinct,
          ai_fairness_stance: form.ai_fairness_stance
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

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: DEMOGRAPHICS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Section 1: Demographics</h2>
            
            {/* Age and Gender - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="age">
                  Age *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="18"
                  max="99"
                  value={form.age || ''}
                  onChange={handleChange('age')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="18-99"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="gender">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange('gender')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: EXPERIENCE & PREFERENCES */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Section 2: Experience & Preferences</h2>
            
            {/* Q1: Financial Relationship */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Which best describes your relationship with financial decision-making? *
              </label>
              <div className="space-y-2">
                {FINANCIAL_RELATIONSHIP_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="financial_relationship"
                      value={option.value}
                      checked={form.financial_relationship === option.value}
                      onChange={handleChange('financial_relationship')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q2: Preferred Explanation Style */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Before seeing any explanations, which style do you think you would prefer? *
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
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: TRUST & ETHICS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Section 3: Trust & Ethics</h2>
            
            {/* Q3: AI Trust Instinct */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Imagine an AI rejects a loan applicant that you personally liked. What is your immediate instinct? *
              </label>
              <div className="space-y-2">
                {AI_TRUST_INSTINCT_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ai_trust_instinct"
                      value={option.value}
                      checked={form.ai_trust_instinct === option.value}
                      onChange={handleChange('ai_trust_instinct')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q4: AI Fairness Stance */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What is your general stance on the fairness of AI in banking? *
              </label>
              <div className="space-y-2">
                {AI_FAIRNESS_STANCE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ai_fairness_stance"
                      value={option.value}
                      checked={form.ai_fairness_stance === option.value}
                      onChange={handleChange('ai_fairness_stance')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
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
