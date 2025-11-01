// Model page - Real model metrics and performance visualization

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface ModelMetrics {
  model_type: string
  train_accuracy: number
  test_accuracy: number
  roc_auc: number
  precision: number
  recall: number
  f1_score: number
  train_size: number
  test_size: number
  n_features: number
  confusion_matrix: number[][]
  top_features?: Array<{ feature: string; coefficient: number }>
}

interface MetricsResponse {
  success: boolean
  metrics: {
    xgboost: ModelMetrics | null
    logistic: ModelMetrics | null
  }
}

const MetricCard = ({ label, value, format = 'percent' }: { label: string; value: number; format?: 'percent' | 'number' }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900">
      {format === 'percent' ? `${(value * 100).toFixed(2)}%` : value.toFixed(4)}
    </div>
  </div>
)

const ConfusionMatrix = ({ matrix }: { matrix: number[][] }) => (
  <div className="bg-white p-6 rounded-lg border">
    <h4 className="font-semibold mb-4">Confusion Matrix</h4>
    <div className="grid grid-cols-3 gap-2 max-w-md">
      <div></div>
      <div className="text-center text-sm font-semibold">Predicted Bad</div>
      <div className="text-center text-sm font-semibold">Predicted Good</div>
      <div className="text-sm font-semibold">Actual Bad</div>
      <div className="bg-red-100 p-4 text-center font-bold">{matrix[0][0]}</div>
      <div className="bg-orange-100 p-4 text-center font-bold">{matrix[0][1]}</div>
      <div className="text-sm font-semibold">Actual Good</div>
      <div className="bg-orange-100 p-4 text-center font-bold">{matrix[1][0]}</div>
      <div className="bg-green-100 p-4 text-center font-bold">{matrix[1][1]}</div>
    </div>
  </div>
)

export default function ModelPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/admin/model-metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load model metrics:', err)
        setError('Model metrics not yet available')
        setLoading(false)
      })
  }, [apiUrl])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Model Performance & Metrics
          </h1>
          <p className="text-xl text-gray-600">
            Real training results from XGBoost and Logistic Regression models
          </p>
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading model metrics...</p>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4">
              Please train the models from the admin panel to see performance metrics.
            </p>
            <Link 
              href="/admin"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Go to Admin Panel →
            </Link>
          </div>
        )}

        {metrics?.metrics.xgboost && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">XGBoost Model</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Test Accuracy" value={metrics.metrics.xgboost.test_accuracy} />
              <MetricCard label="ROC-AUC Score" value={metrics.metrics.xgboost.roc_auc} />
              <MetricCard label="Precision" value={metrics.metrics.xgboost.precision} />
              <MetricCard label="Recall" value={metrics.metrics.xgboost.recall} />
              <MetricCard label="F1 Score" value={metrics.metrics.xgboost.f1_score} />
              <MetricCard label="Train Accuracy" value={metrics.metrics.xgboost.train_accuracy} />
              <MetricCard label="Train Size" value={metrics.metrics.xgboost.train_size} format="number" />
              <MetricCard label="Test Size" value={metrics.metrics.xgboost.test_size} format="number" />
            </div>

            <ConfusionMatrix matrix={metrics.metrics.xgboost.confusion_matrix} />
          </div>
        )}

        {metrics?.metrics.logistic && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Logistic Regression Model</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Test Accuracy" value={metrics.metrics.logistic.test_accuracy} />
              <MetricCard label="ROC-AUC Score" value={metrics.metrics.logistic.roc_auc} />
              <MetricCard label="Precision" value={metrics.metrics.logistic.precision} />
              <MetricCard label="Recall" value={metrics.metrics.logistic.recall} />
              <MetricCard label="F1 Score" value={metrics.metrics.logistic.f1_score} />
              <MetricCard label="Train Accuracy" value={metrics.metrics.logistic.train_accuracy} />
              <MetricCard label="Train Size" value={metrics.metrics.logistic.train_size} format="number" />
              <MetricCard label="Test Size" value={metrics.metrics.logistic.test_size} format="number" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <ConfusionMatrix matrix={metrics.metrics.logistic.confusion_matrix} />
              
              {metrics.metrics.logistic.top_features && (
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-semibold mb-4">Top 10 Features (by coefficient)</h4>
                  <div className="space-y-2">
                    {metrics.metrics.logistic.top_features.slice(0, 10).map((feat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{feat.feature}</span>
                        <span className={`font-mono font-semibold ${feat.coefficient > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {feat.coefficient.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Models</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>XGBoost:</strong> Gradient Boosted Decision Trees with SHAP explanations. 
              Captures complex non-linear patterns while maintaining interpretability.
            </p>
            <p>
              <strong>Logistic Regression:</strong> Linear model providing baseline performance 
              and direct feature importance through coefficients.
            </p>
            <p className="text-sm text-gray-600">
              All metrics calculated on held-out test set (20% of data). Models trained on 
              German Credit Dataset with bias features (gender, nationality) excluded.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Link 
            href="/dataset"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Dataset
          </Link>
          <Link 
            href="/experiment/start"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Start Experiment →
          </Link>
        </div>
      </div>
    </main>
  )
}
