/**
 * ExplanationChatbot.tsx
 * Interactive chatbot for bank clerks to ask questions about the credit decision
 * Uses OpenAI API with global model context and local applicant SHAP values
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, AlertCircle, Trash2 } from 'lucide-react'

interface SHAPFeature {
  feature: string
  value: string
  shap_value: number
  impact: 'positive' | 'negative'
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ExplanationChatbotProps {
  decision: 'approved' | 'rejected'
  probability: number
  shapFeatures: SHAPFeature[]
}

export default function ExplanationChatbot({ decision, probability, shapFeatures }: ExplanationChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalContext, setGlobalContext] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch global model context on mount
  useEffect(() => {
    const fetchGlobalContext = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        const response = await fetch(`${apiUrl}/api/v1/admin/global-analysis`)
        if (response.ok) {
          const data = await response.json()
          setGlobalContext(data.report_content)
        }
      } catch (err) {
        console.error('Failed to fetch global context:', err)
      }
    }
    fetchGlobalContext()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build context for the AI
  const buildSystemContext = () => {
    const topFeatures = shapFeatures.slice(0, 10)
    const riskIncreasing = shapFeatures.filter(f => f.impact === 'positive')
    const riskDecreasing = shapFeatures.filter(f => f.impact === 'negative')

    return `You are a helpful AI assistant for bank clerks reviewing credit decisions. You explain AI-based credit risk assessments in clear, professional language.

IMPORTANT DISCLAIMER: The "Credit History" feature in this model shows COUNTERINTUITIVE patterns due to historical selection bias in the 1994 German Credit dataset. "Critical" credit history correlates with LOWER default rates (17%) while "all_paid" shows HIGHER rates (57%). Always mention this caveat when discussing Credit History.

=== GLOBAL MODEL INFORMATION ===
${globalContext || 'Global model analysis not available. The model uses XGBoost with SHAP values for explainability.'}

=== THIS APPLICANT'S DECISION ===
Decision: ${decision.toUpperCase()}
Confidence: ${(probability * 100).toFixed(1)}%

Top Contributing Factors:
${topFeatures.map((f, i) => `${i + 1}. ${f.feature}: ${f.value} (SHAP: ${f.shap_value > 0 ? '+' : ''}${f.shap_value.toFixed(3)}, ${f.impact === 'positive' ? 'INCREASES risk' : 'DECREASES risk'})`).join('\n')}

Summary:
- ${riskIncreasing.length} factors raised concerns (increased risk)
- ${riskDecreasing.length} factors were favorable (decreased risk)

=== GUIDELINES ===
1. Answer questions clearly and concisely
2. Reference specific SHAP values when relevant
3. Explain what each factor means in plain language
4. Always caveat Credit History as counterintuitive
5. Be helpful but remind the clerk this is AI assistance, not a final decision
6. If asked about something not in the data, say so honestly`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/api/v1/explanations/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          system_context: buildSystemContext(),
          decision,
          probability,
          shap_features: shapFeatures
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.response }])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response'
      setError(errorMsg)
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const suggestedQuestions = [
    "Why was this applicant " + (decision === 'approved' ? 'approved' : 'rejected') + "?",
    "What are the main risk factors?",
    "How does their checking account affect the decision?",
    "What could improve this applicant's chances?",
    "Explain the Credit History anomaly"
  ]

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">Ask About This Decision</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-white/80 hover:text-white p-1 rounded"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">
              Ask me anything about this credit decision. I have access to both the global model behavior and this specific applicant&apos;s data.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this decision..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
