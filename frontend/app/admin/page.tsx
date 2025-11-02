// Admin page for data management and model training

'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [downloadStatus, setDownloadStatus] = useState<string>('')
  const [edaStatus, setEdaStatus] = useState<string>('')
  const [trainStatus, setTrainStatus] = useState<string>('')
  const [loading, setLoading] = useState<{ download: boolean; eda: boolean; train: boolean }>({
    download: false,
    eda: false,
    train: false,
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
    setTrainStatus('Training XGBoost model with one-hot encoding...')
    
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

        {/* EDA Generation Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. Generate EDA
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
            3. Train Model
          </h2>
          <p className="text-gray-700 mb-6">
            Train XGBoost model with new one-hot encoding preprocessing (preserves raw + scaled features for interpretability) and upload to R2 storage.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Dataset must be downloaded first (Step 1)</li>
                <li>Python dependencies installed on backend</li>
                <li>Sufficient compute resources (training takes 2-5 minutes)</li>
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
                <li>Upload model + metrics to R2 storage</li>
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
              {loading.train ? 'Training Model...' : 'Train XGBoost Model (New Preprocessing)'}
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
