// Layers display page - shows explanation layers sequentially with ratings

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPersona, type PersonaInfo } from '@/lib/personas'
import Layer0AllFeatures from '@/components/layers/Layer0AllFeatures'
import Layer1Minimal from '@/components/layers/Layer1Minimal'
import Layer2ShortText from '@/components/layers/Layer2ShortText'
import CounterfactualExplorer from '@/components/layers/CounterfactualExplorer'

const SESSION_STORAGE_KEY = 'experiment_session_id'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface PredictionData {
  decision: 'approved' | 'rejected'
  probability: number
  shap_features: SHAPFeature[]
  prediction_id: string
}

interface LayerRating {
  trust: number
  understanding: number
  usefulness: number
  mental_effort: number
  comment: string
  time_spent_seconds: number
}

interface LayersClientProps {
  personaId: string
}

const LAYER_NAMES = [
  'Complete SHAP Analysis',
  'Analytical Dashboard',
  'Narrative Explanation',
  'Counterfactual Analysis'
]

const TOTAL_LAYERS = 4

export default function LayersClient({ personaId }: LayersClientProps) {
  const router = useRouter()
  
  const [persona, setPersona] = useState<PersonaInfo | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0)
  const [layerStartTime, setLayerStartTime] = useState(Date.now())
  const [ratings, setRatings] = useState<LayerRating>({
    trust: 0,
    understanding: 0,
    usefulness: 0,
    mental_effort: 0,
    comment: '',
    time_spent_seconds: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load persona
    const personaData = getPersona(personaId)
    if (!personaData) {
      setError('Invalid persona')
      return
    }
    setPersona(personaData)

    // Load session ID
    if (typeof window !== 'undefined') {
      const storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY)
      if (!storedSessionId) {
        router.push('/experiment/start')
        return
      }
      setSessionId(storedSessionId)

      // Load prediction from localStorage (saved from persona detail page)
      const predictionKey = `prediction_${personaId}`
      const storedPrediction = window.localStorage.getItem(predictionKey)
      if (storedPrediction) {
        setPrediction(JSON.parse(storedPrediction))
      } else {
        setError('No prediction found. Please submit the application first.')
      }
    }
  }, [personaId, router])

  const handleRatingChange = (field: keyof LayerRating, value: number | string) => {
    setRatings({ ...ratings, [field]: value })
  }

  const handleSubmitRating = async () => {
    // Validate ratings
    if (ratings.trust === 0 || ratings.understanding === 0 || 
        ratings.usefulness === 0 || ratings.mental_effort === 0) {
      setError('Please rate all four dimensions before continuing.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const timeSpent = Math.floor((Date.now() - layerStartTime) / 1000)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/experiment/rate-layer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          persona_id: personaId,
          layer_number: currentLayerIndex + 1,
          layer_name: LAYER_NAMES[currentLayerIndex],
          trust_rating: ratings.trust,
          understanding_rating: ratings.understanding,
          usefulness_rating: ratings.usefulness,
          mental_effort_rating: ratings.mental_effort,
          comment: ratings.comment,
          time_spent_seconds: timeSpent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit rating')
      }

      // Move to next layer or complete
      if (currentLayerIndex < TOTAL_LAYERS - 1) {
        setCurrentLayerIndex(currentLayerIndex + 1)
        setLayerStartTime(Date.now())
        setRatings({
          trust: 0,
          understanding: 0,
          usefulness: 0,
          mental_effort: 0,
          comment: '',
          time_spent_seconds: 0
        })
      } else {
        // All layers completed for this persona
        // Mark persona as completed
        const completedKey = `completed_${personaId}`
        localStorage.setItem(completedKey, 'true')
        
        // Check if all personas are completed
        const allCompleted = ['elderly-woman', 'young-entrepreneur', 'middle-aged-employee']
          .every(id => localStorage.getItem(`completed_${id}`) === 'true')
        
        if (allCompleted) {
          // All personas done - go to post-experiment questionnaire
          router.push('/experiment/complete')
        } else {
          // More personas to do - return to hub
          router.push('/experiment/personas')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error && !prediction) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 mb-4">{error}</p>
          <Link href={`/experiment/personas/${personaId}`} className="text-blue-600 hover:underline">
            ← Back to Application
          </Link>
        </div>
      </main>
    )
  }

  if (!persona || !prediction || !sessionId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/experiment/personas" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Personas Hub
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {persona.name}'s Application - Explanation Layers
          </h1>
          <p className="text-gray-600">
            Review different ways the AI explains its decision. Rate each explanation.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Layer {currentLayerIndex + 1} of {TOTAL_LAYERS}
            </h2>
            <span className="text-sm text-gray-600">
              {Math.round(((currentLayerIndex + 1) / TOTAL_LAYERS) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentLayerIndex + 1) / TOTAL_LAYERS) * 100}%` }}
            />
          </div>
        </div>

        {/* Decision Recap (Collapsed) */}
        <div className={`mb-8 p-4 rounded-lg border-2 ${
          prediction.decision === 'approved' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm text-gray-700">
            <strong>AI Decision:</strong>{' '}
            <span className={prediction.decision === 'approved' ? 'text-green-700' : 'text-red-700'}>
              {prediction.decision.toUpperCase()}
            </span>{' '}
            (Model certainty: {(prediction.probability * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Current Layer Display */}
        <div className="mb-8">
          {currentLayerIndex === 0 && (
            <Layer0AllFeatures
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={prediction.shap_features}
            />
          )}
          {currentLayerIndex === 1 && (
            <Layer1Minimal
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={prediction.shap_features}
            />
          )}
          {currentLayerIndex === 2 && (
            <Layer2ShortText
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={prediction.shap_features}
            />
          )}
          {currentLayerIndex === 3 && (
            <CounterfactualExplorer
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={prediction.shap_features}
            />
          )}
        </div>

        {/* Rating Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Rate This Explanation
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Trust Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. How much do you trust this explanation? *
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange('trust', value)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                      ratings.trust === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not at all</span>
                <span>Completely</span>
              </div>
            </div>

            {/* Understanding Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. How well do you understand the AI's decision? *
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange('understanding', value)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                      ratings.understanding === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not at all</span>
                <span>Completely</span>
              </div>
            </div>

            {/* Usefulness Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                3. How useful is this explanation for your work? *
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange('usefulness', value)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                      ratings.usefulness === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not useful</span>
                <span>Very useful</span>
              </div>
            </div>

            {/* Mental Effort Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                4. How much mental effort did it take to understand? *
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange('mental_effort', value)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                      ratings.mental_effort === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very easy</span>
                <span>Very difficult</span>
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                5. Any additional comments? (Optional)
              </label>
              <textarea
                value={ratings.comment}
                onChange={(e) => handleRatingChange('comment', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={4}
                placeholder="Share any thoughts about this explanation..."
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitRating}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? 'Submitting...' 
                : currentLayerIndex < TOTAL_LAYERS - 1
                  ? 'Next Explanation →' 
                  : 'Complete This Persona →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
