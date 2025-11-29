// Dataset Transparency - Narrative-driven EDA with causal analysis

'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { FEATURE_DESCRIPTIONS } from '@/lib/featureDescriptions'

interface DatasetStats {
  dataset_info?: {
    name: string
    source: string
    total_records: number
    total_attributes: number
    numerical_attributes: number
    categorical_attributes: number
    bias_features_excluded: string[]
  }
  target_distribution?: {
    good_credit: { count: number; percentage: number; label: string }
    bad_credit: { count: number; percentage: number; label: string }
    imbalance_ratio: number
    cost_matrix_note: string
  }
  feature_insights?: {
    age?: { youngest: number; oldest: number; average: number }
    credit_amount?: { smallest_dm: number; largest_dm: number; average_dm: number; median_dm: number }
    duration?: { shortest_months: number; longest_months: number; average_months: number }
  }
  numerical_summary?: Record<string, any>
  categorical_summary?: Record<string, any>
  data_quality?: {
    missing_values: string | Record<string, any>
    duplicates: number
  }
}

interface EdaImage {
  filename: string
  key: string
  url: string
  size: number
  last_modified: string
}

interface EdaImagesResponse {
  success: boolean
  count: number
  images: EdaImage[]
}

const humanizeFilename = (filename: string) =>
  filename
    .replace('.png', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export default function DatasetPage() {
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [images, setImages] = useState<EdaImage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingImages, setLoadingImages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'numeric' | 'categorical' | 'causal' | 'features'>('overview')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${apiUrl}/api/v1/admin/eda-stats`)
    if (!res.ok) {
      throw new Error('Failed to load EDA statistics')
    }
    return res.json()
  }, [apiUrl])

  const fetchImages = useCallback(() => {
    // Define all expected EDA images from eda_local.py
    const imageFilenames = [
      'target_distribution.png',
      'numerical_distributions.png',
      'categorical_distributions.png',
      'correlation_heatmap.png',
      'feature_importance.png',
      'age_distribution.png',
      'credit_amount_distribution.png',
      'duration_distribution.png'
    ]
    
    // Create image objects with URLs pointing to the new API endpoint
    return imageFilenames.map(filename => ({
      filename,
      key: filename,
      url: `${apiUrl}/api/v1/admin/eda-image/${filename}`,
      size: 0, // Size not available without listing
      last_modified: new Date().toISOString() // Placeholder
    }))
  }, [apiUrl])

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const statsData = await fetchStats()
      const imagesData = fetchImages() // Not async, just returns array
      setStats(statsData)
      setImages(imagesData)
    } catch (err) {
      console.error('Failed to load EDA data:', err)
      setError('EDA data not yet generated. Please run the EDA script from the admin panel.')
    } finally {
      setLoading(false)
    }
  }, [fetchStats, fetchImages])

  const refreshImagesOnly = useCallback(async () => {
    try {
      setLoadingImages(true)
      setError(null)
      const imagesData = await fetchImages()
      setImages(imagesData)
    } catch (err) {
      console.error('Failed to refresh EDA images:', err)
      setError('Unable to refresh EDA visualizations. Re-run generation from admin panel if issue persists.')
    } finally {
      setLoadingImages(false)
    }
  }, [fetchImages])

  useEffect(() => {
    refreshAllData()
  }, [refreshAllData])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshImagesOnly()
    }, 45 * 60 * 1000) // refresh presigned URLs every 45 minutes
    return () => clearInterval(interval)
  }, [refreshImagesOnly])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Understanding Credit Risk</h1>
            <p className="text-xl text-gray-600">
              A data-driven journey through what makes creditworthy applicants
            </p>
          </div>
          <button
            type="button"
            onClick={refreshImagesOnly}
            className="self-start rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
            disabled={loadingImages}
          >
            {loadingImages ? 'Refreshing…' : 'Refresh Visualizations'}
          </button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading dataset statistics and visualizations…</p>
          </div>
        )}

        {/* Introduction - Why This Matters */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Why Creditworthiness Prediction Matters</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Every day, millions of people apply for loans to buy homes, start businesses, or handle emergencies. 
            Banks must decide: <strong>who can repay, and who might default?</strong> This decision affects lives.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            The German Credit Risk Dataset contains <strong>1,000 real credit applications</strong> with 20 financial 
            and personal attributes. By analyzing patterns in this data, we can build AI models that make 
            <strong className="text-blue-700"> fair, explainable, and accurate</strong> credit decisions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            This page takes you through a <strong>data-driven story</strong>: from understanding risk patterns → 
            identifying key drivers → ensuring fairness → preparing for model training.
          </p>
        </div>

        {error && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4">
              Please run EDA generation from the admin panel to see dataset statistics.
            </p>
            <Link 
              href="/admin"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Go to Admin Panel →
            </Link>
          </div>
        )}

        {stats?.dataset_info && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Dataset Overview</h2>
            <p className="text-gray-600 mb-6 italic">
              "Before we dive into patterns, let's understand what data we're working with."
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-2">
                  <strong>Name:</strong> {stats.dataset_info.name || 'German Credit Dataset'}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Source:</strong> {stats.dataset_info.source || 'UCI Machine Learning Repository'}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Total Records:</strong> {stats.dataset_info.total_records?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-700 mb-2">
                  <strong>Total Features:</strong> {stats.dataset_info.total_features || 'N/A'}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Numerical:</strong> {stats.dataset_info.numerical_features || 0} features
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Categorical:</strong> {stats.dataset_info.categorical_features || 0} features
                </p>
              </div>
            </div>
            
            {stats.dataset_info.bias_features_excluded?.length > 0 && (
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Bias Prevention</p>
                <p className="text-sm text-blue-800">
                  Excluded features: {stats.dataset_info.bias_features_excluded.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}


        {stats?.target_distribution && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">⚖️ The Risk Balance</h2>
            <p className="text-gray-600 mb-6 italic">
              "Not all applicants are equal. Understanding the balance between good and bad credit is crucial for fair AI."
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <div className="text-sm text-green-700 mb-2">Good Credit</div>
                <div className="text-3xl font-bold text-green-900">
                  {stats.target_distribution.good_credit?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {stats.target_distribution.good_credit_rate ? (stats.target_distribution.good_credit_rate * 100).toFixed(1) : 'N/A'}% of total
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <div className="text-sm text-red-700 mb-2">Bad Credit</div>
                <div className="text-3xl font-bold text-red-900">
                  {stats.target_distribution.bad_credit?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {stats.target_distribution.bad_credit_rate ? (stats.target_distribution.bad_credit_rate * 100).toFixed(1) : 'N/A'}% of total
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Imbalance Ratio:</strong> {stats.target_distribution.good_credit && stats.target_distribution.bad_credit ? (stats.target_distribution.good_credit / stats.target_distribution.bad_credit).toFixed(2) : 'N/A'}:1
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                Class imbalance reflects real-world lending patterns
              </p>
              <p className="text-sm text-yellow-800 mt-3 font-semibold">
                💡 What this means: The dataset reflects real-world lending — most applicants are creditworthy, 
                but the model must carefully identify the 30% who might default.
              </p>
            </div>
          </div>
        )}

        {stats?.key_insights && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Key Insights</h2>
            <p className="text-gray-600 mb-6 italic">
              "Understanding the differences between good and bad credit applicants."
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-lg mb-3">Average Age</h3>
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Good Credit:</strong> {stats.key_insights?.avg_age_good?.toFixed(1) || 'N/A'} years
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Bad Credit:</strong> {stats.key_insights?.avg_age_bad?.toFixed(1) || 'N/A'} years
                </p>
              </div>
              
              <div className="border-l-4 border-green-600 pl-4">
                <h3 className="font-semibold text-lg mb-3">Average Credit Amount</h3>
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Good Credit:</strong> {stats.key_insights?.avg_amount_good?.toLocaleString() || 'N/A'} DM
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Bad Credit:</strong> {stats.key_insights?.avg_amount_bad?.toLocaleString() || 'N/A'} DM
                </p>
              </div>
              
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-semibold text-lg mb-3">Average Duration</h3>
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Good Credit:</strong> {stats.key_insights?.avg_duration_good?.toFixed(1) || 'N/A'} months
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Bad Credit:</strong> {stats.key_insights?.avg_duration_bad?.toFixed(1) || 'N/A'} months
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Anomaly Discovery Section */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🔬</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-amber-900 mb-4">Research Finding: Historical Data Anomaly</h2>
              <p className="text-amber-800 mb-4">
                During our deep alignment analysis, we discovered a <strong>counterintuitive pattern</strong> in 
                the &apos;credit_history&apos; feature that contradicts modern credit risk intuition.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-amber-200 mb-4">
                <h3 className="font-semibold text-amber-900 mb-3">Observed Default Rates by Credit History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-amber-100">
                        <th className="px-4 py-2 text-left font-semibold text-amber-900">Credit History</th>
                        <th className="px-4 py-2 text-center font-semibold text-amber-900">Default Rate</th>
                        <th className="px-4 py-2 text-center font-semibold text-amber-900">Samples</th>
                        <th className="px-4 py-2 text-left font-semibold text-amber-900">Expected vs Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-amber-100">
                        <td className="px-4 py-2 font-medium">critical</td>
                        <td className="px-4 py-2 text-center text-green-700 font-bold">17.1%</td>
                        <td className="px-4 py-2 text-center">293</td>
                        <td className="px-4 py-2 text-red-600">Expected: HIGHEST risk → Actual: LOWEST</td>
                      </tr>
                      <tr className="border-b border-amber-100">
                        <td className="px-4 py-2 font-medium">delayed_past</td>
                        <td className="px-4 py-2 text-center text-yellow-700 font-bold">31.8%</td>
                        <td className="px-4 py-2 text-center">88</td>
                        <td className="px-4 py-2 text-amber-600">Expected: High risk → Actual: Medium</td>
                      </tr>
                      <tr className="border-b border-amber-100">
                        <td className="px-4 py-2 font-medium">existing_paid</td>
                        <td className="px-4 py-2 text-center text-yellow-700 font-bold">31.9%</td>
                        <td className="px-4 py-2 text-center">530</td>
                        <td className="px-4 py-2 text-green-600">As expected: Medium risk</td>
                      </tr>
                      <tr className="border-b border-amber-100">
                        <td className="px-4 py-2 font-medium">all_paid</td>
                        <td className="px-4 py-2 text-center text-orange-700 font-bold">57.1%</td>
                        <td className="px-4 py-2 text-center">49</td>
                        <td className="px-4 py-2 text-red-600">Expected: LOWEST risk → Actual: High</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">no_credits</td>
                        <td className="px-4 py-2 text-center text-red-700 font-bold">62.5%</td>
                        <td className="px-4 py-2 text-center">40</td>
                        <td className="px-4 py-2 text-red-600">Expected: Low risk → Actual: HIGHEST</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2">🤔 Why This Happened</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>Selection Bias:</strong> Banks in 1994 were more cautious with &apos;critical&apos; applicants</li>
                    <li>• <strong>Smaller Loans:</strong> Risky applicants received smaller, safer loans</li>
                    <li>• <strong>More Oversight:</strong> High-risk applicants had stricter monitoring</li>
                    <li>• <strong>Overconfidence:</strong> &apos;all_paid&apos; applicants may have over-borrowed</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2">📚 Research Implications</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• The model <strong>correctly learns</strong> from historical data</li>
                    <li>• SHAP values <strong>accurately reflect</strong> what the model learned</li>
                    <li>• This demonstrates why <strong>XAI is crucial</strong> for understanding AI</li>
                    <li>• Historical patterns may not match modern intuition</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Transparency Note:</strong> This anomaly is intentionally preserved for research purposes. 
                  Features marked with ⚠ in explanations may show unexpected risk directions. 
                  This is a valuable example of why explainable AI matters in real-world applications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!loading && !error && images.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Visual Data Story</h2>
            <p className="text-gray-600 mb-6">
              Explore patterns through interactive visualizations. Each chart reveals insights about what drives credit decisions.
            </p>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('numeric')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'numeric'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Numeric Features
              </button>
              <button
                onClick={() => setActiveTab('categorical')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'categorical'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Categorical Features
              </button>
              <button
                onClick={() => setActiveTab('causal')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'causal'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Causal Analysis
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'features'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Feature Dictionary
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Overview Insight:</strong> The dataset shows clear patterns — applicants with stable 
                    employment, higher savings, and shorter loan durations are more likely to be approved.
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Numerical Features</h3>
                    <p className="text-sm text-gray-600">Age, credit amount, and duration distributions reveal key patterns in creditworthiness.</p>
                    <p className="text-xs text-blue-600 mt-2">→ View in Numeric Features tab</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="text-2xl mb-2">📋</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Categorical Features</h3>
                    <p className="text-sm text-gray-600">Employment, savings, and housing status show clear approval patterns.</p>
                    <p className="text-xs text-green-600 mt-2">→ View in Categorical Features tab</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <div className="text-2xl mb-2">🔗</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Causal Analysis</h3>
                    <p className="text-sm text-gray-600">Feature importance and outcome relationships guide model decisions.</p>
                    <p className="text-xs text-purple-600 mt-2">→ View in Causal Analysis tab</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'numeric' && (
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                  <p className="text-sm text-green-900">
                    <strong>💡 Numeric Insight:</strong> Shorter loan durations and lower credit amounts correlate with approval. 
                    Older applicants (more experience) show better repayment patterns.
                  </p>
                </div>
                <div className="space-y-8">
                  {images.filter(img => img.filename.includes('numerical') || img.filename.includes('correlation')).map((image) => (
                    <div key={image.filename} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900">{humanizeFilename(image.filename)}</h3>
                        <p className="text-gray-600 mt-2">Click image to view full size in new tab</p>
                      </div>
                      <div className="p-6">
                        <a href={image.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group">
                          <img 
                            src={image.url} 
                            alt={humanizeFilename(image.filename)} 
                            className="w-full h-auto rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]" 
                            style={{ minHeight: '400px', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categorical' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                  <p className="text-sm text-purple-900">
                    <strong>💡 Categorical Insight:</strong> Checking account status and credit history are the strongest 
                    categorical predictors. Having savings and stable employment dramatically increases approval odds.
                  </p>
                </div>
                <div className="space-y-8">
                  {images.filter(img => img.filename.includes('categorical')).map((image) => (
                    <div key={image.filename} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900">{humanizeFilename(image.filename)}</h3>
                        <p className="text-gray-600 mt-2">Click image to view full size in new tab</p>
                      </div>
                      <div className="p-6">
                        <a href={image.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group">
                          <img 
                            src={image.url} 
                            alt={humanizeFilename(image.filename)} 
                            className="w-full h-auto rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]" 
                            style={{ minHeight: '400px', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'causal' && (
              <div className="space-y-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-sm text-red-900">
                    <strong>💡 Causal Insight:</strong> Statistical tests (Chi-square, Point-biserial correlation) reveal 
                    which features <em>truly drive</em> credit outcomes vs. those that merely correlate.
                  </p>
                </div>
                <div className="space-y-8">
                  {images.filter(img => img.filename.includes('importance') || img.filename.includes('outcome')).map((image) => (
                    <div key={image.filename} className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900">{humanizeFilename(image.filename)}</h3>
                        <p className="text-gray-600 mt-2">Click image to view full size in new tab</p>
                      </div>
                      <div className="p-6">
                        <a href={image.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group">
                          <img 
                            src={image.url} 
                            alt={humanizeFilename(image.filename)} 
                            className="w-full h-auto rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]" 
                            style={{ minHeight: '400px', objectFit: 'contain' }}
                          />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Top Drivers Summary */}
                <div className="bg-white border-2 border-gray-300 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Top 5 Statistical Drivers</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-gray-700"><strong>Checking Status:</strong> Direct proof of financial stability</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <p className="text-gray-700"><strong>Credit History:</strong> Past behavior predicts future behavior</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-700"><strong>Duration:</strong> Longer loans = more risk exposure</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-700"><strong>Credit Amount:</strong> Larger amounts = harder to repay</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-gray-700"><strong>Savings Status:</strong> Proxy for financial discipline</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>📖 Feature Dictionary:</strong> Understanding what each feature means is crucial for interpreting AI decisions. Here's your complete guide to every data point.
                  </p>
                </div>
                
                <div className="grid gap-6">
                  {Object.entries(FEATURE_DESCRIPTIONS).map(([key, feature]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.name}
                      </h3>
                      <p className="text-gray-700 mb-3">
                        {feature.description}
                      </p>
                      
                      {feature.values && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Possible Values:</h4>
                          <div className="space-y-1">
                            {Object.entries(feature.values).map(([valueKey, valueDesc]) => (
                              <div key={valueKey} className="text-sm">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">
                                  {valueKey}
                                </span>
                                <span className="text-gray-600 ml-2">– {valueDesc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 How to Use This Information</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• <strong>In Layer 0:</strong> Hover over any feature name to see its description</p>
                    <p>• <strong>In other layers:</strong> Feature names with dotted underlines have tooltips</p>
                    <p>• <strong>For research:</strong> Use this dictionary to understand what drives AI decisions</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fairness Guardrails */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-8 border border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🛡️ Fairness Guardrails</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            <strong>Responsible AI requires excluding biased features.</strong> We removed attributes that could lead to 
            discriminatory decisions:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <p className="font-semibold text-gray-900 mb-2">❌ Excluded: Personal Status & Sex</p>
              <p className="text-sm text-gray-600">Gender should not influence creditworthiness</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <p className="font-semibold text-gray-900 mb-2">❌ Excluded: Foreign Worker Status</p>
              <p className="text-sm text-gray-600">Nationality should not determine credit access</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            By focusing on <strong className="text-green-700">financial behavior</strong> (savings, employment, credit history) 
            rather than demographics, we ensure the model makes fair, merit-based decisions.
          </p>
        </div>

        {/* Model Readiness Preview */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Preparing for Model Training</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            With patterns identified and fairness ensured, the dataset is ready for machine learning. 
            Here's how we prepare the data:
          </p>
          
          <div className="bg-white rounded-lg p-6 mb-4 border border-indigo-300">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Preprocessing Pipeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-semibold text-gray-900">Categorical Encoding</p>
                  <p className="text-sm text-gray-600">One-hot encoding for categorical features (checking_status, credit_history, etc.)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-semibold text-gray-900">Numerical Scaling</p>
                  <p className="text-sm text-gray-600">StandardScaler for numerical features (age, credit_amount, duration)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-semibold text-gray-900">Feature Preservation</p>
                  <p className="text-sm text-gray-600">Raw features kept for SHAP explainability</p>
                </div>
              </div>
            </div>
          </div>

          <Link 
            href="/model"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Next: Model Performance →
          </Link>
        </div>

        {/* Human Takeaway */}
        <div className="bg-gray-900 text-white rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">📖 The Human Takeaway</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            The analysis reveals that <strong className="text-blue-400">financial stability indicators</strong> — such as 
            savings balance, employment length, and loan size — are the strongest predictors of creditworthiness. 
            These insights guide the features used in the upcoming model training step, ensuring our AI makes 
            <strong className="text-green-400"> fair, transparent, and accurate</strong> credit decisions based on 
            what truly matters: <em>financial behavior, not demographics</em>.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Home
          </Link>
          <Link 
            href="/model"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Next: Model Performance →
          </Link>
        </div>
      </div>
    </main>
  )
}
