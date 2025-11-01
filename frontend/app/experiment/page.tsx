// Experiment landing page - directs to start page

import Link from 'next/link'

export default function ExperimentPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Participate in the Experiment
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Help us understand how different explanation styles affect trust in AI decisions
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What to Expect
          </h2>
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">1.</span>
              <span>Register with basic demographic information</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">2.</span>
              <span>Answer pre-experiment questions about your expectations</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">3.</span>
              <span>Review 3 credit application personas with 4 different explanation styles each</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">4.</span>
              <span>Provide feedback on each explanation style</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">5.</span>
              <span>Complete post-experiment questionnaire</span>
            </li>
          </ul>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Time commitment:</strong> Approximately 15-20 minutes
            </p>
          </div>

          <Link
            href="/experiment/start"
            className="block w-full bg-blue-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Experiment
          </Link>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This experiment is part of a Master's thesis research project. 
            Your participation is voluntary and all data will be anonymized.
          </p>
        </div>
      </div>
    </main>
  )
}
