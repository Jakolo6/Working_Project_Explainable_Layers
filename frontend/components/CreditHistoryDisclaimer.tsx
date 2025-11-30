/**
 * CreditHistoryDisclaimer.tsx
 * Persistent disclaimer banner about the counterintuitive Credit History feature
 * Displayed above all SHAP tables to warn users to ignore this feature's direction
 */

'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface CreditHistoryDisclaimerProps {
  /** Allow user to dismiss the banner */
  dismissible?: boolean
}

export default function CreditHistoryDisclaimer({ dismissible = false }: CreditHistoryDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-amber-800 flex items-center gap-2">
            ⚠️ Important: Ignore &quot;Credit History&quot; Feature Direction
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            The <strong>&quot;Credit History&quot;</strong> feature in this 1994 dataset shows <strong>counterintuitive patterns</strong> due to historical selection bias. 
            The model learned that &quot;critical&quot; credit history correlates with <em>lower</em> default rates (17%), 
            while &quot;all_paid&quot; history shows <em>higher</em> rates (57%).
          </p>
          <p className="text-sm text-amber-700 mt-2">
            <strong>Why?</strong> In 1994, banks were more cautious with applicants who looked risky on paper, 
            giving them smaller loans with stricter terms. This historical selection effect means the feature&apos;s 
            direction is <strong>not reliable for real-world credit decisions</strong>.
          </p>
          <p className="text-xs text-amber-600 mt-2 font-medium">
            👉 When reviewing the table below, please disregard the impact direction of &quot;Credit History&quot;.
          </p>
        </div>
        {dismissible && (
          <button 
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 p-1"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
