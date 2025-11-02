// Client component for persona detail page interactive UI

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPersona, getPersonaApplication, ADJUSTABLE_FIELDS, type PersonaInfo, type ApplicationData } from '@/lib/personas'

const SESSION_STORAGE_KEY = 'experiment_session_id'

interface PersonaClientProps {
  personaId: string
}

export default function PersonaClient({ personaId }: PersonaClientProps) {
  const router = useRouter()
  
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

  const handleFieldChange = (field: string, value: string | number) => {
    if (isLocked) return
    setApplication(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!application || !sessionId || isLocked) return

    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/experiment/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          persona_id: personaId,
          application_data: application
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get prediction')
      }

      const result = await response.json()
      
      // Store prediction in localStorage
      const predictionKey = `prediction_${personaId}`
      localStorage.setItem(predictionKey, JSON.stringify(result))
      
      setDecision({
        result: result.decision,
        probability: result.probability
      })
      setIsLocked(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinue = () => {
    router.push(`/experiment/personas/${personaId}/layers`)
  }

  if (error && !persona) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
          <Link href="/experiment/personas" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Personas
          </Link>
        </div>
      </main>
    )
  }

  if (!persona || !application) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/experiment/personas" className="text-blue-600 hover:text-blue-700">
            ← Back to Personas
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-2">{persona.name}</h1>
          <p className="text-lg text-gray-600">{persona.description}</p>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Credit Application</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and adjust the application details below. Fields marked as adjustable can be modified.
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (months) {ADJUSTABLE_FIELDS.includes('duration') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.duration}
              onChange={(e) => handleFieldChange('duration', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('duration')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Credit Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Credit Amount (DM) {ADJUSTABLE_FIELDS.includes('credit_amount') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.credit_amount}
              onChange={(e) => handleFieldChange('credit_amount', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('credit_amount')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Installment Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Installment Rate (% of disposable income) {ADJUSTABLE_FIELDS.includes('installment_rate') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.installment_rate}
              onChange={(e) => handleFieldChange('installment_rate', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('installment_rate')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Residence Since */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Present Residence Since (years) {ADJUSTABLE_FIELDS.includes('residence_since') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.residence_since}
              onChange={(e) => handleFieldChange('residence_since', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('residence_since')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age (years) {ADJUSTABLE_FIELDS.includes('age') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.age}
              onChange={(e) => handleFieldChange('age', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('age')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Existing Credits */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Existing Credits {ADJUSTABLE_FIELDS.includes('existing_credits') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.existing_credits}
              onChange={(e) => handleFieldChange('existing_credits', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('existing_credits')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dependents */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Dependents {ADJUSTABLE_FIELDS.includes('num_dependents') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.num_dependents}
              onChange={(e) => handleFieldChange('num_dependents', parseInt(e.target.value))}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('num_dependents')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!decision && (
            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application for AI Decision'}
            </button>
          )}
        </form>

        {/* Decision Display */}
        {decision && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Decision</h2>
            <div className={`p-6 rounded-lg ${decision.result === 'approved' ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <p className="text-2xl font-bold mb-2">
                {decision.result === 'approved' ? '✓ APPROVED' : '✗ REJECTED'}
              </p>
              <p className="text-lg">
                Confidence: {(decision.probability * 100).toFixed(1)}%
              </p>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full mt-6 rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              Continue to Explanation Layers →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
