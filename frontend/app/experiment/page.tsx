// Main experiment page for credit application testing

'use client'

import { useState } from 'react'
import axios from 'axios'

interface ExplanationData {
  feature: string
  value: number
  contribution: number
}

interface PredictionResponse {
  decision: string
  probability: number
  explanation_layer: string
  explanation: ExplanationData[]
  session_id: string
}

export default function ExperimentPage() {
  const [formData, setFormData] = useState({
    age: 30,
    employment_duration: 24,
    income: 3000,
    credit_amount: 5000,
    duration: 24,
    existing_credits: 1,
    dependents: 0,
    housing: 'own',
    job: 'skilled',
    purpose: 'car'
  })

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [ratings, setRatings] = useState({
    trust_rating: 4,
    understanding_rating: 4,
    usefulness_rating: 4,
    mental_effort_rating: 4
  })
  
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['age', 'employment_duration', 'income', 'credit_amount', 'duration', 'existing_credits', 'dependents'].includes(name)
        ? Number(value)
        : value
    }))
  }

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRatings(prev => ({
      ...prev,
      [name]: Number(value)
    }))
  }

  const handlePredict = async () => {
    setLoading(true)
    try {
      const response = await axios.post(`${apiUrl}/api/v1/experiment/predict`, formData)
      setPrediction(response.data)
      setSubmitted(false)
    } catch (error) {
      console.error('Prediction error:', error)
      alert('Failed to get prediction. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!prediction) return

    setLoading(true)
    try {
      const responseData = {
        session_id: prediction.session_id,
        decision: prediction.decision,
        probability: prediction.probability,
        explanation_layer: prediction.explanation_layer,
        ...ratings
      }

      await axios.post(`${apiUrl}/api/v1/experiment/response`, responseData)
      setSubmitted(true)
      alert('Feedback submitted successfully!')
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit feedback. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Credit Application Experiment</h1>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Application Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="18"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Employment Duration (months)</label>
              <input
                type="number"
                name="employment_duration"
                value={formData.employment_duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monthly Income</label>
              <input
                type="number"
                name="income"
                value={formData.income}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Credit Amount</label>
              <input
                type="number"
                name="credit_amount"
                value={formData.credit_amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (months)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="72"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Existing Credits</label>
              <input
                type="number"
                name="existing_credits"
                value={formData.existing_credits}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dependents</label>
              <input
                type="number"
                name="dependents"
                value={formData.dependents}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Housing</label>
              <select
                name="housing"
                value={formData.housing}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="own">Own</option>
                <option value="rent">Rent</option>
                <option value="free">Free</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Job Type</label>
              <select
                name="job"
                value={formData.job}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="skilled">Skilled</option>
                <option value="unskilled">Unskilled</option>
                <option value="management">Management</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Purpose</label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="car">Car</option>
                <option value="education">Education</option>
                <option value="furniture">Furniture</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Get Credit Decision'}
          </button>
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">AI Decision</h2>
            
            <div className={`p-4 rounded-md mb-4 ${
              prediction.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-bold text-lg">
                Decision: {prediction.decision.toUpperCase()}
              </p>
              <p className="text-sm mt-1">
                Confidence: {(prediction.probability * 100).toFixed(1)}%
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Explanation Layer: <span className="font-medium">{prediction.explanation_layer}</span>
              </p>
              
              <h3 className="font-semibold mb-2">Top Contributing Factors:</h3>
              <div className="space-y-2">
                {prediction.explanation.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{exp.feature}</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Value: {exp.value.toFixed(2)}</span>
                      <span className={`ml-4 text-sm font-semibold ${
                        exp.contribution > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {exp.contribution > 0 ? '+' : ''}{exp.contribution.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Sliders */}
            {!submitted && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Please rate your experience:</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Trust in AI Decision (1=Not at all, 7=Completely)
                    </label>
                    <input
                      type="range"
                      name="trust_rating"
                      min="1"
                      max="7"
                      value={ratings.trust_rating}
                      onChange={handleRatingChange}
                      className="w-full"
                    />
                    <div className="text-center font-semibold">{ratings.trust_rating}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Understanding of Explanation (1=Poor, 7=Excellent)
                    </label>
                    <input
                      type="range"
                      name="understanding_rating"
                      min="1"
                      max="7"
                      value={ratings.understanding_rating}
                      onChange={handleRatingChange}
                      className="w-full"
                    />
                    <div className="text-center font-semibold">{ratings.understanding_rating}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Usefulness of Explanation (1=Not useful, 7=Very useful)
                    </label>
                    <input
                      type="range"
                      name="usefulness_rating"
                      min="1"
                      max="7"
                      value={ratings.usefulness_rating}
                      onChange={handleRatingChange}
                      className="w-full"
                    />
                    <div className="text-center font-semibold">{ratings.usefulness_rating}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mental Effort Required (1=Very low, 7=Very high)
                    </label>
                    <input
                      type="range"
                      name="mental_effort_rating"
                      min="1"
                      max="7"
                      value={ratings.mental_effort_rating}
                      onChange={handleRatingChange}
                      className="w-full"
                    />
                    <div className="text-center font-semibold">{ratings.mental_effort_rating}</div>
                  </div>
                </div>

                <button
                  onClick={handleSubmitFeedback}
                  disabled={loading}
                  className="mt-6 w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}

            {submitted && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                <p className="text-green-800 font-semibold">Thank you! Your feedback has been recorded.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
