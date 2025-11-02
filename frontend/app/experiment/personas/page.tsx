// Persona selection hub - choose persona to explore explanation layers

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type PersonaId = 'elderly-woman' | 'young-entrepreneur' | 'middle-aged-employee'

interface PersonaCard {
  id: PersonaId
  title: string
  subtitle: string
  context: string
  keyFactors: string[]
}

interface SessionState {
  status: 'idle' | 'loading' | 'ready' | 'invalid'
  sessionId: string | null
  error: string | null
}

const SESSION_STORAGE_KEY = 'experiment_session_id'

const PERSONAS: PersonaCard[] = [
  {
    id: 'elderly-woman',
    title: 'Persona 1: Maria (67) – Retired',
    subtitle: '€4,000 for home renovation',
    context:
      'Maria is a 67-year-old retiree who wants to borrow €4,000 to renovate her bathroom for better accessibility. She has a modest pension and some savings, but is concerned about taking on debt at her age.',
    keyFactors: [
      'Fixed retirement income from pension',
      'Owns her home with no mortgage',
      'Limited existing credits, good payment history',
    ],
  },
  {
    id: 'young-entrepreneur',
    title: 'Persona 2: Jonas (27) – Employee',
    subtitle: '€12,000 for business start-up',
    context:
      'Jonas is a 27-year-old employee who wants to borrow €12,000 to start a small online business alongside his current job. He has been employed for 3 years and has a stable income.',
    keyFactors: [
      'Steady employment income',
      'Young with limited credit history',
      'Ambitious but higher risk due to business venture',
    ],
  },
  {
    id: 'middle-aged-employee',
    title: 'Persona 3: Sofia (44) – Single Parent',
    subtitle: '€20,000 to consolidate debt',
    context:
      'Sofia is a 44-year-old single parent who wants to borrow €20,000 to consolidate multiple smaller debts into one manageable payment. She works full-time and supports two children.',
    keyFactors: [
      'Stable employment but supporting family alone',
      'Multiple existing credits to consolidate',
      'Seeking better financial management through consolidation',
    ],
  },
]

export default function PersonaSelectionPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    status: 'idle',
    sessionId: null,
    error: null,
  })

  useEffect(() => {
    const storedSessionId = typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null
    if (!storedSessionId) {
      setSessionState({ status: 'invalid', sessionId: null, error: 'Session not found. Please start the experiment first.' })
      return
    }

    const controller = new AbortController()

    const verifySession = async () => {
      setSessionState({ status: 'loading', sessionId: storedSessionId, error: null })
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/v1/experiment/session/${storedSessionId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Session validation failed. Please restart the experiment.')
        }

        setSessionState({ status: 'ready', sessionId: storedSessionId, error: null })
      } catch (error) {
        console.error('Failed to validate session:', error)
        setSessionState({
          status: 'invalid',
          sessionId: null,
          error: 'Unable to validate your session. Please return to the registration step.',
        })
      }
    }

    verifySession()

    return () => {
      controller.abort()
    }
  }, [])

  const renderContent = () => {
    if (sessionState.status === 'invalid') {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold mb-2">Session not found</p>
          <p className="mb-4">
            To continue, please register for a session first. This ensures that your responses and decisions are linked
            correctly for the study.
          </p>
          <Link
            href="/experiment/start"
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Go to Registration
          </Link>
        </div>
      )
    }

    if (sessionState.status === 'loading' || sessionState.status === 'idle') {
      return (
        <div className="flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-700">
          <svg className="mr-3 h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          <span>Validating session…</span>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <section className="rounded-xl bg-blue-50 border border-blue-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏦 You are a Bank Clerk</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Your role:</strong> You are processing loan applications today. You'll meet three customers, each with different financial situations and credit needs.
            </p>
            <p>
              <strong>Your task:</strong> For each customer, you'll enter their information into the system and the AI will generate a credit decision (Approved or Rejected).
            </p>
            <p>
              <strong>What happens next:</strong> After the AI makes its decision, you'll see 5 different explanation formats. Rate each one on trust, understanding, usefulness, and mental effort.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {PERSONAS.map((persona) => (
            <article key={persona.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <header className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{persona.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{persona.subtitle}</p>
              </header>
              <p className="text-sm text-gray-700 flex-1">{persona.context}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {persona.keyFactors.map((factor) => (
                  <li key={factor} className="flex items-start">
                    <span className="mt-1 mr-2 h-2 w-2 rounded-full bg-blue-500"></span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/experiment/personas/${persona.id}`}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Start with this Customer →
              </Link>
            </article>
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <Link href="/experiment/pre" className="text-blue-600 hover:text-blue-700">
            ← Back to Questionnaire
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Persona Exploration Hub</h1>
          <p className="mt-3 text-lg text-gray-600">
            Session ID: <span className="font-mono text-gray-800">{sessionState.sessionId ?? 'validating…'}</span>
          </p>
        </div>

        {renderContent()}
      </div>
    </main>
  )
}
