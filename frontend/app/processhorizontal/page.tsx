'use client'

import { ArrowRight, Zap } from 'lucide-react'

export default function ProcessHorizontalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-b shadow-lg">
        <div className="max-w-[1800px] mx-auto px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">XAI Credit Risk System - Technical Process Flow</h1>
          <p className="text-slate-300">Horizontal diagram optimized for thesis inclusion</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-12">
        
        {/* Compact Horizontal Flow */}
        <div className="bg-white border-2 border-slate-300 rounded-xl shadow-xl p-8">
          <div className="space-y-6">
            
            {/* ROW 1: OFFLINE TRAINING */}
            <div className="flex items-stretch gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-bold text-sm whitespace-nowrap min-w-[160px] flex items-center justify-center shadow-md">
                OFFLINE TRAINING
              </div>
              <div className="flex items-stretch gap-3 flex-1">
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-blue-900 mb-1 text-sm">1. Data Acquisition</div>
                  <div className="text-gray-600 leading-tight">UCI German Credit (1000 samples, 20 features)</div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-blue-900 mb-1 text-sm">2. Data Cleaning</div>
                  <div className="text-gray-600 leading-tight">Map categorical values, human-readable labels</div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-blue-900 mb-1 text-sm">3. EDA Analysis</div>
                  <div className="text-gray-600 leading-tight">8 visualizations, statistics JSON</div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-blue-900 mb-1 text-sm">4. Feature Engineering</div>
                  <div className="text-gray-600 leading-tight">5 derived features, encoding pipeline</div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-blue-900 mb-1 text-sm">5. Model Training</div>
                  <div className="text-gray-600 leading-tight">XGBoost + SHAP TreeExplainer</div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-blue-900 mb-1 text-sm">6. Upload to R2</div>
                  <div className="text-gray-600 leading-tight">Cloudflare R2 storage</div>
                </div>
              </div>
            </div>

            {/* ROW 2: DEPLOYMENT */}
            <div className="flex items-stretch gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white px-4 py-3 rounded-lg font-bold text-sm whitespace-nowrap min-w-[160px] flex items-center justify-center shadow-md">
                DEPLOYMENT
              </div>
              <div className="flex items-stretch gap-3 flex-1">
                <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-purple-900 mb-1 text-sm">7. Backend Deploy</div>
                  <div className="text-gray-600 leading-tight">FastAPI on Railway, load models from R2</div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-purple-900 mb-1 text-sm">8. Frontend Deploy</div>
                  <div className="text-gray-600 leading-tight">Next.js on Netlify, connect to backend API</div>
                </div>
              </div>
            </div>

            {/* ROW 3: ONLINE EXPERIMENT */}
            <div className="flex items-stretch gap-3">
              <div className="bg-gradient-to-br from-green-600 to-green-700 text-white px-4 py-3 rounded-lg font-bold text-sm whitespace-nowrap min-w-[160px] flex items-center justify-center shadow-md">
                ONLINE EXPERIMENT
              </div>
              <div className="flex items-stretch gap-3 flex-1">
                <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-green-900 mb-1 text-sm">9. Consent & Baseline</div>
                  <div className="text-gray-600 leading-tight">Demographics, AI trust, create session</div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-green-900 mb-1 text-sm">10. Persona Selection</div>
                  <div className="text-gray-600 leading-tight">Maria (LOW RISK) or Jonas (HIGH RISK)</div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-2 border-yellow-500 rounded-lg px-4 py-3 text-xs flex-1 shadow-md hover:shadow-lg transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-yellow-900 mb-1 text-sm flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    11. Real-time Prediction
                  </div>
                  <div className="text-gray-700 leading-tight">XGBoost + <strong>SHAP calculation NOW</strong></div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-green-900 mb-1 text-sm">12. Explanation Layers</div>
                  <div className="text-gray-600 leading-tight">4 layers: SHAP, Dashboard, Narrative, Counterfactual</div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-green-900 mb-1 text-sm">13. Repeat Persona 2</div>
                  <div className="text-gray-600 leading-tight">Complete steps 10-12 again</div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0 self-center" />
                <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-lg px-4 py-3 text-xs flex-1 shadow-sm hover:shadow-md transition-shadow h-[72px] flex flex-col justify-center">
                  <div className="font-bold text-green-900 mb-1 text-sm">14. Study Complete</div>
                  <div className="text-gray-600 leading-tight">8 ratings (4×2), save to Supabase</div>
                </div>
              </div>
            </div>

          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t-2 border-slate-200">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <div className="font-bold text-amber-900 mb-1">Key Insight: SHAP Timing</div>
                  <div className="text-sm text-amber-800">
                    <strong>OFFLINE:</strong> SHAP TreeExplainer initialized from trained model (Step 5) • 
                    <strong className="ml-2">ONLINE:</strong> SHAP values calculated in real-time per prediction (Step 11)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📋</div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg mb-2">Export for Master Thesis</h3>
              <div className="text-blue-800 space-y-2">
                <p className="leading-relaxed">
                  This professional horizontal layout is optimized for thesis inclusion with consistent box heights and clear visual hierarchy.
                </p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded font-medium">Option 1:</span>
                    <span>Print to PDF (landscape orientation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded font-medium">Option 2:</span>
                    <span>Screenshot (maintains full quality)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
