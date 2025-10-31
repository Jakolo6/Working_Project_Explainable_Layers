// Landing page - Introduction to the research platform

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Explainable AI in Financial Services
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            A Master's Thesis Research Platform
          </p>
          <p className="text-lg text-gray-500">
            Nova School of Business and Economics × zeb Consulting
          </p>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">About This Study</h2>
          <p className="text-lg text-gray-700 mb-4">
            This research investigates how different explanation styles affect understanding and trust 
            in AI-based credit decisions. As AI systems become increasingly prevalent in financial services, 
            it's crucial to understand how to communicate their decisions effectively to both professionals 
            and customers.
          </p>
          <p className="text-lg text-gray-700">
            You will interact with a real credit scoring AI system, see multiple explanation formats, 
            and share your perspectives on what helps you understand and trust these decisions.
          </p>
        </div>

        {/* What You'll Do */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What You'll Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Learn About the System</h3>
                <p className="text-gray-600">
                  Understand the dataset and AI model used for credit decisions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Test the System</h3>
                <p className="text-gray-600">
                  Process credit applications for three different personas.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Explore Explanations</h3>
                <p className="text-gray-600">
                  See four different explanation styles for each decision.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Share Your Insights</h3>
                <p className="text-gray-600">
                  Reflect on what helped you understand and trust the AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ethics & Consent */}
        <div className="bg-blue-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ethics & Consent</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Your responses are completely anonymous</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Participation is voluntary and you can stop at any time</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>Data is used solely for academic research purposes</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>All data handling complies with GDPR principles</span>
            </li>
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/dataset"
            className="bg-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition font-semibold text-lg"
          >
            Learn About the Data
          </Link>
          <Link 
            href="/model"
            className="bg-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition font-semibold text-lg"
          >
            Understand the Model
          </Link>
          <Link 
            href="/experiment/start"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg shadow-lg"
          >
            Start Experiment →
          </Link>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-12 text-gray-600">
          <Link href="/about" className="hover:text-blue-600 transition">
            About This Research
          </Link>
          <span className="mx-4">•</span>
          <Link href="/results" className="hover:text-blue-600 transition">
            View Results (Researcher)
          </Link>
        </div>
      </div>
    </main>
  )
}
