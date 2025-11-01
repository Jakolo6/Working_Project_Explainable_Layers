// Dataset page - Real EDA statistics from German Credit Dataset

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const fetchStats = useCallback(async () => {
    const res = await fetch(`${apiUrl}/api/v1/admin/eda-stats`)
    if (!res.ok) {
      throw new Error('Failed to load EDA statistics')
    }
    return res.json()
  }, [apiUrl])

  const fetchImages = useCallback(async () => {
    const res = await fetch(`${apiUrl}/api/v1/admin/eda-images`)
    if (!res.ok) {
      throw new Error('Failed to load EDA visualizations')
    }
    const data = await res.json()
    return (data?.images ?? []) as EdaImage[]
  }, [apiUrl])

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsData, imagesData] = await Promise.all([fetchStats(), fetchImages()])
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dataset Transparency</h1>
            <p className="text-xl text-gray-600">
              Comprehensive exploratory data analysis of the German Credit Risk Dataset
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dataset Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-700 mb-2">
                  <strong>Name:</strong> {stats.dataset_info.name}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Source:</strong> {stats.dataset_info.source}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Total Records:</strong> {stats.dataset_info.total_records.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-700 mb-2">
                  <strong>Total Attributes:</strong> {stats.dataset_info.total_attributes}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Numerical:</strong> {stats.dataset_info.numerical_attributes} attributes
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Categorical:</strong> {stats.dataset_info.categorical_attributes} attributes
                </p>
              </div>
            </div>
            
            {stats.dataset_info.bias_features_excluded.length > 0 && (
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Target Distribution</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <div className="text-sm text-green-700 mb-2">Good Credit ({stats.target_distribution.good_credit.label})</div>
                <div className="text-3xl font-bold text-green-900">
                  {stats.target_distribution.good_credit.count.toLocaleString()}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {stats.target_distribution.good_credit.percentage.toFixed(1)}% of total
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
                <div className="text-sm text-red-700 mb-2">Bad Credit ({stats.target_distribution.bad_credit.label})</div>
                <div className="text-3xl font-bold text-red-900">
                  {stats.target_distribution.bad_credit.count.toLocaleString()}
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {stats.target_distribution.bad_credit.percentage.toFixed(1)}% of total
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Imbalance Ratio:</strong> {stats.target_distribution.imbalance_ratio.toFixed(2)}:1
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                {stats.target_distribution.cost_matrix_note}
              </p>
            </div>
          </div>
        )}

        {stats?.feature_insights && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Feature Insights</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {stats.feature_insights.age && (
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-lg mb-3">Age Distribution</h3>
                  <p className="text-gray-700 text-sm mb-1">
                    <strong>Range:</strong> {stats.feature_insights.age.youngest} - {stats.feature_insights.age.oldest} years
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Average:</strong> {stats.feature_insights.age.average.toFixed(1)} years
                  </p>
                </div>
              )}
              
              {stats.feature_insights.credit_amount && (
                <div className="border-l-4 border-green-600 pl-4">
                  <h3 className="font-semibold text-lg mb-3">Credit Amount</h3>
                  <p className="text-gray-700 text-sm mb-1">
                    <strong>Range:</strong> {stats.feature_insights.credit_amount.smallest_dm.toLocaleString()} - {stats.feature_insights.credit_amount.largest_dm.toLocaleString()} DM
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    <strong>Average:</strong> {stats.feature_insights.credit_amount.average_dm.toLocaleString()} DM
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Median:</strong> {stats.feature_insights.credit_amount.median_dm.toLocaleString()} DM
                  </p>
                </div>
              )}
              
              {stats.feature_insights.duration && (
                <div className="border-l-4 border-purple-600 pl-4">
                  <h3 className="font-semibold text-lg mb-3">Loan Duration</h3>
                  <p className="text-gray-700 text-sm mb-1">
                    <strong>Range:</strong> {stats.feature_insights.duration.shortest_months} - {stats.feature_insights.duration.longest_months} months
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Average:</strong> {stats.feature_insights.duration.average_months.toFixed(1)} months
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {stats?.data_quality && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Quality</h2>
            <div className="space-y-3">
              <p className="text-gray-700">
                <strong>Missing Values:</strong> {typeof stats.data_quality.missing_values === 'string' 
                  ? stats.data_quality.missing_values 
                  : 'Some missing values detected'}
              </p>
              <p className="text-gray-700">
                <strong>Duplicate Records:</strong> {stats.data_quality.duplicates}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exploratory Data Analysis Visualizations</h2>
            <p className="text-gray-600 mb-6">
              Generated directly from the German Credit Dataset (1,000 credit applications, 20 attributes). Use the
              refresh button above if the images expire.
            </p>
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

        <div className="bg-blue-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Dataset</h2>
          <p className="text-gray-700 mb-4">
            The German Credit Risk Dataset is a widely-used benchmark in financial machine learning research. 
            Originally compiled by Professor Hans Hofmann at the University of Hamburg, it contains 1,000 
            credit applications with 20 attributes describing applicants' financial and personal characteristics.
          </p>
          <p className="text-gray-700">
            To ensure fairness, we excluded sensitive attributes (gender, nationality) from model training 
            to prevent discriminatory predictions.
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
