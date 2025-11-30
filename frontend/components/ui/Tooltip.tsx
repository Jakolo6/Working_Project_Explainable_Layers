// Reusable tooltip component for feature explanations
// Uses fixed positioning via portal to avoid container overflow issues

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export default function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + rect.width / 2 + window.scrollX
      })
    }
  }

  const handleMouseEnter = () => {
    updatePosition()
    setIsVisible(true)
  }

  const tooltipContent = (
    <div 
      className="fixed z-[9999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg w-72 text-center pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="whitespace-normal break-words">
        {content}
      </div>
      {/* Arrow */}
      <div 
        className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
        style={{
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  )

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {mounted && isVisible && createPortal(tooltipContent, document.body)}
    </div>
  )
}
