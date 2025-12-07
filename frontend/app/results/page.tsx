// Research Results Dashboard - Comprehensive Analysis for Discussion
// Password-protected researcher view with meaningful metrics for thesis discussion

'use client'

import { useState, useEffect } from 'react'
import PasswordProtection from '@/components/PasswordProtection'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LayerPerformance {
  layer_number: number
  layer_name: string
  persona_id: string
  total_ratings: number
  avg_understanding: number
  stddev_understanding: number
  avg_communicability: number
  stddev_communicability: number
  avg_cognitive_load: number
  stddev_cognitive_load: number
  avg_time_seconds: number
  min_time_seconds: number
  max_time_seconds: number
}

interface SessionData {
  session_id: string
  age: number
  gender: string
  financial_relationship: string
  ai_trust_instinct: string
  ai_fairness_stance: string
  preferred_explanation_style: string
  total_layer_ratings: number
  avg_understanding: number
  avg_communicability: number
  avg_cognitive_load: number
  total_time_spent_seconds: number
  most_helpful_layer: string | null
  most_trusted_layer: string | null
  best_for_customer: string | null
  overall_intuitiveness: number | null
  ai_usefulness: number | null
  improvement_suggestions: string | null
}

interface ResearchData {
  layer_performance: LayerPerformance[]
  session_data: SessionData[]
  total_participants: number
  completed_participants: number
  total_layer_ratings: number
  demographics: {
    age_distribution: Record<string, number>
    gender_distribution: Record<string, number>
    financial_relationship_distribution: Record<string, number>
    ai_trust_distribution: Record<string, number>
    ai_fairness_distribution: Record<string, number>
    explanation_style_distribution: Record<string, number>
  }
  layer_rankings: {
    by_understanding: Array<{layer: string, score: number}>
    by_communicability: Array<{layer: string, score: number}>
    by_cognitive_load: Array<{layer: string, score: number}>
    by_preference: Array<{layer: string, count: number}>
  }
  persona_comparison: {
    maria: {avg_understanding: number, avg_communicability: number, avg_cognitive_load: number}
    jonas: {avg_understanding: number, avg_communicability: number, avg_cognitive_load: number}
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LAYER_NAMES: Record<number, string> = {
  1: 'Baseline SHAP',
  2: 'Dashboard',
  3: 'Narrative',
  4: 'Counterfactual'
}

const PERSONA_LABELS: Record<string, string> = {
  'elderly-woman': 'Maria (Approved ~60%)',
  'young-entrepreneur': 'Jonas (Rejected ~48%)'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ResearchResultsPage() {
  return (
    <PasswordProtection pageName="Research Results Dashboard">
      <ResultsDashboard />
    </PasswordProtection>
  )
}

function ResultsDashboard() {
  const [data, setData] = useState<ResearchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResearchData()
  }, [])

  const fetchResearchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/experiment/research-results`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch research data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading research data...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 mb-4">Error: {error}</p>
          <button
            onClick={fetchResearchData}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </main>
    )
  }

  const avgTime = data.layer_performance.length > 0
    ? Math.round(data.layer_performance.reduce((sum, p) => sum + p.avg_time_seconds, 0) / data.layer_performance.length)
    : 0

  const avgUnderstanding = data.layer_performance.length > 0
    ? (data.layer_performance.reduce((sum, p) => sum + p.avg_understanding, 0) / data.layer_performance.length).toFixed(2)
    : '0.00'

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Research Results Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of explanation layer effectiveness
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Participants"
            value={data.total_participants}
            subtitle={`${data.completed_participants} completed`}
            icon="👥"
          />
          <StatCard
            title="Layer Ratings"
            value={data.total_layer_ratings}
            subtitle={`${Math.round(data.total_layer_ratings / 4)} per layer avg`}
            icon="⭐"
          />
          <StatCard
            title="Avg Understanding"
            value={avgUnderstanding}
            subtitle="Out of 5.0"
            icon="🧠"
          />
          <StatCard
            title="Avg Time/Layer"
            value={`${avgTime}s`}
            subtitle="Per explanation"
            icon="⏱️"
          />
        </div>

        {/* Layer Performance Comparison */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Layer Performance Comparison
          </h2>
          <LayerComparisonTable data={data.layer_performance} />
        </section>

        {/* Layer Rankings */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Layer Rankings by Metric
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RankingCard
              title="Understanding"
              rankings={data.layer_rankings.by_understanding}
              metric="score"
            />
            <RankingCard
              title="Communicability"
              rankings={data.layer_rankings.by_communicability}
              metric="score"
            />
            <RankingCard
              title="Cognitive Load (Lower = Better)"
              rankings={data.layer_rankings.by_cognitive_load}
              metric="score"
              inverse
            />
          </div>
        </section>

        {/* Persona Comparison */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Persona-Specific Performance
          </h2>
          <PersonaComparisonChart data={data.persona_comparison} />
        </section>

        {/* Demographics */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Participant Demographics
          </h2>
          <DemographicsGrid demographics={data.demographics} />
        </section>

        {/* Layer Preferences */}
        <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Participant Preferences
          </h2>
          <PreferenceBreakdown rankings={data.layer_rankings.by_preference} />
        </section>

        {/* Qualitative Insights */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Qualitative Feedback
          </h2>
          <ImprovementSuggestions sessions={data.session_data} />
        </section>
      </div>
    </main>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({ title, value, subtitle, icon }: {
  title: string
  value: string | number
  subtitle: string
  icon: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

function LayerComparisonTable({ data }: { data: LayerPerformance[] }) {
  // Group by layer number
  const byLayer = data.reduce((acc, item) => {
    if (!acc[item.layer_number]) {
      acc[item.layer_number] = []
    }
    acc[item.layer_number].push(item)
    return acc
  }, {} as Record<number, LayerPerformance[]>)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Layer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Understanding</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Communicability</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cognitive Load</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.keys(byLayer).sort((a, b) => Number(a) - Number(b)).map(layerNum => (
            byLayer[Number(layerNum)].map((item, idx) => (
              <tr key={`${item.layer_number}-${item.persona_id}`} className="hover:bg-gray-50">
                {idx === 0 && (
                  <td rowSpan={byLayer[Number(layerNum)].length} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {LAYER_NAMES[item.layer_number] || item.layer_name}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {PERSONA_LABELS[item.persona_id] || item.persona_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.total_ratings}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.avg_understanding.toFixed(2)} <span className="text-gray-400">(±{item.stddev_understanding?.toFixed(2) || '0.00'})</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.avg_communicability.toFixed(2)} <span className="text-gray-400">(±{item.stddev_communicability?.toFixed(2) || '0.00'})</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.avg_cognitive_load.toFixed(2)} <span className="text-gray-400">(±{item.stddev_cognitive_load?.toFixed(2) || '0.00'})</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Math.round(item.avg_time_seconds)}s
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankingCard({ title, rankings, metric, inverse = false }: {
  title: string
  rankings: Array<{layer: string, score?: number, count?: number}>
  metric: 'score' | 'count'
  inverse?: boolean
}) {
  const sorted = inverse 
    ? [...rankings].sort((a, b) => (a[metric] || 0) - (b[metric] || 0))
    : [...rankings].sort((a, b) => (b[metric] || 0) - (a[metric] || 0))

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {sorted.map((item, idx) => (
          <div key={item.layer} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${
                idx === 0 ? 'text-green-600' : idx === 1 ? 'text-blue-600' : 'text-gray-400'
              }`}>
                #{idx + 1}
              </span>
              <span className="text-sm text-gray-700">{item.layer}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {metric === 'score' ? (item.score || 0).toFixed(2) : item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonaComparisonChart({ data }: {
  data: {
    maria: {avg_understanding: number, avg_communicability: number, avg_cognitive_load: number}
    jonas: {avg_understanding: number, avg_communicability: number, avg_cognitive_load: number}
  }
}) {
  const metrics = [
    { key: 'avg_understanding' as const, label: 'Understanding' },
    { key: 'avg_communicability' as const, label: 'Communicability' },
    { key: 'avg_cognitive_load' as const, label: 'Cognitive Load' }
  ]

  return (
    <div className="space-y-6">
      {metrics.map(metric => (
        <div key={metric.key}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{metric.label}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Maria (Approved)</span>
                <span className="text-sm font-semibold">{data.maria[metric.key].toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(data.maria[metric.key] / 5) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Jonas (Rejected)</span>
                <span className="text-sm font-semibold">{data.jonas[metric.key].toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(data.jonas[metric.key] / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DemographicsGrid({ demographics }: { demographics: ResearchData['demographics'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DemographicCard title="Age Distribution" data={demographics.age_distribution} />
      <DemographicCard title="Gender" data={demographics.gender_distribution} />
      <DemographicCard title="Financial Relationship" data={demographics.financial_relationship_distribution} />
      <DemographicCard title="AI Trust Instinct" data={demographics.ai_trust_distribution} />
      <DemographicCard title="AI Fairness Stance" data={demographics.ai_fairness_distribution} />
      <DemographicCard title="Preferred Explanation Style" data={demographics.explanation_style_distribution} />
    </div>
  )
}

function DemographicCard({ title, data }: { title: string, data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0)
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="font-medium text-gray-900">
              {value} ({total > 0 ? Math.round((value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreferenceBreakdown({ rankings }: { rankings: Array<{layer: string, count: number}> }) {
  const total = rankings.reduce((sum, item) => sum + item.count, 0)
  
  return (
    <div className="space-y-4">
      {rankings.map(item => (
        <div key={item.layer}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{item.layer}</span>
            <span className="text-sm text-gray-600">
              {item.count} votes ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ImprovementSuggestions({ sessions }: { sessions: SessionData[] }) {
  const suggestions = sessions
    .filter(s => s.improvement_suggestions && s.improvement_suggestions.trim().length > 0)
    .map(s => s.improvement_suggestions)

  return (
    <div className="space-y-3">
      {suggestions.length === 0 ? (
        <p className="text-gray-500 italic">No improvement suggestions yet</p>
      ) : (
        suggestions.map((suggestion, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">{suggestion}</p>
          </div>
        ))
      )}
    </div>
  )
}
