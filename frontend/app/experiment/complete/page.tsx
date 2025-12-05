// Experiment completion / thank you page
// Shown after completing personas (all or partial)

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const SESSION_STORAGE_KEY = 'experiment_session_id'

export default function CompletePage() {
  const [completedCount, setCompletedCount] = useState(0)
  const [isMarking, setIsMarking] = useState(true)

  useEffect(() => {
    const markSessionComplete = async () => {
      // Count completed personas
      let count = 0
      if (localStorage.getItem('completed_elderly-woman') === 'true') count++
      if (localStorage.getItem('completed_young-entrepreneur') === 'true') count++
      setCompletedCount(count)

      // Mark session as complete in backend
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
      if (sessionId) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          await fetch(`${apiUrl}/api/v1/experiment/session/${sessionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          console.error('Failed to mark session complete:', error)
        }
      }

      // Clear session data
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem('completed_elderly-woman')
      localStorage.removeItem('completed_young-entrepreneur')
      
      setIsMarking(false)
    }

    markSessionComplete()
  }, [])

  if (isMarking) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Saving your responses...</p>
        </div>
      </main>
    )
  }

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
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Study Complete!</strong> You completed {completedCount} of 3 personas.
              {completedCount === 3 
                ? ' Amazing work completing all personas!' 
                : ' Every completed persona helps our research.'}
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              <strong>What happens next:</strong> Your anonymous data will be analyzed alongside 
              other participants' responses to understand how different explanation styles affect 
              trust and understanding of AI decisions in credit risk assessment.
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
