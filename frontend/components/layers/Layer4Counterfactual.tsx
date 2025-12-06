// Layer 4: Solution Finder - Real-time counterfactual analysis for bank clerks
// Three zones: Narrative Header, Smart Simulator with live predictions, Action Plans

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Sparkles, DollarSign, Clock, PiggyBank, TrendingDown, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getPersonaApplication } from '@/lib/personas'
import { useParams } from 'next/navigation'
import DecisionHeader from './DecisionHeader'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface SolutionFinderProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

interface LivePrediction {
  decision: 'approved' | 'rejected'
  probability: number
  isLoading: boolean
}

// ═══════════════════════════════════════════════════════════════════════
// FEATURE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

// Universal Levers - Always shown
const UNIVERSAL_LEVERS = ['Credit Amount', 'Loan Duration (months)'];

// Mutable features that can be adjusted
const MUTABLE_FEATURES = [
  'Checking Account Status',
  'Savings Account Status',
  'Installment Rate',
  ...UNIVERSAL_LEVERS
];

// Immutable - NEVER shown
const IMMUTABLE_FEATURES = [
  'Age',
  'Credit History',
  'Employment Duration',
  'Foreign Worker',
  'Sex',
  'Personal Status'
];

// Feature name mapping (SHAP names -> display names)
const FEATURE_NAME_MAP: Record<string, string> = {
  'Credit Amount': 'Credit Amount',
  'Loan Duration (months)': 'Loan Duration (months)',
  'Checking Account Status': 'Checking Account Status',
  'Savings Account Status': 'Savings Account Status',
  'Installment Rate': 'Installment Rate',
};

// Backend field name mapping (for API calls)
const BACKEND_FIELD_MAP: Record<string, string> = {
  'Credit Amount': 'credit_amount',
  'Loan Duration (months)': 'duration',
  'Checking Account Status': 'checking_status',
  'Savings Account Status': 'savings_status',
  'Installment Rate': 'installment_commitment',
};

export default function Layer4Counterfactual({ decision, probability, shapFeatures }: SolutionFinderProps) {
  const params = useParams()
  const personaId = params?.personaId as string

  // Get original application data
  const originalApplication = getPersonaApplication(personaId)
  
  // State
  const [modifiedData, setModifiedData] = useState<Record<string, any>>({})
  const [livePrediction, setLivePrediction] = useState<LivePrediction>({
    decision,
    probability,
    isLoading: false
  })
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Initialize with original data
  useEffect(() => {
    if (originalApplication) {
      setModifiedData({ ...originalApplication })
    }
  }, [originalApplication])

  // Determine which features to show
  const featuresToShow = useCallback(() => {
    const features: string[] = [...UNIVERSAL_LEVERS];
    
    // Add top 3 risk factors if they're mutable
    const topRiskFactors = shapFeatures
      .filter(f => f.impact === 'positive') // Risk-increasing
      .slice(0, 3);
    
    for (const factor of topRiskFactors) {
      if (MUTABLE_FEATURES.includes(factor.feature) && !features.includes(factor.feature)) {
        features.push(factor.feature);
      }
    }
    
    return features;
  }, [shapFeatures]);

  const visibleFeatures = featuresToShow();

  // Call backend for real prediction
  const fetchPrediction = useCallback(async (data: Record<string, any>) => {
    setLivePrediction(prev => ({ ...prev, isLoading: true }));
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/experiment/predict-counterfactual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_data: data })
      });
      
      if (!response.ok) throw new Error('Prediction failed');
      
      const result = await response.json();
      setLivePrediction({
        decision: result.decision,
        probability: result.probability,
        isLoading: false
      });
    } catch (error) {
      console.error('Prediction error:', error);
      setLivePrediction(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Debounced prediction update
  const handleFeatureChange = useCallback((feature: string, value: any) => {
    const backendField = BACKEND_FIELD_MAP[feature] || feature;
    const newData = { ...modifiedData, [backendField]: value };
    setModifiedData(newData);
    
    // Debounce API call
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      fetchPrediction(newData);
    }, 500);
    setDebounceTimer(timer);
  }, [modifiedData, debounceTimer, fetchPrediction]);

  // Action Plans
  const applyQuickFix = () => {
    if (!originalApplication) return;
    const newAmount = Math.round(originalApplication.credit_amount * 0.8);
    handleFeatureChange('Credit Amount', newAmount);
  };

  const applySafeBet = () => {
    if (!originalApplication) return;
    const newDuration = Math.max(6, originalApplication.duration_months - 12);
    handleFeatureChange('Loan Duration (months)', newDuration);
  };

  const applyCommitment = () => {
    // Simulate moving up one savings category
    handleFeatureChange('Savings Account Status', '500 to 1000 DM');
  };

  // Calculate gap to approval
  const gapToApproval = decision === 'rejected' ? ((0.5 - (1 - probability)) * 100) : 0;
  const isApproved = livePrediction.decision === 'approved';
  const hasFlipped = livePrediction.decision !== decision;

  // Generate short counterfactual summary
  const getSummary = () => {
    if (hasFlipped && isApproved) {
      return "Your adjustments successfully flipped the decision to APPROVED! The changes improved the risk assessment."
    }
    if (isApproved) {
      return "Currently approved. Adjusting Credit Amount or Loan Duration can improve your interest rate."
    }
    return `This application needs ${gapToApproval.toFixed(0)}% improvement for approval. Try reducing Credit Amount or Loan Duration.`
  }

  return (
    <div className="space-y-6">
      {/* Decision Header with Interest Rate */}
      <DecisionHeader decision={livePrediction.decision} probability={livePrediction.probability} />
      
      {/* Short Counterfactual Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-4 border ${
          isApproved
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <p className="text-sm text-gray-700">
          {getSummary()}
        </p>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          INTERACTIVE SIMULATOR
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl border-2 p-6 ${
          isApproved
            ? 'border-green-300 bg-white'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Sparkles className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Interactive Simulator</h3>
              <p className="text-sm text-gray-600">Adjust values to see real-time predictions</p>
            </div>
          </div>
          
          {livePrediction.isLoading && (
            <div className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm font-medium">Calculating...</span>
            </div>
          )}
        </div>

        {/* Feature Sliders */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Credit Amount */}
          {visibleFeatures.includes('Credit Amount') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  Credit Amount
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <Zap size={12} />
                    Quick Fix
                  </span>
                </label>
                <span className="text-sm font-bold text-gray-900">
                  €{modifiedData.credit_amount?.toLocaleString() || 0}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="20000"
                step="100"
                value={modifiedData.credit_amount || 0}
                onChange={(e) => handleFeatureChange('Credit Amount', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>€500</span>
                <span>€20,000</span>
              </div>
            </div>
          )}

          {/* Loan Duration */}
          {visibleFeatures.includes('Loan Duration (months)') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  Loan Duration
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    <Zap size={12} />
                    Quick Fix
                  </span>
                </label>
                <span className="text-sm font-bold text-gray-900">
                  {modifiedData.duration || modifiedData.duration_months || 0} months
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="72"
                step="6"
                value={modifiedData.duration || modifiedData.duration_months || 0}
                onChange={(e) => handleFeatureChange('Loan Duration (months)', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>6 months</span>
                <span>72 months</span>
              </div>
            </div>
          )}
        </div>

        {/* Success Animation */}
        <AnimatePresence>
          {isApproved && hasFlipped && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 rounded-xl bg-green-50 border-2 border-green-300"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold text-green-900">Decision Flipped to APPROVED!</p>
                  <p className="text-sm text-green-700">
                    Confidence: {(livePrediction.probability * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ZONE C: ACTION PLANS
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border-2 border-gray-200 bg-white p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="text-indigo-600" size={20} />
          Recommended Solutions
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Click any option to instantly apply the changes
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Option 1: Quick Fix */}
          <button
            onClick={applyQuickFix}
            className="group p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Quick Fix</h4>
                <p className="text-xs text-gray-600">Fastest path</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Decrease Credit Amount by <strong>20%</strong>
            </p>
          </button>

          {/* Option 2: Safe Bet */}
          <button
            onClick={applySafeBet}
            className="group p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Safe Bet</h4>
                <p className="text-xs text-gray-600">Lower risk</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Decrease Duration by <strong>12 months</strong>
            </p>
          </button>

          {/* Option 3: Commitment */}
          <button
            onClick={applyCommitment}
            className="group p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                <PiggyBank className="text-purple-600" size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Commitment</h4>
                <p className="text-xs text-gray-600">Build trust</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Increase Savings to <strong>€500-1000</strong>
            </p>
          </button>
        </div>
      </motion.div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 How it works:</strong> This simulator calls the real XGBoost model to generate live predictions.
          Adjust the sliders above to explore different scenarios and find the optimal path to approval.
        </p>
      </div>
    </div>
  )
}
