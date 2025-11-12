// Dataset Transparency - Narrative-driven EDA with causal analysis

'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'numeric' | 'categorical' | 'causal'>('overview')

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
                <div className="grid gap-6 md:grid-cols-2">
                  {images.map((image) => (
                    <figure key={image.filename} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                      <figcaption className="mb-3 text-lg font-semibold text-gray-800">
                        {humanizeFilename(image.filename)}
                      </figcaption>
                      <div className="overflow-hidden rounded border bg-white">
                        <img
                          src={image.url}
                          alt={humanizeFilename(image.filename)}
                          className="h-auto w-full"
                          loading="lazy"
                          onError={(event) => {
                            const target = event.currentTarget
                            target.alt = 'Visualization unavailable. Please refresh or regenerate from the admin panel.'
                            target.src = ''
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Generated: {new Date(image.last_modified).toLocaleString()} • Size: {(image.size / 1024).toFixed(2)} KB
                      </p>
                    </figure>
                  ))}
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
                {images.filter(img => img.filename.includes('numerical')).map((image) => (
                  <div key={image.filename} className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="mb-4 text-xl font-semibold text-gray-800">{humanizeFilename(image.filename)}</h3>
                    <a href={image.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                      <img src={image.url} alt={humanizeFilename(image.filename)} className="w-full rounded-lg hover:opacity-90 transition-opacity" />
                    </a>
                  </div>
                ))}
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
                {images.filter(img => img.filename.includes('categorical')).map((image) => (
                  <div key={image.filename} className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="mb-4 text-xl font-semibold text-gray-800">{humanizeFilename(image.filename)}</h3>
                    <a href={image.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                      <img src={image.url} alt={humanizeFilename(image.filename)} className="w-full rounded-lg hover:opacity-90 transition-opacity" />
                    </a>
                  </div>
                ))}
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
                {images.filter(img => img.filename.includes('importance') || img.filename.includes('outcome')).map((image) => (
                  <div key={image.filename} className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="mb-4 text-xl font-semibold text-gray-800">{humanizeFilename(image.filename)}</h3>
                    <a href={image.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                      <img src={image.url} alt={humanizeFilename(image.filename)} className="w-full rounded-lg hover:opacity-90 transition-opacity" />
                    </a>
                  </div>
                ))}
                
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
