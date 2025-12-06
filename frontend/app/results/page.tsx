// Results dashboard - Researcher view for aggregated experiment data
// Protected by password - Advanced statistics for quantitative analysis

'use client'

import { useState, useEffect } from 'react'
import PasswordProtection from '@/components/PasswordProtection'

interface LayerStat {
  count: number
  understanding: number
  communicability: number
  fairness: number
  cognitive_load: number
  reliance: number
  avg_time_seconds: number
}

interface PersonaStat {
  count: number
  understanding: number
  communicability: number
  fairness: number
  cognitive_load: number
  reliance: number
}

interface DashboardStats {
  // Basic counts
  total_sessions: number
  completed_sessions: number
  total_ratings: number
  total_questionnaires: number
  total_predictions: number
  
  // Participant demographics
  participant_backgrounds: Record<string, number>
  credit_experiences: Record<string, number>
  avg_ai_familiarity: number
  preferred_explanation_styles: Record<string, number>
  
  // Layer rating averages (5 dimensions) with standard deviations
  avg_understanding: number
  avg_communicability: number
  avg_fairness: number
  avg_cognitive_load: number
  avg_reliance: number
  std_understanding: number
  std_communicability: number
  std_fairness: number
  std_cognitive_load: number
  std_reliance: number
  
  // Per-layer breakdown
  layer_stats: Record<string, LayerStat>
  
  // Per-persona breakdown
  persona_stats: Record<string, PersonaStat>
  
  // Layer preferences (all 3 questions)
  layer_preferences: Record<string, number>
  most_helpful_layer: Record<string, number>
  most_trusted_layer: Record<string, number>
  best_for_customer: Record<string, number>
  
  // Post-questionnaire averages
  avg_intuitiveness: number
  avg_usefulness: number
  improvement_suggestions: string[]
  
  // Error field (optional)
  error?: string
}

const LAYER_NAMES: Record<string, string> = {
  'layer_1': 'Layer 1: Baseline SHAP',
  'layer_2': 'Layer 2: Dashboard',
  'layer_3': 'Layer 3: Narrative',
  'layer_4': 'Layer 4: Counterfactual'
}

const PERSONA_NAMES: Record<string, string> = {
  'elderly-woman': 'Maria (Low Risk)',
  'young-entrepreneur': 'Jonas (High Risk)'
}

const BACKGROUND_LABELS: Record<string, string> = {
  'banking': 'Banking/Credit/Risk',
  'data_analytics': 'Data/Analytics/ML',
  'banking_and_analytics': 'Banking + Analytics',
  'student': 'Student',
  'other': 'Other'
}

const EXPERIENCE_LABELS: Record<string, string> = {
  'none': 'None',
  'some': 'Some',
  'regular': 'Regular',
  'expert': 'Expert'
}

const STYLE_LABELS: Record<string, string> = {
  'technical': 'Technical',
  'visual': 'Visual',
  'narrative': 'Narrative',
  'action_oriented': 'Action-oriented'
}

interface PersonaDetail {
  layers_rated: number
  questionnaire_done: boolean
  prediction_done: boolean
  layers_complete: boolean
  fully_completed: boolean
}

interface SessionData {
  session_id: string
  created_at: string
  completed: boolean
  consent_given: boolean
  participant_background: string
  credit_experience: string
  ai_familiarity: number
  ratings_count: number
  predictions_count: number
  questionnaires_count: number
  personas_completed: number
  persona_details: {
    'elderly-woman': PersonaDetail
    'young-entrepreneur': PersonaDetail
  }
}

const PERSONA_SHORT_NAMES: Record<string, string> = {
  'elderly-woman': '✅ Low Risk',
  'young-entrepreneur': '⚠️ High Risk'
}

function ResultsContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'layers' | 'personas' | 'demographics' | 'feedback' | 'manage'>('overview')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchSessions()
    }
  }, [activeTab])

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

  const fetchSessions = async () => {
    setSessionsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/admin/sessions`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    setDeleting(sessionId)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/admin/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete session')
      }
      
      // Refresh both sessions and stats
      await Promise.all([fetchSessions(), fetchDashboardStats()])
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete session:', err)
      alert('Failed to delete session. Please try again.')
    } finally {
      setDeleting(null)
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

  // Helper to render a stat with mean ± std
  const renderStatWithStd = (label: string, mean: number, std: number, color: string) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          {(mean || 0).toFixed(2)} <span className="text-gray-600 font-normal">± {(std || 0).toFixed(2)}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${((mean || 0) / 5) * 100}%` }}></div>
      </div>
    </div>
  )

  // Helper to render preference bars
  const renderPreferenceBars = (prefs: Record<string, number>, total: number, title: string) => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {['layer_1', 'layer_2', 'layer_3', 'layer_4'].map(layer => {
          const count = prefs?.[layer] || 0
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={layer}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{LAYER_NAMES[layer]}</span>
                <span className="font-semibold">{count} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with participant count always visible */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Research Results Dashboard</h1>
              <p className="text-gray-600">Quantitative analysis of XAI explanation layers experiment</p>
            </div>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
              <p className="text-sm font-medium opacity-90">Total Participants</p>
              <p className="text-3xl font-bold">{stats.total_sessions}</p>
              <p className="text-xs opacity-75">{stats.completed_sessions} completed ({completionRate}%)</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '📈 Overview' },
            { id: 'layers', label: '📊 Layer Analysis' },
            { id: 'personas', label: '👥 Persona Analysis' },
            { id: 'demographics', label: '🎯 Demographics' },
            { id: 'feedback', label: '💬 Feedback' },
            { id: 'manage', label: '🗑️ Manage Data' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <p className="text-xs font-semibold text-gray-600 uppercase">Sessions</p>
                <p className="text-2xl font-bold">{stats.total_sessions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <p className="text-xs font-semibold text-gray-600 uppercase">Completed</p>
                <p className="text-2xl font-bold">{stats.completed_sessions}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                <p className="text-xs font-semibold text-gray-600 uppercase">Ratings</p>
                <p className="text-2xl font-bold">{stats.total_ratings}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                <p className="text-xs font-semibold text-gray-600 uppercase">Questionnaires</p>
                <p className="text-2xl font-bold">{stats.total_questionnaires || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
                <p className="text-xs font-semibold text-gray-600 uppercase">Predictions</p>
                <p className="text-2xl font-bold">{stats.total_predictions || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-pink-500">
                <p className="text-xs font-semibold text-gray-600 uppercase">Completion</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>

            {/* Overall Ratings with Standard Deviations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Overall Ratings (Mean ± SD)</h2>
                <p className="text-xs text-gray-600 mb-4">n = {stats.total_ratings} ratings</p>
                <div className="space-y-4">
                  {renderStatWithStd('Understanding', stats.avg_understanding, stats.std_understanding, 'bg-blue-500')}
                  {renderStatWithStd('Communicability', stats.avg_communicability, stats.std_communicability, 'bg-green-500')}
                  {renderStatWithStd('Perceived Fairness', stats.avg_fairness, stats.std_fairness, 'bg-purple-500')}
                  {renderStatWithStd('Cognitive Load', stats.avg_cognitive_load, stats.std_cognitive_load, 'bg-orange-500')}
                  {renderStatWithStd('Reliance Intention', stats.avg_reliance, stats.std_reliance, 'bg-indigo-500')}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Post-Questionnaire Results</h2>
                <p className="text-xs text-gray-600 mb-4">n = {stats.total_questionnaires || 0} questionnaires</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Intuitiveness</p>
                    <p className="text-3xl font-bold text-blue-600">{(stats.avg_intuitiveness || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">/ 5.0</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">AI Usefulness</p>
                    <p className="text-3xl font-bold text-green-600">{(stats.avg_usefulness || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">/ 5.0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer Preferences - All 3 Questions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderPreferenceBars(stats.most_helpful_layer || {}, stats.total_questionnaires || 0, '🏆 Most Helpful Layer')}
              {renderPreferenceBars(stats.most_trusted_layer || {}, stats.total_questionnaires || 0, '🤝 Most Trusted Layer')}
              {renderPreferenceBars(stats.best_for_customer || {}, stats.total_questionnaires || 0, '💬 Best for Customer')}
            </div>
          </div>
        )}

        {/* LAYER ANALYSIS TAB */}
        {activeTab === 'layers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Per-Layer Rating Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold">Layer</th>
                      <th className="text-center py-3 px-2 font-semibold">n</th>
                      <th className="text-center py-3 px-2 font-semibold">Understanding</th>
                      <th className="text-center py-3 px-2 font-semibold">Communicability</th>
                      <th className="text-center py-3 px-2 font-semibold">Fairness</th>
                      <th className="text-center py-3 px-2 font-semibold">Cognitive Load</th>
                      <th className="text-center py-3 px-2 font-semibold">Reliance</th>
                      <th className="text-center py-3 px-2 font-semibold">Avg Time (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['layer_1', 'layer_2', 'layer_3', 'layer_4'].map((layerKey, idx) => {
                      const layer = stats.layer_stats?.[layerKey]
                      if (!layer || layer.count === 0) return null
                      return (
                        <tr key={layerKey} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-2 font-medium">{LAYER_NAMES[layerKey]}</td>
                          <td className="text-center py-3 px-2">{layer.count}</td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded ${layer.understanding >= 4 ? 'bg-green-100 text-green-800' : layer.understanding >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {layer.understanding?.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded ${layer.communicability >= 4 ? 'bg-green-100 text-green-800' : layer.communicability >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {layer.communicability?.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded ${layer.fairness >= 4 ? 'bg-green-100 text-green-800' : layer.fairness >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {layer.fairness?.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded ${layer.cognitive_load <= 2 ? 'bg-green-100 text-green-800' : layer.cognitive_load <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {layer.cognitive_load?.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded ${layer.reliance >= 4 ? 'bg-green-100 text-green-800' : layer.reliance >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {layer.reliance?.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-600">{layer.avg_time_seconds?.toFixed(0)}s</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-4">
                Color coding: <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">≥4.0 (Good)</span>{' '}
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">3.0-3.9 (Moderate)</span>{' '}
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">&lt;3.0 (Low)</span>
                {' '}| Cognitive Load: lower is better
              </p>
            </div>
          </div>
        )}

        {/* PERSONA ANALYSIS TAB */}
        {activeTab === 'personas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Per-Persona Rating Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold">Persona</th>
                      <th className="text-center py-3 px-2 font-semibold">n</th>
                      <th className="text-center py-3 px-2 font-semibold">Understanding</th>
                      <th className="text-center py-3 px-2 font-semibold">Communicability</th>
                      <th className="text-center py-3 px-2 font-semibold">Fairness</th>
                      <th className="text-center py-3 px-2 font-semibold">Cognitive Load</th>
                      <th className="text-center py-3 px-2 font-semibold">Reliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['elderly-woman', 'young-entrepreneur'].map((personaKey, idx) => {
                      const persona = stats.persona_stats?.[personaKey]
                      if (!persona || persona.count === 0) return null
                      return (
                        <tr key={personaKey} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-2 font-medium">{PERSONA_NAMES[personaKey]}</td>
                          <td className="text-center py-3 px-2">{persona.count}</td>
                          <td className="text-center py-3 px-2">{persona.understanding?.toFixed(2)}</td>
                          <td className="text-center py-3 px-2">{persona.communicability?.toFixed(2)}</td>
                          <td className="text-center py-3 px-2">{persona.fairness?.toFixed(2)}</td>
                          <td className="text-center py-3 px-2">{persona.cognitive_load?.toFixed(2)}</td>
                          <td className="text-center py-3 px-2">{persona.reliance?.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DEMOGRAPHICS TAB */}
        {activeTab === 'demographics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Background */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Professional Background</h3>
                <div className="space-y-2">
                  {Object.entries(stats.participant_backgrounds || {}).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{BACKGROUND_LABELS[key] || key}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.participant_backgrounds || {}).length === 0 && (
                    <p className="text-gray-600 text-sm">No data yet</p>
                  )}
                </div>
              </div>

              {/* Credit Experience */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Credit Experience</h3>
                <div className="space-y-2">
                  {Object.entries(stats.credit_experiences || {}).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{EXPERIENCE_LABELS[key] || key}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.credit_experiences || {}).length === 0 && (
                    <p className="text-gray-600 text-sm">No data yet</p>
                  )}
                </div>
              </div>

              {/* AI Familiarity */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">AI Familiarity</h3>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-blue-600">{(stats.avg_ai_familiarity || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Average (1-5 scale)</p>
                </div>
              </div>

              {/* Preferred Style */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Preferred Explanation Style</h3>
                <div className="space-y-2">
                  {Object.entries(stats.preferred_explanation_styles || {}).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{STYLE_LABELS[key] || key}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.preferred_explanation_styles || {}).length === 0 && (
                    <p className="text-gray-600 text-sm">No data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Improvement Suggestions ({stats.improvement_suggestions?.length || 0})
              </h2>
              {stats.improvement_suggestions && stats.improvement_suggestions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.improvement_suggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <p className="text-sm text-gray-700">"{suggestion}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No improvement suggestions collected yet.</p>
              )}
            </div>
          </div>
        )}

        {/* MANAGE DATA TAB */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Warning Banner */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-bold text-red-900">Danger Zone</h3>
                  <p className="text-sm text-red-800">
                    Deleting sessions is permanent and cannot be undone. Use this to remove test data before your actual study.
                  </p>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  All Sessions ({sessions.length})
                </h2>
                <button
                  onClick={fetchSessions}
                  disabled={sessionsLoading}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  {sessionsLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No sessions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold">Session ID</th>
                        <th className="text-left py-3 px-2 font-semibold">Created</th>
                        <th className="text-center py-3 px-2 font-semibold">Status</th>
                        <th className="text-center py-3 px-2 font-semibold">Background</th>
                        <th className="text-center py-3 px-2 font-semibold">Personas Done</th>
                        <th className="text-center py-3 px-2 font-semibold">Persona Progress</th>
                        <th className="text-right py-3 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session, idx) => (
                        <tr key={session.session_id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-2 font-mono text-xs">
                            {session.session_id.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-2 text-gray-600 text-xs">
                            {new Date(session.created_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="text-center py-3 px-2">
                            {session.completed ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Completed</span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">In Progress</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-600 text-xs">
                            {BACKGROUND_LABELS[session.participant_background] || session.participant_background || '-'}
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              session.personas_completed === 2 ? 'bg-green-100 text-green-800' :
                              session.personas_completed > 0 ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {session.personas_completed}/2
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1 justify-center flex-wrap">
                              {session.persona_details && Object.entries(session.persona_details).map(([personaId, detail]) => (
                                <div 
                                  key={personaId}
                                  className={`px-1.5 py-0.5 rounded text-xs ${
                                    detail.layers_complete ? 'bg-green-100 text-green-800' :
                                    detail.layers_rated > 0 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}
                                  title={`${PERSONA_SHORT_NAMES[personaId]}: ${detail.layers_rated}/4 layers${detail.layers_complete ? ' ✓' : ''}`}
                                >
                                  {personaId === 'elderly-woman' ? '👵' : personaId === 'young-entrepreneur' ? '👨‍💼' : '👨‍💻'}
                                  {detail.layers_rated}/4
                                  {detail.layers_complete && '✓'}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="text-right py-3 px-2">
                            {deleteConfirm === session.session_id ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => deleteSession(session.session_id)}
                                  disabled={deleting === session.session_id}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deleting === session.session_id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(session.session_id)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Summary Footer */}
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={4} className="py-3 px-2 font-bold text-right">
                          Totals ({sessions.length} sessions):
                        </td>
                        <td className="text-center py-3 px-2 font-bold">
                          {sessions.reduce((sum, s) => sum + (s.personas_completed || 0), 0)} personas
                        </td>
                        <td className="text-center py-3 px-2 font-bold text-xs">
                          {sessions.reduce((sum, s) => sum + s.ratings_count, 0)} ratings / {sessions.reduce((sum, s) => sum + s.questionnaires_count, 0)} quest.
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-900">
            <strong>📌 Note:</strong> Data updates in real-time. n = {stats.total_sessions} participants, 
            {stats.total_ratings} layer ratings, {stats.total_questionnaires || 0} post-questionnaires.
          </p>
        </div>
      </div>
    </main>
  )
}

// Wrap with password protection
export default function ResultsPage() {
  return (
    <PasswordProtection pageName="Results Dashboard">
      <ResultsContent />
    </PasswordProtection>
  )
}
