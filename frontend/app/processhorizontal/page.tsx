'use client'

import { ArrowRight, Database, Server, Users, Zap } from 'lucide-react'

export default function ProcessHorizontalPage() {
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

        {/* Horizontal Flow Diagram with Swimlanes */}
        <div className="overflow-x-auto pb-8">
          <div className="inline-flex gap-4 min-w-max">
            
            {/* PHASE 1: OFFLINE TRAINING (Blue) */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 w-[320px]">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  <Database className="w-4 h-4" />
                  <span>OFFLINE TRAINING</span>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-blue-900 mb-1 text-sm">1. Data Acquisition</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• UCI German Credit dataset</li>
                    <li>• 1000 samples, 20 features</li>
                    <li>• Binary classification</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-blue-500 rotate-90" /></div>

                {/* Step 2 */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-blue-900 mb-1 text-sm">2. Data Cleaning</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Map categorical values</li>
                    <li>• Human-readable labels</li>
                    <li>• Save clean CSV</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-blue-500 rotate-90" /></div>

                {/* Step 3 */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-blue-900 mb-1 text-sm">3. EDA Analysis</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• 8 visualizations</li>
                    <li>• Statistics JSON</li>
                    <li>• Feature importance</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-blue-500 rotate-90" /></div>

                {/* Step 4 */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-blue-900 mb-1 text-sm">4. Feature Engineering</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• 5 derived features</li>
                    <li>• Encoding pipeline</li>
                    <li>• Scaling pipeline</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-blue-500 rotate-90" /></div>

                {/* Step 5 */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-blue-900 mb-1 text-sm">5. Model Training</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• XGBoost classifier</li>
                    <li>• SHAP TreeExplainer init</li>
                    <li>• Save models to disk</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-blue-500 rotate-90" /></div>

                {/* Step 6 */}
                <div className="bg-white border-2 border-blue-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-blue-900 mb-1 text-sm">6. Upload to R2</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Manual upload</li>
                    <li>• Models + EDA files</li>
                    <li>• Cloudflare R2 storage</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PHASE 2: DEPLOYMENT (Purple) */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-5 w-[320px]">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>DEPLOYMENT</span>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {/* Step 7 */}
                <div className="bg-white border-2 border-purple-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-purple-900 mb-1 text-sm">7. Backend Deploy</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• FastAPI on Railway</li>
                    <li>• Load models from R2</li>
                    <li>• Initialize SHAP explainer</li>
                    <li>• Connect Supabase</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-purple-500 rotate-90" /></div>

                {/* Step 8 */}
                <div className="bg-white border-2 border-purple-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-purple-900 mb-1 text-sm">8. Frontend Deploy</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Next.js on Netlify</li>
                    <li>• Connect to backend API</li>
                    <li>• Persona pages</li>
                    <li>• Layer system</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PHASE 3: ONLINE EXPERIMENT (Green) */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 w-[320px]">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>ONLINE EXPERIMENT</span>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {/* Step 9 */}
                <div className="bg-white border-2 border-green-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-green-900 mb-1 text-sm">9. User Registration</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Pre-questionnaire</li>
                    <li>• Demographics</li>
                    <li>• AI experience</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-green-500 rotate-90" /></div>

                {/* Step 10 */}
                <div className="bg-white border-2 border-green-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-green-900 mb-1 text-sm">10. Persona Selection</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Maria, Jonas, or Sofia</li>
                    <li>• Preset loan scenarios</li>
                    <li>• Submit application</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-green-500 rotate-90" /></div>

                {/* Step 11 - HIGHLIGHTED */}
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-2.5 shadow-lg">
                  <div className="font-semibold text-yellow-900 mb-1 text-sm flex items-center gap-1">
                    <Zap className="w-3 h-3" />
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
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-green-500 rotate-90" /></div>

                {/* Step 12 */}
                <div className="bg-white border-2 border-green-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-green-900 mb-1 text-sm">12. Explanation Layers</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Layer 1-4 (4 layers)</li>
                    <li>• Progressive detail</li>
                    <li>• Rate each layer</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-green-500 rotate-90" /></div>

                {/* Step 13 */}
                <div className="bg-white border-2 border-green-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-green-900 mb-1 text-sm">13. Post-Questionnaire</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Satisfaction ratings</li>
                    <li>• Trust assessment</li>
                    <li>• Preferred layer</li>
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-green-500 rotate-90" /></div>

                {/* Step 14 */}
                <div className="bg-white border-2 border-green-400 rounded-lg p-2.5 shadow-sm">
                  <div className="font-semibold text-green-900 mb-1 text-sm">14. Complete</div>
                  <ul className="text-xs text-gray-700 space-y-0.5">
                    <li>• Save to Supabase</li>
                    <li>• Session complete</li>
                    <li>• Thank you page</li>
                  </ul>
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
