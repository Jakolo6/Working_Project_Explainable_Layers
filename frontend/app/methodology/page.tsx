'use client'

import { ArrowRight, Database, FileText, Users, Brain, BarChart3, CheckCircle } from 'lucide-react'

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-b">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Experimental Methodology</h1>
          <p className="text-slate-300">Within-Subjects Design: Explanation Layer Comparison Study</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        
        {/* Study Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Design Overview</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-600 mb-1">Design Type</div>
              <div className="text-lg font-bold text-slate-900">Within-Subjects</div>
              <div className="text-xs text-slate-600 mt-1">Each participant evaluates all conditions</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-600 mb-1">Independent Variable</div>
              <div className="text-lg font-bold text-slate-900">Explanation Layer Type</div>
              <div className="text-xs text-slate-600 mt-1">4 levels (Baseline, Dashboard, Narrative, Counterfactual)</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-600 mb-1">Dependent Variables</div>
              <div className="text-lg font-bold text-slate-900">Understanding, Communicability, Cognitive Load</div>
              <div className="text-xs text-slate-600 mt-1">5-point Likert scales + time-on-task</div>
            </div>
          </div>
        </div>

        {/* Horizontal Flow Diagram */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Participant Flow Diagram</h2>
          
          <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-6">
            {/* Horizontal Flow */}
            <div className="overflow-x-auto">
              <div className="inline-flex items-center gap-3 min-w-max pb-4">
                
                {/* Phase 1: Recruitment & Consent */}
                <div className="flex flex-col items-center">
                  <div className="bg-slate-700 text-white px-4 py-2 rounded-t-lg font-semibold text-sm w-[160px] text-center">
                    Phase 1
                  </div>
                  <div className="bg-white border-2 border-slate-700 rounded-b-lg p-4 w-[160px]">
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="text-xs font-bold text-center mb-2">Recruitment & Consent</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>• Information sheet</div>
                      <div>• Informed consent</div>
                      <div>• Eligibility check</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="text-xs font-semibold text-slate-700">n = recruited</div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />

                {/* Phase 2: Baseline Measurement */}
                <div className="flex flex-col items-center">
                  <div className="bg-indigo-700 text-white px-4 py-2 rounded-t-lg font-semibold text-sm w-[160px] text-center">
                    Phase 2
                  </div>
                  <div className="bg-white border-2 border-indigo-700 rounded-b-lg p-4 w-[160px]">
                    <div className="flex items-center justify-center mb-2">
                      <BarChart3 className="w-6 h-6 text-indigo-700" />
                    </div>
                    <div className="text-xs font-bold text-center mb-2">Baseline Measurement</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>• Demographics</div>
                      <div>• AI trust attitudes</div>
                      <div>• Financial literacy</div>
                      <div>• Explanation preferences</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="text-xs font-semibold text-slate-700">t₀ measurement</div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />

                {/* Phase 3: Persona 1 */}
                <div className="flex flex-col items-center">
                  <div className="bg-purple-700 text-white px-4 py-2 rounded-t-lg font-semibold text-sm w-[160px] text-center">
                    Phase 3
                  </div>
                  <div className="bg-white border-2 border-purple-700 rounded-b-lg p-4 w-[160px]">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-purple-700" />
                    </div>
                    <div className="text-xs font-bold text-center mb-2">Persona 1 Exposure</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>• Application review</div>
                      <div>• AI decision (t₁)</div>
                      <div>• Layer 1 → Rate</div>
                      <div>• Layer 2 → Rate</div>
                      <div>• Layer 3 → Rate</div>
                      <div>• Layer 4 → Rate</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="text-xs font-semibold text-slate-700">4 × ratings</div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />

                {/* Phase 4: Persona 2 */}
                <div className="flex flex-col items-center">
                  <div className="bg-purple-700 text-white px-4 py-2 rounded-t-lg font-semibold text-sm w-[160px] text-center">
                    Phase 4
                  </div>
                  <div className="bg-white border-2 border-purple-700 rounded-b-lg p-4 w-[160px]">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-purple-700" />
                    </div>
                    <div className="text-xs font-bold text-center mb-2">Persona 2 Exposure</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>• Application review</div>
                      <div>• AI decision (t₂)</div>
                      <div>• Layer 1 → Rate</div>
                      <div>• Layer 2 → Rate</div>
                      <div>• Layer 3 → Rate</div>
                      <div>• Layer 4 → Rate</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="text-xs font-semibold text-slate-700">4 × ratings</div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0" />

                {/* Phase 5: Completion */}
                <div className="flex flex-col items-center">
                  <div className="bg-green-700 text-white px-4 py-2 rounded-t-lg font-semibold text-sm w-[160px] text-center">
                    Phase 5
                  </div>
                  <div className="bg-white border-2 border-green-700 rounded-b-lg p-4 w-[160px]">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="text-xs font-bold text-center mb-2">Data Collection Complete</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>• Session finalized</div>
                      <div>• Data stored</div>
                      <div>• Debriefing</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <div className="text-xs font-semibold text-slate-700">n = completed</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t-2 border-slate-300">
              <div className="text-xs font-semibold text-slate-700 mb-2">Measurement Points:</div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <div><strong>t₀:</strong> Pre-exposure baseline</div>
                <div><strong>t₁, t₂:</strong> Post-decision measurements (per persona)</div>
                <div><strong>Per layer:</strong> Understanding, Communicability, Cognitive Load (5-point Likert) + Time-on-task (seconds)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Collection Summary */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Collection Summary</h2>
          
          <div className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Variable Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Measurement</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Scale</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Collection Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Demographics</td>
                  <td className="px-4 py-3 text-slate-600">Age, Gender</td>
                  <td className="px-4 py-3 text-slate-600">Categorical / Continuous</td>
                  <td className="px-4 py-3 text-slate-600">Phase 2 (t₀)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Financial Relationship</td>
                  <td className="px-4 py-3 text-slate-600">Layperson / Borrower / Professional</td>
                  <td className="px-4 py-3 text-slate-600">Categorical (3 levels)</td>
                  <td className="px-4 py-3 text-slate-600">Phase 2 (t₀)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">AI Trust Instinct</td>
                  <td className="px-4 py-3 text-slate-600">Automation bias / Algorithm aversion / Neutral</td>
                  <td className="px-4 py-3 text-slate-600">Categorical (3 levels)</td>
                  <td className="px-4 py-3 text-slate-600">Phase 2 (t₀)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">AI Fairness Stance</td>
                  <td className="px-4 py-3 text-slate-600">Skeptical / Cautious / Optimistic</td>
                  <td className="px-4 py-3 text-slate-600">Categorical (3 levels)</td>
                  <td className="px-4 py-3 text-slate-600">Phase 2 (t₀)</td>
                </tr>
                <tr className="hover:bg-slate-50 bg-blue-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Understanding</td>
                  <td className="px-4 py-3 text-slate-600">"How well did you understand this explanation?"</td>
                  <td className="px-4 py-3 text-slate-600">5-point Likert (1=Not at all, 5=Completely)</td>
                  <td className="px-4 py-3 text-slate-600">After each layer (8×)</td>
                </tr>
                <tr className="hover:bg-slate-50 bg-blue-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Communicability</td>
                  <td className="px-4 py-3 text-slate-600">"How easy to communicate to customer?"</td>
                  <td className="px-4 py-3 text-slate-600">5-point Likert (1=Very difficult, 5=Very easy)</td>
                  <td className="px-4 py-3 text-slate-600">After each layer (8×)</td>
                </tr>
                <tr className="hover:bg-slate-50 bg-blue-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Cognitive Load</td>
                  <td className="px-4 py-3 text-slate-600">"How much mental effort required?"</td>
                  <td className="px-4 py-3 text-slate-600">5-point Likert (1=Very high, 5=Very low)</td>
                  <td className="px-4 py-3 text-slate-600">After each layer (8×)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Time-on-Task</td>
                  <td className="px-4 py-3 text-slate-600">Duration spent viewing each layer</td>
                  <td className="px-4 py-3 text-slate-600">Continuous (seconds)</td>
                  <td className="px-4 py-3 text-slate-600">Automatic tracking (8×)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">Qualitative Feedback</td>
                  <td className="px-4 py-3 text-slate-600">Optional open-ended comments</td>
                  <td className="px-4 py-3 text-slate-600">Free text</td>
                  <td className="px-4 py-3 text-slate-600">After each layer (optional)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sample Size Calculation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistical Considerations</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-6">
              <h3 className="font-bold text-slate-900 mb-4">Sample Size Justification</h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span className="font-medium">Effect size (Cohen's d):</span>
                  <span className="font-mono">0.5 (medium)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Statistical power:</span>
                  <span className="font-mono">0.80 (80%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Significance level (α):</span>
                  <span className="font-mono">0.05</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Number of conditions:</span>
                  <span className="font-mono">4 (layers)</span>
                </div>
                <div className="pt-3 border-t border-slate-300 flex justify-between">
                  <span className="font-bold">Minimum required n:</span>
                  <span className="font-mono font-bold">~34 participants</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 rounded-lg p-6">
              <h3 className="font-bold text-slate-900 mb-4">Planned Analyses</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div><strong>Primary:</strong> Repeated-measures ANOVA (4 layers × 3 DVs)</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div><strong>Post-hoc:</strong> Bonferroni-corrected pairwise comparisons</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div><strong>Covariates:</strong> AI trust, financial literacy, demographics</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div><strong>Order effects:</strong> Counterbalancing check via mixed-effects model</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div><strong>Qualitative:</strong> Thematic analysis of open comments</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Implementation</h2>
          
          <div className="bg-white border-2 border-slate-300 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="font-bold text-slate-900 mb-3">Frontend</div>
                <div className="space-y-1 text-slate-600">
                  <div>• Next.js 14 (React)</div>
                  <div>• TypeScript</div>
                  <div>• TailwindCSS</div>
                  <div>• Client-side timing</div>
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-3">Backend</div>
                <div className="space-y-1 text-slate-600">
                  <div>• FastAPI (Python 3.11)</div>
                  <div>• XGBoost classifier</div>
                  <div>• SHAP explainer</div>
                  <div>• RESTful API</div>
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-3">Data Storage</div>
                <div className="space-y-1 text-slate-600">
                  <div>• Supabase (PostgreSQL)</div>
                  <div>• Anonymized sessions</div>
                  <div>• GDPR compliant</div>
                  <div>• Cloudflare R2 (models)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Note */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📋</div>
            <div>
              <div className="font-bold text-blue-900 mb-1">Export Instructions</div>
              <div className="text-sm text-blue-800">
                This page is designed for thesis inclusion. To export: (1) Print to PDF with landscape orientation, 
                or (2) Take a screenshot of the horizontal flow diagram section. The diagram maintains readability 
                at reduced sizes suitable for academic publications.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
