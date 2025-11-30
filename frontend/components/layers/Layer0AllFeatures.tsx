// Layer 0: SHAP Dashboard - Visual credit decision analysis dashboard
// Redesigned as a modern dashboard with visual widgets, charts, and interactive cards

'use client'

import React, { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, ChevronDown, ChevronUp, AlertTriangle, Info, Zap } from 'lucide-react'
import GlobalModelExplanation from './GlobalModelExplanation'
import Tooltip from '@/components/ui/Tooltip'
import ModelCertaintyExplanation from '@/components/ui/ModelCertaintyExplanation'
import { getFeatureDescription } from '@/lib/featureDescriptions'
import { isCreditHistoryFeature, CREDIT_HISTORY_WARNING_TEXT } from '@/components/CreditHistoryWarning'
import CreditHistoryDisclaimer from '@/components/CreditHistoryDisclaimer'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer0AllFeaturesProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature display name mapping
const FEATURE_DISPLAY_MAP: Record<string, string> = {
  'Checking Account Status': 'Checking Account',
  'Savings Account Status': 'Savings Account',
  'Credit History': 'Credit History',
  'Loan Purpose': 'Loan Purpose',
  'Employment Duration': 'Employment',
  'Housing Status': 'Housing',
  'Property Ownership': 'Property',
  'Other Debtors/Guarantors': 'Guarantors',
  'Other Payment Plans': 'Other Plans',
  'Job Type': 'Job Type',
  'Telephone Registration': 'Telephone',
  'Loan Duration (months)': 'Loan Duration',
  'Credit Amount': 'Credit Amount',
  'Installment Rate': 'Installment Rate',
  'Years at Residence': 'Residence',
  'Age': 'Age',
  'Existing Credits': 'Existing Credits',
  'Number of Dependents': 'Dependents',
  'Monthly Payment Burden': 'Monthly Burden',
  'Financial Stability Score': 'Stability Score',
  'Credit Risk Ratio': 'Risk Ratio',
  'Credit to Income Ratio': 'Credit/Income',
  'Duration Risk Score': 'Duration Risk',
}

function getDisplayName(rawName: string): string {
  if (FEATURE_DISPLAY_MAP[rawName]) return FEATURE_DISPLAY_MAP[rawName]
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_MAP)) {
    if (rawName.toLowerCase().includes(key.toLowerCase())) return value
  }
  return rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(feature: string, value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  if (feature.includes('Duration') && feature.includes('months')) return `${num} mo`
  if (feature.includes('Amount')) return `${num.toLocaleString()} DM`
  if (feature.includes('Age')) return `${num} yrs`
  if (feature.includes('Burden')) return `${num.toLocaleString()} DM/mo`
  if (feature.includes('Residence')) return `${num} yrs`
  if (feature.includes('Rate')) return `${num.toFixed(1)}%`
  return num.toFixed(1)
}

export default function Layer0AllFeatures({ decision, probability, shapFeatures }: Layer0AllFeaturesProps) {
  const [expandedSection, setExpandedSection] = useState<'supportive' | 'concerns' | 'all' | null>('all')
  const [selectedFeature, setSelectedFeature] = useState<SHAPFeature | null>(null)
  
  const isApproved = decision === 'approved'
  const confidencePercent = Math.round(probability * 100)
  
  // Computed values
  const sortedFeatures = useMemo(() => 
    [...shapFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)),
    [shapFeatures]
  )
  
  const supportiveFeatures = useMemo(() => 
    sortedFeatures.filter(f => f.impact === 'negative'),
    [sortedFeatures]
  )
  
  const concernFeatures = useMemo(() => 
    sortedFeatures.filter(f => f.impact === 'positive'),
    [sortedFeatures]
  )
  
  const topSupportive = supportiveFeatures[0]
  const topConcern = concernFeatures[0]
  
  // Calculate net impact
  const totalSupportive = useMemo(() => 
    supportiveFeatures.reduce((sum, f) => sum + Math.abs(f.shap_value), 0),
    [supportiveFeatures]
  )
  
  const totalConcerns = useMemo(() => 
    concernFeatures.reduce((sum, f) => sum + Math.abs(f.shap_value), 0),
    [concernFeatures]
  )
  
  const netImpact = totalSupportive - totalConcerns
  const maxImpact = Math.max(totalSupportive, totalConcerns)
  const balancePercent = maxImpact > 0 ? Math.round((totalSupportive / (totalSupportive + totalConcerns)) * 100) : 50
  
  // Max SHAP for bar scaling
  const maxShap = Math.max(...sortedFeatures.map(f => Math.abs(f.shap_value)))

  return (
    <div className="space-y-6">
      {/* Global Model Explanation */}
      <GlobalModelExplanation defaultExpanded={false} showVisualizations={true} />
      
      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD HEADER - Decision Summary
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl p-6 ${isApproved 
        ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200' 
        : 'bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 border-2 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isApproved ? 'bg-green-100' : 'bg-red-100'}`}>
              {isApproved ? <CheckCircle2 className="text-green-600" size={36} /> : <XCircle className="text-red-600" size={36} />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Credit Decision: {decision.toUpperCase()}
              </h1>
              <p className="text-gray-600">SHAP Analysis Dashboard • {shapFeatures.length} factors analyzed</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
              {confidencePercent}%
            </div>
            <p className="text-sm text-gray-500">Model Confidence</p>
          </div>
        </div>
      </div>

      {/* Model Certainty Explanation */}
      <ModelCertaintyExplanation probability={probability} decision={decision} />

      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD WIDGETS - Key Metrics Row
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Widget 1: Total Factors */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="text-indigo-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{shapFeatures.length}</div>
              <div className="text-xs text-gray-500">Factors Analyzed</div>
            </div>
          </div>
        </div>
        
        {/* Widget 2: Supportive Factors */}
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingDown className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{supportiveFeatures.length}</div>
              <div className="text-xs text-gray-500">Supportive</div>
            </div>
          </div>
        </div>
        
        {/* Widget 3: Concern Factors */}
        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingUp className="text-red-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{concernFeatures.length}</div>
              <div className="text-xs text-gray-500">Concerns</div>
            </div>
          </div>
        </div>
        
        {/* Widget 4: Net Balance */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${netImpact >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Activity className={netImpact >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Net Impact</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          VISUAL CHARTS ROW - Balance Meter & Distribution
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Balance Meter */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-indigo-500" size={18} />
            <h3 className="font-semibold text-gray-900">Influence Balance</h3>
          </div>
          
          {/* Donut-style visual */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#22c55e" strokeWidth="12"
                  strokeDasharray={`${balancePercent * 2.51} 251`}
                  strokeLinecap="round"
                />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#ef4444" strokeWidth="12"
                  strokeDasharray={`${(100 - balancePercent) * 2.51} 251`}
                  strokeDashoffset={`${-balancePercent * 2.51}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-700">{balancePercent}%</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Supportive
                </span>
                <span className="font-semibold text-green-600">{balancePercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Concerns
                </span>
                <span className="font-semibold text-red-600">{100 - balancePercent}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Factors Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-amber-500" size={18} />
            <h3 className="font-semibold text-gray-900">Key Factors</h3>
          </div>
          
          <div className="space-y-3">
            {/* Strongest Supportive */}
            {topSupportive && (
              <div 
                className="p-3 bg-green-50 rounded-lg border border-green-100 cursor-pointer hover:bg-green-100 transition"
                onClick={() => setSelectedFeature(topSupportive)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 font-medium">Strongest Supportive</div>
                    <div className="font-semibold text-gray-900">{getDisplayName(topSupportive.feature)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{topSupportive.shap_value.toFixed(3)}</div>
                    <div className="text-xs text-gray-500">{formatValue(topSupportive.feature, topSupportive.value)}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Strongest Concern */}
            {topConcern && (
              <div 
                className="p-3 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:bg-red-100 transition"
                onClick={() => setSelectedFeature(topConcern)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-red-600 font-medium">Strongest Concern</div>
                    <div className="font-semibold text-gray-900">
                      {getDisplayName(topConcern.feature)}
                      {isCreditHistoryFeature(topConcern.feature) && <span className="ml-1 text-amber-500">⚠</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">+{topConcern.shap_value.toFixed(3)}</div>
                    <div className="text-xs text-gray-500">{formatValue(topConcern.feature, topConcern.value)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SHAP WATERFALL CHART - Visual Bar Chart
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-500" size={18} />
            <h3 className="font-semibold text-gray-900">SHAP Impact Chart</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span> Supportive
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500"></span> Concern
            </span>
          </div>
        </div>
        
        <div className="p-5">
          <div className="space-y-2">
            {sortedFeatures.slice(0, 10).map((feature, idx) => {
              const barWidth = (Math.abs(feature.shap_value) / maxShap) * 100
              const displayName = getDisplayName(feature.feature)
              const isCreditHistory = isCreditHistoryFeature(feature.feature)
              
              return (
                <Tooltip
                  key={idx}
                  content={
                    isCreditHistory
                      ? `${getFeatureDescription(displayName)?.description || 'This factor influenced the decision.'}\n\n⚠️ ${CREDIT_HISTORY_WARNING_TEXT}`
                      : getFeatureDescription(displayName)?.description || 'This factor influenced the decision.'
                  }
                >
                  <div 
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      selectedFeature?.feature === feature.feature 
                        ? 'bg-indigo-50 ring-2 ring-indigo-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFeature(feature)}
                  >
                    <div className="w-32 text-sm font-medium text-gray-700 truncate flex items-center gap-1">
                      {displayName}
                      {isCreditHistory && <AlertTriangle size={12} className="text-amber-500" />}
                    </div>
                    <div className="flex-1 flex items-center">
                      {feature.impact === 'negative' ? (
                        <>
                          <div className="flex-1 flex justify-end">
                            <div 
                              className="h-6 bg-gradient-to-l from-green-500 to-green-400 rounded-l"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <div className="w-px h-8 bg-gray-300 mx-1" />
                          <div className="flex-1" />
                        </>
                      ) : (
                        <>
                          <div className="flex-1" />
                          <div className="w-px h-8 bg-gray-300 mx-1" />
                          <div className="flex-1">
                            <div 
                              className="h-6 bg-gradient-to-r from-red-400 to-red-500 rounded-r"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className={`w-20 text-right text-sm font-mono font-semibold ${
                      feature.impact === 'positive' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(3)}
                    </div>
                  </div>
                </Tooltip>
              )
            })}
          </div>
          
          {sortedFeatures.length > 10 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Showing top 10 of {sortedFeatures.length} factors. See detailed table below.
            </p>
          )}
        </div>
      </div>

      {/* Credit History Disclaimer */}
      <CreditHistoryDisclaimer />

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURE DETAIL PANEL (when a feature is selected)
          ═══════════════════════════════════════════════════════════════════════ */}
      {selectedFeature && (
        <div className="bg-indigo-50 rounded-xl border-2 border-indigo-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {getDisplayName(selectedFeature.feature)}
                {isCreditHistoryFeature(selectedFeature.feature) && (
                  <span className="text-amber-500"><AlertTriangle size={16} /></span>
                )}
              </h3>
              <p className="text-sm text-gray-600">
                {getFeatureDescription(selectedFeature.feature)?.description || getFeatureDescription(getDisplayName(selectedFeature.feature))?.description || 'This factor influenced the credit decision.'}
              </p>
            </div>
            <button 
              onClick={() => setSelectedFeature(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500">Current Value</div>
              <div className="font-semibold text-gray-900">{formatValue(selectedFeature.feature, selectedFeature.value)}</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500">SHAP Impact</div>
              <div className={`font-semibold ${selectedFeature.impact === 'positive' ? 'text-red-600' : 'text-green-600'}`}>
                {selectedFeature.shap_value > 0 ? '+' : ''}{selectedFeature.shap_value.toFixed(4)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-xs text-gray-500">Effect</div>
              <div className={`font-semibold ${selectedFeature.impact === 'positive' ? 'text-red-600' : 'text-green-600'}`}>
                {selectedFeature.impact === 'positive' ? 'Raised concerns' : 'Supported approval'}
              </div>
            </div>
          </div>
          
          {isCreditHistoryFeature(selectedFeature.feature) && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>⚠️ Note:</strong> {CREDIT_HISTORY_WARNING_TEXT}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EXPANDABLE SECTIONS - Detailed Feature Lists
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Supportive Factors Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'supportive' ? null : 'supportive')}
            className="w-full px-5 py-4 flex items-center justify-between bg-green-50 hover:bg-green-100 transition"
          >
            <div className="flex items-center gap-3">
              <TrendingDown className="text-green-600" size={20} />
              <span className="font-semibold text-gray-900">Supportive Factors ({supportiveFeatures.length})</span>
            </div>
            {expandedSection === 'supportive' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSection === 'supportive' && (
            <div className="p-4 grid gap-2">
              {supportiveFeatures.map((f, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg hover:bg-green-50 cursor-pointer transition"
                  onClick={() => setSelectedFeature(f)}
                >
                  <div>
                    <span className="font-medium text-gray-900">{getDisplayName(f.feature)}</span>
                    <span className="text-gray-500 text-sm ml-2">{formatValue(f.feature, f.value)}</span>
                  </div>
                  <span className="font-mono text-green-600 font-semibold">{f.shap_value.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Concern Factors Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'concerns' ? null : 'concerns')}
            className="w-full px-5 py-4 flex items-center justify-between bg-red-50 hover:bg-red-100 transition"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="text-red-600" size={20} />
              <span className="font-semibold text-gray-900">Concern Factors ({concernFeatures.length})</span>
            </div>
            {expandedSection === 'concerns' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSection === 'concerns' && (
            <div className="p-4 grid gap-2">
              {concernFeatures.map((f, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg hover:bg-red-50 cursor-pointer transition"
                  onClick={() => setSelectedFeature(f)}
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {getDisplayName(f.feature)}
                      {isCreditHistoryFeature(f.feature) && <span className="ml-1 text-amber-500">⚠</span>}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">{formatValue(f.feature, f.value)}</span>
                  </div>
                  <span className="font-mono text-red-600 font-semibold">+{f.shap_value.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* All Factors Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'all' ? null : 'all')}
            className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="text-indigo-600" size={20} />
              <span className="font-semibold text-gray-900">All Factors - Detailed Table ({sortedFeatures.length})</span>
            </div>
            {expandedSection === 'all' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSection === 'all' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Factor</th>
                    <th className="px-4 py-3 text-left">Value</th>
                    <th className="px-4 py-3 text-left">Impact</th>
                    <th className="px-4 py-3 text-left">Effect</th>
                    <th className="px-4 py-3 text-left">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedFeatures.map((f, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-gray-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      onClick={() => setSelectedFeature(f)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">#{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getDisplayName(f.feature)}
                        {isCreditHistoryFeature(f.feature) && <span className="ml-1 text-amber-500">⚠</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatValue(f.feature, f.value)}</td>
                      <td className={`px-4 py-3 text-sm font-mono font-semibold ${f.impact === 'positive' ? 'text-red-600' : 'text-green-600'}`}>
                        {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(4)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          f.impact === 'positive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {f.impact === 'positive' ? 'Concern' : 'Supportive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${f.impact === 'positive' ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${(Math.abs(f.shap_value) / maxShap) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LEGEND / HELP
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Info className="text-slate-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">Understanding This Dashboard</p>
            <ul className="space-y-1">
              <li><strong className="text-green-600">Green/Negative SHAP</strong> = Factor supports approval (reduces default risk)</li>
              <li><strong className="text-red-600">Red/Positive SHAP</strong> = Factor raises concerns (increases default risk)</li>
              <li><strong>Click any factor</strong> to see detailed information</li>
              <li><strong>Balance meter</strong> shows the overall weight of supportive vs concern factors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
