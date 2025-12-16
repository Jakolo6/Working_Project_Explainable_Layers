'use client'

import { ArrowRight, Zap } from 'lucide-react'

export default function ProcessHorizontalPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-b">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold mb-1">XAI Credit Risk System - Technical Process Flow</h1>
          <p className="text-slate-300 text-sm">Horizontal diagram optimized for thesis inclusion</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        
        {/* Compact Horizontal Flow */}
        <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6">
          <div className="space-y-4">
            
            {/* ROW 1: OFFLINE TRAINING */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white px-3 py-1.5 rounded font-bold text-xs whitespace-nowrap min-w-[140px] text-center">
                OFFLINE TRAINING
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="bg-white border border-blue-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-blue-900 mb-0.5">1. Data Acquisition</div>
                  <div className="text-gray-600">UCI German Credit (1000 samples, 20 features)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="bg-white border border-blue-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-blue-900 mb-0.5">2. Data Cleaning</div>
                  <div className="text-gray-600">Map categorical values, human-readable labels</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="bg-white border border-blue-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-blue-900 mb-0.5">3. EDA Analysis</div>
                  <div className="text-gray-600">8 visualizations, statistics JSON</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="bg-white border border-blue-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-blue-900 mb-0.5">4. Feature Engineering</div>
                  <div className="text-gray-600">5 derived features, encoding pipeline</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="bg-white border border-blue-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-blue-900 mb-0.5">5. Model Training</div>
                  <div className="text-gray-600">XGBoost + SHAP TreeExplainer</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="bg-white border border-blue-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-blue-900 mb-0.5">6. Upload to R2</div>
                  <div className="text-gray-600">Cloudflare R2 storage</div>
                </div>
              </div>
            </div>

            {/* ROW 2: DEPLOYMENT */}
            <div className="flex items-center gap-2">
              <div className="bg-purple-600 text-white px-3 py-1.5 rounded font-bold text-xs whitespace-nowrap min-w-[140px] text-center">
                DEPLOYMENT
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="bg-white border border-purple-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-purple-900 mb-0.5">7. Backend Deploy</div>
                  <div className="text-gray-600">FastAPI on Railway, load models from R2</div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div className="bg-white border border-purple-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-purple-900 mb-0.5">8. Frontend Deploy</div>
                  <div className="text-gray-600">Next.js on Netlify, connect to backend API</div>
                </div>
              </div>
            </div>

            {/* ROW 3: ONLINE EXPERIMENT */}
            <div className="flex items-center gap-2">
              <div className="bg-green-600 text-white px-3 py-1.5 rounded font-bold text-xs whitespace-nowrap min-w-[140px] text-center">
                ONLINE EXPERIMENT
              </div>
              <div className="flex items-center gap-2 flex-1">
                <div className="bg-white border border-green-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-green-900 mb-0.5">9. Consent & Baseline</div>
                  <div className="text-gray-600">Demographics, AI trust, create session</div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="bg-white border border-green-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-green-900 mb-0.5">10. Persona Selection</div>
                  <div className="text-gray-600">Maria (LOW RISK) or Jonas (HIGH RISK)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-yellow-900 mb-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    11. Real-time Prediction
                  </div>
                  <div className="text-gray-700">XGBoost + <strong>SHAP calculation NOW</strong></div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="bg-white border border-green-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-green-900 mb-0.5">12. Explanation Layers</div>
                  <div className="text-gray-600">4 layers: SHAP, Dashboard, Narrative, Counterfactual</div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="bg-white border border-green-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-green-900 mb-0.5">13. Repeat Persona 2</div>
                  <div className="text-gray-600">Complete steps 10-12 again</div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="bg-white border border-green-300 rounded px-3 py-2 text-xs flex-1">
                  <div className="font-bold text-green-900 mb-0.5">14. Study Complete</div>
                  <div className="text-gray-600">8 ratings (4×2), save to Supabase</div>
                </div>
              </div>
            </div>

          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-slate-300 text-xs text-slate-600">
            <strong>Key Insight:</strong> SHAP TreeExplainer initialized offline (Step 5), SHAP values calculated in real-time per prediction (Step 11)
          </div>
        </div>

        {/* Export Instructions */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r text-sm">
          <div className="font-bold text-blue-900 mb-1">📋 Export for Thesis</div>
          <div className="text-blue-800">
            This compact horizontal layout is optimized for thesis inclusion. Export via: (1) Print to PDF with landscape orientation, 
            or (2) Screenshot. The diagram maintains readability when scaled to fit page width.
          </div>
        </div>

      </div>
    </div>
  )
}
