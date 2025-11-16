// Layer 1: Minimal - Single key driver explanation in plain language

import React from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { getFeatureDescription } from '@/lib/featureDescriptions'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer1MinimalProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature name mappings: backend names → display names
const FEATURE_LABELS: Record<string, string> = {
  // Backend returns human-readable names, map to consistent display names
  'Loan Duration (months)': 'Loan Duration',
  'Credit Amount': 'Credit Amount',
  'Installment Rate': 'Monthly Payment Burden',
  'Years at Residence': 'Residential Stability',
  'Age': 'Age',
  'Existing Credits': 'Existing Loans',
  'Number of Dependents': 'Number of Dependents',
  'Monthly Payment Burden': 'Monthly Payment Burden',
  'Financial Stability Score': 'Financial Stability Score',
  'Credit Risk Ratio': 'Credit Risk Ratio',
  'Credit to Income Ratio': 'Credit to Income Ratio',
  'Duration Risk Score': 'Duration Risk Score',
  'Checking Account Status': 'Checking Account Status',
  'Credit History': 'Credit History',
  'Loan Purpose': 'Loan Purpose',
  'Savings Account Status': 'Savings Account Status',
  'Employment Duration': 'Employment Duration',
  'Other Debtors/Guarantors': 'Other Debtors/Guarantors',
  'Property Ownership': 'Property Ownership',
  'Other Payment Plans': 'Other Payment Plans',
  'Housing Status': 'Housing Status',
  'Job Type': 'Job Type',
  'Telephone Registration': 'Telephone Registration'
}

// Value descriptions: backend values → human-readable descriptions
const VALUE_DESCRIPTIONS: Record<string, string> = {
  // Categorical values are already human-readable from backend
  // This is used for additional formatting if needed
}

// Contextual explanations for each feature category
const FEATURE_CONTEXT: Record<string, string> = {
  'Loan Duration': 'Longer loans carry more uncertainty and risk.',
  'Credit Amount': 'Higher amounts mean greater risk for the lender.',
  'Monthly Payment Burden': 'Higher monthly payments relative to income increase default risk.',
  'Residential Stability': 'Longer residence suggests stability and reliability.',
  'Age': 'Age correlates with financial experience and stability.',
  'Existing Loans': 'Multiple loans can strain repayment capacity.',
  'Number of Dependents': 'More dependents mean higher financial obligations.',
  'Financial Stability Score': 'A composite measure of overall financial health.',
  'Credit Risk Ratio': 'Measures the relationship between credit amount and borrower profile.',
  'Credit to Income Ratio': 'Higher ratios indicate greater repayment burden.',
  'Duration Risk Score': 'Combines loan duration with amount to assess risk.',
  'Checking Account Status': 'Account balance indicates financial management skills.',
  'Credit History': 'Past payment behavior is a strong indicator of future reliability.',
  'Loan Purpose': 'Different loan purposes carry different levels of risk.',
  'Savings Account Status': 'Savings provide a financial cushion for unexpected situations.',
  'Employment Duration': 'Longer employment history suggests job security.',
  'Other Debtors/Guarantors': 'Co-signers can reduce lending risk.',
  'Property Ownership': 'Property serves as collateral and shows financial stability.',
  'Other Payment Plans': 'Existing payment obligations affect repayment capacity.',
  'Housing Status': 'Homeownership indicates financial responsibility.',
  'Job Type': 'Job type affects income stability and repayment ability.',
  'Telephone Registration': 'Having a registered phone shows stability and contactability.',
}

// Format numeric values with context
function formatValue(feature: string, value: string): string {
  // Backend already provides human-readable values for categorical features
  // Just format numerical values with appropriate units
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') || feature.includes('months')) {
      return `${numValue} months`
    } else if (feature.includes('Credit Amount') || feature.includes('Amount')) {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age')) {
      return `${numValue} years old`
    } else if (feature.includes('Rate') || feature.includes('Burden')) {
      return `${numValue}% of income`
    } else if (feature.includes('Residence') || feature.includes('Years')) {
      return `${numValue} years`
    } else if (feature.includes('Credits') || feature.includes('Loans')) {
      return `${numValue} loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('Dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    } else if (feature.includes('Score') || feature.includes('Ratio')) {
      return numValue.toFixed(2)
    }
  }
  
  // Return the value as-is (backend provides human-readable categorical values)
  return value
}

// Get impact strength and direction in plain language
function getImpactDescription(shapValue: number, impact: 'positive' | 'negative'): string {
  const magnitude = Math.abs(shapValue)
  
  let strength = ''
  if (magnitude < 0.3) {
    strength = 'slightly'
  } else if (magnitude < 0.7) {
    strength = 'moderately'
  } else {
    strength = 'strongly'
  }
  
  if (impact === 'positive') {
    return `This factor ${strength} supported approval.`
  } else {
    return `This factor ${strength} reduced the chances of approval.`
  }
}

export default function Layer1Minimal({ decision, probability, shapFeatures }: Layer1MinimalProps) {
  // Get the single most important feature
  const topFeature = shapFeatures[0]
  
  if (!topFeature) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  const featureLabel = FEATURE_LABELS[topFeature.feature] || topFeature.feature
  const valueDescription = formatValue(topFeature.feature, topFeature.value)
  const impactDescription = getImpactDescription(topFeature.shap_value, topFeature.impact)
  const context = FEATURE_CONTEXT[featureLabel] || ''

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
          isApproved ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isApproved ? '✓' : '✗'}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            Minimal Explanation
          </h3>
          <p className="text-gray-600">The single most important factor</p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
        <p className="text-lg text-gray-900 mb-3">
          <strong>Key Factor:</strong>
        </p>
        <p className="text-xl font-semibold text-blue-900 mb-3">
          <Tooltip 
            content={getFeatureDescription(topFeature.feature)?.description || 'No description available'}
          >
            <span className="cursor-help border-b border-dotted border-blue-400">
              {featureLabel}
            </span>
          </Tooltip>
        </p>
        <p className="text-gray-700 mb-3">
          <span className="bg-white px-3 py-1.5 rounded border border-gray-200">
            {valueDescription}
          </span>
        </p>
        <p className="text-base text-gray-800 mb-2">
          {impactDescription}
        </p>
        {context && (
          <p className="text-sm text-gray-600 italic">
            {context}
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong>What this means:</strong> The AI {decision} this loan mainly because the applicant's{' '}
          <strong>{featureLabel.toLowerCase()}</strong> ({valueDescription.toLowerCase()}){' '}
          {topFeature.impact === 'positive' ? 'met' : 'did not meet'} the bank's criteria for financial stability.
        </p>
      </div>
    </div>
  )
}
