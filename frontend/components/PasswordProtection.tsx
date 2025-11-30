// PasswordProtection.tsx - Password gate for protected pages
// Uses NEXT_PUBLIC_ADMIN_PASSWORD environment variable from Netlify

'use client'

import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react'

interface PasswordProtectionProps {
  children: React.ReactNode
  pageName?: string
}

const SESSION_KEY = 'xai_admin_authenticated'
const SESSION_EXPIRY_KEY = 'xai_admin_auth_expiry'
const SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export default function PasswordProtection({ children, pageName = 'this page' }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if already authenticated (session storage)
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return
      
      const authStatus = sessionStorage.getItem(SESSION_KEY)
      const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY)
      
      if (authStatus === 'true' && expiry) {
        const expiryTime = parseInt(expiry, 10)
        if (Date.now() < expiryTime) {
          setIsAuthenticated(true)
        } else {
          // Session expired
          sessionStorage.removeItem(SESSION_KEY)
          sessionStorage.removeItem(SESSION_EXPIRY_KEY)
        }
      }
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Get the admin password from environment variable
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    if (!adminPassword) {
      setError('Admin password not configured. Please set NEXT_PUBLIC_ADMIN_PASSWORD in Netlify.')
      return
    }
    
    if (password === adminPassword) {
      // Set session with expiry
      sessionStorage.setItem(SESSION_KEY, 'true')
      sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString())
      setIsAuthenticated(true)
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Security Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-500/20 p-4 rounded-full">
              <Shield className="w-12 h-12 text-indigo-400" />
            </div>
          </div>
          
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Protected Area
              </h1>
              <p className="text-gray-600">
                Access to {pageName} requires authentication.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Access Page
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                🔒 This page is protected for research data security.
                <br />
                Session expires after 1 hour of inactivity.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-6">
            XAI Financial Services Research Platform
          </p>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
