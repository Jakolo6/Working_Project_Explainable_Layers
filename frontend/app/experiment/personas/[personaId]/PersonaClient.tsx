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
      const payload = {
        session_id: sessionId,
        persona_id: personaId,
        application_data: application
      }
      console.log('Sending prediction request:', payload)
      
      const response = await fetch(`${apiUrl}/api/v1/experiment/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Prediction error:', errorData)
        throw new Error(errorData.detail || 'Failed to get prediction')
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
              Duration (months) {ADJUSTABLE_FIELDS.includes('duration_months') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.duration_months}
              onChange={(e) => handleFieldChange('duration_months', parseInt(e.target.value) || 0)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('duration_months')}
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
              onChange={(e) => handleFieldChange('credit_amount', parseInt(e.target.value) || 0)}
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
              onChange={(e) => handleFieldChange('installment_rate', parseInt(e.target.value) || 0)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('installment_rate')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Residence Since */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Present Residence Since (years) {ADJUSTABLE_FIELDS.includes('present_residence_since') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <input
              type="number"
              value={application.present_residence_since}
              onChange={(e) => handleFieldChange('present_residence_since', parseInt(e.target.value) || 0)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('present_residence_since')}
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
              onChange={(e) => handleFieldChange('age', parseInt(e.target.value) || 0)}
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
              onChange={(e) => handleFieldChange('existing_credits', parseInt(e.target.value) || 0)}
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
              onChange={(e) => handleFieldChange('num_dependents', parseInt(e.target.value) || 0)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('num_dependents')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Checking Account Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Checking Account Status {ADJUSTABLE_FIELDS.includes('checking_account_status') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.checking_account_status}
              onChange={(e) => handleFieldChange('checking_account_status', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('checking_account_status')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="less than 0 DM">Less than 0 DM (overdrawn)</option>
              <option value="0 to 200 DM">0 to 200 DM</option>
              <option value="200 DM or more">200 DM or more</option>
              <option value="no checking account">No checking account</option>
            </select>
          </div>

          {/* Savings Account */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Savings Account {ADJUSTABLE_FIELDS.includes('savings_account') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.savings_account}
              onChange={(e) => handleFieldChange('savings_account', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('savings_account')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="less than 100 DM">Less than 100 DM</option>
              <option value="100 to 500 DM">100 to 500 DM</option>
              <option value="500 to 1000 DM">500 to 1000 DM</option>
              <option value="1000 DM or more">1000 DM or more</option>
              <option value="unknown/no savings">Unknown/No savings</option>
            </select>
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Employment Status {ADJUSTABLE_FIELDS.includes('employment_status') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.employment_status}
              onChange={(e) => handleFieldChange('employment_status', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('employment_status')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="unemployed">Unemployed</option>
              <option value="less than 1 year">Less than 1 year</option>
              <option value="1 to 4 years">1 to 4 years</option>
              <option value="4 to 7 years">4 to 7 years</option>
              <option value="7 years or more">7 years or more</option>
            </select>
          </div>

          {/* Property */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Property {ADJUSTABLE_FIELDS.includes('property') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.property}
              onChange={(e) => handleFieldChange('property', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('property')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="real estate">Real estate</option>
              <option value="building society savings/life insurance">Building society savings/Life insurance</option>
              <option value="car or other">Car or other</option>
              <option value="unknown/no property">Unknown/No property</option>
            </select>
          </div>

          {/* Housing */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Housing {ADJUSTABLE_FIELDS.includes('housing') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.housing}
              onChange={(e) => handleFieldChange('housing', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('housing')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="rent">Rent</option>
              <option value="own">Own</option>
              <option value="for free">For free</option>
            </select>
          </div>

          {/* Credit History */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Credit History {ADJUSTABLE_FIELDS.includes('credit_history') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.credit_history}
              onChange={(e) => handleFieldChange('credit_history', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('credit_history')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="no credits taken/all paid back">No credits taken/All paid back</option>
              <option value="all credits paid back duly">All credits paid back duly</option>
              <option value="existing credits paid back duly">Existing credits paid back duly</option>
              <option value="delay in paying off in the past">Delay in paying off in the past</option>
              <option value="critical account">Critical account</option>
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Purpose {ADJUSTABLE_FIELDS.includes('purpose') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('purpose')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="car (new)">Car (new)</option>
              <option value="car (used)">Car (used)</option>
              <option value="furniture/equipment">Furniture/Equipment</option>
              <option value="radio/television">Radio/Television</option>
              <option value="domestic appliances">Domestic appliances</option>
              <option value="repairs">Repairs</option>
              <option value="education">Education</option>
              <option value="retraining">Retraining</option>
              <option value="business">Business</option>
              <option value="others">Others</option>
            </select>
          </div>

          {/* Other Debtors */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Other Debtors/Guarantors {ADJUSTABLE_FIELDS.includes('other_debtors') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.other_debtors}
              onChange={(e) => handleFieldChange('other_debtors', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('other_debtors')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="none">None</option>
              <option value="co-applicant">Co-applicant</option>
              <option value="guarantor">Guarantor</option>
            </select>
          </div>

          {/* Other Installment Plans */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Other Installment Plans {ADJUSTABLE_FIELDS.includes('other_installment_plans') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.other_installment_plans}
              onChange={(e) => handleFieldChange('other_installment_plans', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('other_installment_plans')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="none">None</option>
              <option value="bank">Bank</option>
              <option value="stores">Stores</option>
            </select>
          </div>

          {/* Job */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job {ADJUSTABLE_FIELDS.includes('job') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.job}
              onChange={(e) => handleFieldChange('job', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('job')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="unemployed/unskilled - non-resident">Unemployed/Unskilled - Non-resident</option>
              <option value="unskilled - resident">Unskilled - Resident</option>
              <option value="skilled employee">Skilled employee/Official</option>
              <option value="management/self-employed">Management/Self-employed/Highly qualified</option>
            </select>
          </div>

          {/* Telephone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telephone {ADJUSTABLE_FIELDS.includes('telephone') && <span className="text-blue-600">✎ Adjustable</span>}
            </label>
            <select
              value={application.telephone}
              onChange={(e) => handleFieldChange('telephone', e.target.value)}
              disabled={isLocked || !ADJUSTABLE_FIELDS.includes('telephone')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="no">No</option>
              <option value="yes">Yes (registered under customer's name)</option>
            </select>
          </div>

          {/* Excluded fields - not used in model */}
          <div className="border-t-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <span className="text-yellow-600 mr-2">⚠️</span>
              Excluded Attributes (Not Used in Credit Decision)
            </h3>
            
            <p className="text-sm text-gray-700 mb-3">
              These attributes are <strong>NOT used</strong> by the AI model to prevent discrimination based on gender and nationality.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sex</label>
                <input
                  type="text"
                  value={application.sex}
                  disabled
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foreign Worker</label>
                <input
                  type="text"
                  value={application.foreign_worker}
                  disabled
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mt-3 italic">
              ℹ️ The XGBoost model was trained without these features to ensure fair and unbiased credit decisions.
            </p>
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
