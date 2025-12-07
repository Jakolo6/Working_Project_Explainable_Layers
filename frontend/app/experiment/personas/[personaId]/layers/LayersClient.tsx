// Layers display page - shows explanation layers sequentially with ratings

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPersona, type PersonaInfo } from '@/lib/personas'
import Layer1Baseline from '@/components/layers/Layer1Baseline'
import Layer2Dashboard from '@/components/layers/Layer2Dashboard'
import Layer3Narrative from '@/components/layers/Layer3Narrative'
import Layer4Counterfactual from '@/components/layers/Layer4Counterfactual'

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
  understanding: number
  communicability: number
  cognitive_load: number
  comment: string
  time_spent_seconds: number
}

interface LayersClientProps {
  personaId: string
}

const LAYER_NAMES = [
  'Baseline SHAP Explanation',
  'Interactive Dashboard',
  'Narrative Explanation',
  'Counterfactual Analysis'
]

const TOTAL_LAYERS = 4

// Features to hide from the explanation interface (still in model, just not displayed)
// These features add cognitive load without providing clear actionable insights
const HIDDEN_FEATURES = [
  'Credit History',
  'Existing Credits',
  'Number of Dependents',
  'Years at Residence',
  'Other Debtors/Guarantors',
  'Other Payment Plans',
  // Also match potential variations
  'credit_history',
  'existing_credits',
  'num_dependents',
  'residence_since',
  'other_debtors',
  'other_payment_plans',
]

// Filter out hidden features from SHAP features array
function filterShapFeatures(features: SHAPFeature[]): SHAPFeature[] {
  return features.filter(f => {
    const featureLower = f.feature.toLowerCase()
    return !HIDDEN_FEATURES.some(hidden => 
      featureLower.includes(hidden.toLowerCase()) || 
      hidden.toLowerCase().includes(featureLower)
    )
  })
}

export default function LayersClient({ personaId }: LayersClientProps) {
  const router = useRouter()
  
  const [persona, setPersona] = useState<PersonaInfo | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0)
  const [layerStartTime, setLayerStartTime] = useState(Date.now())
  const [ratings, setRatings] = useState<LayerRating>({
    understanding: 0,
    communicability: 0,
    cognitive_load: 0,
    comment: '',
    time_spent_seconds: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Scroll to top when component loads
    window.scrollTo({ top: 0, behavior: 'instant' })
    
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

  // Scroll to top whenever layer changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentLayerIndex])

  const handleRatingChange = (field: keyof LayerRating, value: number | string) => {
    setRatings({ ...ratings, [field]: value })
  }

  const handleSubmitRating = async () => {
    // Validate ratings
    if (ratings.understanding === 0 || ratings.communicability === 0 || 
        ratings.cognitive_load === 0) {
      setError('Please rate all three dimensions before continuing.')
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
          understanding_rating: ratings.understanding,
          communicability_rating: ratings.communicability,
          cognitive_load_rating: ratings.cognitive_load,
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
          understanding: 0,
          communicability: 0,
          cognitive_load: 0,
          comment: '',
          time_spent_seconds: 0
        })
        // Scroll to top of page when moving to next layer (useEffect will handle this)
        // Removed manual scroll here as useEffect on currentLayerIndex handles it
      } else {
        // All layers completed for this persona
        // Navigate to per-persona questionnaire (which will mark as completed after submission)
        router.push(`/experiment/personas/${personaId}/questionnaire`)
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

        {/* Current Layer Display */}
        <div className="mb-8">
          {currentLayerIndex === 0 && (
            <Layer1Baseline
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={filterShapFeatures(prediction.shap_features)}
            />
          )}
          {currentLayerIndex === 1 && (
            <Layer2Dashboard
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={filterShapFeatures(prediction.shap_features)}
            />
          )}
          {currentLayerIndex === 2 && (
            <Layer3Narrative
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={filterShapFeatures(prediction.shap_features)}
            />
          )}
          {currentLayerIndex === 3 && (
            <Layer4Counterfactual
              decision={prediction.decision}
              probability={prediction.probability}
              shapFeatures={filterShapFeatures(prediction.shap_features)}
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
            {/* Understanding Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. This explanation helped me understand why the decision was made. *
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
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Strongly disagree</span>
                <span>Strongly agree</span>
              </div>
            </div>

            {/* Communicability Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. I could use this explanation to communicate the decision to an applicant or stakeholder. *
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange('communicability', value)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                      ratings.communicability === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Strongly disagree</span>
                <span>Strongly agree</span>
              </div>
            </div>

            {/* Cognitive Load Rating (Inverted: 1=Hard, 5=Easy) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                3. The explanation was easy to understand without much mental effort. *
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange('cognitive_load', value)}
                    className={`flex-1 py-3 rounded-lg border-2 font-semibold transition ${
                      ratings.cognitive_load === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Strongly disagree (Very hard)</span>
                <span>Strongly agree (Very easy)</span>
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                4. What was the most helpful or least helpful aspect of this explanation? (Optional)
              </label>
              <textarea
                value={ratings.comment}
                onChange={(e) => handleRatingChange('comment', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="Share what worked well or what could be improved..."
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
