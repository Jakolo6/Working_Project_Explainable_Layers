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
  // ═══════════════════════════════════════════════════════════════════════
  // ORIGINAL FEATURES (with distribution lines)
  // ═══════════════════════════════════════════════════════════════════════
  
  'Checking Account': "Shows day-to-day financial management and cash flow health. Accounts with balances ≥€200 indicate good liquidity and regular income, while negative balances signal financial stress and potential payment difficulties. This directly reflects current payment capacity and financial discipline.",
  
  'Savings Account': "Reflects the applicant's financial buffer and ability to handle unexpected expenses. Higher savings (€1000+) demonstrate financial discipline and provide a safety net for loan repayment during emergencies. Applicants with substantial savings show significantly lower default rates.",
  
  'Credit History': "Past credit behavior is the strongest predictor of future repayment. A clean history of timely payments demonstrates reliability, while delays or defaults indicate higher risk. Note: Some patterns may appear counterintuitive due to historical data biases.",
  
  'Installment Rate': "The percentage of disposable income dedicated to this loan payment. Lower rates (<20%) indicate comfortable repayment capacity with room for other expenses, while higher rates (>35%) suggest financial strain and limited flexibility for unexpected costs.",
  
  'Loan Duration': "The repayment period for the loan. Shorter durations (10-21 months) indicate faster repayment and lower cumulative risk exposure, while longer durations (36-72 months) increase vulnerability to life changes, job loss, or other payment disruptions.",
  
  'Credit Amount': "The total loan amount requested. Larger loans carry more risk for the lender and require stronger financial profiles to support repayment. Typical approved amounts range from €1,200-€3,500 based on historical data.",
  
  'Age': "Older applicants (35-50) typically have more stable financial situations, established credit histories, and consistent income. Younger applicants (19-25) may have less financial track record and higher income volatility, increasing perceived risk.",
  
  'Employment': "Length of time in current employment. Longer tenure (7+ years) indicates job stability and reliable income streams, while shorter periods (<1 year) suggest higher employment risk and potential income uncertainty.",
  
  'Loan Purpose': "The intended use of funds affects risk assessment. Practical purposes like car purchases or essential home repairs show lower default rates than discretionary spending or high-risk ventures. Purpose indicates financial planning maturity.",
  
  'Housing': "Homeownership indicates financial stability and long-term commitment. Owners demonstrate 15% lower default rates than renters, as they have proven ability to manage long-term financial obligations and have built equity.",
  
  'Property': "Type and value of assets owned. Real estate ownership provides collateral and demonstrates financial capacity. Applicants with substantial property show significantly lower default risk due to asset backing.",
  
  'Existing Credits': "Number of other active loans or credit accounts. Having 1-2 credits shows credit experience and management ability, but 3+ credits may indicate over-leverage and increased default risk due to payment burden.",
  
  'Residence': "Years at current residence. Longer residence (3-4 years) indicates stability and community ties, while frequent moves may suggest instability. Stable residence correlates with reliable repayment behavior.",
  
  'Dependents': "Number of people financially dependent on the applicant. More dependents increase financial obligations and reduce disposable income available for loan repayment, potentially increasing default risk.",
  
  'Guarantors': "Presence of co-applicants or guarantors. Having a guarantor reduces lender risk by providing a backup repayment source if the primary applicant defaults, significantly improving approval odds.",
  
  'Job Type': "Employment category and skill level. Skilled employees and management positions typically have higher, more stable incomes compared to unskilled or unemployed applicants, reducing repayment risk.",
  
  'Telephone': "Having a registered telephone indicates stability and reachability. It demonstrates established residence and provides a contact method for payment reminders, correlating with better repayment rates.",
  
  'Other Plans': "Existing payment plans with banks or stores. Multiple active payment plans may indicate financial strain or over-commitment, while no other plans suggests available payment capacity.",
  
  // ═══════════════════════════════════════════════════════════════════════
  // ENGINEERED FEATURES (text explanation only, no distribution line)
  // ═══════════════════════════════════════════════════════════════════════
  
  'Monthly Burden': "Calculated as Credit Amount ÷ Loan Duration. This represents the actual monthly payment amount required. Lower monthly burdens (€100-250) are easier to manage within typical budgets, while higher burdens (€500+) leave little room for unexpected expenses or income disruptions.",
  
  'Credit To Income Ratio': "Calculated as Credit Amount ÷ Age (as a proxy for income). This engineered metric estimates how large the loan is relative to expected annual earnings. Lower ratios (<30%) indicate the loan is manageable relative to income, while higher ratios (>60%) suggest the debt may be difficult to service over time.",
  
  'Stability Score': "Calculated as Age × Employment Years. This composite measure combines life stage maturity with job tenure to assess overall stability. Higher scores (150+) indicate established life circumstances with stable income, while lower scores (<60) suggest less predictable financial situations.",
  
  'Duration Risk': "Calculated as Loan Duration × Credit Amount. This metric captures the total risk exposure over the loan lifetime. Higher values indicate larger cumulative risk from both loan size and extended repayment periods, while lower values suggest faster, lower-risk repayment.",
  
  'Credit Risk Ratio': "Calculated as Credit Amount ÷ (Age × 100). This ratio measures loan size relative to the applicant's life stage and presumed financial capacity. Higher ratios (>3.0) indicate the loan represents a large burden relative to resources, while lower ratios (<1.0) suggest manageable debt levels.",
}
