# Supabase database service for storing experiment data
# Aligned with FINAL_CLEAN_SCHEMA.sql

from supabase import create_client, Client
from typing import Dict, Optional
from datetime import datetime
import uuid


class SupabaseService:
    """
    Handles interaction with Supabase database.
    
    Tables:
    - sessions: Consent + baseline questionnaire
    - predictions: AI predictions per persona
    - layer_ratings: Ratings for each layer (3 personas × 4 layers = 12 per session)
    - post_questionnaires: Final questionnaire
    """
    
    def __init__(self, config):
        self.config = config
        self.client: Client = create_client(
            config.supabase_url,
            config.supabase_key
        )
    
    # =========================================================================
    # SESSION MANAGEMENT
    # =========================================================================
    
    def create_session(self, session_record: Dict) -> Dict:
        """
        Create a new experiment session.
        
        Expected fields:
        - session_id: str (UUID)
        - consent_given: bool
        - participant_background: str (banking, data_analytics, student, other)
        - credit_experience: str (none, some, regular, expert)
        - ai_familiarity: int (1-5)
        - preferred_explanation_style: str (technical, visual, narrative, action_oriented)
        - background_notes: str (optional)
        """
        try:
            # Ensure we only send fields that exist in the schema
            clean_record = {
                'session_id': session_record['session_id'],
                'consent_given': session_record.get('consent_given', False),
                'participant_background': session_record.get('participant_background'),
                'credit_experience': session_record.get('credit_experience'),
                'ai_familiarity': session_record.get('ai_familiarity'),
                'preferred_explanation_style': session_record.get('preferred_explanation_style'),
                'background_notes': session_record.get('background_notes', ''),
                'completed': False,
                'current_step': 'background'
            }
            
            print(f"[INFO] Creating session: {clean_record['session_id']}")
            response = self.client.table('sessions').insert(clean_record).execute()
            print(f"[INFO] Session created successfully")
            return {"success": True, "data": response.data}
            
        except Exception as e:
            import traceback
            print(f"[ERROR] Error creating session: {e}")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return {"success": False, "error": str(e)}
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve session data by session_id"""
        try:
            response = self.client.table('sessions').select('*').eq('session_id', session_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            print(f"[ERROR] Error retrieving session: {e}")
            return None
    
    def complete_session(self, session_id: str) -> bool:
        """Mark session as completed with timestamp"""
        try:
            self.client.table('sessions').update({
                'completed': True,
                'completed_at': datetime.utcnow().isoformat(),
                'current_step': 'completed'
            }).eq('session_id', session_id).execute()
            print(f"[INFO] Session {session_id} marked as completed")
            return True
        except Exception as e:
            print(f"[ERROR] Error completing session: {e}")
            return False
    
    # =========================================================================
    # PREDICTIONS
    # =========================================================================
    
    def store_prediction(self, session_id: str, prediction_data: Dict) -> bool:
        """
        Store AI prediction for a persona.
        
        Expected prediction_data:
        - decision: str ('approved' or 'rejected')
        - probability: float (0-1)
        - explanation: dict with shap_features, persona_id, application_data
        """
        try:
            explanation = prediction_data.get('explanation', {})
            
            data = {
                'session_id': session_id,
                'persona_id': explanation.get('persona_id', 'unknown'),
                'decision': prediction_data['decision'],
                'probability': float(prediction_data['probability']),
                'shap_values': explanation.get('shap_features', []),
                'input_features': explanation.get('application_data', {})
            }
            
            self.client.table('predictions').insert(data).execute()
            print(f"[INFO] Prediction stored for session {session_id}, persona {data['persona_id']}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Error storing prediction: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return False
    
    # =========================================================================
    # LAYER RATINGS
    # =========================================================================
    
    def store_layer_rating(self, rating_data: Dict) -> bool:
        """
        Store rating for an explanation layer.
        
        Expected rating_data:
        - session_id: str
        - persona_id: str (elderly-woman, young-entrepreneur, middle-aged-employee)
        - layer_number: int (1-4)
        - layer_name: str
        - understanding_rating: int (1-5)
        - communicability_rating: int (1-5)
        - perceived_fairness_rating: int (1-5)
        - cognitive_load_rating: int (1-5)
        - reliance_intention_rating: int (1-5)
        - comment: str (optional)
        - time_spent_seconds: int
        """
        try:
            # Validate and clean the data
            clean_data = {
                'session_id': rating_data['session_id'],
                'persona_id': rating_data['persona_id'],
                'layer_number': int(rating_data['layer_number']),
                'layer_name': rating_data.get('layer_name', f"Layer {rating_data['layer_number']}"),
                'understanding_rating': int(rating_data['understanding_rating']),
                'communicability_rating': int(rating_data['communicability_rating']),
                'perceived_fairness_rating': int(rating_data['perceived_fairness_rating']),
                'cognitive_load_rating': int(rating_data['cognitive_load_rating']),
                'reliance_intention_rating': int(rating_data['reliance_intention_rating']),
                'comment': rating_data.get('comment', ''),
                'time_spent_seconds': int(rating_data.get('time_spent_seconds', 0))
            }
            
            print(f"[DEBUG] Storing layer rating: session={clean_data['session_id']}, "
                  f"persona={clean_data['persona_id']}, layer={clean_data['layer_number']}")
            
            self.client.table('layer_ratings').insert(clean_data).execute()
            print(f"[INFO] Layer rating stored successfully")
            return True
            
        except Exception as e:
            print(f"[ERROR] Error storing layer rating: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return False
    
    # =========================================================================
    # POST-QUESTIONNAIRE
    # =========================================================================
    
    def store_post_questionnaire(self, questionnaire_data: Dict) -> bool:
        """
        Store post-experiment questionnaire.
        
        Expected questionnaire_data:
        - session_id: str
        - most_helpful_layer: str (layer_1 to layer_4)
        - most_trusted_layer: str (layer_1 to layer_4)
        - best_for_customer: str (layer_1 to layer_4)
        - overall_intuitiveness: int (1-5)
        - ai_usefulness: int (1-5)
        - improvement_suggestions: str (optional)
        """
        try:
            clean_data = {
                'session_id': questionnaire_data['session_id'],
                'most_helpful_layer': questionnaire_data['most_helpful_layer'],
                'most_trusted_layer': questionnaire_data['most_trusted_layer'],
                'best_for_customer': questionnaire_data['best_for_customer'],
                'overall_intuitiveness': int(questionnaire_data['overall_intuitiveness']),
                'ai_usefulness': int(questionnaire_data['ai_usefulness']),
                'improvement_suggestions': questionnaire_data.get('improvement_suggestions', '')
            }
            
            self.client.table('post_questionnaires').insert(clean_data).execute()
            
            # Also mark session as completed
            self.complete_session(questionnaire_data['session_id'])
            
            print(f"[INFO] Post-questionnaire stored for session {clean_data['session_id']}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Error storing post questionnaire: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return False
    
    # =========================================================================
    # DASHBOARD / ANALYTICS
    # =========================================================================
    
    def get_dashboard_stats(self) -> Dict:
        """
        Get aggregated experiment statistics for analysis.
        """
        try:
            # Session counts
            sessions_response = self.client.table('sessions').select('session_id, completed, consent_given').execute()
            sessions = sessions_response.data or []
            total_sessions = len([s for s in sessions if s.get('consent_given')])
            completed_sessions = len([s for s in sessions if s.get('completed')])
            
            # Layer ratings
            ratings_response = self.client.table('layer_ratings').select('*').execute()
            ratings = ratings_response.data or []
            total_ratings = len(ratings)
            
            # Calculate averages for the 5 dimensions
            avg_understanding = 0.0
            avg_communicability = 0.0
            avg_fairness = 0.0
            avg_cognitive_load = 0.0
            avg_reliance = 0.0
            
            if total_ratings > 0:
                avg_understanding = sum(r.get('understanding_rating', 0) or 0 for r in ratings) / total_ratings
                avg_communicability = sum(r.get('communicability_rating', 0) or 0 for r in ratings) / total_ratings
                avg_fairness = sum(r.get('perceived_fairness_rating', 0) or 0 for r in ratings) / total_ratings
                avg_cognitive_load = sum(r.get('cognitive_load_rating', 0) or 0 for r in ratings) / total_ratings
                avg_reliance = sum(r.get('reliance_intention_rating', 0) or 0 for r in ratings) / total_ratings
            
            # Post-questionnaire data
            post_response = self.client.table('post_questionnaires').select('*').execute()
            post_data = post_response.data or []
            
            # Count layer preferences
            layer_preferences = {}
            for post in post_data:
                preferred = post.get('most_helpful_layer')
                if preferred:
                    layer_preferences[preferred] = layer_preferences.get(preferred, 0) + 1
            
            # Post-questionnaire averages
            avg_intuitiveness = 0.0
            avg_usefulness = 0.0
            
            if len(post_data) > 0:
                avg_intuitiveness = sum(p.get('overall_intuitiveness', 0) or 0 for p in post_data) / len(post_data)
                avg_usefulness = sum(p.get('ai_usefulness', 0) or 0 for p in post_data) / len(post_data)
            
            return {
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "total_ratings": total_ratings,
                "avg_understanding": round(avg_understanding, 2),
                "avg_communicability": round(avg_communicability, 2),
                "avg_fairness": round(avg_fairness, 2),
                "avg_cognitive_load": round(avg_cognitive_load, 2),
                "avg_reliance": round(avg_reliance, 2),
                "layer_preferences": layer_preferences,
                "avg_intuitiveness": round(avg_intuitiveness, 2),
                "avg_usefulness": round(avg_usefulness, 2)
            }
            
        except Exception as e:
            print(f"[ERROR] Error getting dashboard stats: {e}")
            return {
                "total_sessions": 0,
                "completed_sessions": 0,
                "total_ratings": 0,
                "error": str(e)
            }
