// Experiment completion / thank you page
// Shown after all personas are completed

'use client'

import { useEffect } from 'react'
import Link from 'next/link'

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function CompletePage() {
  useEffect(() => {
    // Clear session data on completion
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem('completed_elderly-woman')
    localStorage.removeItem('completed_young-entrepreneur')
    localStorage.removeItem('completed_middle-aged-employee')
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You for Participating!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your responses have been recorded successfully. Your contribution to this research 
            on explainable AI in financial decision-making is greatly appreciated.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              <strong>What happens next:</strong> Your anonymous data will be analyzed alongside 
              other participants' responses to understand how different explanation styles affect 
              trust and understanding of AI decisions in credit risk assessment.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Study Complete!</strong> You have successfully completed all three personas 
              and their questionnaires. Your session data has been saved.
            </p>
          </div>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
