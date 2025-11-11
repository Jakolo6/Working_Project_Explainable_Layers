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
    
    def create_session(self, session_record: Dict) -> bool:
        """Create a new experiment session with participant information"""
        try:
            response = self.client.table('sessions').insert(session_record).execute()
            return True
        except Exception as e:
            print(f"Error creating session: {e}")
            return False
    
    def store_prediction(self, session_id: str, prediction_data: Dict) -> bool:
        """Store prediction results for a session"""
        data = {
            'session_id': session_id,
            'decision': prediction_data['decision'],
            'probability': prediction_data['probability'],
            'explanation_layer': prediction_data['explanation_layer'],
            'explanation_data': prediction_data['explanation'],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            self.client.table('predictions').insert(data).execute()
            return True
        except Exception as e:
            print(f"Error storing prediction: {e}")
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
            self.client.table('layer_ratings').insert(rating_data).execute()
            return True
        except Exception as e:
            print(f"Error storing layer rating: {e}")
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
