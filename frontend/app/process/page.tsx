'use client'

// Process visualization page showing the complete XAI credit risk workflow

import { useState } from 'react'
import { ChevronRight, Database, Settings, Brain, Eye, Users, BarChart3, GitBranch, Upload, Download, Cpu, Target, Layers, MousePointer } from 'lucide-react'

export default function ProcessPage() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const processSteps = [
    {
      id: 1,
      title: "Data Acquisition & Cleaning",
      icon: <Database className="w-8 h-8" />,
      description: "Download and prepare the German Credit dataset",
      details: [
        "Download from UCI ML Repository (1000 samples, 20 features)",
        "Map symbolic codes (A11, A12...) to human-readable values",
        "Clean categorical variables (employment, housing, etc.)",
        "Remove biased features (gender, foreign worker status)",
        "Create german_credit_clean.csv with 18 final features"
      ],
      color: "bg-blue-500",
      lightColor: "bg-blue-50 border-blue-200"
    },
    {
      id: 2,
      title: "Exploratory Data Analysis",
      icon: <BarChart3 className="w-8 h-8" />,
      description: "Comprehensive statistical analysis and visualization",
      details: [
        "Target distribution analysis (70% good, 30% bad credit)",
        "Numerical feature distributions (age, amount, duration)",
        "Categorical feature analysis (checking status, employment)",
        "Correlation heatmap with human-readable feature names",
        "Feature importance using Chi-square and point-biserial tests",
        "Generate 8 visualization files + statistics.json"
      ],
      color: "bg-green-500",
      lightColor: "bg-green-50 border-green-200"
    },
    {
      id: 3,
      title: "Feature Engineering",
      icon: <Settings className="w-8 h-8" />,
      description: "Create advanced risk metrics from raw features",
      details: [
        "Monthly Payment Burden = Credit Amount ÷ Duration",
        "Financial Stability Score = Age × Employment Years",
        "Credit Risk Ratio = Credit Amount ÷ (Age × 100)",
        "Credit to Income Proxy = Credit Amount ÷ Age",
        "Duration Risk Score = Duration × Credit Amount",
        "Map employment categories to numerical years"
      ],
      color: "bg-purple-500",
      lightColor: "bg-purple-50 border-purple-200"
    },
    {
      id: 4,
      title: "Model Training & Validation",
      icon: <Brain className="w-8 h-8" />,
      description: "Train XGBoost and Logistic Regression models",
      details: [
        "XGBoost: Passthrough numerical + OrdinalEncoder categorical",
        "Logistic Regression: StandardScaler + OneHotEncoder (baseline)",
        "80/20 train-test split with stratification",
        "Hyperparameter tuning and cross-validation",
        "Performance metrics: Accuracy, Precision, Recall, F1, AUC",
        "Save trained models to R2 cloud storage"
      ],
      color: "bg-red-500",
      lightColor: "bg-red-50 border-red-200"
    },
    {
      id: 5,
      title: "SHAP Explainability Integration",
      icon: <Eye className="w-8 h-8" />,
      description: "Implement model-agnostic explanations",
      details: [
        "SHAP TreeExplainer for XGBoost model interpretability",
        "Calculate feature importance and individual predictions",
        "Map transformed feature names back to human-readable labels",
        "Generate explanation data for all 20+ features",
        "Handle categorical encoding and numerical scaling",
        "Provide both local and global explanations"
      ],
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50 border-yellow-200"
    },
    {
      id: 6,
      title: "Explanation Layer System",
      icon: <Layers className="w-8 h-8" />,
      description: "Multi-level XAI interface design",
      details: [
        "Layer 0: Complete SHAP feature table (all 20+ features)",
        "Layer 1: Key features with values and impact direction",
        "Layer 2: Natural language explanations of decisions",
        "Layer 3: Visual charts and risk factor highlighting",
        "Layer 4: Comparative analysis and what-if scenarios",
        "Progressive disclosure from technical to intuitive"
      ],
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 border-indigo-200"
    },
    {
      id: 7,
      title: "Persona-Based Experiment",
      icon: <Users className="w-8 h-8" />,
      description: "Structured user study with diverse profiles",
      details: [
        "5 diverse personas: Student, Professional, Retiree, etc.",
        "Each persona represents different risk profiles",
        "Randomized explanation layer assignment",
        "Collect user perception and trust metrics",
        "Measure comprehension across explanation styles",
        "A/B testing framework for XAI effectiveness"
      ],
      color: "bg-teal-500",
      lightColor: "bg-teal-50 border-teal-200"
    },
    {
      id: 8,
      title: "Full-Stack Deployment",
      icon: <Upload className="w-8 h-8" />,
      description: "Production-ready system architecture",
      details: [
        "Frontend: Next.js 14 + TypeScript + TailwindCSS (Netlify)",
        "Backend: FastAPI + Python (Railway)",
        "Database: Supabase PostgreSQL for experiment data",
        "Storage: Cloudflare R2 for models and visualizations",
        "Real-time predictions with SHAP explanations",
        "Responsive design for desktop and mobile"
      ],
      color: "bg-orange-500",
      lightColor: "bg-orange-50 border-orange-200"
    }
  ]

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
              Complete Process Workflow & Architecture
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <GitBranch className="w-4 h-4" />
              <span>End-to-End Explainable AI Pipeline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Research Goal</h3>
            </div>
            <p className="text-gray-600">
              Study how different XAI explanation styles influence human perception and trust in AI-based credit decisions.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Cpu className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tech Stack</h3>
            </div>
            <p className="text-gray-600">
              Next.js + FastAPI + XGBoost + SHAP + Supabase + Cloudflare R2 for a complete ML-powered web application.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <MousePointer className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">User Experience</h3>
            </div>
            <p className="text-gray-600">
              Progressive explanation layers from technical SHAP values to intuitive visual representations.
            </p>
          </div>
        </div>

        {/* Process Steps */}
        <div className="space-y-8">
          {processSteps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < processSteps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-16 bg-gray-300 z-0"></div>
              )}
              
              {/* Step Card */}
              <div 
                className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                  activeStep === step.id 
                    ? step.lightColor + ' shadow-xl transform scale-[1.02]' 
                    : 'border-gray-200 hover:shadow-xl hover:border-gray-300'
                }`}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Icon */}
                    <div className={`${step.color} text-white p-3 rounded-xl flex-shrink-0`}>
                      {step.icon}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">Step {step.id}</span>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          activeStep === step.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {step.description}
                      </p>
                      
                      {/* Expanded Details */}
                      {activeStep === step.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Implementation Details:</h4>
                          <ul className="space-y-2">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-gray-700 text-sm">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Architecture Diagram */}
        <div className="mt-16 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">System Architecture</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Frontend */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-blue-900 mb-2">Frontend</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>Next.js 14 + TypeScript</div>
                  <div>TailwindCSS Styling</div>
                  <div>Responsive Design</div>
                  <div>Deployed on Netlify</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">User Interface & Experience</div>
            </div>

            {/* Backend */}
            <div className="text-center">
              <div className="bg-green-100 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-green-900 mb-2">Backend</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <div>FastAPI + Python</div>
                  <div>XGBoost + SHAP</div>
                  <div>ML Model Serving</div>
                  <div>Deployed on Railway</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">AI Processing & APIs</div>
            </div>

            {/* Data Layer */}
            <div className="text-center">
              <div className="bg-purple-100 rounded-xl p-6 mb-4">
                <h3 className="font-bold text-purple-900 mb-2">Data Layer</h3>
                <div className="space-y-1 text-sm text-purple-800">
                  <div>Supabase PostgreSQL</div>
                  <div>Cloudflare R2 Storage</div>
                  <div>Model & Asset Storage</div>
                  <div>Experiment Data</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Storage & Persistence</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-blue-100 mb-6">
            Experience the complete XAI system with interactive explanations and real-time predictions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/experiment" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try the Experiment
            </a>
            <a 
              href="/dataset" 
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
            >
              Explore the Data
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
