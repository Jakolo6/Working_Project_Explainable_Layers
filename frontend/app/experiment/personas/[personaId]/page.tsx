// Individual persona application page with prefilled form

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPersona, getPersonaApplication, ADJUSTABLE_FIELDS, type PersonaInfo, type ApplicationData } from '@/lib/personas'

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function PersonaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const personaId = params.personaId as string
  
  const [persona, setPersona] = useState<PersonaInfo | null>(null)
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [decision, setDecision] = useState<{
    result: 'approved' | 'rejected'
    probability: number
  } | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Load persona data
    const personaData = getPersona(personaId)
    const appData = getPersonaApplication(personaId)
    
    if (!personaData || !appData) {
      setError('Invalid persona ID')
      return
    }
    
    setPersona(personaData)
    setApplication(appData)
    
    // Load session ID
    if (typeof window !== 'undefined') {
      const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY)
      if (!storedSessionId) {
        router.push('/experiment/start')
        return
      }
      setSessionId(storedSessionId)
    }
  }, [personaId, router])

  const handleFieldChange = (field: keyof ApplicationData, value: string | number) => {
    if (isLocked || !application) return
    setApplication({ ...application, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!application || !sessionId || isLocked) return

    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/experiment/predict_persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          persona_id: personaId,
          application_data: application,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI decision')
      }

      const result = await response.json()
      setDecision({
        result: result.decision === 'approved' ? 'approved' : 'rejected',
        probability: result.probability,
      })
      setIsLocked(true)
      
      // Save prediction to localStorage for layers page
      if (typeof window !== 'undefined') {
        const predictionKey = `prediction_${personaId}`
        window.localStorage.setItem(predictionKey, JSON.stringify(result))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error && !persona) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error}</p>
          <Link href="/experiment/personas" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Personas
          </Link>
        </div>
      </main>
    )
  }

  if (!persona || !application) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/experiment/personas" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Back to Personas Hub
        </Link>

        {/* Persona Recap Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {persona.name} ({persona.age}) – {persona.occupation}
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            <strong>Loan Request:</strong> €{persona.loanAmount.toLocaleString()} for {persona.loanPurpose}
          </p>
          <p className="text-gray-600">{persona.description}</p>
        </div>

        {/* AI Decision (if submitted) */}
        {decision && (
          <div className={`rounded-xl p-6 mb-8 ${
            decision.result === 'approved' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h2 className="text-2xl font-bold mb-2">
              {decision.result === 'approved' ? '✓ Application Approved' : '✗ Application Rejected'}
            </h2>
            <p className="text-gray-700">
              Probability: {(decision.probability * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This decision is now locked. You'll see 5 different explanations for this decision next.
            </p>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Credit Application Form</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Adjustable Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Loan Amount (€) *
              </label>
              <input
                type="number"
                value={application.credit_amount}
                onChange={(e) => handleFieldChange('credit_amount', Number(e.target.value))}
                disabled={isLocked}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                min="1000"
                max="50000"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (months) *
              </label>
              <input
                type="number"
                value={application.duration_months}
                onChange={(e) => handleFieldChange('duration_months', Number(e.target.value))}
                disabled={isLocked}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                min="6"
                max="72"
                step="6"
              />
            </div>

            {/* Prefilled Fields (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={application.age}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Employment Status</label>
              <input
                type="text"
                value={application.employment_status}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Checking Account</label>
              <input
                type="text"
                value={application.checking_account_status}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Savings Account</label>
              <input
                type="text"
                value={application.savings_account}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property</label>
              <input
                type="text"
                value={application.property}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Housing</label>
              <input
                type="text"
                value={application.housing}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Credit History</label>
              <input
                type="text"
                value={application.credit_history}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
              <input
                type="text"
                value={application.purpose}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Credits</label>
              <input
                type="number"
                value={application.existing_credits}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dependents</label>
              <input
                type="number"
                value={application.num_dependents}
                disabled
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              * You can adjust loan amount and duration. Other fields are prefilled based on the persona.
            </p>
            {!isLocked && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>

        {/* Next Step (after decision) */}
        {decision && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Next: View Explanation Layers</h3>
            <p className="text-gray-700 mb-6">
              You will now see 5 different ways the AI explains this decision. Rate each explanation on trust, understanding, usefulness, and mental effort.
            </p>
            <Link
              href={`/experiment/personas/${personaId}/layers`}
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Start Viewing Explanations →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
