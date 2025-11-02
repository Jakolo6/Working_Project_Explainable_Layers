// Results dashboard - Researcher view for aggregated experiment data

'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  total_sessions: number
  completed_sessions: number
  total_ratings: number
  avg_trust: number
  avg_understanding: number
  avg_usefulness: number
  avg_mental_effort: number
  layer_preferences: Record<string, number>
  avg_overall_experience: number
  avg_explanation_helpfulness: number
  avg_would_trust_ai: number
}

export default function ResultsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/admin/dashboard-stats`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <p className="text-sm text-red-600">
              Make sure the backend API endpoint <code className="bg-red-100 px-2 py-1 rounded">/api/v1/admin/dashboard-stats</code> is implemented.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">No Data Available</h2>
            <p className="text-yellow-700">No experiment sessions have been completed yet.</p>
          </div>
        </div>
      </main>
    )
  }

  const completionRate = stats.total_sessions > 0 
    ? ((stats.completed_sessions / stats.total_sessions) * 100).toFixed(1)
    : '0.0'

  const topLayer = Object.entries(stats.layer_preferences).sort((a, b) => b[1] - a[1])[0]

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📊 Results Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Aggregated data from all experiment sessions
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm font-semibold text-gray-600 uppercase mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_sessions}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm font-semibold text-gray-600 uppercase mb-1">Completed</p>
            <p className="text-3xl font-bold text-gray-900">{stats.completed_sessions}</p>
            <p className="text-xs text-gray-500 mt-1">{completionRate}% completion rate</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-sm font-semibold text-gray-600 uppercase mb-1">Total Ratings</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_ratings}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-sm font-semibold text-gray-600 uppercase mb-1">Avg Trust</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avg_trust.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
          </div>
        </div>

        {/* Layer Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Average Layer Ratings</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Trust</span>
                  <span className="text-sm font-bold text-gray-900">{stats.avg_trust.toFixed(2)} / 5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.avg_trust / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Understanding</span>
                  <span className="text-sm font-bold text-gray-900">{stats.avg_understanding.toFixed(2)} / 5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.avg_understanding / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Usefulness</span>
                  <span className="text-sm font-bold text-gray-900">{stats.avg_usefulness.toFixed(2)} / 5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.avg_usefulness / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Mental Effort</span>
                  <span className="text-sm font-bold text-gray-900">{stats.avg_mental_effort.toFixed(2)} / 5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.avg_mental_effort / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Layer Preferences</h2>
            <div className="space-y-3">
              {Object.entries(stats.layer_preferences)
                .sort((a, b) => b[1] - a[1])
                .map(([layer, count]) => {
                  const percentage = stats.completed_sessions > 0 
                    ? ((count / stats.completed_sessions) * 100).toFixed(1)
                    : '0.0'
                  return (
                    <div key={layer}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{layer}</span>
                        <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
            </div>
            {topLayer && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-900">
                  <strong>Most Preferred:</strong> {topLayer[0]} ({topLayer[1]} votes)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Post-Questionnaire Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Post-Experiment Questionnaire</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase mb-2">Overall Experience</p>
              <p className="text-4xl font-bold text-blue-600">{stats.avg_overall_experience.toFixed(2)}</p>
              <p className="text-sm text-gray-500">out of 5.0</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase mb-2">Explanation Helpfulness</p>
              <p className="text-4xl font-bold text-green-600">{stats.avg_explanation_helpfulness.toFixed(2)}</p>
              <p className="text-sm text-gray-500">out of 5.0</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 uppercase mb-2">Would Trust AI</p>
              <p className="text-4xl font-bold text-purple-600">{stats.avg_would_trust_ai.toFixed(2)}</p>
              <p className="text-sm text-gray-500">out of 5.0</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <p className="text-sm text-blue-900">
            <strong>📌 Note:</strong> All data is aggregated from completed experiment sessions. 
            Ratings are averaged across all participants and all explanation layers. 
            This dashboard updates in real-time as new data is collected.
          </p>
        </div>
      </div>
    </main>
  )
}
