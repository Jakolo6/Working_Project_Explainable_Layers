/**
 * Risk Assessment Utilities
 * Replaces raw confidence percentages with meaningful risk bands and interest rates
 */

export interface RiskAssessment {
  display: string
  color: string
  bgColor: string
  tooltip: string
}

/**
 * Calculate interest rate for approved applications
 * Base rate: 4.5%, Risk premium: 0-8% based on confidence
 */
export function calculateInterestRate(probability: number): string {
  const riskScore = 1 - probability
  const baseRate = 4.5
  const riskPremium = riskScore * 8
  const totalRate = baseRate + riskPremium
  return totalRate.toFixed(2) + '%'
}

/**
 * Get risk band for rejected applications based on confidence
 * Higher confidence in rejection = Higher risk applicant
 */
export function getRiskBand(probability: number): RiskAssessment {
  const confidencePercent = probability * 100
  
  if (confidencePercent >= 70) {
    return {
      display: 'High Risk',
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
      tooltip: 'The model is highly confident that this applicant presents significant credit risk. Multiple factors indicate a high probability of default.'
    }
  } else if (confidencePercent >= 40) {
    return {
      display: 'Medium Risk',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      tooltip: 'The model assesses this applicant as having moderate credit risk. Some factors raise concerns about repayment ability.'
    }
  } else {
    return {
      display: 'Low Risk',
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200',
      tooltip: 'The model sees relatively low credit risk, but other factors led to rejection. This is a borderline case.'
    }
  }
}

/**
 * Get assessment display for any decision
 * - Approved: Shows interest rate
 * - Rejected: Shows risk band
 */
export function getAssessmentDisplay(
  decision: 'approved' | 'rejected',
  probability: number
): { value: string; label: string; color: string; bgColor: string; tooltip: string } {
  if (decision === 'approved') {
    const interestRate = calculateInterestRate(probability)
    return {
      value: interestRate,
      label: 'Interest Rate',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      tooltip: 'This is the credit interest rate offered to the applicant, determined based on the model\'s assessment of credit risk. Lower rates indicate lower perceived risk.'
    }
  } else {
    const riskBand = getRiskBand(probability)
    return {
      value: riskBand.display,
      label: 'Risk Assessment',
      color: riskBand.color,
      bgColor: riskBand.bgColor,
      tooltip: riskBand.tooltip
    }
  }
}
