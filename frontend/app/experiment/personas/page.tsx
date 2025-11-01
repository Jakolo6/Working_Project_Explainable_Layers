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
    title: 'Persona 1 · Helga (68) – Retired Bookkeeper',
    subtitle: 'Fixed pension income, cautious spender, limited digital literacy',
    context:
      'Helga managed a small bookstore for 35 years and now relies on a modest state pension. She needs a credit line to fund home renovations, but is wary of digital banking tools and wants clear, trustworthy explanations.',
    keyFactors: [
      'Stable but modest retirement income',
      'Low appetite for risk after previous investment loss',
      'Looks for human reassurance when receiving automated decisions',
    ],
  },
  {
    id: 'young-entrepreneur',
    title: 'Persona 2 · Milan (31) – Tech Entrepreneur',
    subtitle: 'Rapidly growing start-up, volatile cash flow, data-savvy decision-maker',
    context:
      'Milan co-founded a fintech start-up and is applying for a credit extension to finance expansion. He is comfortable with advanced analytics and wants explanations that connect the AI decision to tangible business metrics.',
    keyFactors: [
      'High month-to-month revenue swings due to project-based income',
      'Strong credit history but increasing leverage to fuel growth',
      'Prefers actionable, contextual comparisons to market benchmarks',
    ],
  },
  {
    id: 'middle-aged-employee',
    title: 'Persona 3 · Sara (47) – Operations Manager',
    subtitle: 'Consistent salary, family obligations, values fairness and transparency',
    context:
      'Sara supports two teenagers and recently refinanced her mortgage. She is seeking a credit increase for education expenses and wants assurance that the AI evaluates her case fairly without hidden biases.',
    keyFactors: [
      'Steady employment with mid-level management salary',
      'Balances multiple obligations: mortgage, tuition, and savings goals',
      'Sensitive to fairness due to past experience with opaque lending decisions',
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
        <section className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Choose your next persona</h2>
          <p className="text-gray-600">
            Explore each persona sequentially. For every persona, you will submit a credit application, review four
            explanation layers, and provide feedback. Your session ID ensures the research team can map your insights to
            the correct study stage.
          </p>
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
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Enter Persona Flow
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
