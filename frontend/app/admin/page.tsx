// Simplified Admin page for local-first workflow

'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [clearStatus, setClearStatus] = useState<string>('')
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

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
