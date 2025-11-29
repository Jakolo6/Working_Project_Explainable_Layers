/**
 * CreditHistoryWarning.tsx
 * Displays a contextual warning about the counterintuitive credit_history patterns
 * in the German Credit dataset.
 */

'use client'

import { AlertTriangle } from 'lucide-react'

interface CreditHistoryWarningProps {
  /** Compact mode for inline display */
  compact?: boolean
  /** Show full explanation with default rates */
  showDetails?: boolean
}

export default function CreditHistoryWarning({ compact = false, showDetails = false }: CreditHistoryWarningProps) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          <strong>Note:</strong> The &apos;credit_history&apos; pattern in this 1994 dataset is counterintuitive due to historical selection bias.
        </span>
      </div>
    )
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-800">Historical Data Pattern Notice</h4>
          <p className="text-sm text-amber-700">
            The risk pattern for <strong>&apos;credit_history&apos;</strong> in this historical dataset is counterintuitive. 
            In the 1994 German Credit dataset, applicants labeled &apos;critical&apos; showed <em>lower</em> default rates 
            than those with &apos;all_paid&apos; history.
          </p>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-white rounded border border-amber-100">
              <p className="text-xs font-medium text-amber-800 mb-2">Observed Default Rates:</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• <strong>critical:</strong> 17.1% default (293 samples) — lowest rate</li>
                <li>• <strong>delayed_past:</strong> 31.8% default (88 samples)</li>
                <li>• <strong>existing_paid:</strong> 31.9% default (530 samples)</li>
                <li>• <strong>all_paid:</strong> 57.1% default (49 samples)</li>
                <li>• <strong>no_credits:</strong> 62.5% default (40 samples) — highest rate</li>
              </ul>
            </div>
          )}
          
          <p className="text-xs text-amber-600">
            This reflects <strong>historical selection bias</strong> (banks were more cautious with &apos;critical&apos; applicants) 
            and <strong>not modern credit-risk practice</strong>. The model faithfully learns these historical patterns.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper function to check if a feature name relates to credit_history
 */
export function isCreditHistoryFeature(featureName: string): boolean {
  const name = featureName.toLowerCase()
  return name.includes('credit_history') || name.includes('credit history')
}

/**
 * Inline warning text for tooltips or small spaces
 */
export const CREDIT_HISTORY_WARNING_TEXT = 
  "Note: The risk pattern for 'credit_history' in this 1994 dataset is counterintuitive due to historical selection bias. " +
  "Applicants labeled 'critical' showed lower default rates than expected."
