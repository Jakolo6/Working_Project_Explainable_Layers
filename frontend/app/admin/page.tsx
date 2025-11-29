// Admin page with model retraining and sanity check functionality

'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SanityCheckResult {
  passed: boolean
  checks: Record<string, boolean>
  results: Record<string, {
    decision: string
    confidence: number
    probability_good: number
    probability_bad: number
    key_shap_features: Record<string, { value: string; shap: number; impact: string }>
  }>
}

interface TrainingResult {
  success: boolean
  message?: string
  xgboost_metrics?: Record<string, number>
  logistic_metrics?: Record<string, number>
  sanity_check?: { passed: boolean; safe?: { decision: string }; risky?: { decision: string } }
  uploaded_files?: Record<string, string>
  training_log?: string[]
}

export default function AdminPage() {
  const [clearStatus, setClearStatus] = useState<string>('')
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  
  // Training state
  const [trainingStatus, setTrainingStatus] = useState<string>('')
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null)
  const [isTraining, setIsTraining] = useState<boolean>(false)
  
  // Sanity check state
  const [sanityStatus, setSanityStatus] = useState<string>('')
  const [sanityResult, setSanityResult] = useState<SanityCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState<boolean>(false)

  // Handler for model retraining
  const handleRetrainModel = async () => {
    setIsTraining(true)
    setTrainingStatus('🔄 Starting model retraining with risk-ordered categories...')
    setTrainingResult(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/retrain-model`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setTrainingStatus('✅ Model retrained and uploaded successfully!')
        setTrainingResult(data)
      } else {
        setTrainingStatus(`❌ Training failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setTrainingStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsTraining(false)
    }
  }
  
  // Handler for sanity check
  const handleSanityCheck = async () => {
    setIsChecking(true)
    setSanityStatus('🔍 Running sanity check on deployed model...')
    setSanityResult(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/run-sanity-check`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSanityStatus(data.passed ? '✅ Sanity check PASSED!' : '❌ Sanity check FAILED!')
        setSanityResult(data)
      } else {
        setSanityStatus(`❌ Check failed: ${data.detail || 'Unknown error'}`)
      }
    } catch (error) {
      setSanityStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleClearR2Bucket = async () => {
    setLoading(true)
    setClearStatus('Deleting all files from R2 bucket...')
    setShowClearConfirm(false)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/clear-r2-bucket`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setClearStatus(`✅ Success: ${data.message}`)
      } else {
        setClearStatus(`❌ Error: ${data.detail || 'Failed to clear bucket'}`)
      }
    } catch (error) {
      setClearStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading(false)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Admin Panel
          </h1>
          <p className="text-xl text-gray-600">
            Local-First Workflow Management
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                📦 Local-First Approach
              </h3>
              <p className="text-blue-800 mb-3">
                This project uses a local-first workflow. Run scripts locally and manually upload results to R2.
              </p>
              <p className="text-sm text-blue-700">
                See <code className="bg-blue-100 px-2 py-1 rounded">LOCAL_SCRIPTS_README.md</code> for detailed instructions.
              </p>
            </div>
          </div>
        </div>

        {/* Manual Upload Workflow */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🚀 Manual Upload Workflow
          </h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step 1: Run Local Scripts
              </h3>
              <p className="text-gray-700 mb-3">
                Run these scripts in your project directory:
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div>$ conda activate creditrisk</div>
                <div>$ python eda_local.py</div>
                <div>$ python train_models_local.py</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                ⏱️ EDA: ~30 seconds | Training: ~2-3 minutes
              </p>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step 2: Review Generated Files
              </h3>
              <p className="text-gray-700 mb-3">
                Check the generated files before uploading:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">📊 EDA Files (data/eda/)</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 8 PNG visualizations</li>
                      <li>• statistics.json</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">🤖 Model Files (data/models/)</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 4 PKL model files</li>
                      <li>• 3 PNG visualizations</li>
                      <li>• 2 JSON files</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step 3: Manual Upload to R2
              </h3>
              <p className="text-gray-700 mb-3">
                Upload files to your Cloudflare R2 bucket:
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <ul className="text-sm text-gray-800 space-y-2">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">→</span>
                    <span><code className="bg-purple-100 px-2 py-1 rounded">data/eda/*</code> → R2 <code className="bg-purple-100 px-2 py-1 rounded">eda/</code> folder</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">→</span>
                    <span><code className="bg-purple-100 px-2 py-1 rounded">data/models/*</code> → R2 <code className="bg-purple-100 px-2 py-1 rounded">models/</code> folder</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Step 4: Verify Upload
              </h3>
              <p className="text-gray-700 mb-3">
                Check that everything loaded correctly:
              </p>
              <div className="flex gap-3">
                <Link 
                  href="/dataset" 
                  className="flex-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-3 text-center transition"
                >
                  <span className="text-orange-700 font-semibold">📊 Dataset Page</span>
                </Link>
                <Link 
                  href="/model" 
                  className="flex-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-3 text-center transition"
                >
                  <span className="text-orange-700 font-semibold">🤖 Model Page</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ✨ Benefits of Local-First Approach
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Reproducible results</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Review before upload</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">No cloud dependencies</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Professor-friendly</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Full transparency</span>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span className="text-gray-700">Source code included</span>
            </div>
          </div>
        </div>

        {/* Model Training Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-indigo-200">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4">
            🤖 Model Training & Validation
          </h2>
          <p className="text-gray-700 mb-6">
            Retrain models with <strong>risk-ordered categorical encoding</strong> to ensure SHAP values are semantically meaningful.
          </p>
          
          <div className="space-y-6">
            {/* Explanation */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="font-semibold text-indigo-900 mb-2">📊 Why Risk-Ordered Encoding?</h3>
              <p className="text-indigo-800 text-sm mb-2">
                Categories are ordered from lowest risk (code 0) to highest risk (code N-1):
              </p>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• <code className="bg-indigo-100 px-1 rounded">credit_history</code>: all_paid → critical</li>
                <li>• <code className="bg-indigo-100 px-1 rounded">employment</code>: ge_7_years → unemployed</li>
                <li>• <code className="bg-indigo-100 px-1 rounded">checking_status</code>: ge_200_dm → lt_0_dm</li>
              </ul>
              <p className="text-indigo-700 text-sm mt-2">
                This ensures positive SHAP = increases risk, negative SHAP = decreases risk.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRetrainModel}
                disabled={isTraining}
                className={`py-3 px-6 rounded-lg font-semibold text-white transition ${
                  isTraining
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isTraining ? '🔄 Training...' : '🚀 Retrain Model'}
              </button>
              
              <button
                onClick={handleSanityCheck}
                disabled={isChecking}
                className={`py-3 px-6 rounded-lg font-semibold text-white transition ${
                  isChecking
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {isChecking ? '🔍 Checking...' : '🔍 Run Sanity Check'}
              </button>
            </div>
            
            {/* Training Status */}
            {trainingStatus && (
              <div className={`p-4 rounded-lg ${
                trainingStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : trainingStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <p className="font-semibold">{trainingStatus}</p>
              </div>
            )}
            
            {/* Training Results */}
            {trainingResult && trainingResult.success && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">📈 Training Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-800">XGBoost Metrics:</p>
                    <ul className="text-green-700">
                      <li>AUC: {trainingResult.xgboost_metrics?.roc_auc?.toFixed(4)}</li>
                      <li>F1: {trainingResult.xgboost_metrics?.f1?.toFixed(4)}</li>
                      <li>Accuracy: {trainingResult.xgboost_metrics?.accuracy?.toFixed(4)}</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Logistic Metrics:</p>
                    <ul className="text-green-700">
                      <li>AUC: {trainingResult.logistic_metrics?.roc_auc?.toFixed(4)}</li>
                      <li>F1: {trainingResult.logistic_metrics?.f1?.toFixed(4)}</li>
                      <li>Accuracy: {trainingResult.logistic_metrics?.accuracy?.toFixed(4)}</li>
                    </ul>
                  </div>
                </div>
                {trainingResult.sanity_check && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className={`font-medium ${trainingResult.sanity_check.passed ? 'text-green-800' : 'text-red-800'}`}>
                      Sanity Check: {trainingResult.sanity_check.passed ? '✅ PASSED' : '❌ FAILED'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Sanity Check Status */}
            {sanityStatus && (
              <div className={`p-4 rounded-lg ${
                sanityStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : sanityStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <p className="font-semibold">{sanityStatus}</p>
              </div>
            )}
            
            {/* Sanity Check Results */}
            {sanityResult && (
              <div className={`rounded-lg p-4 border ${sanityResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h4 className={`font-semibold mb-3 ${sanityResult.passed ? 'text-green-900' : 'text-red-900'}`}>
                  🔍 Sanity Check Results
                </h4>
                <div className="space-y-3">
                  {Object.entries(sanityResult.results).map(([name, result]) => (
                    <div key={name} className="bg-white rounded p-3 border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{name.replace('_', ' ')}</span>
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          result.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.decision.toUpperCase()} ({(result.confidence * 100).toFixed(1)}%)
                        </span>
                      </div>
                      {Object.keys(result.key_shap_features).length > 0 && (
                        <div className="text-xs text-gray-600">
                          <p className="font-medium mb-1">Key SHAP Features:</p>
                          {Object.entries(result.key_shap_features).map(([feat, data]) => (
                            <div key={feat} className="flex items-center gap-2">
                              <span>{feat}:</span>
                              <span className={data.shap > 0 ? 'text-red-600' : 'text-green-600'}>
                                {data.shap > 0 ? '+' : ''}{data.shap.toFixed(3)}
                              </span>
                              <span className="text-gray-500">({data.value})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            ⚠️ Danger Zone
          </h2>
          <p className="text-gray-700 mb-6">
            Delete all files from Cloudflare R2 storage. Use this before re-uploading to ensure a clean state.
          </p>
          
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ This will delete:</h3>
              <ul className="list-disc list-inside text-red-800 space-y-1">
                <li>All EDA visualizations and statistics</li>
                <li>All trained models and preprocessors</li>
                <li>All model metrics and training code</li>
              </ul>
              <p className="mt-3 text-sm text-red-700 font-semibold">
                This action cannot be undone! You will need to re-run scripts and re-upload.
              </p>
            </div>

            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:bg-gray-400"
              >
                Clear R2 Bucket
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                  <p className="text-red-900 font-semibold mb-3">
                    Are you absolutely sure? This will permanently delete all files!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearR2Bucket}
                      disabled={loading}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-700 hover:bg-red-800'
                      }`}
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete Everything'}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      disabled={loading}
                      className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition disabled:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {clearStatus && (
              <div className={`p-4 rounded-lg ${
                clearStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : clearStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {clearStatus}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gray-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            System Status
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Backend API:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
            </p>
            <p className="text-sm text-gray-600">
              Quick links: <Link href="/dataset" className="text-blue-600 hover:underline">Dataset</Link> | <Link href="/model" className="text-blue-600 hover:underline">Model</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
