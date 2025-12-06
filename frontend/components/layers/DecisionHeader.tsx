// Reusable Decision Header with Interest Rate
// Displayed consistently at the top of every layer

'use client'

import React from 'react'

interface DecisionHeaderProps {
  decision: 'approved' | 'rejected'
  probability: number
}

// Interest rate calculation based on risk
function calculateInterestRate(decision: 'approved' | 'rejected', probability: number): string {
  if (decision === 'rejected') {
    return 'N/A'
  }
  
  // Convert probability to risk score (lower probability = higher risk)
  // Approved loans: probability is confidence in approval
  const riskScore = 1 - probability
  
  // Base rate: 4.5%
  // Risk premium: 0% to 8% based on risk score
  const baseRate = 4.5
  const riskPremium = riskScore * 8
  const totalRate = baseRate + riskPremium
  
  return totalRate.toFixed(2) + '%'
}

export default function DecisionHeader({ decision, probability }: DecisionHeaderProps) {
  const isApproved = decision === 'approved'
  const confidencePercent = Math.round(probability * 100)
  const interestRate = calculateInterestRate(decision, probability)

  return (
    <div className={`p-6 rounded-lg border-2 ${
      isApproved 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Left: Decision */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Decision: <span className={isApproved ? 'text-green-700' : 'text-red-700'}>
              {decision.toUpperCase()}
            </span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Model Confidence: {confidencePercent}%
          </p>
        </div>

        {/* Right: Interest Rate */}
        <div className="text-right">
          <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
            {isApproved ? 'Loan Interest Rate' : 'Interest Rate'}
          </div>
          <div className={`text-4xl font-bold ${
            isApproved ? 'text-green-700' : 'text-red-700'
          }`}>
            {interestRate}
          </div>
          {!isApproved && (
            <p className="text-xs text-gray-500 mt-1">
              Loan not approved
            </p>
          )}
          {isApproved && (
            <p className="text-xs text-gray-500 mt-1">
              Based on risk assessment
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
