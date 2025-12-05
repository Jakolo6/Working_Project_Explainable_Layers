'use client'

import React, { useState } from 'react'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  content: string
  size?: number
}

export default function InfoTooltip({ content, size = 14 }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label="More information"
      >
        <Info size={size} />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs whitespace-normal">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}

// Predefined tooltips for common terms
export const TOOLTIPS = {
  modelConfidence: "How certain the AI is about this specific decision. Higher percentages indicate stronger confidence.",
  impactPercent: "How much this specific factor influenced the final result, relative to all other factors analyzed.",
  riskDrivers: "Factors that increased the perceived risk of default. These pushed the decision toward rejection.",
  strengths: "Factors that supported approval. These reduced the perceived risk of default.",
  typicalRange: "The range of values typically seen in approved applications from the historical dataset.",
  shapValue: "A measure of how much this factor pushed the prediction toward approval (negative) or rejection (positive).",
  interestRate: "Your personalized APR is calculated from your risk profile: Base Rate (4.5%) + Risk Adjustment. Lower default risk = lower rate.",
  defaultRisk: "The estimated probability that this applicant would fail to repay the loan, based on the model's analysis.",
}

// Feature-specific global explanations
export const FEATURE_EXPLANATIONS: Record<string, string> = {
  'Credit Risk Ratio': "Measures the loan amount relative to the applicant's financial capacity. Higher ratios indicate the loan represents a larger burden relative to their resources, increasing default risk. Typical approved applications have ratios between 0.3-0.7.",
  
  'Savings Account': "Reflects the applicant's financial buffer and ability to handle unexpected expenses. Higher savings demonstrate financial discipline and provide a safety net for loan repayment. Applicants with €1000+ in savings have 25% lower default rates.",
  
  'Stability Score': "A composite measure combining employment duration, residence stability, and age. Higher scores indicate more established life circumstances, which correlate with reliable repayment behavior. Scores above 0.6 are typical for approved applications.",
  
  'Installment Rate': "The percentage of monthly income dedicated to loan payments. Lower rates (<20%) indicate comfortable repayment capacity, while higher rates (>35%) suggest financial strain. This is one of the strongest predictors of default risk.",
  
  'Checking Account': "Shows day-to-day financial management and cash flow health. Accounts with balances ≥€200 indicate good liquidity, while negative balances signal financial stress. This feature directly reflects current payment capacity.",
  
  'Monthly Burden': "The total monthly loan payment as a percentage of income. Lower burdens (<25%) allow for financial flexibility, while higher burdens (>40%) leave little room for unexpected expenses. This measures immediate repayment feasibility.",
  
  'Credit To Income Ratio': "Compares the total loan amount to annual income. Lower ratios (<30%) indicate the loan is manageable relative to earnings, while higher ratios (>60%) suggest the debt may be difficult to service. This is a standard creditworthiness metric.",
  
  'Loan Duration (months)': "The repayment period for the loan. Shorter durations (6-18 months) indicate faster repayment and lower cumulative risk, while longer durations (36-72 months) increase exposure to life changes and default risk.",
  
  'Credit Amount': "The total loan amount requested. Larger loans carry more risk for the lender and require stronger financial profiles. Typical approved amounts range from €1,200-€3,500 in the historical data.",
  
  'Age': "Older applicants typically have more stable financial situations and established credit histories. The model shows lower default rates for applicants aged 35-50 compared to younger applicants (19-25).",
  
  'Employment Duration': "Length of time in current employment. Longer tenure (7+ years) indicates job stability and reliable income, while shorter periods (<1 year) suggest higher employment risk and income uncertainty.",
  
  'Loan Purpose': "The intended use of funds. Practical purposes like car purchases or home repairs show lower default rates than high-risk purposes like business ventures or speculative investments.",
  
  'Housing': "Homeownership indicates financial stability and collateral. Owners have 15% lower default rates than renters, as they demonstrate long-term financial commitment and asset accumulation.",
  
  'Property': "Type and value of assets owned. Real estate ownership provides collateral and demonstrates financial capacity. Applicants with property have significantly lower default rates.",
  
  'Existing Credits': "Number of other active loans or credit accounts. Having 1-2 credits shows credit experience, but 3+ credits may indicate over-leverage and increased default risk.",
  
  'Other Debtors': "Presence of co-applicants or guarantors. Having a guarantor reduces lender risk by providing a backup repayment source if the primary applicant defaults.",
}
