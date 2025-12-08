// Client component for persona detail page interactive UI

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PERSONAS } from '@/lib/personas'
import { AlertCircle, Info } from 'lucide-react'
import { getAssessmentDisplay } from '@/lib/riskAssessment'
import { getPersona, getPersonaApplication, type PersonaInfo, type ApplicationData } from '@/lib/personas'

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
    // Scroll to top when page loads
    window.scrollTo({ top: 0, behavior: 'instant' })
    
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

  // Map frontend values to exact backend expected values
  const VALUE_MAPPING: Record<string, string> = {
    // Checking account status - match form dropdown values exactly
    'less than 0 dm': 'lt_0_dm',
    '0 to 200 dm': '0_to_200_dm',
    '200 dm or more': 'ge_200_dm',
    'no checking account': 'no_checking',
    
    // Savings account - match form dropdown values exactly
    'less than 100 dm': 'lt_100_dm',
    '100 to 500 dm': '100_to_500_dm',
    '500 to 1000 dm': '500_to_1000_dm',
    '1000 dm or more': 'ge_1000_dm',
    'unknown/no savings': 'unknown',
    
    // Credit history - match form dropdown values exactly
    'no credits taken/all paid back': 'no_credits',
    'all credits paid back duly': 'all_paid',
    'existing credits paid back duly': 'existing_paid',
    'delay in paying off in the past': 'delayed_past',
    'critical account': 'critical',
    
    // Employment - match form dropdown values exactly
    'unemployed': 'unemployed',
    'less than 1 year': 'lt_1_year',
    '1 to 4 years': '1_to_4_years',
    '4 to 7 years': '4_to_7_years',
    '7 years or more': 'ge_7_years',
    
    // Job - match form dropdown values exactly
    'unemployed/unskilled - non-resident': 'unemployed_unskilled',
    'unskilled - resident': 'unskilled_resident',
    'skilled employee': 'skilled',
    'management/self-employed': 'management',
    
    // Purpose - match form dropdown values exactly
    'car (new)': 'car_new',
    'car (used)': 'car_used',
    'furniture/equipment': 'furniture',
    'radio/television': 'radio_tv',
    'domestic appliances': 'appliances',
    'repairs': 'repairs',
    'education': 'education',
    'retraining': 'retraining',
    'business': 'business',
    'others': 'others',
    
    // Property - match form dropdown values exactly
    'real estate': 'real_estate',
    'building society savings/life insurance': 'savings_agreement',
    'car or other': 'car_or_other',
    'unknown/no property': 'unknown_no_property',
    
    // Housing - match form dropdown values exactly
    'rent': 'rent',
    'own': 'own',
    'for free': 'for_free',
    
    // Other debtors/guarantors - match form dropdown values exactly
    'none': 'none',
    'co-applicant': 'co_applicant',
    'guarantor': 'guarantor',
    
    // Other payment plans - match form dropdown values exactly
    'bank': 'bank',
    'stores': 'stores',
    
    // Telephone - match form dropdown values exactly
    'no': 'none',
    'yes': 'yes',
  }
  
  const mapValue = (value: string): string => {
    const normalized = value.toLowerCase().trim()
    const mapped = VALUE_MAPPING[normalized] || normalized
    return mapped
  }

  // Map installment rate from numerical (1-4) to categorical
  const mapInstallmentRate = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseInt(value) : value
    const mapping: Record<number, string> = {
      1: 'ge_35_percent',      // ≥35% (highest burden)
      2: '25_to_35_percent',   // 25-35%
      3: '20_to_25_percent',   // 20-25%
      4: 'lt_20_percent'       // <20% (lowest burden)
    }
    return mapping[numValue] || 'lt_20_percent'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!application || !sessionId || isLocked) return

    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Map frontend field names to backend field names and map values
      const mappedApplication = {
        checking_status: mapValue(application.checking_account_status),
        duration: Number(application.duration_months),
        credit_history: mapValue(application.credit_history),
        purpose: mapValue(application.purpose),
        credit_amount: Number(application.credit_amount),
        savings_status: mapValue(application.savings_account),
        employment: mapValue(application.employment_status),
        installment_commitment: mapInstallmentRate(application.installment_rate),
        other_debtors: mapValue(application.other_debtors),
        residence_since: Number(application.present_residence_since),
        property_magnitude: mapValue(application.property),
        age: Number(application.age),
        other_payment_plans: mapValue(application.other_installment_plans),
        housing: mapValue(application.housing),
        existing_credits: Number(application.existing_credits),
        job: mapValue(application.job),
        num_dependents: Number(application.num_dependents),
        own_telephone: mapValue(application.telephone)
      }
      
      const payload = {
        session_id: sessionId,
        persona_id: personaId,
        application_data: mappedApplication
      }
      
      const response = await fetch(`${apiUrl}/api/v1/experiment/predict_persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(JSON.stringify(errorData.detail) || 'Failed to get prediction')
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
      
      // Automatically navigate to layers page (starts at layer 1 by default)
      setTimeout(() => {
        router.push(`/experiment/personas/${personaId}/layers`)
      }, 500) // Small delay to show the decision briefly
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

        {/* Decision Display - At Top When Generated */}
        {decision && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Decision</h2>
            <div className={`p-6 rounded-lg ${decision.result === 'approved' ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold mb-2">
                    {decision.result === 'approved' ? '✓ APPROVED' : '✗ REJECTED'}
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const assessment = getAssessmentDisplay(decision.result, decision.probability)
                    return (
                      <>
                        <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">
                          {assessment.label}
                        </p>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border-2 ${assessment.bgColor}`}>
                          <span className={`text-xl font-bold ${assessment.color}`}>
                            {assessment.value}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full mt-6 rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              Continue to Explanation Layers →
            </button>
          </div>
        )}

        {/* Step 1: Review Context Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Application Review</h2>
              <p className="text-gray-700">
                Review <strong>{persona.name}'s</strong> key application details below. 
                <strong className="text-blue-700"> Click "Generate AI Decision" to see the model's decision and explanations.</strong>
              </p>
            </div>
          </div>
        </div>


        {/* Application Summary - Read-Only */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Credit Application Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Key information from {persona.name}'s application
            </p>
          </div>

          {/* Key Features - Read-Only Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loan Amount */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Loan Amount
              </label>
              <p className="text-lg font-semibold text-gray-900">
                €{application.credit_amount.toLocaleString()}
              </p>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Duration
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {application.duration_months} months
              </p>
            </div>

            {/* Checking Account */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Checking Account Status
              </label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {application.checking_account_status}
              </p>
            </div>

            {/* Employment */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Employment Duration
              </label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {application.employment_status}
              </p>
            </div>

            {/* Purpose */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Loan Purpose
              </label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {application.purpose}
              </p>
            </div>
          </div>

          {/* More Features Indicator */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This application includes {Object.keys(application).length} total data points. 
              The AI model considers all factors when making its decision.
            </p>
          </div>
        </div>

        {/* Generate AI Decision Button */}
        {!decision && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isLocked}
              className="w-full rounded-lg bg-blue-600 px-6 py-4 text-white text-lg font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating AI Decision...' : 'Generate AI Decision →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
