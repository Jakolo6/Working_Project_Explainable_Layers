// Landing page - Experiment participant welcome page

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* ============================================ */}
      {/* 1. HERO SECTION */}
      {/* ============================================ */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Help Shape the Future of AI Transparency in Banking
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8">
            A Master's Thesis Research Experiment by <strong>Nova SBE</strong> × <strong>zeb Consulting</strong>
          </p>
          
          <Link 
            href="/experiment/start"
            className="inline-block bg-white text-blue-700 px-10 py-4 rounded-xl hover:bg-blue-50 transition font-bold text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Start Experiment
          </Link>
          
          <p className="mt-6 text-blue-200 text-sm">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time required: Approx. 10 minutes
            </span>
            <span className="mx-3">•</span>
            <span>No technical expertise required</span>
            <span className="mx-3">•</span>
            <span>Mobile or Desktop</span>
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* ============================================ */}
        {/* 2. THE CONTEXT - What & Why */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            The Research Challenge
          </h2>
          
          <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
            <p>
              Artificial Intelligence is increasingly deciding who gets approved for a loan and who 
              gets rejected. But these AI models are often <strong>"black boxes"</strong>—complex 
              systems that are hard for humans to understand.
            </p>
            <p>
              My Master's Thesis asks a simple question: <em>Which type of explanation helps humans 
              best understand, trust, and work with these AI decisions?</em>
            </p>
            <p>
              I am comparing <strong>four different ways</strong> of explaining AI decisions—from 
              technical data tables to conversational chatbots—to see which one works best for 
              people like you.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. HOW IT WORKS - The "How" */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Your Role in the Experiment
          </h2>
          
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">The Setup</h3>
                <p className="text-gray-600 text-lg">
                  You will step into the shoes of a <strong>Credit Analyst</strong>. You will review 
                  3 loan applications with different risk profiles.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">The Explanations</h3>
                <p className="text-gray-600 text-lg">
                  For each applicant, our AI will make a recommendation. You will see <strong>4 different 
                  explanation styles</strong> showing why the AI made that choice.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">Your Feedback</h3>
                <p className="text-gray-600 text-lg">
                  After viewing each style, you will briefly rate it based on <strong>Understanding</strong>, 
                  <strong> Fairness</strong>, and <strong>Usefulness</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Button - Middle */}
        <div className="text-center mb-12">
          <Link 
            href="/experiment/start"
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-xl hover:bg-blue-700 transition font-bold text-xl shadow-lg"
          >
            Start Experiment →
          </Link>
        </div>

        {/* ============================================ */}
        {/* 4. FOR THE CURIOUS - Optional Context */}
        {/* ============================================ */}
        <section className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Curious about the tech? <span className="text-gray-600 font-normal">(Optional)</span>
          </h2>
          <p className="text-gray-600 mb-4">
            If you are interested in how this platform was built, you are welcome to explore 
            the <Link href="/process" className="text-blue-600 hover:underline font-medium">Process</Link>, 
            <Link href="/dataset" className="text-blue-600 hover:underline font-medium"> Dataset</Link>, and 
            <Link href="/model" className="text-blue-600 hover:underline font-medium"> Model</Link> pages.
          </p>
          <p className="text-gray-600 text-sm italic">
            Note: This is completely optional. You do not need to review these technical details 
            to participate in the experiment.
          </p>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>
            Questions? Contact the researcher at{' '}
            <a href="mailto:jakob.lindner@novasbe.pt" className="text-blue-600 hover:underline">
              jakob.lindner@novasbe.pt
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
