'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GlobalDistributionLineProps {
  min: number
  max: number
  value: number
  typicalRange: [number, number]
  unit?: string
  higherIsBetter?: boolean // For features like age, savings where higher is good
}

export default function GlobalDistributionLine({
  min,
  max,
  value,
  typicalRange,
  unit = '',
  higherIsBetter = false
}: GlobalDistributionLineProps) {
  // Calculate positions as percentages
  const range = max - min
  const valuePercent = range > 0 ? ((value - min) / range) * 100 : 50
  const typicalStartPercent = range > 0 ? ((typicalRange[0] - min) / range) * 100 : 25
  const typicalEndPercent = range > 0 ? ((typicalRange[1] - min) / range) * 100 : 75
  const typicalWidth = typicalEndPercent - typicalStartPercent

  // Determine if value is in safe zone
  const isInSafeZone = value >= typicalRange[0] && value <= typicalRange[1]
  const isBelowSafe = value < typicalRange[0]
  const isAboveSafe = value > typicalRange[1]

  // Determine color based on position and feature type
  const getValueColor = () => {
    if (isInSafeZone) return 'bg-green-500'
    if (higherIsBetter) {
      return isBelowSafe ? 'bg-red-500' : 'bg-green-500'
    } else {
      return isAboveSafe ? 'bg-red-500' : 'bg-amber-500'
    }
  }

  const getPositionLabel = () => {
    if (isInSafeZone) return 'Within typical range'
    if (isBelowSafe) {
      return higherIsBetter ? 'Below typical range' : 'Below typical range'
    }
    return higherIsBetter ? 'Above typical range' : 'Above typical range'
  }

  // Format value for display
  const formatValue = (val: number) => {
    if (unit === '€') return `€${val.toLocaleString()}`
    if (unit === 'months') return `${val} mo`
    if (unit === 'years') return `${val} yrs`
    if (unit === '%') return `${val}%`
    return val.toLocaleString()
  }

  return (
    <div className="w-full py-3">
      {/* Labels row */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Low ({formatValue(min)})</span>
        <span className="text-gray-600 font-medium">Typical Approved Range</span>
        <span>High ({formatValue(max)})</span>
      </div>

      {/* Distribution line container */}
      <div className="relative h-10">
        {/* Base line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full transform -translate-y-1/2" />

        {/* Typical approved range (safe zone) */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="absolute top-1/2 h-3 bg-green-100 border border-green-300 rounded transform -translate-y-1/2"
          style={{
            left: `${typicalStartPercent}%`,
            width: `${typicalWidth}%`,
            transformOrigin: 'left'
          }}
        />

        {/* Range markers */}
        <div
          className="absolute top-1/2 w-0.5 h-5 bg-green-400 transform -translate-y-1/2"
          style={{ left: `${typicalStartPercent}%` }}
        />
        <div
          className="absolute top-1/2 w-0.5 h-5 bg-green-400 transform -translate-y-1/2"
          style={{ left: `${typicalEndPercent}%` }}
        />

        {/* Applicant's value marker - PRECISELY ALIGNED */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
          className="absolute"
          style={{ 
            left: `${valuePercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Value dot */}
          <div className={`w-4 h-4 rounded-full ${getValueColor()} ring-4 ring-white shadow-lg`} />
          
          {/* Value label - positioned directly above the dot */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute whitespace-nowrap pointer-events-none"
            style={{
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
              <span className="font-semibold">You: {formatValue(value)}</span>
            </div>
            <div 
              className="w-2 h-2 bg-gray-900 absolute"
              style={{
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%) translateY(-4px) rotate(45deg)'
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={`mt-6 text-xs font-medium text-center ${
          isInSafeZone ? 'text-green-600' : isBelowSafe && !higherIsBetter ? 'text-amber-600' : 'text-red-600'
        }`}
      >
        {getPositionLabel()}
        {!isInSafeZone && (
          <span className="text-gray-500 ml-1">
            (Typical: {formatValue(typicalRange[0])} – {formatValue(typicalRange[1])})
          </span>
        )}
      </motion.div>
    </div>
  )
}
