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
    
    def create_session(self, application_data: Dict) -> str:
        """Create a new experiment session"""
        session_id = str(uuid.uuid4())
        
        session_data = {
            'session_id': session_id,
            'created_at': datetime.utcnow().isoformat(),
            'application_data': application_data
        }
        
        # Insert into sessions table (will be created in Supabase)
        response = self.client.table('sessions').insert(session_data).execute()
        
        return session_id
    
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
