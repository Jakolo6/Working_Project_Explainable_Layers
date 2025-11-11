// Admin page for data management and model training

'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [downloadStatus, setDownloadStatus] = useState<string>('')
  const [cleanStatus, setCleanStatus] = useState<string>('')
  const [edaStatus, setEdaStatus] = useState<string>('')
  const [trainStatus, setTrainStatus] = useState<string>('')
  const [testStatus, setTestStatus] = useState<string>('')
  const [clearStatus, setClearStatus] = useState<string>('')
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false)
  const [loading, setLoading] = useState<{ download: boolean; clean: boolean; eda: boolean; train: boolean; test: boolean; clear: boolean }>({
    download: false,
    clean: false,
    eda: false,
    train: false,
    test: false,
    clear: false,
  })

  const handleDownloadDataset = async () => {
    setLoading({ ...loading, download: true })
    setDownloadStatus('Downloading dataset from UCI ML Repository...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/download-dataset`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setDownloadStatus(`✅ Success: ${data.message}`)
      } else {
        setDownloadStatus(`❌ Error: ${data.detail || 'Failed to download dataset'}`)
      }
    } catch (error) {
      setDownloadStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading({ ...loading, download: false })
    }
  }

  const handleCleanDataset = async () => {
    setLoading({ ...loading, clean: true })
    setCleanStatus('Cleaning dataset (mapping Axx codes to readable values)...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/clean-dataset`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCleanStatus(`✅ Success: ${data.message}`)
      } else {
        setCleanStatus(`❌ Error: ${data.detail || 'Failed to clean dataset'}`)
      }
    } catch (error) {
      setCleanStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading({ ...loading, clean: false })
    }
  }

  const handleGenerateEDA = async () => {
    setLoading({ ...loading, eda: true })
    setEdaStatus('Generating EDA visualizations and statistics...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/generate-eda`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setEdaStatus(`✅ Success: ${data.message}`)
      } else {
        setEdaStatus(`❌ Error: ${data.detail || 'Failed to generate EDA'}`)
      }
    } catch (error) {
      setEdaStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading({ ...loading, eda: false })
    }
  }

  const handleTrainModel = async () => {
    setLoading({ ...loading, train: true })
    setTrainStatus('Training both models (XGBoost + Logistic Regression) with new preprocessing...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/train-model`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTrainStatus(`✅ Success: ${data.message}`)
      } else {
        setTrainStatus(`❌ Error: ${data.detail || 'Failed to train models'}`)
      }
    } catch (error) {
      setTrainStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading({ ...loading, train: false })
    }
  }

  const handleTestModels = async () => {
    setLoading({ ...loading, test: true })
    setTestStatus('Testing notebook-trained models...')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/experiment/health`)
      
      const data = await response.json()
      
      if (response.ok && data.status === 'healthy') {
        setTestStatus(`✅ Models Ready:\n- XGBoost: ${data.xgboost_loaded ? '✓' : '✗'}\n- Logistic: ${data.logistic_loaded ? '✓' : '✗'}\n- Database: ${data.database_connected ? '✓' : '✗'}`)
      } else {
        setTestStatus(`❌ Error: ${data.error || 'Models not loaded'}`)
      }
    } catch (error) {
      setTestStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading({ ...loading, test: false })
    }
  }

  const handleClearR2Bucket = async () => {
    setLoading({ ...loading, clear: true })
    setClearStatus('Deleting all files from R2 bucket...')
    setShowClearConfirm(false)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/admin/clear-r2-bucket`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setClearStatus(`✅ Success: ${data.message} (${data.deleted_count} files deleted)`)
      } else {
        setClearStatus(`❌ Error: ${data.detail || 'Failed to clear R2 bucket'}`)
      }
    } catch (error) {
      setClearStatus(`❌ Error: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading({ ...loading, clear: false })
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
            Manage dataset and model training
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Access:</strong> These operations will download data and train models on the backend server. 
                Make sure you have proper credentials configured in Railway environment variables.
              </p>
            </div>
          </div>
        </div>

        {/* Clear R2 Bucket Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            0. Clear R2 Bucket (Danger Zone)
          </h2>
          <p className="text-gray-700 mb-6">
            Delete all files from Cloudflare R2 storage. Use this before retraining to ensure a clean state.
          </p>
          
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ WARNING - This will delete:</h3>
              <ul className="list-disc list-inside text-red-800 space-y-1">
                <li>All trained models (XGBoost + Logistic Regression)</li>
                <li>All EDA visualizations and statistics</li>
                <li>Dataset files</li>
                <li>Model metrics and performance data</li>
              </ul>
              <p className="mt-3 text-sm text-red-700 font-semibold">
                This action cannot be undone! You will need to re-download the dataset and retrain all models.
              </p>
            </div>

            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={loading.clear}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition"
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
                      disabled={loading.clear}
                      className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition ${
                        loading.clear
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-700 hover:bg-red-800'
                      }`}
                    >
                      {loading.clear ? 'Deleting...' : 'Yes, Delete Everything'}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      disabled={loading.clear}
                      className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
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

        {/* Dataset Download Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Download Dataset
          </h2>
          <p className="text-gray-700 mb-6">
            Download the German Credit Risk Dataset from UCI ML Repository and upload it to Cloudflare R2 storage.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>ucimlrepo package installed on backend</li>
                <li>Cloudflare R2 bucket access</li>
                <li>Internet connection on backend server</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadDataset}
              disabled={loading.download}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                loading.download
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading.download ? 'Downloading...' : 'Download Dataset from UCI'}
            </button>

            {downloadStatus && (
              <div className={`p-4 rounded-lg ${
                downloadStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : downloadStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {downloadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Clean Dataset Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. Clean Dataset
          </h2>
          <p className="text-gray-700 mb-6">
            Map Axx symbolic codes to human-readable values (e.g., A11 → negative_balance). Creates german_credit_clean.csv in R2.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Dataset must be downloaded first (Step 1)</li>
                <li>Cleaning script in backend/scripts/</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">✨ Transformations:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Attribute1 → checking_status (negative_balance, 0_to_200_dm, etc.)</li>
                <li>Attribute3 → credit_history (no_credits, all_paid, delay, etc.)</li>
                <li>Attribute4 → purpose (car_new, furniture, education, etc.)</li>
                <li>All 20 attributes mapped to readable column names</li>
              </ul>
            </div>

            <button
              onClick={handleCleanDataset}
              disabled={loading.clean}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                loading.clean
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading.clean ? 'Cleaning Dataset...' : 'Clean Dataset (Map Axx Codes)'}
            </button>

            {cleanStatus && (
              <div className={`p-4 rounded-lg ${
                cleanStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : cleanStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {cleanStatus}
              </div>
            )}
          </div>
        </div>

        {/* EDA Generation Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. Generate EDA
          </h2>
          <p className="text-gray-700 mb-6">
            Generate Exploratory Data Analysis with visualizations and statistics, then upload to R2 storage.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Dataset must be downloaded first (Step 1)</li>
                <li>Python visualization libraries installed</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Generated Outputs:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>statistics.json - Comprehensive dataset statistics</li>
                <li>target_distribution.png - Credit risk distribution</li>
                <li>age_distribution.png - Age histogram</li>
                <li>credit_amount_distribution.png - Credit amount histogram</li>
                <li>correlation_heatmap.png - Feature correlations</li>
                <li>purpose_distribution.png - Top credit purposes</li>
              </ul>
            </div>

            <button
              onClick={handleGenerateEDA}
              disabled={loading.eda}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                loading.eda
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading.eda ? 'Generating EDA...' : 'Generate EDA Visualizations'}
            </button>

            {edaStatus && (
              <div className={`p-4 rounded-lg ${
                edaStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : edaStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {edaStatus}
              </div>
            )}
          </div>
        </div>

        {/* Model Training Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. Train Models
          </h2>
          <p className="text-gray-700 mb-6">
            Train both XGBoost and Logistic Regression models with new one-hot encoding preprocessing (preserves raw + scaled features) for fair benchmarking.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Dataset must be downloaded first (Step 1)</li>
                <li>Python dependencies installed on backend</li>
                <li>Sufficient compute resources (training takes 4-8 minutes)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Training Process:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Load dataset from R2</li>
                <li>Apply one-hot encoding for categorical features</li>
                <li>Preserve raw + scaled features for interpretability</li>
                <li>Exclude bias features (personal_status, foreign_worker)</li>
                <li>Train XGBoost classifier (~60 features after encoding)</li>
                <li>Train Logistic Regression with same preprocessing</li>
                <li>Upload both models + metrics to R2 for benchmarking</li>
              </ul>
            </div>

            <button
              onClick={handleTrainModel}
              disabled={loading.train}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                loading.train
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading.train ? 'Training Models...' : 'Train Both Models (XGBoost + Logistic)'}
            </button>

            {trainStatus && (
              <div className={`p-4 rounded-lg ${
                trainStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : trainStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {trainStatus}
              </div>
            )}
          </div>
        </div>

        {/* Test Models Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            5. Test Notebook Models
          </h2>
          <p className="text-gray-700 mb-6">
            Test if the notebook-trained models are loaded correctly and ready for predictions. Checks XGBoost, Logistic Regression, and database connectivity.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">What This Tests:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>XGBoost model loaded from R2 (models/xgboost_model.pkl)</li>
                <li>Logistic Regression model loaded from R2 (models/logistic_model.pkl)</li>
                <li>Preprocessor fitted on cleaned dataset</li>
                <li>Database connection active</li>
              </ul>
            </div>

            <button
              onClick={handleTestModels}
              disabled={loading.test}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                loading.test
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading.test ? 'Testing Models...' : 'Test Notebook Models'}
            </button>

            {testStatus && (
              <div className={`p-4 rounded-lg whitespace-pre-line ${
                testStatus.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : testStatus.startsWith('❌')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}>
                {testStatus}
              </div>
            )}
          </div>
        </div>

        {/* Status Check */}
        <div className="bg-gray-100 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            System Status
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Backend API:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
            </p>
            <p className="text-sm text-gray-600">
              Check the backend logs in Railway for detailed progress and error messages.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Home
          </Link>
          <Link 
            href="/experiment"
            className="text-blue-600 hover:text-blue-700 transition font-semibold"
          >
            Go to Experiment →
          </Link>
        </div>
      </div>
    </main>
  )
}
