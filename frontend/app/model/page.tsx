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
  logistic_regression: any
  xgboost: any
  training_info: any
  features: any
  feature_importance_top15: any
  model_comparison: any
}

interface TrainingDocs {
  title: string
  overview: {
    description: string
    techniques: string[]
    models: string[]
  }
  methodology: Array<{
    step: number
    title: string
    description: string
    key_points: string[]
  }>
  feature_engineering: {
    description: string
    features: Array<{
      name: string
      formula: string
      purpose: string
      interpretation: string
    }>
  }
  hyperparameters: {
    logistic_regression: Record<string, any>
    xgboost: Record<string, any>
  }
  key_insights: Array<{
    title: string
    description: string
  }>
  preprocessing_pipeline: {
    logistic_regression: string[]
    xgboost: string[]
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
  if (metrics.total_cost === undefined && metrics.avg_cost_per_prediction === undefined) return null
  
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
  const [trainingDocs, setTrainingDocs] = useState<TrainingDocs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [activeTab, setActiveTab] = useState<'metrics' | 'training'>('metrics')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    // Fetch metrics
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
    
    // Fetch training documentation
    fetch(`${apiUrl}/api/v1/admin/training-code`)
      .then(res => res.json())
      .then(data => {
        setTrainingDocs(data)
      })
      .catch(err => {
        console.error('Failed to load training docs:', err)
      })
  }, [apiUrl])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Model Performance & Training
              </h1>
              <p className="text-xl text-gray-600">
                Complete training process and performance metrics
              </p>
            </div>
            <button
              onClick={() => setShowCode(true)}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              View Training Code
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`pb-4 px-2 font-semibold transition ${
                  activeTab === 'metrics'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Performance Metrics
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`pb-4 px-2 font-semibold transition ${
                  activeTab === 'training'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Training Process
              </button>
            </div>
          </div>
        </div>

        {loading && activeTab === 'metrics' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading model metrics...</p>
          </div>
        )}

        {error && activeTab === 'metrics' && (
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

        {/* Performance Metrics Tab */}
        {activeTab === 'metrics' && metrics?.xgboost && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">XGBoost Model</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Accuracy" value={metrics.xgboost.accuracy} />
              <MetricCard label="ROC-AUC Score" value={metrics.xgboost.auc_roc} />
              <MetricCard label="Precision" value={metrics.xgboost.precision} />
              <MetricCard label="Recall" value={metrics.xgboost.recall} />
              <MetricCard label="F1 Score" value={metrics.xgboost.f1_score} />
              <MetricCard label="Train Size" value={metrics.training_info.train_samples} format="number" />
              <MetricCard label="Test Size" value={metrics.training_info.test_samples} format="number" />
              <MetricCard label="Features" value={metrics.features.total_features} format="number" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <ConfusionMatrix matrix={metrics.xgboost.confusion_matrix} />
              <CostAnalysis metrics={metrics.xgboost} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <RocCurveChart data={metrics.xgboost.roc_curve} />
              <FeatureImportanceBars
                data={metrics.feature_importance_top15?.slice(0, 10)?.map((item: any) => ({
                  feature: item.feature,
                  value: item.importance,
                }))}
                title="Top 10 Feature Importances"
              />
            </div>
          </div>
        )}

        {activeTab === 'metrics' && metrics?.logistic_regression && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Logistic Regression Model</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Accuracy" value={metrics.logistic_regression.accuracy} />
              <MetricCard label="ROC-AUC Score" value={metrics.logistic_regression.auc_roc} />
              <MetricCard label="Precision" value={metrics.logistic_regression.precision} />
              <MetricCard label="Recall" value={metrics.logistic_regression.recall} />
              <MetricCard label="F1 Score" value={metrics.logistic_regression.f1_score} />
              <MetricCard label="Train Size" value={metrics.training_info.train_samples} format="number" />
              <MetricCard label="Test Size" value={metrics.training_info.test_samples} format="number" />
              <MetricCard label="Features" value={metrics.features.total_features} format="number" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <ConfusionMatrix matrix={metrics.logistic_regression.confusion_matrix} />
              <CostAnalysis metrics={metrics.logistic_regression} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <RocCurveChart data={metrics.logistic_regression.roc_curve} />
              <FeatureImportanceBars
                data={metrics.logistic_regression.top_features?.map((feat: { feature: string; coefficient: number }) => ({
                  feature: feat.feature,
                  value: feat.coefficient,
                }))}
                title="Top 10 Coefficients"
                signed
              />
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
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
        )}

        {/* Historical Data Disclaimer */}
        {activeTab === 'metrics' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-2xl font-bold text-amber-900 mb-4">Historical Data Disclaimer</h2>
                <div className="space-y-4 text-amber-800">
                  <p>
                    This model was trained on the <strong>German Credit Dataset from 1994</strong>. 
                    Due to historical lending practices and selection bias, some features exhibit 
                    counterintuitive risk patterns.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <h3 className="font-semibold text-amber-900 mb-2">Notable Data Anomaly: Credit History</h3>
                    <p className="text-sm mb-3">
                      The &apos;credit_history&apos; feature shows inverted default rates compared to modern expectations:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="bg-red-100 p-2 rounded text-center">
                        <div className="font-bold text-red-800">critical</div>
                        <div className="text-red-700">17.1% default</div>
                        <div className="text-red-600 text-xs">(lowest!)</div>
                      </div>
                      <div className="bg-yellow-100 p-2 rounded text-center">
                        <div className="font-bold text-yellow-800">delayed</div>
                        <div className="text-yellow-700">31.8% default</div>
                      </div>
                      <div className="bg-yellow-100 p-2 rounded text-center">
                        <div className="font-bold text-yellow-800">existing_paid</div>
                        <div className="text-yellow-700">31.9% default</div>
                      </div>
                      <div className="bg-orange-100 p-2 rounded text-center">
                        <div className="font-bold text-orange-800">all_paid</div>
                        <div className="text-orange-700">57.1% default</div>
                      </div>
                      <div className="bg-red-100 p-2 rounded text-center">
                        <div className="font-bold text-red-800">no_credits</div>
                        <div className="text-red-700">62.5% default</div>
                        <div className="text-red-600 text-xs">(highest!)</div>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 mt-3">
                      <strong>Why?</strong> Banks in 1994 were likely more cautious with &apos;critical&apos; applicants 
                      (smaller loans, more oversight), while &apos;all_paid&apos; applicants may have been overconfident borrowers.
                      This is historical selection bias, not modern credit practice.
                    </p>
                  </div>
                  <p className="text-sm">
                    The model faithfully learns these historical patterns. Features marked with ⚠ in explanations 
                    may show unexpected risk directions. This is intentional for research transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Training Process Tab */}
        {activeTab === 'training' && trainingDocs?.overview && (
          <div className="space-y-8">
            {/* Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{trainingDocs.title}</h2>
              <p className="text-lg text-gray-700 mb-6">{trainingDocs.overview.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Techniques Applied:</h3>
                  <ul className="space-y-1">
                    {trainingDocs.overview.techniques.map((tech, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Models Trained:</h3>
                  <ul className="space-y-1">
                    {trainingDocs.overview.models.map((model, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        {model}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Methodology Steps */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Training Methodology</h2>
              <div className="space-y-6">
                {trainingDocs.methodology.map((step) => (
                  <div key={step.step} className="border-l-4 border-blue-500 pl-6 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                        {step.step}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-700 mb-3">{step.description}</p>
                    <ul className="space-y-1">
                      {step.key_points.map((point, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-blue-500 mr-2">→</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Engineering */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Engineering</h2>
              <p className="text-gray-700 mb-6">{trainingDocs.feature_engineering.description}</p>
              <div className="grid md:grid-cols-2 gap-6">
                {trainingDocs.feature_engineering.features.map((feature, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.name}</h3>
                    <div className="bg-white rounded px-3 py-2 mb-3 font-mono text-sm text-indigo-700 border border-indigo-200">
                      {feature.formula}
                    </div>
                    <p className="text-sm text-gray-700 mb-2"><strong>Purpose:</strong> {feature.purpose}</p>
                    <p className="text-sm text-gray-600"><strong>Interpretation:</strong> {feature.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hyperparameters */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hyperparameters</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Logistic Regression */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Logistic Regression</h3>
                  <div className="space-y-2">
                    {Object.entries(trainingDocs.hyperparameters.logistic_regression)
                      .filter(([key]) => key !== 'notes')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm font-mono text-gray-700">{key}:</span>
                          <span className="text-sm font-bold text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4 italic">
                    {trainingDocs.hyperparameters.logistic_regression.notes}
                  </p>
                </div>

                {/* XGBoost */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">XGBoost</h3>
                  <div className="space-y-2">
                    {Object.entries(trainingDocs.hyperparameters.xgboost)
                      .filter(([key]) => key !== 'notes')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm font-mono text-gray-700">{key}:</span>
                          <span className="text-sm font-bold text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4 italic">
                    {trainingDocs.hyperparameters.xgboost.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Insights</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {trainingDocs.key_insights.map((insight, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="font-bold text-lg text-indigo-900 mb-2">{insight.title}</h3>
                    <p className="text-gray-700">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* Training Code Modal */}
        {showCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowCode(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold">Model Training Code</h3>
                <button onClick={() => setShowCode(false)} className="text-white hover:text-gray-300 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    This is the actual Python code used to train both XGBoost and Logistic Regression models.
                  </p>
                  <p className="text-sm text-gray-600">
                    File: <code className="bg-gray-100 px-2 py-1 rounded">backend/scripts/train_both_models.py</code>
                  </p>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
{`# Script to train both XGBoost and Logistic Regression models

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.services.xgboost_model import CreditModel
from app.services.logistic_model import LogisticCreditModel
from app.config import get_settings

load_dotenv()

def train_xgboost(config, df):
    """Train XGBoost model with preprocessing"""
    print("="*60)
    print("TRAINING XGBOOST MODEL")
    print("="*60)
    
    model_service = CreditModel(config)
    
    print("🔧 Preprocessing data for XGBoost...")
    X_scaled, y, X_raw = model_service.preprocess_data(df, fit_preprocessor=True)
    print(f"✓ Features (after one-hot encoding): {X_scaled.shape[1]} columns")
    print(f"✓ Target distribution: {y.value_counts().to_dict()}")
    print(f"✓ Raw features preserved for interpretability")
    
    print("🎯 Training XGBoost model...")
    model_service.train_model(X_scaled, y, X_raw)
    
    print("☁️  Uploading XGBoost model to R2...")
    model_service.save_model_to_r2()
    print("✓ XGBoost model saved successfully")
    
    return model_service

def train_logistic(config, df):
    """Train Logistic Regression model with preprocessing"""
    print("="*60)
    print("TRAINING LOGISTIC REGRESSION MODEL")
    print("="*60)
    
    model_service = LogisticCreditModel(config)
    
    print("🔧 Preprocessing data for Logistic Regression...")
    X_scaled, y, X_raw = model_service.preprocess_data(df, fit_preprocessor=True)
    print(f"✓ Features (after one-hot encoding): {X_scaled.shape[1]} columns")
    print(f"✓ Target distribution: {y.value_counts().to_dict()}")
    print(f"✓ Raw features preserved for interpretability")
    
    print("🎯 Training Logistic Regression model...")
    model_service.train_model(X_scaled, y, X_raw)
    
    print("☁️  Uploading Logistic Regression model to R2...")
    model_service.save_model_to_r2()
    print("✓ Logistic Regression model saved successfully")
    
    return model_service

def main():
    """Train both models with one-hot encoding preprocessing"""
    print("="*60)
    print("COMPREHENSIVE MODEL TRAINING PIPELINE")
    print("Training XGBoost and Logistic Regression")
    print("New Preprocessing: One-hot encoding + raw feature preservation")
    print("Excluding bias features: personal_status, foreign_worker")
    print("="*60)
    
    try:
        # Load configuration
        config = get_settings()
        
        # Load dataset from R2 (only once)
        print("📥 Loading dataset from R2...")
        xgb_service = CreditModel(config)
        df = xgb_service.load_dataset_from_r2()
        print(f"✓ Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Train XGBoost
        xgb_model = train_xgboost(config, df.copy())
        
        # Train Logistic Regression
        lr_model = train_logistic(config, df.copy())
        
        # Summary
        print("="*60)
        print("✓ ALL MODELS TRAINED SUCCESSFULLY!")
        print("="*60)
        print("\\nTrained Models:")
        print("  1. XGBoost Classifier")
        print("  2. Logistic Regression Classifier")
        print("\\nBoth models:")
        print("  - Use one-hot encoding for categorical features")
        print("  - Preserve raw + scaled features for interpretability")
        print("  - Exclude bias features (personal_status, foreign_worker)")
        print("  - Use same preprocessing pipeline for fair comparison")
        print("  - Saved to Cloudflare R2")
        print("  - Ready for predictions and benchmarking")
        print("="*60)
        
    except Exception as e:
        print("="*60)
        print(f"✗ Training failed: {e}")
        print("="*60)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()`}
                </pre>
                <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>One-hot encoding</strong> for categorical features</li>
                    <li>• <strong>Bias prevention:</strong> Excludes personal_status and foreign_worker</li>
                    <li>• <strong>Feature preservation:</strong> Keeps raw features for interpretability</li>
                    <li>• <strong>Cloud storage:</strong> Models saved to Cloudflare R2</li>
                    <li>• <strong>Fair comparison:</strong> Same preprocessing for both models</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
