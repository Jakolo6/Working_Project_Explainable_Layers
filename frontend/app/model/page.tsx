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
  total_cost?: number
  avg_cost_per_prediction?: number
  false_positives?: number
  false_negatives?: number
  top_features?: Array<{ feature: string; coefficient: number }>
  feature_importance?: Array<{ feature: string; importance: number }>
  roc_curve?: {
    fpr: number[]
    tpr: number[]
    thresholds: number[]
  }
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

const RocCurveChart = ({ data }: { data?: ModelMetrics['roc_curve'] }) => {
  if (!data || data.fpr.length === 0) return null

  const width = 220
  const height = 220
  const path = data.fpr
    .map((fpr, idx) => {
      const x = fpr * width
      const y = height - data.tpr[idx] * height
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h4 className="font-semibold mb-4">ROC Curve</h4>
      <svg viewBox={`0 0 ${width + 40} ${height + 40}`} className="w-full">
        <g transform="translate(20, 20)">
          <rect x={0} y={0} width={width} height={height} fill="#f9fafb" stroke="#d1d5db" />
          <line x1={0} y1={height} x2={width} y2={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} />
          {data.fpr.map((fpr, idx) => (
            <circle
              key={idx}
              cx={fpr * width}
              cy={height - data.tpr[idx] * height}
              r={2.5}
              fill="#2563eb"
            />
          ))}
          <text x={width / 2 - 20} y={height + 24} className="text-xs fill-gray-500">
            False Positive Rate
          </text>
          <text x={-12} y={-8} className="text-xs fill-gray-500">
            True Positive Rate
          </text>
        </g>
      </svg>
    </div>
  )
}

const FeatureImportanceBars = ({
  data,
  title,
  signed = false,
}: {
  data?: Array<{ feature: string; value: number }>
  title: string
  signed?: boolean
}) => {
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map((item) => Math.abs(item.value))) || 1

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h4 className="font-semibold mb-4">{title}</h4>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const percentage = Math.abs(item.value) / maxValue
          const barStyle = signed
            ? item.value >= 0
              ? 'bg-green-500'
              : 'bg-red-500'
            : 'bg-indigo-500'
          return (
            <div key={`${item.feature}-${idx}`}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="truncate pr-2">{item.feature}</span>
                <span className="font-mono text-gray-700">{item.value.toFixed(4)}</span>
              </div>
              <div className="h-2 rounded bg-gray-200">
                <div
                  className={`${barStyle} h-2 rounded`}
                  style={{ width: `${Math.min(100, percentage * 100)}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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

const CostAnalysis = ({ metrics }: { metrics: ModelMetrics }) => {
  if (!metrics.total_cost && !metrics.avg_cost_per_prediction) return null
  
  const fp = metrics.false_positives || 0
  const fn = metrics.false_negatives || 0
  const totalCost = metrics.total_cost || 0
  const avgCost = metrics.avg_cost_per_prediction || 0
  
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h4 className="font-semibold mb-4">Misclassification Cost Analysis</h4>
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Cost Matrix (German Credit Dataset)</div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div></div>
            <div className="text-center font-semibold">Pred Bad</div>
            <div className="text-center font-semibold">Pred Good</div>
            <div className="font-semibold">Actual Good</div>
            <div className="bg-blue-100 p-2 text-center font-mono">0</div>
            <div className="bg-yellow-100 p-2 text-center font-mono">1</div>
            <div className="font-semibold">Actual Bad</div>
            <div className="bg-red-100 p-2 text-center font-mono">5</div>
            <div className="bg-blue-100 p-2 text-center font-mono">0</div>
          </div>
          <p className="text-xs text-gray-600 italic">
            Predicting "good" for a bad customer costs 5× more than rejecting a good customer
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">False Positives (FP)</span>
            <span className="font-mono font-bold text-red-600">{fp} × 5 = {fp * 5}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">False Negatives (FN)</span>
            <span className="font-mono font-bold text-yellow-600">{fn} × 1 = {fn * 1}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Total Cost</span>
              <span className="font-mono font-bold text-lg text-gray-900">{totalCost}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">Avg Cost per Prediction</span>
              <span className="font-mono text-gray-700">{avgCost.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <ConfusionMatrix matrix={metrics.metrics.xgboost.confusion_matrix} />
              <CostAnalysis metrics={metrics.metrics.xgboost} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <RocCurveChart data={metrics.metrics.xgboost.roc_curve} />
              <FeatureImportanceBars
                data={metrics.metrics.xgboost.feature_importance?.slice(0, 10)?.map((item) => ({
                  feature: item.feature,
                  value: item.importance,
                }))}
                title="Top 10 Feature Importances"
              />
            </div>
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

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <ConfusionMatrix matrix={metrics.metrics.logistic.confusion_matrix} />
              <CostAnalysis metrics={metrics.metrics.logistic} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <RocCurveChart data={metrics.metrics.logistic.roc_curve} />
              <FeatureImportanceBars
                data={metrics.metrics.logistic.top_features?.map((feat) => ({
                  feature: feat.feature,
                  value: feat.coefficient,
                }))}
                title="Top 10 Coefficients"
                signed
              />
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
