// Admin page - Focused model and explanation management
// Three main actions: Upload Model, Generate Global Explanation, Upload Performance Stats

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface AssetStatus {
  key: string
  name: string
  available: boolean
  last_modified: string | null
}

interface AssetsResponse {
  success: boolean
  assets: {
    model: AssetStatus
    global_explanation: AssetStatus
    performance_stats: AssetStatus
  }
  checked_at: string
}

export default function AdminPage() {
  const [assets, setAssets] = useState<AssetsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [actionStatus, setActionStatus] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isTraining, setIsTraining] = useState<boolean>(false)
  const [generationLog, setGenerationLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState<boolean>(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  // Fetch asset status
  const fetchAssetStatus = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/asset-status`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (error) {
      console.error('Failed to fetch asset status:', error)
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  useEffect(() => {
    fetchAssetStatus()
  }, [fetchAssetStatus])

  // Format date for display
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handler for model retraining
  const handleRetrainModel = async () => {
    setIsTraining(true)
    setActionStatus('🔄 Retraining model...')
    setGenerationLog([])
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/retrain-model`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setActionStatus('✅ Model retrained and uploaded successfully!')
        if (data.training_log) setGenerationLog(data.training_log)
        fetchAssetStatus()
      } else {
        setActionStatus(`❌ Training failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setActionStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsTraining(false)
    }
  }

  // Handler for generating global explanation
  const handleGenerateGlobalExplanation = async () => {
    setIsGenerating(true)
    setActionStatus('🔄 Generating global explanation package...')
    setGenerationLog([])
    setShowLog(true)
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/generate-global-explanation`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setActionStatus('✅ Global explanation package generated and uploaded!')
        if (data.log) setGenerationLog(data.log)
        fetchAssetStatus()
      } else {
        setActionStatus(`❌ Generation failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setActionStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-xl text-gray-600">
            Model & Explanation Management
          </p>
        </div>

        {/* Asset Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Model Status */}
          <div className={`bg-white rounded-xl shadow p-6 border-2 ${
            assets?.assets.model.available ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🤖</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                assets?.assets.model.available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {assets?.assets.model.available ? 'Available' : 'Not Found'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">XGBoost Model</h3>
            <p className="text-xs text-gray-500">
              Updated: {formatDate(assets?.assets.model.last_modified || null)}
            </p>
          </div>

          {/* Global Explanation Status */}
          <div className={`bg-white rounded-xl shadow p-6 border-2 ${
            assets?.assets.global_explanation.available ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📊</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                assets?.assets.global_explanation.available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {assets?.assets.global_explanation.available ? 'Available' : 'Not Generated'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Global Explanation</h3>
            <p className="text-xs text-gray-500">
              Updated: {formatDate(assets?.assets.global_explanation.last_modified || null)}
            </p>
          </div>

          {/* Performance Stats Status */}
          <div className={`bg-white rounded-xl shadow p-6 border-2 ${
            assets?.assets.performance_stats.available ? 'border-green-200' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📈</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                assets?.assets.performance_stats.available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {assets?.assets.performance_stats.available ? 'Available' : 'Not Found'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Performance Stats</h3>
            <p className="text-xs text-gray-500">
              Updated: {formatDate(assets?.assets.performance_stats.last_modified || null)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Actions
          </h2>
          
          <div className="space-y-4">
            {/* Retrain Model Button */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div>
                <h3 className="font-semibold text-indigo-900">Retrain Model</h3>
                <p className="text-sm text-indigo-700">
                  Retrain XGBoost model with risk-ordered encoding and upload to R2
                </p>
              </div>
              <button
                onClick={handleRetrainModel}
                disabled={isTraining || isGenerating}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
                  isTraining || isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isTraining ? '🔄 Training...' : '🤖 Retrain Model'}
              </button>
            </div>

            {/* Generate Global Explanation Button */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <h3 className="font-semibold text-purple-900">Generate Global Explanation</h3>
                <p className="text-sm text-purple-700">
                  Create SHAP plots, feature importance charts, and narrative
                </p>
              </div>
              <button
                onClick={handleGenerateGlobalExplanation}
                disabled={isGenerating || isTraining || !assets?.assets.model.available}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
                  isGenerating || isTraining || !assets?.assets.model.available
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isGenerating ? '🔄 Generating...' : '📊 Generate'}
              </button>
            </div>

            {/* Refresh Status Button */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Refresh Status</h3>
                <p className="text-sm text-gray-600">
                  Check R2 bucket for latest asset status
                </p>
              </div>
              <button
                onClick={fetchAssetStatus}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Status Message */}
          {actionStatus && (
            <div className={`mt-6 p-4 rounded-lg ${
              actionStatus.startsWith('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : actionStatus.startsWith('❌')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <p className="font-semibold">{actionStatus}</p>
            </div>
          )}

          {/* Generation Log */}
          {showLog && generationLog.length > 0 && (
            <div className="mt-4">
              <button 
                onClick={() => setShowLog(!showLog)}
                className="text-sm text-gray-600 hover:text-gray-800 mb-2"
              >
                {showLog ? '▼ Hide Log' : '▶ Show Log'}
              </button>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
                {generationLog.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Explanation Preview */}
        {assets?.assets.global_explanation.available && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Global Explanation Preview
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={`${apiUrl}/api/v1/admin/global-explanation-image/feature_importance.png`}
                  alt="Feature Importance"
                  className="w-full"
                />
                <p className="text-center text-sm text-gray-600 py-2 bg-gray-50">Feature Importance</p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={`${apiUrl}/api/v1/admin/global-explanation-image/shap_summary.png`}
                  alt="SHAP Summary"
                  className="w-full"
                />
                <p className="text-center text-sm text-gray-600 py-2 bg-gray-50">SHAP Summary</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-gray-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Links
          </h2>
          <div className="flex gap-3">
            <Link 
              href="/dataset" 
              className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-center transition"
            >
              <span className="text-gray-700 font-semibold">📊 Dataset Page</span>
            </Link>
            <Link 
              href="/model" 
              className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-center transition"
            >
              <span className="text-gray-700 font-semibold">🤖 Model Page</span>
            </Link>
            <Link 
              href="/experiment/personas" 
              className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-center transition"
            >
              <span className="text-gray-700 font-semibold">🧪 Experiment</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
