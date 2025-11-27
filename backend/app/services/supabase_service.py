# Supabase database service for storing participant responses

from supabase import create_client, Client
from typing import Dict, Optional
from datetime import datetime
import uuid

class SupabaseService:
    """Handles interaction with Supabase database"""
    
    def __init__(self, config):
        self.config = config
        self.client: Client = create_client(
            config.supabase_url,
            config.supabase_key
        )
    
    def create_session(self, session_record: Dict) -> Dict:
        """Create a new experiment session with participant information"""
        try:
            print(f"[INFO] Attempting to create session: {session_record.get('session_id')}")
            print(f"[INFO] Supabase URL: {self.config.supabase_url[:30]}...")
            response = self.client.table('sessions').insert(session_record).execute()
            print(f"[INFO] Session created successfully: {session_record.get('session_id')}")
            print(f"[INFO] Response: {response}")
            return {"success": True, "data": response.data}
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"[ERROR] Error creating session: {type(e).__name__}: {e}")
            print(f"[ERROR] Full traceback: {error_details}")
            print(f"[ERROR] Session record: {session_record}")
            return {"success": False, "error": f"{type(e).__name__}: {str(e) or 'No error message'}"}
    
    def store_prediction(self, session_id: str, prediction_data: Dict) -> bool:
        """Store prediction results for a session"""
        # Validate required keys
        required_keys = ['decision', 'probability', 'explanation_layer', 'explanation']
        missing_keys = [key for key in required_keys if key not in prediction_data]
        if missing_keys:
            print(f"[ERROR] Missing required keys in prediction_data: {missing_keys}")
            print(f"[ERROR] Received prediction_data: {prediction_data}")
            return False
        
        # Extract explanation data
        explanation = prediction_data['explanation']
        
        # Prepare data according to actual database schema
        data = {
            'session_id': session_id,
            'decision': prediction_data['decision'],
            'probability': prediction_data['probability'],
            'shap_values': explanation.get('shap_features', []),
            'input_features': explanation.get('application_data', {}),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Add persona_id if available
        if 'persona_id' in explanation:
            data['persona_id'] = explanation['persona_id']
        
        try:
            self.client.table('predictions').insert(data).execute()
            print(f"[INFO] Prediction stored successfully for session {session_id}")
            return True
        except Exception as e:
            print(f"[ERROR] Error storing prediction: {e}")
            print(f"[ERROR] Data attempted to store: {data}")
            return False
    
    def store_participant_response(self, response_data: Dict) -> Optional[str]:
        """Store participant feedback ratings"""
        data = {
            'id': str(uuid.uuid4()),
            'session_id': response_data['session_id'],
            'trust_rating': response_data['trust_rating'],
            'understanding_rating': response_data['understanding_rating'],
            'usefulness_rating': response_data['usefulness_rating'],
            'mental_effort_rating': response_data['mental_effort_rating'],
            'decision': response_data['decision'],
            'probability': response_data['probability'],
            'explanation_layer': response_data['explanation_layer'],
            'submitted_at': datetime.utcnow().isoformat()
        }
        
        try:
            response = self.client.table('participant_responses').insert(data).execute()
            return data['id']
        except Exception as e:
            print(f"Error storing participant response: {e}")
            return None
    
    # ============================================================================
    # NEW EXPERIMENTAL FLOW METHODS
    # ============================================================================
    
    def store_pre_experiment_response(self, response_data: Dict) -> bool:
        """Store pre-experiment questionnaire responses"""
        try:
            self.client.table('pre_experiment_responses').insert(response_data).execute()
            return True
        except Exception as e:
            print(f"Error storing pre-experiment response: {e}")
            return False
    
    def store_post_experiment_response(self, response_data: Dict) -> bool:
        """Store post-experiment questionnaire responses"""
        try:
            self.client.table('post_experiment_responses').insert(response_data).execute()
            return True
        except Exception as e:
            print(f"Error storing post-experiment response: {e}")
            return False
    
    def store_layer_feedback(self, feedback_data: Dict) -> bool:
        """Store layer-specific feedback"""
        try:
            self.client.table('layer_feedback').insert(feedback_data).execute()
            return True
        except Exception as e:
            print(f"Error storing layer feedback: {e}")
            return False
    
    def mark_session_complete(self, session_id: str) -> bool:
        """Mark a session as completed"""
        try:
            self.client.table('sessions').update({
                'completed': True
            }).eq('session_id', session_id).execute()
            return True
        except Exception as e:
            print(f"Error marking session complete: {e}")
            return False
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve session data"""
        try:
            response = self.client.table('sessions').select('*').eq('session_id', session_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error retrieving session: {e}")
            return None
    
    def store_layer_rating(self, rating_data: Dict) -> bool:
        """Store layer rating from experiment"""
        try:
            print(f"[DEBUG] Attempting to store layer rating: {rating_data}")
            response = self.client.table('layer_ratings').insert(rating_data).execute()
            print(f"[INFO] Layer rating stored successfully")
            return True
        except Exception as e:
            print(f"[ERROR] Error storing layer rating: {e}")
            print(f"[ERROR] Rating data: {rating_data}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return False
    
    def store_post_questionnaire(self, questionnaire_data: Dict) -> bool:
        """Store post-experiment questionnaire"""
        try:
            self.client.table('post_questionnaires').insert(questionnaire_data).execute()
            return True
        except Exception as e:
            print(f"Error storing post questionnaire: {e}")
            return False
    
    def complete_session(self, session_id: str) -> bool:
        """Mark session as completed"""
        try:
            self.client.table('sessions').update({
                'completed': True,
                'completed_at': datetime.utcnow().isoformat()
            }).eq('session_id', session_id).execute()
            return True
        except Exception as e:
            print(f"Error completing session: {e}")
            return False
