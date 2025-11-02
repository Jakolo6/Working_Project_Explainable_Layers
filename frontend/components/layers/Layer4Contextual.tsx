// Layer 4: Contextual - Benchmarking with typical ranges from German Credit dataset

import React from 'react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Layer4ContextualProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

// Feature name mappings (same as previous layers)
const FEATURE_LABELS: Record<string, string> = {
  'Attribute1_A11': 'Checking account balance',
  'Attribute1_A12': 'Checking account balance',
  'Attribute1_A13': 'Checking account balance',
  'Attribute1_A14': 'Checking account status',
  'Attribute3_A30': 'Credit history',
  'Attribute3_A31': 'Credit history',
  'Attribute3_A32': 'Credit history',
  'Attribute3_A33': 'Credit history',
  'Attribute3_A34': 'Credit history',
  'Attribute4_A40': 'Loan purpose',
  'Attribute4_A41': 'Loan purpose',
  'Attribute4_A42': 'Loan purpose',
  'Attribute4_A43': 'Loan purpose',
  'Attribute4_A44': 'Loan purpose',
  'Attribute4_A45': 'Loan purpose',
  'Attribute4_A46': 'Loan purpose',
  'Attribute4_A48': 'Loan purpose',
  'Attribute4_A49': 'Loan purpose',
  'Attribute4_A410': 'Loan purpose',
  'Attribute6_A61': 'Savings account level',
  'Attribute6_A62': 'Savings account level',
  'Attribute6_A63': 'Savings account level',
  'Attribute6_A64': 'Savings account level',
  'Attribute6_A65': 'Savings account status',
  'Attribute7_A71': 'Employment status',
  'Attribute7_A72': 'Employment duration',
  'Attribute7_A73': 'Employment duration',
  'Attribute7_A74': 'Employment duration',
  'Attribute7_A75': 'Employment duration',
  'Attribute12_A121': 'Property ownership',
  'Attribute12_A122': 'Property ownership',
  'Attribute12_A123': 'Property ownership',
  'Attribute12_A124': 'Property status',
  'Attribute15_A151': 'Housing situation',
  'Attribute15_A152': 'Housing situation',
  'Attribute15_A153': 'Housing situation',
  'Attribute17_A171': 'Employment type',
  'Attribute17_A172': 'Employment type',
  'Attribute17_A173': 'Employment type',
  'Attribute17_A174': 'Employment type',
  'Duration': 'Loan duration',
  'Credit amount': 'Loan amount',
  'Installment rate': 'Monthly payment burden',
  'Present residence since': 'Residential stability',
  'Age': 'Age',
  'Number of existing credits': 'Existing loans',
  'Number of people being liable to provide maintenance for': 'Number of dependents',
}

const VALUE_DESCRIPTIONS: Record<string, string> = {
  'Attribute1_A11': 'Negative balance',
  'Attribute1_A12': 'Low balance (under 200 DM)',
  'Attribute1_A13': 'Good balance (over 200 DM)',
  'Attribute1_A14': 'No checking account',
  'Attribute3_A30': 'No previous credits',
  'Attribute3_A31': 'All credits paid on time',
  'Attribute3_A32': 'Current credits paid on time',
  'Attribute3_A33': 'Past payment delays',
  'Attribute3_A34': 'Critical account or other debts',
  'Attribute4_A40': 'New car purchase',
  'Attribute4_A41': 'Used car purchase',
  'Attribute4_A42': 'Furniture or equipment',
  'Attribute4_A43': 'Radio or television',
  'Attribute4_A44': 'Domestic appliances',
  'Attribute4_A45': 'Repairs',
  'Attribute4_A46': 'Education',
  'Attribute4_A48': 'Retraining',
  'Attribute4_A49': 'Business',
  'Attribute4_A410': 'Other purposes',
  'Attribute6_A61': 'Very low savings (under 100 DM)',
  'Attribute6_A62': 'Low savings (100-500 DM)',
  'Attribute6_A63': 'Moderate savings (500-1000 DM)',
  'Attribute6_A64': 'Good savings (over 1000 DM)',
  'Attribute6_A65': 'No savings account',
  'Attribute7_A71': 'Unemployed',
  'Attribute7_A72': 'Short employment (under 1 year)',
  'Attribute7_A73': 'Stable employment (1-4 years)',
  'Attribute7_A74': 'Long employment (4-7 years)',
  'Attribute7_A75': 'Very stable employment (over 7 years)',
  'Attribute12_A121': 'Owns real estate',
  'Attribute12_A122': 'Has savings agreement or life insurance',
  'Attribute12_A123': 'Owns car or other property',
  'Attribute12_A124': 'No property',
  'Attribute15_A151': 'Renting',
  'Attribute15_A152': 'Owns home',
  'Attribute15_A153': 'Living rent-free',
  'Attribute17_A171': 'Unemployed or unskilled',
  'Attribute17_A172': 'Unskilled resident',
  'Attribute17_A173': 'Skilled employee',
  'Attribute17_A174': 'Management or highly qualified',
}

function formatValue(feature: string, value: string): string {
  if (VALUE_DESCRIPTIONS[feature]) {
    return VALUE_DESCRIPTIONS[feature]
  }
  
  const numValue = parseFloat(value)
  if (!isNaN(numValue)) {
    if (feature.includes('Duration') || feature === 'Duration') {
      return `${numValue} months`
    } else if (feature.includes('Credit amount') || feature === 'Credit amount') {
      return `${numValue.toLocaleString()} DM`
    } else if (feature.includes('Age') || feature === 'Age') {
      return `${numValue} years old`
    } else if (feature.toLowerCase().includes('rate')) {
      return `${numValue}% of income`
    } else if (feature.toLowerCase().includes('residence')) {
      return `${numValue} years`
    } else if (feature.toLowerCase().includes('credits')) {
      return `${numValue} loan${numValue !== 1 ? 's' : ''}`
    } else if (feature.toLowerCase().includes('dependents')) {
      return `${numValue} dependent${numValue !== 1 ? 's' : ''}`
    }
  }
  
  return value
}

export default function Layer4Contextual({ decision, probability, shapFeatures }: Layer4ContextualProps) {
  // Get top 5 features
  const top5Features = shapFeatures.slice(0, 5)
  
  if (top5Features.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
        No explanation data available.
      </div>
    )
  }

  const isApproved = decision === 'approved'
  
  // Contextual benchmarks based on German Credit Dataset statistics
  const getContextualInfo = (feature: SHAPFeature) => {
    const featureName = feature.feature
    const numValue = parseFloat(feature.value)
    
    // Duration (months) - Dataset range: 4-72, typical: 12-36
    if (featureName === 'Duration' || featureName.includes('Duration')) {
      const months = numValue
      let comparison = ''
      let context = ''
      
      if (months < 12) {
        comparison = 'This is below the typical range of 12-36 months.'
        context = 'Short-term loans are generally lower risk but less common in the dataset.'
      } else if (months <= 36) {
        comparison = 'This falls within the typical range of 12-36 months for approved applications.'
        context = 'Standard loan durations in this range are common and well-accepted.'
      } else {
        comparison = 'This is above the typical range of 12-36 months.'
        context = 'Longer loan durations carry more uncertainty and may increase perceived risk.'
      }
      
      return {
        typical: '12-36 months',
        yourValue: `${months} months`,
        comparison,
        context
      }
    }
    
    // Credit amount (DM) - Dataset range: 250-18,424, typical: 1,000-10,000
    if (featureName === 'Credit amount' || featureName.includes('amount')) {
      const amount = numValue
      let comparison = ''
      let context = ''
      
      if (amount < 1000) {
        comparison = 'This is below the typical range of 1,000-10,000 DM.'
        context = 'Smaller loan amounts generally have higher approval rates due to lower risk.'
      } else if (amount <= 10000) {
        comparison = 'This falls within the typical range of 1,000-10,000 DM for approved applications.'
        context = 'This amount aligns with the majority of successful credit applications.'
      } else {
        comparison = 'This is above the typical range of 1,000-10,000 DM.'
        context = 'Larger amounts require stronger financial profiles to offset the increased risk.'
      }
      
      return {
        typical: '1,000-10,000 DM',
        yourValue: `${amount.toLocaleString()} DM`,
        comparison,
        context
      }
    }
    
    // Age - Dataset range: 19-75, typical: 25-55
    if (featureName === 'Age' || featureName.includes('Age')) {
      const age = numValue
      let comparison = ''
      let context = ''
      
      if (age < 25) {
        comparison = 'This is below the typical range of 25-55 years.'
        context = 'Younger applicants may have less established credit history.'
      } else if (age <= 55) {
        comparison = 'This falls within the typical range of 25-55 years for approved applications.'
        context = 'This age group typically shows stable employment and credit behavior.'
      } else {
        comparison = 'This is above the typical range of 25-55 years.'
        context = 'Older applicants often have established credit but may face different risk assessments.'
      }
      
      return {
        typical: '25-55 years',
        yourValue: `${age} years old`,
        comparison,
        context
      }
    }
    
    // Savings account - categorical
    if (featureName.includes('Attribute6')) {
      const valueDesc = VALUE_DESCRIPTIONS[featureName] || feature.value
      let comparison = ''
      let context = ''
      
      if (featureName === 'Attribute6_A61') {
        comparison = 'This is below the range typically seen in approved cases.'
        context = 'Applicants with low savings tend to face higher risk assessments due to limited financial cushion.'
      } else if (featureName === 'Attribute6_A62' || featureName === 'Attribute6_A63') {
        comparison = 'This is within the moderate savings range common in approved applications.'
        context = 'Having some savings demonstrates financial planning and provides security.'
      } else if (featureName === 'Attribute6_A64') {
        comparison = 'This is above average and strongly supports approval.'
        context = 'Good savings indicate financial stability and ability to handle unexpected expenses.'
      } else {
        comparison = 'No savings account was reported.'
        context = 'Lack of savings may be seen as higher risk, though other factors can compensate.'
      }
      
      return {
        typical: '100-1,000 DM',
        yourValue: valueDesc,
        comparison,
        context
      }
    }
    
    // Employment duration - categorical
    if (featureName.includes('Attribute7')) {
      const valueDesc = VALUE_DESCRIPTIONS[featureName] || feature.value
      let comparison = ''
      let context = ''
      
      if (featureName === 'Attribute7_A71' || featureName === 'Attribute7_A72') {
        comparison = 'This is below the stable employment range typically preferred.'
        context = 'Short or no employment history may indicate income instability.'
      } else if (featureName === 'Attribute7_A73' || featureName === 'Attribute7_A74') {
        comparison = 'This falls within the stable employment range for approved applications.'
        context = 'Longer employment history suggests job security and reliable income.'
      } else {
        comparison = 'This shows very stable, long-term employment.'
        context = 'Extended employment duration is a strong positive indicator of financial stability.'
      }
      
      return {
        typical: '1-7 years',
        yourValue: valueDesc,
        comparison,
        context
      }
    }
    
    // Default for other categorical features
    const featureLabel = FEATURE_LABELS[featureName] || featureName
    const valueDesc = VALUE_DESCRIPTIONS[featureName] || formatValue(featureName, feature.value)
    
    return {
      typical: 'Typically varies depending on applicant profile',
      yourValue: valueDesc,
      comparison: feature.impact === 'positive' 
        ? 'This value is within the range commonly seen in approved applications.'
        : 'This value differs from patterns typically seen in approved cases.',
      context: feature.impact === 'positive'
        ? 'This factor aligns with characteristics of successful applicants.'
        : 'This factor may require additional consideration in the overall assessment.'
    }
  }

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
            Layer 4: Contextual Explanation
          </h3>
          <p className="text-gray-600">Comparison with typical ranges and thresholds</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
        <p className="text-sm text-gray-700">
          <strong>📊 Benchmarking Report:</strong> This explanation compares the applicant's values 
          with what's typical in approved applications, helping identify where their profile fits best. 
          All ranges are based on the German Credit Dataset.
        </p>
      </div>

      <div className="space-y-5">
        {top5Features.map((feature, index) => {
          const info = getContextualInfo(feature)
          const featureLabel = FEATURE_LABELS[feature.feature] || feature.feature
          const bgColor = feature.impact === 'positive' 
            ? 'bg-green-50 border-green-200' 
            : feature.impact === 'negative' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-gray-50 border-gray-200'
          
          return (
            <div key={index} className={`rounded-lg p-5 border-2 ${bgColor}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  feature.impact === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{featureLabel}</h4>
                  <p className={`text-sm font-medium ${
                    feature.impact === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {feature.impact === 'positive' ? '↑ Positive impact' : '↓ Negative impact'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Applicant's Value</p>
                  <p className="text-base font-bold text-gray-900">{info.yourValue}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Typical Range</p>
                  <p className="text-base font-bold text-gray-900">{info.typical}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Comparison:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{info.comparison}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Context:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{info.context}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎯</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">Overall Assessment:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {(() => {
                const positiveCount = top5Features.filter(f => f.impact === 'positive').length
                const negativeCount = top5Features.filter(f => f.impact === 'negative').length
                
                if (isApproved) {
                  if (positiveCount >= 3) {
                    return `Most of this applicant's values fall within the ranges seen in approved applications, suggesting a generally solid profile. The AI approved this application with ${(probability * 100).toFixed(1)}% confidence.`
                  } else {
                    return `While some factors differ from typical approved cases, the overall combination of characteristics led to approval with ${(probability * 100).toFixed(1)}% confidence.`
                  }
                } else {
                  if (negativeCount >= 3) {
                    return `Several factors differ from typical approved cases, which may explain why this application was rejected. The AI's confidence in this rejection is ${(probability * 100).toFixed(1)}%.`
                  } else {
                    return `Although some values are within typical ranges, the overall combination of factors led to rejection with ${(probability * 100).toFixed(1)}% confidence.`
                  }
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
