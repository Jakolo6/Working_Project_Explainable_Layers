// Temporary home page redirecting to experiment

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">XAI Financial Services</h1>
        <p className="text-gray-600 mb-8">Research Platform for Explainable AI</p>
        <Link 
          href="/experiment"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Start Experiment
        </Link>
      </div>
    </main>
  )
}
