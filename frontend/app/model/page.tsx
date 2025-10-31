// Model page - Explaining the AI system

import Link from 'next/link'

export default function ModelPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Understanding the AI Model
          </h1>
          <p className="text-xl text-gray-600">
            How machine learning makes credit decisions and why explainability matters.
          </p>
        </div>

        {/* Model Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Model Selection</h2>
          <p className="text-gray-700 mb-6">
            We compared two machine learning approaches to find the right balance between 
            performance and interpretability:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Logistic Regression</h3>
              <div className="space-y-2 text-gray-700 mb-4">
                <p><strong>Accuracy:</strong> 72%</p>
                <p><strong>Interpretability:</strong> High</p>
                <p><strong>Complexity:</strong> Low</p>
              </div>
              <p className="text-sm text-gray-600">
                Simple linear model where each feature has a clear weight. Easy to understand 
                but limited in capturing complex patterns.
              </p>
            </div>

            <div className="border-2 border-blue-600 rounded-lg p-6 bg-blue-50">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">XGBoost (Selected)</h3>
              <div className="space-y-2 text-gray-700 mb-4">
                <p><strong>Accuracy:</strong> 84%</p>
                <p><strong>Interpretability:</strong> Low (without SHAP)</p>
                <p><strong>Complexity:</strong> High</p>
              </div>
              <p className="text-sm text-gray-600">
                Ensemble of decision trees that captures non-linear relationships. More accurate 
                but requires explainability tools like SHAP.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-gray-700">
              <strong>The Trade-off:</strong> XGBoost provides 12% higher accuracy, which could 
              prevent significant financial losses. However, its complexity requires sophisticated 
              explanation methods to maintain trust and regulatory compliance.
            </p>
          </div>
        </div>

        {/* Training Process */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Training Process</h2>
          <p className="text-gray-700 mb-6">
            The model was trained using rigorous machine learning best practices:
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Data Split</h3>
                <p className="text-gray-600">
                  70% training, 15% validation, 15% testing to prevent overfitting and ensure 
                  generalization to new cases.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Feature Engineering</h3>
                <p className="text-gray-600">
                  Created interaction terms and polynomial features while removing bias-inducing 
                  variables (gender, nationality).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Hyperparameter Tuning</h3>
                <p className="text-gray-600">
                  Used cross-validation to optimize learning rate, tree depth, and regularization 
                  parameters for best performance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Validation</h3>
                <p className="text-gray-600">
                  Tested on held-out data to verify accuracy, precision, recall, and fairness 
                  across demographic groups.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SHAP Explainability */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">SHAP: Making AI Transparent</h2>
          <p className="text-gray-700 mb-6">
            <strong>SHAP (SHapley Additive exPlanations)</strong> is a game-theory-based method 
            that explains how each feature contributes to a specific prediction.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-3">Why SHAP?</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span><strong>Mathematically rigorous:</strong> Based on Shapley values from 
                cooperative game theory</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span><strong>Model-agnostic:</strong> Works with any machine learning model</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span><strong>Consistent:</strong> If a feature contributes more, its SHAP value 
                is higher</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span><strong>Local accuracy:</strong> Explanations sum to the actual prediction</span>
              </li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">Global Explainability</h3>
              <p className="text-gray-600 mb-2">
                Which features are generally most important across all predictions?
              </p>
              <p className="text-sm text-gray-500">
                Example: "Credit history is the most influential factor in 80% of decisions."
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">Local Explainability</h3>
              <p className="text-gray-600 mb-2">
                How did each feature affect this specific person's decision?
              </p>
              <p className="text-sm text-gray-500">
                Example: "For this applicant, low income decreased approval probability by 15%."
              </p>
            </div>
          </div>
        </div>

        {/* Trust and Fairness */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trust, Fairness & Ethics</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-2">Bias Prevention</h3>
              <p>
                We explicitly removed protected attributes (gender, nationality, ethnicity) from 
                the training data to prevent discriminatory patterns. The model cannot learn biases 
                from features it never sees.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Fairness Testing</h3>
              <p>
                Post-training analysis verified that approval rates are statistically similar across 
                age groups and employment types, ensuring equitable treatment.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Regulatory Compliance</h3>
              <p>
                The model design aligns with EU AI Act requirements for high-risk AI systems, 
                including transparency, human oversight, and the right to explanation.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Human-in-the-Loop</h3>
              <p>
                This system is designed to <strong>assist</strong> human decision-makers, not 
                replace them. Bank employees review AI recommendations and can override decisions 
                based on contextual factors the model cannot capture.
              </p>
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div className="bg-blue-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Model Performance Metrics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">84%</div>
              <div className="text-gray-600">Overall Accuracy</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">81%</div>
              <div className="text-gray-600">Precision (Approved)</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">87%</div>
              <div className="text-gray-600">Recall (Approved)</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Metrics validated on held-out test set (150 applications)
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link 
            href="/dataset"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Dataset
          </Link>
          <Link 
            href="/experiment/start"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Start Experiment →
          </Link>
        </div>
      </div>
    </main>
  )
}
