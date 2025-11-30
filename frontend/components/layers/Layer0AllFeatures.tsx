// Layer 0: All Features - Complete SHAP values for all features (Baseline Layer)

'use client'

import React from 'react'
import GlobalModelExplanation from './GlobalModelExplanation'
import ContextualGlobalInsight from './ContextualGlobalInsight'
import Tooltip from '@/components/ui/Tooltip'
import { getFeatureDescription, getValueDescription } from '@/lib/featureDescriptions'
import CreditHistoryWarning, { isCreditHistoryFeature, CREDIT_HISTORY_WARNING_TEXT } from '@/components/CreditHistoryWarning'

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

// Map raw encoded feature names to human-readable display names
const FEATURE_DISPLAY_MAP: Record<string, string> = {
  // Checking status
  'checking_status_no_checking_account': 'Checking Account: None',
  'checking_status_negative_balance': 'Checking Account: Negative Balance',
  'checking_status_0_to_200_dm': 'Checking Account: 0-200 DM',
  'checking_status_gte_200_dm': 'Checking Account: 200+ DM',
  'checking_status': 'Checking Account Status',
  
  // Savings status
  'savings_status_lt_100_dm': 'Savings: Less than 100 DM',
  'savings_status_100_to_500_dm': 'Savings: 100-500 DM',
  'savings_status_500_to_1000_dm': 'Savings: 500-1000 DM',
  'savings_status_gte_1000_dm': 'Savings: 1000+ DM',
  'savings_status_unknown': 'Savings: Unknown/None',
  'savings_status': 'Savings Account Status',
  
  // Credit history
  'credit_history_critical': 'Credit History: Critical',
  'credit_history_existing_paid': 'Credit History: Existing Paid',
  'credit_history_delayed': 'Credit History: Delayed',
  'credit_history_all_paid': 'Credit History: All Paid',
  'credit_history_no_credits': 'Credit History: No Credits',
  'credit_history': 'Credit History',
  
  // Purpose
  'purpose_new_car': 'Purpose: New Car',
  'purpose_used_car': 'Purpose: Used Car',
  'purpose_furniture': 'Purpose: Furniture',
  'purpose_radio_tv': 'Purpose: Radio/TV',
  'purpose_appliances': 'Purpose: Appliances',
  'purpose_repairs': 'Purpose: Repairs',
  'purpose_education': 'Purpose: Education',
  'purpose_business': 'Purpose: Business',
  'purpose_other': 'Purpose: Other',
  'purpose': 'Loan Purpose',
  
  // Employment
  'employment_unemployed': 'Employment: Unemployed',
  'employment_lt_1_year': 'Employment: Less than 1 Year',
  'employment_1_to_4_years': 'Employment: 1-4 Years',
  'employment_4_to_7_years': 'Employment: 4-7 Years',
  'employment_gte_7_years': 'Employment: 7+ Years',
  'employment': 'Employment Duration',
  
  // Housing
  'housing_rent': 'Housing: Renting',
  'housing_own': 'Housing: Owner',
  'housing_free': 'Housing: Free',
  'housing': 'Housing Status',
  
  // Property
  'property_magnitude_real_estate': 'Property: Real Estate',
  'property_magnitude_savings_insurance': 'Property: Savings/Insurance',
  'property_magnitude_car': 'Property: Car/Other',
  'property_magnitude_unknown': 'Property: Unknown/None',
  'property_magnitude': 'Property Ownership',
  
  // Other debtors
  'other_debtors_none': 'Guarantors: None',
  'other_debtors_co_applicant': 'Guarantors: Co-applicant',
  'other_debtors_guarantor': 'Guarantors: Guarantor',
  'other_debtors': 'Other Debtors/Guarantors',
  
  // Other payment plans
  'other_payment_plans_none': 'Other Plans: None',
  'other_payment_plans_bank': 'Other Plans: Bank',
  'other_payment_plans_stores': 'Other Plans: Stores',
  'other_payment_plans': 'Other Payment Plans',
  
  // Job
  'job_skilled': 'Job: Skilled',
  'job_unskilled_resident': 'Job: Unskilled Resident',
  'job_management': 'Job: Management',
  'job_unemployed': 'Job: Unemployed',
  'job': 'Job Type',
  
  // Telephone
  'own_telephone_yes': 'Telephone: Yes',
  'own_telephone_none': 'Telephone: None',
  'own_telephone': 'Telephone',
  
  // Numerical features
  'duration': 'Loan Duration (months)',
  'credit_amount': 'Credit Amount (DM)',
  'installment_commitment': 'Installment Rate (% of income)',
  'residence_since': 'Years at Current Residence',
  'age': 'Applicant Age',
  'existing_credits': 'Number of Existing Credits',
  'num_dependents': 'Number of Dependents',
  
  // Engineered features
  'monthly_burden': 'Monthly Payment Burden',
  'stability_score': 'Financial Stability Score',
  'risk_ratio': 'Credit-to-Age Risk Ratio',
  'credit_to_income_proxy': 'Credit to Income Ratio',
  'duration_risk': 'Duration Risk Score',
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
  
  // Check if credit_history features are present (need warning)
  const hasCreditHistoryFeature = sortedFeatures.some(f => isCreditHistoryFeature(f.feature))
  
  return (
    <div className="space-y-6">
      {/* Global Model Explanation - How the tool works in general */}
      <GlobalModelExplanation defaultExpanded={false} />
      
      {/* Contextualized Global Insight - Features layer style */}
      <ContextualGlobalInsight context="features" className="mb-4" />
      
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

      {/* Credit History Warning - if applicable */}
      {hasCreditHistoryFeature && (
        <CreditHistoryWarning showDetails={true} />
      )}

      {/* Legend - Bank Clerk Friendly */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Understanding This Table</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Impact Score:</strong> Shows how much each factor influenced the decision for this applicant</p>
          <p><strong>Red items:</strong> <span className="text-red-600">Factors that raised concerns</span> (increased risk assessment)</p>
          <p><strong>Green items:</strong> <span className="text-green-600">Factors that were favorable</span> (reduced risk assessment)</p>
          <p><strong>Higher numbers:</strong> Indicate the factor had a stronger influence on the decision</p>
        </div>
      </div>
    </div>
  )
}
