'use client'

import { useState } from 'react'
import { ArrowDown, Database, BarChart3, Settings, Brain, Upload, Server, Users, Zap, Eye, Layers } from 'lucide-react'

export default function ProcessPage() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const toggleStep = (step: string) => {
    setExpandedStep(expandedStep === step ? null : step)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              XAI Credit Risk System
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Technical Process Flow Diagram
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Offline Training</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-gray-600">Deployment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600">Online Experiment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* PHASE 1: OFFLINE TRAINING */}
        <div className="mb-16">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Database className="w-6 h-6" />
              Phase 1: Offline Training Pipeline (Local)
            </h2>
            <p className="text-blue-700">Executed locally with manual upload to cloud storage</p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('data')}>
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 text-white p-3 rounded-xl"><Database className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">1. Data Acquisition & Cleaning</h3>
                  <p className="text-gray-600 text-sm">Download and prepare German Credit dataset</p>
                  {expandedStep === 'data' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• Download from UCI ML Repository (1000 samples, 20 features)</li>
                      <li>• Map symbolic codes (A11, A12...) to human-readable values</li>
                      <li>• Remove biased features (gender, foreign worker)</li>
                      <li>• Output: german_credit_clean.csv (18 features)</li>
                      <li>• Script: download_data.py + convert_data.py</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-blue-400" /></div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('eda')}>
              <div className="flex items-start gap-4">
                <div className="bg-green-500 text-white p-3 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">2. Exploratory Data Analysis</h3>
                  <p className="text-gray-600 text-sm">Statistical analysis and visualization</p>
                  {expandedStep === 'eda' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• Target distribution (70% good, 30% bad credit)</li>
                      <li>• 7 numerical features: duration, credit_amount, age, etc.</li>
                      <li>• 11 categorical features: checking_status, employment, etc.</li>
                      <li>• Generate 8 visualizations (distributions, correlations)</li>
                      <li>• Output: statistics.json + PNG files to data/eda/</li>
                      <li>• Script: eda_local.py</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-blue-400" /></div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('feature')}>
              <div className="flex items-start gap-4">
                <div className="bg-purple-500 text-white p-3 rounded-xl"><Settings className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">3. Feature Engineering</h3>
                  <p className="text-gray-600 text-sm">Create advanced risk metrics</p>
                  {expandedStep === 'feature' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• monthly_burden = credit_amount / duration</li>
                      <li>• stability_score = age × employment_years</li>
                      <li>• risk_ratio = credit_amount / (age × 100)</li>
                      <li>• credit_to_income_proxy = credit_amount / age</li>
                      <li>• duration_risk = duration × credit_amount</li>
                      <li>• Total: 7 base + 5 engineered = 12 numerical features</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-blue-400" /></div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('training')}>
              <div className="flex items-start gap-4">
                <div className="bg-red-500 text-white p-3 rounded-xl"><Brain className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">4. Model Training & SHAP Initialization</h3>
                  <p className="text-gray-600 text-sm">Train XGBoost and initialize SHAP TreeExplainer</p>
                  {expandedStep === 'training' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• XGBoost Pipeline: Passthrough numerical + OrdinalEncoder categorical</li>
                      <li>• Logistic Regression: StandardScaler + OneHotEncoder(drop='first')</li>
                      <li>• 80/20 train-test split with stratification</li>
                      <li>• Hyperparameter tuning and cross-validation</li>
                      <li>• <strong>SHAP TreeExplainer initialized from trained model</strong></li>
                      <li>• Save models as .pkl files (xgboost_model.pkl, logistic_model.pkl)</li>
                      <li>• Script: train_models_local.py</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-blue-400" /></div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-orange-500 text-white p-3 rounded-xl"><Upload className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">5. Manual Upload to R2</h3>
                  <p className="text-gray-600 text-sm">Upload trained models and EDA outputs to Cloudflare R2</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <li>• Upload data/eda/* (8 PNG files + statistics.json)</li>
                    <li>• Upload data/models/* (XGBoost + Logistic models)</li>
                    <li>• Manual process ensures transparency and review</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHASE 2: DEPLOYMENT */}
        <div className="mb-16">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-2 flex items-center gap-2">
              <Server className="w-6 h-6" />
              Phase 2: Deployment (One-time Setup)
            </h2>
            <p className="text-purple-700">Deploy backend and frontend to production</p>
          </div>

          <div className="space-y-4">
            {/* Step 6 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('backend')}>
              <div className="flex items-start gap-4">
                <div className="bg-purple-600 text-white p-3 rounded-xl"><Server className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">6. Backend Deployment (Railway)</h3>
                  <p className="text-gray-600 text-sm">FastAPI server with model loading</p>
                  {expandedStep === 'backend' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• Load XGBoost model from R2 on startup</li>
                      <li>• Initialize SHAP TreeExplainer with loaded model</li>
                      <li>• Connect to Supabase for data storage</li>
                      <li>• API endpoints: /predict, /session, /rate-layer</li>
                      <li>• Environment: Python 3.11 + FastAPI + SHAP</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-purple-400" /></div>
            </div>

            {/* Step 7 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white p-3 rounded-xl"><Upload className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">7. Frontend Deployment (Netlify)</h3>
                  <p className="text-gray-600 text-sm">Next.js application with experiment interface</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <li>• Next.js 14 + TypeScript + TailwindCSS</li>
                    <li>• Persona pages, layer system, questionnaires</li>
                    <li>• Connect to backend API for predictions</li>
                    <li>• Environment: NEXT_PUBLIC_API_URL</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHASE 3: ONLINE EXPERIMENT */}
        <div className="mb-16">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-900 mb-2 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Phase 3: Online Experiment (Real-time per User)
            </h2>
            <p className="text-green-700">User interaction with live predictions and SHAP calculations</p>
          </div>

          <div className="space-y-4">
            {/* Step 8 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white p-3 rounded-xl"><Users className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">8. User Registration & Pre-Questionnaire</h3>
                  <p className="text-gray-600 text-sm">Participant demographics and expectations</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <li>• Collect: name, age, profession, finance experience, AI familiarity</li>
                    <li>• Pre-questionnaire: expectations about AI decisions</li>
                    <li>• Create session_id in Supabase</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-green-400" /></div>
            </div>

            {/* Step 9 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-teal-600 text-white p-3 rounded-xl"><Users className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">9. Persona Selection</h3>
                  <p className="text-gray-600 text-sm">Choose from 3 predefined personas</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <li>• Maria (67, retired): €4,000 home renovation</li>
                    <li>• Jonas (27, employee): €12,000 business start-up</li>
                    <li>• Sofia (44, single parent): €20,000 debt consolidation</li>
                    <li>• Prefilled application data with 2 adjustable fields</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-green-400" /></div>
            </div>

            {/* Step 10 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('submit')}>
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-xl"><Zap className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">10. Application Submission</h3>
                  <p className="text-gray-600 text-sm">User adjusts loan amount and duration</p>
                  {expandedStep === 'submit' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• User modifies: credit_amount (€250-€20,000)</li>
                      <li>• User modifies: duration (1-72 months)</li>
                      <li>• Other 16 features remain from persona template</li>
                      <li>• Submit to backend /predict endpoint</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-green-400" /></div>
            </div>

            {/* Step 11 - CRITICAL */}
            <div className="bg-yellow-50 rounded-xl shadow-lg border-4 border-yellow-400 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('prediction')}>
              <div className="flex items-start gap-4">
                <div className="bg-red-600 text-white p-3 rounded-xl"><Brain className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900">11. REAL-TIME PREDICTION + SHAP CALCULATION ⚡</h3>
                  <p className="text-red-700 text-sm font-semibold">This is where SHAP values are calculated!</p>
                  {expandedStep === 'prediction' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-900 bg-white p-3 rounded border-2 border-yellow-400">
                      <li>• <strong>Step 1:</strong> Feature engineering (calculate 5 derived features)</li>
                      <li>• <strong>Step 2:</strong> Transform features via pipeline (encoding, scaling)</li>
                      <li>• <strong>Step 3:</strong> model.predict(X) → decision + probability</li>
                      <li>• <strong>Step 4:</strong> explainer.shap_values(X) → <strong>CALCULATE SHAP NOW</strong></li>
                      <li>• <strong>Step 5:</strong> Sort features by |SHAP value|</li>
                      <li>• <strong>Step 6:</strong> Map to human-readable names</li>
                      <li>• <strong>Output:</strong> decision, confidence, all_features (20-30 SHAP values)</li>
                      <li>• <strong>Storage:</strong> Save to Supabase predictions table</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-yellow-600" /></div>
            </div>

            {/* Step 12 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => toggleStep('layers')}>
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white p-3 rounded-xl"><Layers className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">12. Explanation Layer Display</h3>
                  <p className="text-gray-600 text-sm">Show SHAP explanations in 6 different formats</p>
                  {expandedStep === 'layers' && (
                    <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <li>• Layer 0: All Features Table (complete SHAP breakdown)</li>
                      <li>• Layer 1: Minimal (single key factor)</li>
                      <li>• Layer 2: Short Text (natural language summary)</li>
                      <li>• Layer 3: Visual Charts (bar charts with colors)</li>
                      <li>• Layer 4: Detailed Context (benchmarking)</li>
                      <li>• Layer 5: Counterfactual (what-if scenarios)</li>
                      <li>• All layers use the SHAP values from Step 11</li>
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-green-400" /></div>
            </div>

            {/* Step 13 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-purple-600 text-white p-3 rounded-xl"><Eye className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">13. Layer Rating & Iteration</h3>
                  <p className="text-gray-600 text-sm">User rates each layer on 4 metrics</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <li>• Trust (1-7 Likert scale)</li>
                    <li>• Understanding (1-7 Likert scale)</li>
                    <li>• Usefulness (1-7 Likert scale)</li>
                    <li>• Mental Effort (1-7 Likert scale)</li>
                    <li>• Repeat for all 6 layers per persona</li>
                    <li>• Store ratings in Supabase layer_ratings table</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-center mt-4"><ArrowDown className="w-6 h-6 text-green-400" /></div>
            </div>

            {/* Step 14 */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-700 text-white p-3 rounded-xl"><Users className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">14. Post-Questionnaire & Completion</h3>
                  <p className="text-gray-600 text-sm">Final evaluation and layer preference</p>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <li>• Overall experience rating</li>
                    <li>• Explanation helpfulness</li>
                    <li>• Would trust AI decisions</li>
                    <li>• Preferred explanation layer</li>
                    <li>• Optional comments</li>
                    <li>• Mark session as completed in Supabase</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Technical Insights */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🔑 Key Technical Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-bold mb-2">SHAP Timing</h3>
              <p className="opacity-90">
                <strong>OFFLINE:</strong> SHAP TreeExplainer is initialized from the trained model<br/>
                <strong>ONLINE:</strong> SHAP values are calculated in real-time for each prediction
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Data Flow</h3>
              <p className="opacity-90">
                Training happens once locally → Models uploaded to R2 → Backend loads models → 
                Each user prediction triggers new SHAP calculation
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Feature Count</h3>
              <p className="opacity-90">
                18 raw features → 7 base numerical + 11 categorical → 
                5 engineered features → 12 numerical + 11 categorical total
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Experiment Scale</h3>
              <p className="opacity-90">
                3 personas × 6 layers × 4 metrics = 72 data points per participant + 
                demographics + questionnaires
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/experiment" className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Try the Experiment
            </a>
            <a href="/dataset" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Explore the Data
            </a>
            <a href="/model" className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              View Model Metrics
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
