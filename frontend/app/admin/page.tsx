// Admin page - Focused model and explanation management
// Protected by password - Three main actions: Upload Model, Generate Global Explanation, Upload Performance Stats

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import PasswordProtection from '@/components/PasswordProtection'
import { AlertTriangle, Trash2 } from 'lucide-react'

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

function AdminContent() {
  const [assets, setAssets] = useState<AssetsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [actionStatus, setActionStatus] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isTraining, setIsTraining] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('')
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

  // Handler for deleting all experiment data
  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== 'DELETE ALL DATA') {
      setActionStatus('❌ Please type "DELETE ALL DATA" to confirm')
      return
    }
    
    setIsDeleting(true)
    setActionStatus('🔄 Deleting all experiment data...')
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/delete-all-data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: 'DELETE_ALL_EXPERIMENT_DATA'
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setActionStatus(`✅ All data deleted successfully! Deleted: ${data.deleted_sessions || 0} sessions, ${data.deleted_ratings || 0} ratings, ${data.deleted_predictions || 0} predictions, ${data.deleted_questionnaires || 0} questionnaires`)
        setShowDeleteConfirm(false)
        setDeleteConfirmText('')
      } else {
        setActionStatus(`❌ Delete failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setActionStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsDeleting(false)
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
            <p className="text-xs text-gray-600">
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
            <p className="text-xs text-gray-600">
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
            <p className="text-xs text-gray-600">
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

        {/* DANGER ZONE - Delete All Data */}
        <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-red-900">
              Danger Zone
            </h2>
          </div>
          
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-900">Delete All Experiment Data</h3>
                <p className="text-sm text-red-700">
                  Permanently delete all sessions, ratings, predictions, and questionnaires from Supabase.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete All Data
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-red-300">
              <p className="text-red-800 font-semibold mb-3">
                ⚠️ This action cannot be undone! All experiment data will be permanently deleted.
              </p>
              <p className="text-sm text-red-700 mb-3">
                Type <strong>DELETE ALL DATA</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE ALL DATA"
                className="w-full px-4 py-2 border border-red-300 rounded-lg mb-3 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAllData}
                  disabled={isDeleting || deleteConfirmText !== 'DELETE ALL DATA'}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                    deleteConfirmText === 'DELETE ALL DATA' && !isDeleting
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? '🔄 Deleting...' : '🗑️ Confirm Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

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
            <Link 
              href="/results" 
              className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-center transition"
            >
              <span className="text-gray-700 font-semibold">📈 Results</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

// Wrap with password protection
export default function AdminPage() {
  return (
    <PasswordProtection pageName="Admin Panel">
      <AdminContent />
    </PasswordProtection>
  )
}
