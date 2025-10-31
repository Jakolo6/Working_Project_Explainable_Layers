// About page - Ethics, transparency, and research context

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About This Research
          </h1>
          <p className="text-xl text-gray-600">
            Transparency, ethics, and the people behind this study.
          </p>
        </div>

        {/* Research Context */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Research Context</h2>
          <p className="text-gray-700 mb-4">
            This platform was developed as part of a Master's thesis at <strong>Nova School of 
            Business and Economics</strong> in collaboration with <strong>zeb Consulting</strong>, 
            a leading European management consultancy specializing in financial services.
          </p>
          <p className="text-gray-700 mb-4">
            The research investigates a critical question for the future of AI in banking: 
            <em>How should AI systems explain their credit decisions to human decision-makers?</em>
          </p>
          <p className="text-gray-700">
            As financial institutions increasingly adopt AI for credit risk assessment, understanding 
            which explanation formats foster trust, comprehension, and appropriate reliance becomes 
            essential for both regulatory compliance and ethical deployment.
          </p>
        </div>

        {/* Research Ethics */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Research Ethics</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">Ethical Approval</h3>
              <p>
                This study follows ethical research guidelines established by Nova School of Business 
                and Economics. All procedures comply with academic research standards for human 
                participant studies.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Voluntary Participation</h3>
              <p>
                Your participation is entirely voluntary. You may withdraw at any time without 
                providing a reason. There are no penalties or consequences for choosing not to 
                participate or for withdrawing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Informed Consent</h3>
              <p>
                By proceeding with the experiment, you acknowledge that you have been informed about 
                the nature of the study, understand what your participation involves, and consent to 
                participate voluntarily.
              </p>
            </div>
          </div>
        </div>

        {/* Data Privacy */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Privacy & Security</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">Anonymity</h3>
              <p>
                All responses are completely anonymous. We collect only the demographic information 
                you provide (age, profession, AI familiarity) and your responses to questionnaires. 
                No personally identifiable information (PII) such as names, email addresses, or IP 
                addresses is stored.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Data Storage</h3>
              <p>
                Your responses are securely stored in a Supabase PostgreSQL database with encryption 
                at rest and in transit. Access is restricted to the research team and protected by 
                authentication protocols.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Data Usage</h3>
              <p>
                Data collected through this platform will be used solely for academic research 
                purposes. Aggregated, anonymized findings may be published in the Master's thesis, 
                academic papers, or presented at conferences. Individual responses will never be 
                identifiable.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">GDPR Compliance</h3>
              <p>
                This study complies with the General Data Protection Regulation (GDPR). You have the 
                right to access, rectify, or request deletion of your data. Since responses are 
                anonymous, we cannot identify individual submissions after they are submitted.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Data Retention</h3>
              <p>
                Research data will be retained for the duration of the thesis project and for a 
                period of 5 years thereafter, as required by academic research standards. After this 
                period, all data will be securely deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Research Team */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Research Team</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Researcher</h3>
              <p className="text-gray-700">
                <strong>Jakob Lindner</strong><br />
                Master's Student, Nova School of Business and Economics<br />
                Research Focus: Explainable AI in Financial Services
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Academic Institution</h3>
              <p className="text-gray-700">
                <strong>Nova School of Business and Economics</strong><br />
                Universidade Nova de Lisboa<br />
                Lisbon, Portugal
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Industry Partner</h3>
              <p className="text-gray-700">
                <strong>zeb Consulting</strong><br />
                Management Consultancy for Financial Services<br />
                European Leader in Banking and Insurance Strategy
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this research, your rights as a participant, or wish to 
            request information about your data, please contact:
          </p>
          <div className="bg-white rounded-lg p-4">
            <p className="text-gray-700">
              <strong>Jakob Lindner</strong><br />
              Email: <a href="mailto:jakob.lindner@novasbe.pt" className="text-blue-600 hover:underline">
                jakob.lindner@novasbe.pt
              </a><br />
              Institution: Nova School of Business and Economics
            </p>
          </div>
        </div>

        {/* Acknowledgments */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acknowledgments</h2>
          <p className="text-gray-700 mb-4">
            This research would not be possible without the support of:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Nova School of Business and Economics</strong> for providing the 
              academic framework and research guidance</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>zeb Consulting</strong> for industry insights and practical perspectives 
              on AI in banking</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>All participants</strong> who generously contribute their time and 
              insights to advance our understanding of explainable AI</span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Home
          </Link>
          <Link 
            href="/experiment/start"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Participate in Study →
          </Link>
        </div>
      </div>
    </main>
  )
}
