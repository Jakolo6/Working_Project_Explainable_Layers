'use client'

import { useState } from 'react'
import { ArrowDown, Database, BarChart3, Settings, Brain, Upload, Server, Users, Zap, Eye, Layers } from 'lucide-react'

export default function ProcessPage() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'phase1' | 'phase2' | 'phase3'>('overview')

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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-semibold transition-colors border-b-4 ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900 bg-gray-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <span>Full Flow Diagram</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('phase1')}
              className={`px-6 py-4 font-semibold transition-colors border-b-4 ${
                activeTab === 'phase1'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <span>Phase 1: Offline Training</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('phase2')}
              className={`px-6 py-4 font-semibold transition-colors border-b-4 ${
                activeTab === 'phase2'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                <span>Phase 2: Deployment</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('phase3')}
              className={`px-6 py-4 font-semibold transition-colors border-b-4 ${
                activeTab === 'phase3'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Phase 3: Online Experiment</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* OVERVIEW TAB - FULL FLOW DIAGRAM */}
        {activeTab === 'overview' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Technical Flow</h2>
              <p className="text-gray-600">End-to-end pipeline from data acquisition to user experiment</p>
            </div>

            {/* Flow Diagram with Swimlanes */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              
              {/* PHASE 1: OFFLINE TRAINING (Blue) */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
                    <Database className="w-5 h-5" />
                    <span>OFFLINE TRAINING</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">1. Data Acquisition</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• UCI German Credit dataset</li>
                      <li>• 1000 samples, 20 features</li>
                      <li>• Binary classification</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-blue-500" /></div>

                  {/* Step 2 */}
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">2. Data Cleaning</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Map categorical values</li>
                      <li>• Human-readable labels</li>
                      <li>• Save clean CSV</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-blue-500" /></div>

                  {/* Step 3 */}
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">3. EDA Analysis</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• 8 visualizations</li>
                      <li>• Statistics JSON</li>
                      <li>• Feature importance</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-blue-500" /></div>

                  {/* Step 4 */}
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">4. Feature Engineering</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• 5 derived features</li>
                      <li>• Encoding pipeline</li>
                      <li>• Scaling pipeline</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-blue-500" /></div>

                  {/* Step 5 */}
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">5. Model Training</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• XGBoost classifier</li>
                      <li>• SHAP TreeExplainer init</li>
                      <li>• Save models to disk</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-blue-500" /></div>

                  {/* Step 6 */}
                  <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-blue-900 mb-1">6. Upload to R2</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Manual upload</li>
                      <li>• Models + EDA files</li>
                      <li>• Cloudflare R2 storage</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* PHASE 2: DEPLOYMENT (Purple) */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg font-bold">
                    <Server className="w-5 h-5" />
                    <span>DEPLOYMENT</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Step 7 */}
                  <div className="bg-white border-2 border-purple-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-purple-900 mb-1">7. Backend Deploy</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• FastAPI on Railway</li>
                      <li>• Load models from R2</li>
                      <li>• Initialize SHAP explainer</li>
                      <li>• Connect Supabase</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-purple-500" /></div>

                  {/* Step 8 */}
                  <div className="bg-white border-2 border-purple-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-purple-900 mb-1">8. Frontend Deploy</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Next.js on Netlify</li>
                      <li>• Connect to backend API</li>
                      <li>• Persona pages</li>
                      <li>• Layer system</li>
                    </ul>
                  </div>

                  {/* Spacer to align with other columns */}
                  <div className="h-[420px]"></div>
                </div>
              </div>

              {/* PHASE 3: ONLINE EXPERIMENT (Green) */}
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                    <Users className="w-5 h-5" />
                    <span>ONLINE EXPERIMENT</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Step 9 */}
                  <div className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-green-900 mb-1">9. Consent & Baseline</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Informed consent</li>
                      <li>• Demographics (age, gender)</li>
                      <li>• Financial literacy & AI trust</li>
                      <li>• Create session ID</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-green-500" /></div>

                  {/* Step 10 */}
                  <div className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-green-900 mb-1">10. Persona Selection</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Maria (LOW RISK) or Jonas (HIGH RISK)</li>
                      <li>• 2 personas total</li>
                      <li>• Review & submit application</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-green-500" /></div>

                  {/* Step 11 - HIGHLIGHTED */}
                  <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3 shadow-lg">
                    <div className="font-semibold text-yellow-900 mb-1 flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      11. Real-time Prediction
                    </div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Feature engineering</li>
                      <li>• XGBoost prediction</li>
                      <li>• <strong>SHAP calculation NOW</strong></li>
                      <li>• Return all features</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-green-500" /></div>

                  {/* Step 12 */}
                  <div className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-green-900 mb-1">12. Explanation Layers</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• 4 layers (SHAP, Dashboard, Narrative, Counterfactual)</li>
                      <li>• Rate each: Understanding, Communicability, Cognitive Load</li>
                      <li>• Time-on-task tracked</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-green-500" /></div>

                  {/* Step 13 */}
                  <div className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-green-900 mb-1">13. Repeat for Persona 2</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Return to persona hub</li>
                      <li>• Select second persona</li>
                      <li>• Complete steps 10-12 again</li>
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-green-500" /></div>

                  {/* Step 14 */}
                  <div className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm">
                    <div className="font-semibold text-green-900 mb-1">14. Study Complete</div>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• 8 layer ratings collected (4×2)</li>
                      <li>• Data saved to Supabase</li>
                      <li>• Thank you & debriefing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insight Box */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white text-center">
              <h3 className="text-xl font-bold mb-2">🔑 Critical Insight: SHAP Timing</h3>
              <p className="text-sm opacity-90">
                <strong>OFFLINE:</strong> SHAP TreeExplainer is initialized from the trained model<br/>
                <strong>ONLINE:</strong> SHAP values are calculated in real-time for each prediction (Step 11)
              </p>
            </div>
          </div>
        )}

        {/* PHASE 1: OFFLINE TRAINING */}
        {activeTab === 'phase1' && (
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
        )}

        {/* PHASE 2: DEPLOYMENT */}
        {activeTab === 'phase2' && (
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
        )}

        {/* PHASE 3: ONLINE EXPERIMENT */}
        {activeTab === 'phase3' && (
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
        )}

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
                2 personas × 4 layers × 3 metrics = 24 ratings per participant + 
                time-on-task + demographics + baseline questionnaire
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

        {/* Participant Flow Visualization */}
        <div className="mt-16 mb-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Complete Participant Flow</h2>
          <p className="text-center text-gray-600 mb-8">End-to-end user journey through the experiment (~10-15 minutes)</p>
          
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl">
            {/* Flow Steps */}
            <div className="space-y-6">
              
              {/* Step 1: Landing */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  1
                </div>
                <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-blue-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">🏠 Landing Page</h3>
                  <p className="text-sm text-gray-600 mb-2">Learn about the research, understand the task, see time estimate (~10 min)</p>
                  <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Action: Click "Start Experiment"
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 2: Consent & Registration */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  2
                </div>
                <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-indigo-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">📝 Consent & Baseline Questionnaire</h3>
                  <p className="text-sm text-gray-600 mb-3">Provide consent, answer demographics, preferences, and trust attitudes</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                      <div className="font-semibold text-indigo-900">Demographics</div>
                      <div className="text-gray-600">Age, Gender</div>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                      <div className="font-semibold text-indigo-900">Experience</div>
                      <div className="text-gray-600">Financial background</div>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                      <div className="font-semibold text-indigo-900">Trust & Ethics</div>
                      <div className="text-gray-600">AI attitudes</div>
                    </div>
                  </div>
                  <div className="mt-3 inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Action: Create Session
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 3: Persona Selection */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  3
                </div>
                <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-purple-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">👥 Persona Selection Hub</h3>
                  <p className="text-sm text-gray-600 mb-3">Choose which loan applicant to review (2 personas available)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg border-2 border-green-300">
                      <div className="font-semibold text-green-900 text-sm">Persona 1: Maria (35)</div>
                      <div className="text-xs text-gray-600">€2,500 used car</div>
                      <div className="text-xs font-semibold text-green-700 mt-1">LOW RISK ✓</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border-2 border-red-300">
                      <div className="font-semibold text-red-900 text-sm">Persona 2: Jonas (23)</div>
                      <div className="text-xs text-gray-600">€15,000 business</div>
                      <div className="text-xs font-semibold text-red-700 mt-1">HIGH RISK ⚠</div>
                    </div>
                  </div>
                  <div className="mt-3 inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Action: Select Persona
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 4: Application Review */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  4
                </div>
                <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-pink-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">📋 Credit Application Review</h3>
                  <p className="text-sm text-gray-600 mb-2">Review pre-filled loan application with all financial details</p>
                  <div className="inline-block bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Action: Submit to AI
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 5: AI Processing */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg animate-pulse">
                  ⚡
                </div>
                <div className="flex-1 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 shadow-md border-2 border-yellow-400">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">🤖 AI Processing (Real-time)</h3>
                  <p className="text-sm text-gray-600 mb-3">XGBoost model predicts + SHAP calculates feature attributions</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-yellow-300">
                      <div className="font-semibold">Feature Engineering</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-yellow-300">
                      <div className="font-semibold">XGBoost Prediction</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-yellow-300">
                      <div className="font-semibold">SHAP Calculation</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 6: 4 Explanation Layers */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  6
                </div>
                <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-green-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">🎯 4 Explanation Layers (Sequential)</h3>
                  <p className="text-sm text-gray-600 mb-3">View and rate each explanation style one at a time</p>
                  
                  <div className="space-y-2">
                    {/* Layer 1 */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm text-blue-900">Layer 1: Baseline SHAP Table</div>
                        <div className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Technical</div>
                      </div>
                      <div className="text-xs text-gray-600">Feature importance table with SHAP values</div>
                    </div>

                    {/* Layer 2 */}
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm text-purple-900">Layer 2: Interactive Dashboard</div>
                        <div className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Visual</div>
                      </div>
                      <div className="text-xs text-gray-600">Tug-of-war + expandable feature cards</div>
                    </div>

                    {/* Layer 3 */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm text-green-900">Layer 3: Narrative Explanation</div>
                        <div className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Narrative</div>
                      </div>
                      <div className="text-xs text-gray-600">Natural language story format</div>
                    </div>

                    {/* Layer 4 */}
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm text-orange-900">Layer 4: Counterfactual Simulator</div>
                        <div className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">Action</div>
                      </div>
                      <div className="text-xs text-gray-600">What-if analysis with sliders</div>
                    </div>
                  </div>

                  <div className="mt-3 bg-green-100 p-3 rounded-lg border border-green-300">
                    <div className="text-xs font-semibold text-green-900 mb-1">After each layer:</div>
                    <div className="text-xs text-gray-700">Rate on 3 dimensions: Understanding • Communicability • Cognitive Load</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 7: Repeat for Persona 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  7
                </div>
                <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-cyan-100">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">🔄 Repeat for Persona 2</h3>
                  <p className="text-sm text-gray-600 mb-2">Return to hub, select second persona, complete steps 4-6 again</p>
                  <div className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-semibold">
                    Progress: 1 of 2 personas complete
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-blue-400" />
              </div>

              {/* Step 8: Completion */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  ✓
                </div>
                <div className="flex-1 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-5 shadow-md border-2 border-emerald-400">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">🎉 Study Complete!</h3>
                  <p className="text-sm text-gray-600 mb-3">Thank you page, data saved, session cleared</p>
                  <div className="bg-white p-3 rounded-lg border border-emerald-300">
                    <div className="text-xs font-semibold text-emerald-900 mb-1">Data Collected:</div>
                    <div className="text-xs text-gray-700">
                      • 8 layer ratings (4 layers × 2 personas)<br/>
                      • Time spent on each layer<br/>
                      • Demographics & preferences<br/>
                      • Optional comments
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Summary Stats */}
            <div className="mt-8 pt-6 border-t-2 border-blue-200">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-3xl font-bold text-blue-600">8</div>
                  <div className="text-xs text-gray-600 mt-1">Steps</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-3xl font-bold text-purple-600">2</div>
                  <div className="text-xs text-gray-600 mt-1">Personas</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-3xl font-bold text-green-600">4</div>
                  <div className="text-xs text-gray-600 mt-1">Explanation Layers</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-3xl font-bold text-orange-600">~12</div>
                  <div className="text-xs text-gray-600 mt-1">Minutes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
