'use client'

import { useState } from 'react'
import { ArrowRight, ArrowDown, Database, BarChart3, Settings, Brain, Upload, Server, Users, Zap, Eye, Layers } from 'lucide-react'

export default function ProcessHorizontalPage() {
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Technical Flow</h2>
          <p className="text-gray-600">End-to-end pipeline from data acquisition to user experiment</p>
        </div>

        <div className="space-y-4">
          {/* SECTION 1: OFFLINE TRAINING (Blue) */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-lg">
                <Database className="w-6 h-6" />
                <span>OFFLINE TRAINING</span>
              </div>
            </div>
            
            {/* Horizontal flow of steps */}
            <div className="grid grid-cols-6 gap-3">
              {/* Step 1 */}
              <div 
                className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('data')}
              >
                <div className="font-semibold text-blue-900 mb-2">1. Data Acquisition</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• UCI German Credit dataset</li>
                  <li>• 1000 samples, 20 features</li>
                  <li>• Binary classification</li>
                </ul>
                {expandedStep === 'data' && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                    <p>• Download from UCI ML Repository</p>
                    <p>• Map symbolic codes (A11, A12...)</p>
                    <p>• Remove biased features</p>
                    <p>• Script: download_data.py</p>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <ArrowRight className="w-8 h-8 text-blue-500" />
              </div>

              {/* Step 2 */}
              <div 
                className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('cleaning')}
              >
                <div className="font-semibold text-blue-900 mb-2">2. Data Cleaning</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Map categorical values</li>
                  <li>• Human-readable labels</li>
                  <li>• Save clean CSV</li>
                </ul>
                {expandedStep === 'cleaning' && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                    <p>• Output: german_credit_clean.csv</p>
                    <p>• 18 features (removed gender, foreign_worker)</p>
                    <p>• Script: convert_data.py</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-blue-500" />
              </div>

              {/* Step 3 */}
              <div 
                className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('eda')}
              >
                <div className="font-semibold text-blue-900 mb-2">3. EDA Analysis</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• 8 visualizations</li>
                  <li>• Statistics JSON</li>
                  <li>• Feature importance</li>
                </ul>
                {expandedStep === 'eda' && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                    <p>• Target: 70% good, 30% bad</p>
                    <p>• 7 numerical, 11 categorical</p>
                    <p>• Script: eda_local.py</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-blue-500" />
              </div>

              {/* Step 4 */}
              <div 
                className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('feature')}
              >
                <div className="font-semibold text-blue-900 mb-2">4. Feature Engineering</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• 5 derived features</li>
                  <li>• Encoding pipeline</li>
                  <li>• Scaling pipeline</li>
                </ul>
                {expandedStep === 'feature' && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                    <p>• monthly_burden = credit / duration</p>
                    <p>• stability_score = age × employment</p>
                    <p>• risk_ratio, credit_to_income, duration_risk</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-blue-500" />
              </div>

              {/* Step 5 */}
              <div 
                className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('training')}
              >
                <div className="font-semibold text-blue-900 mb-2">5. Model Training</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• XGBoost classifier</li>
                  <li>• SHAP TreeExplainer init</li>
                  <li>• Save models to disk</li>
                </ul>
                {expandedStep === 'training' && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                    <p>• 80/20 train-test split</p>
                    <p>• Hyperparameter tuning</p>
                    <p>• Script: train_models_local.py</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-blue-500" />
              </div>

              {/* Step 6 */}
              <div 
                className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('upload')}
              >
                <div className="font-semibold text-blue-900 mb-2">6. Upload to R2</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Manual upload</li>
                  <li>• Models + EDA files</li>
                  <li>• Cloudflare R2 storage</li>
                </ul>
                {expandedStep === 'upload' && (
                  <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                    <p>• Upload data/eda/* (8 PNGs + JSON)</p>
                    <p>• Upload data/models/* (.pkl files)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: DEPLOYMENT (Purple) */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-lg font-bold text-lg">
                <Server className="w-6 h-6" />
                <span>DEPLOYMENT</span>
              </div>
            </div>
            
            {/* Horizontal flow of steps */}
            <div className="flex items-start gap-4 justify-center">
              {/* Step 7 */}
              <div 
                className="bg-white border-2 border-purple-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[280px]"
                onClick={() => toggleStep('backend')}
              >
                <div className="font-semibold text-purple-900 mb-2">7. Backend Deploy</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• FastAPI on Railway</li>
                  <li>• Load models from R2</li>
                  <li>• Initialize SHAP explainer</li>
                  <li>• Connect Supabase</li>
                </ul>
                {expandedStep === 'backend' && (
                  <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-gray-600 space-y-1">
                    <p>• Python 3.11 + FastAPI + SHAP</p>
                    <p>• API endpoints: /predict, /session, /rate-layer</p>
                    <p>• Environment: R2_ACCESS_KEY, SUPABASE_URL</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-purple-500" />
              </div>

              {/* Step 8 */}
              <div 
                className="bg-white border-2 border-purple-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[280px]"
                onClick={() => toggleStep('frontend')}
              >
                <div className="font-semibold text-purple-900 mb-2">8. Frontend Deploy</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Next.js on Netlify</li>
                  <li>• Connect to backend API</li>
                  <li>• Persona pages</li>
                  <li>• Layer system</li>
                </ul>
                {expandedStep === 'frontend' && (
                  <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-gray-600 space-y-1">
                    <p>• Next.js 14 + TypeScript + TailwindCSS</p>
                    <p>• Environment: NEXT_PUBLIC_API_URL</p>
                    <p>• Persona pages, layer system, questionnaires</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: ONLINE EXPERIMENT (Green) */}
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-lg">
                <Users className="w-6 h-6" />
                <span>ONLINE EXPERIMENT</span>
              </div>
            </div>
            
            {/* Horizontal flow of steps */}
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {/* Step 9 */}
              <div 
                className="bg-white border-2 border-green-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('registration')}
              >
                <div className="font-semibold text-green-900 mb-2">9. User Registration</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Pre-questionnaire</li>
                  <li>• Demographics</li>
                  <li>• AI experience</li>
                </ul>
                {expandedStep === 'registration' && (
                  <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-600 space-y-1">
                    <p>• Collect: name, age, profession</p>
                    <p>• Finance experience, AI familiarity</p>
                    <p>• Create session_id in Supabase</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-green-500" />
              </div>

              {/* Step 10 */}
              <div 
                className="bg-white border-2 border-green-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('persona')}
              >
                <div className="font-semibold text-green-900 mb-2">10. Persona Selection</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Maria, Jonas, or Sofia</li>
                  <li>• Preset loan scenarios</li>
                  <li>• Submit application</li>
                </ul>
                {expandedStep === 'persona' && (
                  <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-600 space-y-1">
                    <p>• Maria (67): €4,000 home renovation</p>
                    <p>• Jonas (27): €12,000 business start-up</p>
                    <p>• Sofia (44): €20,000 debt consolidation</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-green-500" />
              </div>

              {/* Step 11 - HIGHLIGHTED */}
              <div 
                className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow min-w-[200px]"
                onClick={() => toggleStep('prediction')}
              >
                <div className="font-semibold text-yellow-900 mb-2 flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  11. Real-time Prediction
                </div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Feature engineering</li>
                  <li>• XGBoost prediction</li>
                  <li>• <strong>SHAP calculation NOW</strong></li>
                  <li>• Return all features</li>
                </ul>
                {expandedStep === 'prediction' && (
                  <div className="mt-3 pt-3 border-t border-yellow-300 text-xs text-gray-900 bg-white p-2 rounded space-y-1">
                    <p><strong>Step 1:</strong> Feature engineering (5 derived)</p>
                    <p><strong>Step 2:</strong> Transform via pipeline</p>
                    <p><strong>Step 3:</strong> model.predict(X)</p>
                    <p><strong>Step 4:</strong> explainer.shap_values(X) ⚡</p>
                    <p><strong>Step 5:</strong> Sort by |SHAP value|</p>
                    <p><strong>Output:</strong> decision + 20-30 SHAP values</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-green-500" />
              </div>

              {/* Step 12 */}
              <div 
                className="bg-white border-2 border-green-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('layers')}
              >
                <div className="font-semibold text-green-900 mb-2">12. Explanation Layers</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Layer 1-4 (4 layers)</li>
                  <li>• Progressive detail</li>
                  <li>• Rate each layer</li>
                </ul>
                {expandedStep === 'layers' && (
                  <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-600 space-y-1">
                    <p>• Layer 1: Baseline SHAP Table</p>
                    <p>• Layer 2: Interactive Dashboard</p>
                    <p>• Layer 3: Narrative Explanation</p>
                    <p>• Layer 4: Counterfactual Simulator</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-green-500" />
              </div>

              {/* Step 13 */}
              <div 
                className="bg-white border-2 border-green-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('questionnaire')}
              >
                <div className="font-semibold text-green-900 mb-2">13. Post-Questionnaire</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Satisfaction ratings</li>
                  <li>• Trust assessment</li>
                  <li>• Preferred layer</li>
                </ul>
                {expandedStep === 'questionnaire' && (
                  <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-600 space-y-1">
                    <p>• Understanding (1-5 Likert scale)</p>
                    <p>• Communicability (1-5 Likert scale)</p>
                    <p>• Cognitive Load (1-5 Likert scale)</p>
                  </div>
                )}
              </div>

              <div className="flex items-center pt-8">
                <ArrowRight className="w-8 h-8 text-green-500" />
              </div>

              {/* Step 14 */}
              <div 
                className="bg-white border-2 border-green-400 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                onClick={() => toggleStep('complete')}
              >
                <div className="font-semibold text-green-900 mb-2">14. Complete</div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Save to Supabase</li>
                  <li>• Session complete</li>
                  <li>• Thank you page</li>
                </ul>
                {expandedStep === 'complete' && (
                  <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-600 space-y-1">
                    <p>• All data stored in database</p>
                    <p>• Session marked as completed</p>
                    <p>• Ready for analysis</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Insight Box */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white text-center mt-8">
          <h3 className="text-xl font-bold mb-2">🔑 Critical Insight: SHAP Timing</h3>
          <p className="text-sm opacity-90">
            <strong>OFFLINE:</strong> SHAP TreeExplainer is initialized from the trained model<br/>
            <strong>ONLINE:</strong> SHAP values are calculated in real-time for each prediction (Step 11)
          </p>
        </div>
      </div>
    </div>
  )
}
