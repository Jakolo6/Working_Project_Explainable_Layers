// Client component for persona detail page interactive UI

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    // Checking account status
    'less than 0 dm': 'negative_balance',
    '0 to 200 dm': '0_to_200_dm',
    '200 dm or more': '200_or_more_dm',
    'no checking account': 'no_checking_account',
    
    // Savings account
    'less than 100 dm': 'lt_100_dm',
    '100 to 500 dm': '100_to_500_dm',
    '500 to 1000 dm': '500_to_1000_dm',
    '1000 dm or more': 'ge_1000_dm',
    'unknown': 'unknown_no_savings',
    
    // Credit history
    'no credits taken': 'no_credits',
    'all credits paid back duly': 'all_paid',
    'existing credits paid back duly': 'existing_paid',
    'delay in paying off': 'delay',
    'critical account': 'critical',
    
    // Employment
    'unemployed': 'unemployed',
    'less than 1 year': 'lt_1_year',
    '1 to 4 years': '1_to_4_years',
    '4 to 7 years': '4_to_7_years',
    '7 years or more': 'ge_7_years',
    
    // Job
    'unemployed / unskilled': 'unemployed_or_unskilled_non_resident',
    'unskilled': 'unskilled_resident',
    'skilled employee': 'skilled_employee_official',
    'management': 'management_self_employed_highly_qualified_officer',
    
    // Purpose
    'car (new)': 'car_new',
    'car (used)': 'car_used',
    'furniture': 'furniture',
    'radio/tv': 'radio_tv',
    'appliances': 'appliances',
    'repairs': 'repairs',
    'education': 'education',
    'retraining': 'retraining',
    'business': 'business',
    'others': 'others',
    
    // Property
    'real estate': 'real_estate',
    'savings agreement': 'savings_agreement_or_life_insurance',
    'car or other': 'car_or_other',
    'unknown / no property': 'unknown_no_property',
    
    // Housing
    'rent': 'rent',
    'own': 'own',
    'for free': 'for_free',
    
    // Other debtors
    'none': 'none',
    'co-applicant': 'co_applicant',
    'guarantor': 'guarantor',
    
    // Other payment plans
    'bank': 'bank',
    'stores': 'stores',
    
    // Telephone
    'yes': 'yes_registered',
    'no': 'none',
  }
  
  const mapValue = (value: string): string => {
    const normalized = value.toLowerCase().trim()
    return VALUE_MAPPING[normalized] || normalized
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
        installment_commitment: Number(application.installment_rate),
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
      
      console.log('=== MAPPING DEBUG ===')
      console.log('Original application:', application)
      console.log('Mapped application:', mappedApplication)
      console.log('Data types:', Object.entries(mappedApplication).map(([k, v]) => `${k}: ${typeof v} = ${v}`))
      
      const payload = {
        session_id: sessionId,
        persona_id: personaId,
        application_data: mappedApplication
      }
      console.log('Sending prediction request:', payload)
      
      const response = await fetch(`${apiUrl}/api/v1/experiment/predict_persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Prediction error:', JSON.stringify(errorData, null, 2))
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

        {/* Step 1: Review Context Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Application Review</h2>
              <p className="text-gray-700">
                This form is pre-filled with <strong>{persona.name}'s</strong> financial data. 
                <strong className="text-blue-700"> Click "Get AI Assessment" below to proceed</strong> — 
                no adjustments needed. Feel free to review the form details, but submitting as-is is perfectly fine.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Submit Button - Above Form */}
        {!decision && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-green-800">Ready to proceed?</h3>
                <p className="text-sm text-green-700">The form is pre-filled. Click to generate the AI decision.</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isLocked}
                className="flex-shrink-0 rounded-lg bg-green-600 px-6 py-3 text-white font-bold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Generating...' : '🚀 Get AI Assessment'}
              </button>
            </div>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Credit Application</h2>
            <p className="text-sm text-gray-500 mt-1">
              All fields below are editable. Review and adjust as needed.
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (months)
            </label>
            <input
              type="number"
              value={application.duration_months}
              onChange={(e) => handleFieldChange('duration_months', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Credit Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Credit Amount (DM)
            </label>
            <input
              type="number"
              value={application.credit_amount}
              onChange={(e) => handleFieldChange('credit_amount', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Installment Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Installment Rate (% of disposable income)
            </label>
            <input
              type="number"
              value={application.installment_rate}
              onChange={(e) => handleFieldChange('installment_rate', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Residence Since */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Present Residence Since (years)
            </label>
            <input
              type="number"
              value={application.present_residence_since}
              onChange={(e) => handleFieldChange('present_residence_since', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age (years)
            </label>
            <input
              type="number"
              value={application.age}
              onChange={(e) => handleFieldChange('age', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Existing Credits */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Existing Credits
            </label>
            <input
              type="number"
              value={application.existing_credits}
              onChange={(e) => handleFieldChange('existing_credits', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dependents */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Dependents
            </label>
            <input
              type="number"
              value={application.num_dependents}
              onChange={(e) => handleFieldChange('num_dependents', e.target.value === '' ? '' : parseInt(e.target.value))}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          {/* Checking Account Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Checking Account Status
            </label>
            <select
              value={application.checking_account_status}
              onChange={(e) => handleFieldChange('checking_account_status', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Savings Account
            </label>
            <select
              value={application.savings_account}
              onChange={(e) => handleFieldChange('savings_account', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Employment Status
            </label>
            <select
              value={application.employment_status}
              onChange={(e) => handleFieldChange('employment_status', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Property
            </label>
            <select
              value={application.property}
              onChange={(e) => handleFieldChange('property', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Housing
            </label>
            <select
              value={application.housing}
              onChange={(e) => handleFieldChange('housing', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            >
              <option value="rent">Rent</option>
              <option value="own">Own</option>
              <option value="for free">For free</option>
            </select>
          </div>

          {/* Credit History */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Credit History
            </label>
            <select
              value={application.credit_history}
              onChange={(e) => handleFieldChange('credit_history', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Purpose
            </label>
            <select
              value={application.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Other Debtors/Guarantors
            </label>
            <select
              value={application.other_debtors}
              onChange={(e) => handleFieldChange('other_debtors', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            >
              <option value="none">None</option>
              <option value="co-applicant">Co-applicant</option>
              <option value="guarantor">Guarantor</option>
            </select>
          </div>

          {/* Other Installment Plans */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Other Installment Plans
            </label>
            <select
              value={application.other_installment_plans}
              onChange={(e) => handleFieldChange('other_installment_plans', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            >
              <option value="none">None</option>
              <option value="bank">Bank</option>
              <option value="stores">Stores</option>
            </select>
          </div>

          {/* Job */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job
            </label>
            <select
              value={application.job}
              onChange={(e) => handleFieldChange('job', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
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
              Telephone
            </label>
            <select
              value={application.telephone}
              onChange={(e) => handleFieldChange('telephone', e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-900 disabled:cursor-not-allowed"
            >
              <option value="no">No</option>
              <option value="yes">Yes (registered under customer's name)</option>
            </select>
          </div>

          {/* Excluded fields - not used in model */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="bg-gray-100 rounded-lg p-5 border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">🔒</span>
                Excluded Attributes (Hidden from AI)
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                These attributes are <strong>not used</strong> by the AI model to ensure fair and unbiased credit decisions.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Sex</label>
                  <input
                    type="text"
                    value={application.sex}
                    disabled
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Foreign Worker</label>
                  <input
                    type="text"
                    value={application.foreign_worker}
                    disabled
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!decision && (
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isLocked}
                className="w-full rounded-lg bg-blue-600 px-4 py-4 text-white font-bold text-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Generating...' : 'Generate AI Decision & Explanations'}
              </button>
              <p className="text-center text-sm text-gray-500 mt-3">
                ⚠️ Note: Proceeding will lock these values and generate the prediction. You cannot return to this step.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
