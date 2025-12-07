'use client'

import { useState } from 'react'
import { ArrowRight, Database, BarChart3, Settings, Brain, Upload, Server, Users, Zap, Eye, Layers } from 'lucide-react'

export default function ProcessHorizontalPage() {
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  const toggleStep = (step: string) => {
    setExpandedStep(expandedStep === step ? null : step)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              XAI Credit Risk System
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Technical Process Flow Diagram (Horizontal)
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Technical Flow</h2>
          <p className="text-gray-600">End-to-end pipeline from data acquisition to user experiment</p>
        </div>

        {/* Horizontal Flow Diagram */}
        <div className="overflow-x-auto pb-8">
          <div className="inline-flex gap-6 min-w-max">
            
            {/* PHASE 1: OFFLINE TRAINING (Blue) */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 w-[400px]">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
                  <Database className="w-5 h-5" />
                  <span>OFFLINE TRAINING</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Step 1 */}
                <div 
                  className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('data')}
                >
                  <div className="font-semibold text-blue-900 mb-1">1. Data Acquisition</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• UCI German Credit dataset</li>
                    <li>• 1000 samples, 20 features</li>
                    <li>• Binary classification</li>
                  </ul>
                  {expandedStep === 'data' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p>• Download from UCI ML Repository</p>
                      <p>• Map symbolic codes (A11, A12...)</p>
                      <p>• Remove biased features</p>
                      <p>• Script: download_data.py</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-blue-500 rotate-90" /></div>

                {/* Step 2 */}
                <div 
                  className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('cleaning')}
                >
                  <div className="font-semibold text-blue-900 mb-1">2. Data Cleaning</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Map categorical values</li>
                    <li>• Human-readable labels</li>
                    <li>• Save clean CSV</li>
                  </ul>
                  {expandedStep === 'cleaning' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p>• Output: german_credit_clean.csv</p>
                      <p>• 18 features (removed gender, foreign_worker)</p>
                      <p>• Script: convert_data.py</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-blue-500 rotate-90" /></div>

                {/* Step 3 */}
                <div 
                  className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('eda')}
                >
                  <div className="font-semibold text-blue-900 mb-1">3. EDA Analysis</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• 8 visualizations</li>
                    <li>• Statistics JSON</li>
                    <li>• Feature importance</li>
                  </ul>
                  {expandedStep === 'eda' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p>• Target: 70% good, 30% bad</p>
                      <p>• 7 numerical, 11 categorical</p>
                      <p>• Script: eda_local.py</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-blue-500 rotate-90" /></div>

                {/* Step 4 */}
                <div 
                  className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('feature')}
                >
                  <div className="font-semibold text-blue-900 mb-1">4. Feature Engineering</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• 5 derived features</li>
                    <li>• Encoding pipeline</li>
                    <li>• Scaling pipeline</li>
                  </ul>
                  {expandedStep === 'feature' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p>• monthly_burden = credit / duration</p>
                      <p>• stability_score = age × employment</p>
                      <p>• risk_ratio, credit_to_income, duration_risk</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-blue-500 rotate-90" /></div>

                {/* Step 5 */}
                <div 
                  className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('training')}
                >
                  <div className="font-semibold text-blue-900 mb-1">5. Model Training</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• XGBoost classifier</li>
                    <li>• SHAP TreeExplainer init</li>
                    <li>• Save models to disk</li>
                  </ul>
                  {expandedStep === 'training' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p>• 80/20 train-test split</p>
                      <p>• Hyperparameter tuning</p>
                      <p>• Script: train_models_local.py</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-blue-500 rotate-90" /></div>

                {/* Step 6 */}
                <div 
                  className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('upload')}
                >
                  <div className="font-semibold text-blue-900 mb-1">6. Upload to R2</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Manual upload</li>
                    <li>• Models + EDA files</li>
                    <li>• Cloudflare R2 storage</li>
                  </ul>
                  {expandedStep === 'upload' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p>• Upload data/eda/* (8 PNGs + JSON)</p>
                      <p>• Upload data/models/* (.pkl files)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Horizontal Arrow */}
            <div className="flex items-center">
              <ArrowRight className="w-12 h-12 text-blue-500" />
            </div>

            {/* PHASE 2: DEPLOYMENT (Purple) */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 w-[400px]">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg font-bold">
                  <Server className="w-5 h-5" />
                  <span>DEPLOYMENT</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Step 7 */}
                <div 
                  className="bg-white border-2 border-purple-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('backend')}
                >
                  <div className="font-semibold text-purple-900 mb-1">7. Backend Deploy</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• FastAPI on Railway</li>
                    <li>• Load models from R2</li>
                    <li>• Initialize SHAP explainer</li>
                    <li>• Connect Supabase</li>
                  </ul>
                  {expandedStep === 'backend' && (
                    <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-gray-600">
                      <p>• Python 3.11 + FastAPI + SHAP</p>
                      <p>• API endpoints: /predict, /session, /rate-layer</p>
                      <p>• Environment: R2_ACCESS_KEY, SUPABASE_URL</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-purple-500 rotate-90" /></div>

                {/* Step 8 */}
                <div 
                  className="bg-white border-2 border-purple-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('frontend')}
                >
                  <div className="font-semibold text-purple-900 mb-1">8. Frontend Deploy</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Next.js on Netlify</li>
                    <li>• Connect to backend API</li>
                    <li>• Persona pages</li>
                    <li>• Layer system</li>
                  </ul>
                  {expandedStep === 'frontend' && (
                    <div className="mt-2 pt-2 border-t border-purple-200 text-xs text-gray-600">
                      <p>• Next.js 14 + TypeScript + TailwindCSS</p>
                      <p>• Environment: NEXT_PUBLIC_API_URL</p>
                      <p>• Persona pages, layer system, questionnaires</p>
                    </div>
                  )}
                </div>

                {/* Spacer to align with other columns */}
                <div className="h-[420px]"></div>
              </div>
            </div>

            {/* Horizontal Arrow */}
            <div className="flex items-center">
              <ArrowRight className="w-12 h-12 text-purple-500" />
            </div>

            {/* PHASE 3: ONLINE EXPERIMENT (Green) */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 w-[400px]">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                  <Users className="w-5 h-5" />
                  <span>ONLINE EXPERIMENT</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Step 9 */}
                <div 
                  className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('registration')}
                >
                  <div className="font-semibold text-green-900 mb-1">9. User Registration</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Pre-questionnaire</li>
                    <li>• Demographics</li>
                    <li>• AI experience</li>
                  </ul>
                  {expandedStep === 'registration' && (
                    <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
                      <p>• Collect: name, age, profession</p>
                      <p>• Finance experience, AI familiarity</p>
                      <p>• Create session_id in Supabase</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-green-500 rotate-90" /></div>

                {/* Step 10 */}
                <div 
                  className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('persona')}
                >
                  <div className="font-semibold text-green-900 mb-1">10. Persona Selection</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Maria, Jonas, or Sofia</li>
                    <li>• Preset loan scenarios</li>
                    <li>• Submit application</li>
                  </ul>
                  {expandedStep === 'persona' && (
                    <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
                      <p>• Maria (67): €4,000 home renovation</p>
                      <p>• Jonas (27): €12,000 business start-up</p>
                      <p>• Sofia (44): €20,000 debt consolidation</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-green-500 rotate-90" /></div>

                {/* Step 11 - HIGHLIGHTED */}
                <div 
                  className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => toggleStep('prediction')}
                >
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
                  {expandedStep === 'prediction' && (
                    <div className="mt-2 pt-2 border-t border-yellow-300 text-xs text-gray-900 bg-white p-2 rounded">
                      <p><strong>Step 1:</strong> Feature engineering (5 derived)</p>
                      <p><strong>Step 2:</strong> Transform via pipeline</p>
                      <p><strong>Step 3:</strong> model.predict(X)</p>
                      <p><strong>Step 4:</strong> explainer.shap_values(X) ⚡</p>
                      <p><strong>Step 5:</strong> Sort by |SHAP value|</p>
                      <p><strong>Output:</strong> decision + 20-30 SHAP values</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-green-500 rotate-90" /></div>

                {/* Step 12 */}
                <div 
                  className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('layers')}
                >
                  <div className="font-semibold text-green-900 mb-1">12. Explanation Layers</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Layer 0-5 (6 layers)</li>
                    <li>• Progressive detail</li>
                    <li>• Rate each layer</li>
                  </ul>
                  {expandedStep === 'layers' && (
                    <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
                      <p>• Layer 0: All Features Table</p>
                      <p>• Layer 1: Minimal (single factor)</p>
                      <p>• Layer 2: Short Text</p>
                      <p>• Layer 3: Visual Charts</p>
                      <p>• Layer 4: Detailed Context</p>
                      <p>• Layer 5: Counterfactual</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-green-500 rotate-90" /></div>

                {/* Step 13 */}
                <div 
                  className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('questionnaire')}
                >
                  <div className="font-semibold text-green-900 mb-1">13. Post-Questionnaire</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Satisfaction ratings</li>
                    <li>• Trust assessment</li>
                    <li>• Preferred layer</li>
                  </ul>
                  {expandedStep === 'questionnaire' && (
                    <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
                      <p>• Trust (1-7 Likert scale)</p>
                      <p>• Understanding (1-7 Likert scale)</p>
                      <p>• Usefulness (1-7 Likert scale)</p>
                      <p>• Satisfaction (1-7 Likert scale)</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-5 h-5 text-green-500 rotate-90" /></div>

                {/* Step 14 */}
                <div 
                  className="bg-white border-2 border-green-400 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleStep('complete')}
                >
                  <div className="font-semibold text-green-900 mb-1">14. Complete</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Save to Supabase</li>
                    <li>• Session complete</li>
                    <li>• Thank you page</li>
                  </ul>
                  {expandedStep === 'complete' && (
                    <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
                      <p>• All data stored in database</p>
                      <p>• Session marked as completed</p>
                      <p>• Ready for analysis</p>
                    </div>
                  )}
                </div>
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
