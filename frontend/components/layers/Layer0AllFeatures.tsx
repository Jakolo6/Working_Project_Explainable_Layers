// Layer 0: All Features - Complete SHAP values for all features (Baseline Layer)

'use client'

import React from 'react'
import GlobalModelExplanation from './GlobalModelExplanation'
import Tooltip from '@/components/ui/Tooltip'
import { getFeatureDescription, getValueDescription } from '@/lib/featureDescriptions'
import { isCreditHistoryFeature, CREDIT_HISTORY_WARNING_TEXT } from '@/components/CreditHistoryWarning'
import CreditHistoryDisclaimer from '@/components/CreditHistoryDisclaimer'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  // 'positive' = increases default risk (bad for applicant) = RED
  // 'negative' = decreases default risk (good for applicant) = GREEN
  impact: 'positive' | 'negative'
}

interface Layer0AllFeaturesProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Map feature names to human-readable display names
// Backend now returns grouped features with human-readable names, but we keep this for fallback
const FEATURE_DISPLAY_MAP: Record<string, string> = {
  // Categorical features (now grouped by backend)
  'Checking Account Status': 'Checking Account Status',
  'Savings Account Status': 'Savings Account Status',
  'Credit History': 'Credit History',
  'Loan Purpose': 'Loan Purpose',
  'Employment Duration': 'Employment Duration',
  'Housing Status': 'Housing Status',
  'Property Ownership': 'Property Ownership',
  'Other Debtors/Guarantors': 'Other Debtors/Guarantors',
  'Other Payment Plans': 'Other Payment Plans',
  'Job Type': 'Job Type',
  'Telephone Registration': 'Telephone Registration',
  
  // Numerical features
  'Loan Duration (months)': 'Loan Duration',
  'Credit Amount': 'Credit Amount',
  'Installment Rate': 'Installment Rate',
  'Years at Residence': 'Years at Residence',
  'Age': 'Applicant Age',
  'Existing Credits': 'Existing Credits',
  'Number of Dependents': 'Dependents',
  
  // Engineered features
  'Monthly Payment Burden': 'Monthly Payment Burden',
  'Financial Stability Score': 'Financial Stability',
  'Credit Risk Ratio': 'Credit Risk Ratio',
  'Credit to Income Ratio': 'Credit to Income Ratio',
  'Duration Risk Score': 'Duration Risk',
}

// Convert raw feature name to human-readable display name
function getDisplayFeatureName(rawName: string): string {
  // Try exact match first
  if (FEATURE_DISPLAY_MAP[rawName]) {
    return FEATURE_DISPLAY_MAP[rawName]
  }
  
  // Try lowercase match
  const lowerName = rawName.toLowerCase()
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_MAP)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // Try partial match for encoded categorical features
  for (const [key, value] of Object.entries(FEATURE_DISPLAY_MAP)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value
    }
  }
  
  // Fallback: clean up the raw name
  return rawName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Lt /g, '< ')
    .replace(/Gte /g, '≥ ')
    .replace(/Dm/g, 'DM')
}

// Helper function to format feature values
function formatValue(feature: string, value: string): string {
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') && feature.includes('months')) {
      return `${numValue} months`
    } else if (feature.includes('Credit Amount') || feature.includes('Amount')) {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age')) {
      return `${numValue} years old`
    } else if (feature.includes('Monthly Payment Burden')) {
      return `${numValue.toLocaleString()} DM/month`
    } else if (feature.includes('Duration Risk Score')) {
      return `${numValue.toLocaleString()} DM×months`
    } else if (feature.includes('Credit Risk Ratio')) {
      return `${numValue.toFixed(1)} DM per 100 age-years`
    } else if (feature.includes('Credit to Income Ratio')) {
      return `${numValue.toFixed(1)} DM per age-year`
    } else if (feature.includes('Financial Stability Score')) {
      return `${numValue.toFixed(1)} age×employment-years`
    } else if (feature.includes('Installment Rate')) {
      return `${numValue.toFixed(2)}% of income`
    } else if (feature.toLowerCase().includes('residence')) {
      return `${numValue} years`
    } else if (feature.toLowerCase().includes('credits')) {
      return `${numValue} loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.toLowerCase().includes('dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('Score') || feature.includes('Ratio')) {
      return numValue.toFixed(2)
    }
  }
  
  return value
}

// Helper function to get impact color
function getImpactColor(impact: 'positive' | 'negative'): string {
  return impact === 'positive' ? 'text-red-600' : 'text-green-600'
}

// Helper function to get impact description
// SHAP values are for Class 1 (bad credit/default risk):
//   - positive SHAP = increases default risk = AGAINST approval
//   - negative SHAP = decreases default risk = SUPPORTS approval
function getImpactDescription(impact: 'positive' | 'negative', decision: string): string {
  if (decision === 'rejected') {
    return impact === 'positive' ? 'Contributed to rejection' : 'Argued against rejection'
  } else {
    return impact === 'positive' ? 'Raised concerns' : 'Supported approval'
  }
}

export default function Layer0AllFeatures({ decision, probability, shapFeatures }: Layer0AllFeaturesProps) {
  // Sort features by absolute SHAP value (most important first)
  const sortedFeatures = [...shapFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
  
  // Split by impact: positive = risk-increasing (bad), negative = risk-decreasing (good)
  const riskIncreasingFeatures = sortedFeatures.filter(f => f.impact === 'positive')
  const riskDecreasingFeatures = sortedFeatures.filter(f => f.impact === 'negative')
  
  return (
    <div className="space-y-6">
      {/* Global Model Explanation - How the tool works in general with SHAP visualizations */}
      <GlobalModelExplanation defaultExpanded={false} showVisualizations={true} />
      
      {/* Local Decision Section - This specific applicant */}
      <div className="border-t-4 border-indigo-200 pt-4">
        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <span>👤</span> This Applicant&apos;s Complete Analysis
        </h3>
        
        {/* Decision Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Feature Analysis
          </h2>
          <p className="text-gray-600">
            All {shapFeatures.length} factors analyzed with their individual impact on this decision
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-lg mt-3 ${
            decision === 'approved' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <span className="font-semibold">
              Decision: {decision.toUpperCase()} ({(probability * 100).toFixed(1)}% confidence)
            </span>
          </div>
        </div>
      </div>

      {/* SHAP Value Explanation - Always show at the beginning */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">📊 Understanding Impact Values</h4>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-red-500 font-bold text-lg">+</span>
            <div>
              <span className="font-medium text-red-700">Positive values (red)</span>
              <p className="text-gray-600 text-xs">Increase default risk → push toward rejection</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold text-lg">−</span>
            <div>
              <span className="font-medium text-green-700">Negative values (green)</span>
              <p className="text-gray-600 text-xs">Decrease default risk → support approval</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics - Clerk Friendly */}
      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{shapFeatures.length}</div>
          <div className="text-sm text-gray-600">Total Factors Checked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{riskIncreasingFeatures.length}</div>
          <div className="text-sm text-gray-600">Raised Concerns</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{riskDecreasingFeatures.length}</div>
          <div className="text-sm text-gray-600">Were Favorable</div>
        </div>
      </div>

      {/* Credit History Disclaimer - Always visible above table */}
      <CreditHistoryDisclaimer />

      {/* All Features Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Complete Feature Analysis
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Features sorted by impact magnitude (most influential first)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Factor
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Value
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Impact
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                  Effect
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Strength
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedFeatures.map((feature, index) => {
                const displayName = getDisplayFeatureName(feature.feature)
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">
                      <Tooltip 
                        content={
                          isCreditHistoryFeature(feature.feature)
                            ? `${getFeatureDescription(displayName)?.description || 'This factor influenced the credit decision.'}\n\n⚠️ ${CREDIT_HISTORY_WARNING_TEXT}`
                            : getFeatureDescription(displayName)?.description || 'This factor influenced the credit decision.'
                        }
                      >
                        <span className={`font-medium cursor-help border-b border-dotted ${isCreditHistoryFeature(feature.feature) ? 'border-amber-400 bg-amber-50 px-1' : 'border-gray-400'}`}>
                          {displayName}
                          {isCreditHistoryFeature(feature.feature) && <span className="ml-1 text-amber-600">⚠</span>}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700">
                      {formatValue(displayName, feature.value)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-mono">
                      <span className={getImpactColor(feature.impact)}>
                        {feature.shap_value > 0 ? '+' : ''}{feature.shap_value.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        feature.impact === 'positive' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getImpactDescription(feature.impact, decision)}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              feature.impact === 'positive' ? 'bg-red-500' : 'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(Math.abs(feature.shap_value) / Math.max(...sortedFeatures.map(f => Math.abs(f.shap_value))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend - Bank Clerk Friendly */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Reading This Table</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Strength bar:</strong> Longer bars = stronger influence on the decision</p>
          <p><strong>Features at top:</strong> Had the most impact on this specific decision</p>
        </div>
      </div>
    </div>
  )
}
