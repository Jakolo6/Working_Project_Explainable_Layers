# OpenAI service for generating natural language explanations

import os
from typing import List, Dict
from openai import OpenAI

class OpenAIService:
    """Generates natural language explanations using OpenAI GPT models"""
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        self.client = OpenAI(api_key=api_key)
    
    # Feature name mappings: technical → human-readable
    FEATURE_LABELS = {
        # Checking account
        'Attribute1_A11': 'checking account with negative balance',
        'Attribute1_A12': 'checking account with low balance (under 200 DM)',
        'Attribute1_A13': 'checking account with good balance (over 200 DM)',
        'Attribute1_A14': 'no checking account',
        
        # Credit history
        'Attribute3_A30': 'no previous credit history',
        'Attribute3_A31': 'all credits paid on time',
        'Attribute3_A32': 'current credits paid on time',
        'Attribute3_A33': 'past payment delays',
        'Attribute3_A34': 'critical account or other debts',
        
        # Purpose
        'Attribute4_A40': 'loan for new car',
        'Attribute4_A41': 'loan for used car',
        'Attribute4_A42': 'loan for furniture or equipment',
        'Attribute4_A43': 'loan for radio or television',
        'Attribute4_A44': 'loan for domestic appliances',
        'Attribute4_A45': 'loan for repairs',
        'Attribute4_A46': 'loan for education',
        'Attribute4_A48': 'loan for retraining',
        'Attribute4_A49': 'loan for business',
        'Attribute4_A410': 'loan for other purposes',
        
        # Savings
        'Attribute6_A61': 'very low savings (under 100 DM)',
        'Attribute6_A62': 'low savings (100-500 DM)',
        'Attribute6_A63': 'moderate savings (500-1000 DM)',
        'Attribute6_A64': 'good savings (over 1000 DM)',
        'Attribute6_A65': 'no savings account',
        
        # Employment
        'Attribute7_A71': 'unemployed',
        'Attribute7_A72': 'short employment history (under 1 year)',
        'Attribute7_A73': 'stable employment (1-4 years)',
        'Attribute7_A74': 'long employment (4-7 years)',
        'Attribute7_A75': 'very stable employment (over 7 years)',
        
        # Property
        'Attribute12_A121': 'owns real estate',
        'Attribute12_A122': 'has savings agreement or life insurance',
        'Attribute12_A123': 'owns car or other property',
        'Attribute12_A124': 'no property',
        
        # Housing
        'Attribute15_A151': 'renting home',
        'Attribute15_A152': 'owns home',
        'Attribute15_A153': 'living rent-free',
        
        # Job
        'Attribute17_A171': 'unemployed or unskilled',
        'Attribute17_A172': 'unskilled resident',
        'Attribute17_A173': 'skilled employee',
        'Attribute17_A174': 'management or highly qualified',
        
        # Numerical features
        'Duration': 'loan duration',
        'Credit amount': 'requested credit amount',
        'Installment rate': 'monthly payment burden',
        'Present residence since': 'residential stability',
        'Age': 'age',
        'Number of existing credits': 'existing loans',
        'Number of people being liable to provide maintenance for': 'number of dependents',
    }
    
    def _format_feature(self, feature_name: str, value: str) -> str:
        """Convert technical feature name and value to human-readable text"""
        # Check if it's a categorical feature with a direct mapping
        if feature_name in self.FEATURE_LABELS:
            return self.FEATURE_LABELS[feature_name]
        
        # Handle numerical features
        label = self.FEATURE_LABELS.get(feature_name, feature_name)
        num_value = None
        try:
            num_value = float(value)
        except (ValueError, TypeError):
            pass
        
        if num_value is not None:
            if 'Duration' in feature_name or 'duration' in label:
                return f"{label} of {int(num_value)} months"
            elif 'Credit amount' in feature_name or 'credit amount' in label:
                return f"{label} of {int(num_value):,} DM"
            elif 'Age' in feature_name or 'age' in label:
                return f"{label} of {int(num_value)} years"
            elif 'rate' in label.lower():
                return f"{label} of {int(num_value)}% of income"
            elif 'residence' in label.lower():
                return f"{label} of {int(num_value)} years"
            elif 'credits' in label.lower():
                return f"{int(num_value)} {label}"
            elif 'dependents' in label.lower():
                return f"{int(num_value)} {label}"
        
        return f"{label}: {value}"
    
    def generate_explanation(
        self,
        decision: str,
        probability: float,
        top_features: List[Dict]
    ) -> str:
        """
        Generate natural language explanation using GPT.
        
        Args:
            decision: 'approved' or 'rejected'
            probability: Confidence score (0-1)
            top_features: List of dicts with 'feature', 'value', 'impact'
        
        Returns:
            Natural language explanation string
        """
        try:
            # Format features for the prompt
            formatted_features = []
            for feat in top_features[:3]:  # Use top 3
                feature_desc = self._format_feature(feat['feature'], feat['value'])
                impact = "positive" if feat['impact'] == 'positive' else "negative"
                formatted_features.append(f"- {feature_desc} ({impact} impact)")
            
            features_text = "\n".join(formatted_features)
            confidence_pct = f"{probability * 100:.1f}%"
            
            # Create prompt
            prompt = f"""You are a banking assistant explaining an AI credit decision to a customer.

The application was {decision.upper()} with {confidence_pct} confidence.

The three main factors were:
{features_text}

Write a short, professional summary (2-3 sentences) explaining this decision in plain language. 
- Do NOT mention "SHAP", "weights", "features", or technical terms
- Sound like a friendly bank employee
- Be factual and neutral
- Explain why these factors led to this decision"""

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful banking assistant who explains credit decisions clearly and professionally."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            explanation = response.choices[0].message.content.strip()
            return explanation
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback explanation
            return f"The decision was based on the applicant's {', '.join([self._format_feature(f['feature'], f['value']) for f in top_features[:3]])}."
