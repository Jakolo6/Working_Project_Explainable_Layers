'use client'

// Visual flow diagram showing XAI credit risk system workflow

import { ArrowDown, ArrowRight, ArrowUpRight, ArrowDownLeft, Database, BarChart3, Settings, Brain, Eye, Layers, Users, Upload, RefreshCw } from 'lucide-react'

export default function ProcessPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              XAI Credit Risk System
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Visual Process Flow Diagram
            </p>
          </div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Row 1: Data Pipeline */}
        <div className="flex items-center justify-center mb-12">
          {/* Step 1: Data */}
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">Raw Data</h3>
            <p className="text-xs text-gray-600 text-center">German Credit<br/>UCI Dataset</p>
          </div>
          
          <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
          
          {/* Step 2: EDA */}
          <div className="flex flex-col items-center">
            <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">EDA Analysis</h3>
            <p className="text-xs text-gray-600 text-center">8 Visualizations<br/>Statistics</p>
          </div>
          
          <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
          
          {/* Step 3: Feature Engineering */}
          <div className="flex flex-col items-center">
            <div className="bg-purple-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Settings className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">Feature Eng.</h3>
            <p className="text-xs text-gray-600 text-center">Risk Metrics<br/>Transformations</p>
          </div>
          
          <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
          
          {/* Step 4: Model Training */}
          <div className="flex flex-col items-center">
            <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">Model Training</h3>
            <p className="text-xs text-gray-600 text-center">XGBoost<br/>Validation</p>
          </div>
        </div>

        {/* Row 2: Explainability */}
        <div className="flex items-center justify-center mb-12">
          {/* SHAP Integration */}
          <div className="flex flex-col items-center">
            <div className="bg-yellow-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Eye className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">SHAP Analysis</h3>
            <p className="text-xs text-gray-600 text-center">Feature Importance<br/>Explanations</p>
          </div>
          
          <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
          
          {/* Layer System */}
          <div className="flex flex-col items-center">
            <div className="bg-indigo-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">Layer System</h3>
            <p className="text-xs text-gray-600 text-center">5 Explanation<br/>Levels</p>
          </div>
        </div>

        {/* Row 3: Experiment Flow */}
        <div className="flex items-center justify-center mb-12">
          {/* User Experiment */}
          <div className="flex flex-col items-center">
            <div className="bg-teal-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">User Study</h3>
            <p className="text-xs text-gray-600 text-center">5 Personas<br/>A/B Testing</p>
          </div>
          
          {/* Arrow pointing back to model */}
          <div className="flex flex-col items-center mx-8">
            <ArrowUpRight className="w-6 h-6 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 text-center">Requests<br/>Prediction</p>
            <ArrowDownLeft className="w-6 h-6 text-gray-400 mt-2" />
          </div>
          
          {/* Model Prediction (connected back) */}
          <div className="flex flex-col items-center">
            <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg mb-2 border-4 border-red-300">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">Live Prediction</h3>
            <p className="text-xs text-gray-600 text-center">Real-time<br/>SHAP Values</p>
          </div>
          
          <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
          
          {/* Deployment */}
          <div className="flex flex-col items-center">
            <div className="bg-orange-500 text-white p-4 rounded-xl shadow-lg mb-2">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-sm text-center">Deployment</h3>
            <p className="text-xs text-gray-600 text-center">Full Stack<br/>Production</p>
          </div>
        </div>

        {/* Data Flow Legend */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Data Flow Explanation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Training Pipeline</h3>
              <p className="text-sm text-gray-600 mb-2">
                Data flows sequentially through cleaning → analysis → feature engineering → model training.
              </p>
              <p className="text-sm text-gray-600">
                SHAP integration provides explainability for the trained model.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Experiment Loop</h3>
              <p className="text-sm text-gray-600 mb-2">
                Users interact with different explanation layers during the study.
              </p>
              <p className="text-sm text-gray-600">
                Each interaction triggers a live prediction with real-time SHAP explanations.
              </p>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">System Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Frontend</h3>
              <p className="text-sm opacity-90">Next.js + TypeScript + TailwindCSS</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Backend</h3>
              <p className="text-sm opacity-90">FastAPI + XGBoost + SHAP</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Data Layer</h3>
              <p className="text-sm opacity-90">Supabase + Cloudflare R2</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/experiment" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Try the Experiment
            </a>
            <a 
              href="/dataset" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Explore the Data
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
