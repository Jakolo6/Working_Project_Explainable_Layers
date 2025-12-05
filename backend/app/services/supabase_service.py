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
        - persona_id: str (elderly-woman, young-entrepreneur)
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
        Get comprehensive experiment statistics for analysis.
        Includes per-layer, per-persona breakdowns and advanced metrics.
        """
        import statistics
        
        try:
            # Session counts with participant background data
            sessions_response = self.client.table('sessions').select('*').execute()
            sessions = sessions_response.data or []
            consented_sessions = [s for s in sessions if s.get('consent_given')]
            completed_sessions_list = [s for s in sessions if s.get('completed')]
            total_sessions = len(consented_sessions)
            completed_sessions = len(completed_sessions_list)
            
            # Participant demographics
            backgrounds = {}
            credit_experiences = {}
            ai_familiarity_scores = []
            explanation_styles = {}
            
            for s in consented_sessions:
                bg = s.get('participant_background')
                if bg:
                    backgrounds[bg] = backgrounds.get(bg, 0) + 1
                
                exp = s.get('credit_experience')
                if exp:
                    credit_experiences[exp] = credit_experiences.get(exp, 0) + 1
                
                ai_fam = s.get('ai_familiarity')
                if ai_fam:
                    ai_familiarity_scores.append(ai_fam)
                
                style = s.get('preferred_explanation_style')
                if style:
                    explanation_styles[style] = explanation_styles.get(style, 0) + 1
            
            # Layer ratings with full breakdown
            ratings_response = self.client.table('layer_ratings').select('*').execute()
            ratings = ratings_response.data or []
            total_ratings = len(ratings)
            
            # Per-layer statistics
            layer_stats = {}
            for layer_num in [1, 2, 3, 4]:
                layer_ratings = [r for r in ratings if r.get('layer_number') == layer_num]
                if layer_ratings:
                    layer_stats[f'layer_{layer_num}'] = {
                        'count': len(layer_ratings),
                        'understanding': round(sum(r.get('understanding_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                        'communicability': round(sum(r.get('communicability_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                        'fairness': round(sum(r.get('perceived_fairness_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                        'cognitive_load': round(sum(r.get('cognitive_load_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                        'reliance': round(sum(r.get('reliance_intention_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                        'avg_time_seconds': round(sum(r.get('time_spent_seconds', 0) or 0 for r in layer_ratings) / len(layer_ratings), 1),
                    }
                else:
                    layer_stats[f'layer_{layer_num}'] = {'count': 0}
            
            # Per-persona statistics
            persona_stats = {}
            for persona in ['elderly-woman', 'young-entrepreneur']:
                persona_ratings = [r for r in ratings if r.get('persona_id') == persona]
                if persona_ratings:
                    persona_stats[persona] = {
                        'count': len(persona_ratings),
                        'understanding': round(sum(r.get('understanding_rating', 0) or 0 for r in persona_ratings) / len(persona_ratings), 2),
                        'communicability': round(sum(r.get('communicability_rating', 0) or 0 for r in persona_ratings) / len(persona_ratings), 2),
                        'fairness': round(sum(r.get('perceived_fairness_rating', 0) or 0 for r in persona_ratings) / len(persona_ratings), 2),
                        'cognitive_load': round(sum(r.get('cognitive_load_rating', 0) or 0 for r in persona_ratings) / len(persona_ratings), 2),
                        'reliance': round(sum(r.get('reliance_intention_rating', 0) or 0 for r in persona_ratings) / len(persona_ratings), 2),
                    }
                else:
                    persona_stats[persona] = {'count': 0}
            
            # Calculate overall averages and standard deviations
            avg_understanding = 0.0
            avg_communicability = 0.0
            avg_fairness = 0.0
            avg_cognitive_load = 0.0
            avg_reliance = 0.0
            std_understanding = 0.0
            std_communicability = 0.0
            std_fairness = 0.0
            std_cognitive_load = 0.0
            std_reliance = 0.0
            
            if total_ratings > 0:
                understanding_vals = [r.get('understanding_rating', 0) or 0 for r in ratings]
                communicability_vals = [r.get('communicability_rating', 0) or 0 for r in ratings]
                fairness_vals = [r.get('perceived_fairness_rating', 0) or 0 for r in ratings]
                cognitive_vals = [r.get('cognitive_load_rating', 0) or 0 for r in ratings]
                reliance_vals = [r.get('reliance_intention_rating', 0) or 0 for r in ratings]
                
                avg_understanding = sum(understanding_vals) / total_ratings
                avg_communicability = sum(communicability_vals) / total_ratings
                avg_fairness = sum(fairness_vals) / total_ratings
                avg_cognitive_load = sum(cognitive_vals) / total_ratings
                avg_reliance = sum(reliance_vals) / total_ratings
                
                if total_ratings > 1:
                    std_understanding = statistics.stdev(understanding_vals)
                    std_communicability = statistics.stdev(communicability_vals)
                    std_fairness = statistics.stdev(fairness_vals)
                    std_cognitive_load = statistics.stdev(cognitive_vals)
                    std_reliance = statistics.stdev(reliance_vals)
            
            # Post-questionnaire data with full breakdown
            post_response = self.client.table('post_questionnaires').select('*').execute()
            post_data = post_response.data or []
            
            # Count all layer preferences (most_helpful, most_trusted, best_for_customer)
            most_helpful_prefs = {}
            most_trusted_prefs = {}
            best_for_customer_prefs = {}
            
            for post in post_data:
                helpful = post.get('most_helpful_layer')
                if helpful:
                    most_helpful_prefs[helpful] = most_helpful_prefs.get(helpful, 0) + 1
                
                trusted = post.get('most_trusted_layer')
                if trusted:
                    most_trusted_prefs[trusted] = most_trusted_prefs.get(trusted, 0) + 1
                
                customer = post.get('best_for_customer')
                if customer:
                    best_for_customer_prefs[customer] = best_for_customer_prefs.get(customer, 0) + 1
            
            # Post-questionnaire averages
            avg_intuitiveness = 0.0
            avg_usefulness = 0.0
            
            if len(post_data) > 0:
                avg_intuitiveness = sum(p.get('overall_intuitiveness', 0) or 0 for p in post_data) / len(post_data)
                avg_usefulness = sum(p.get('ai_usefulness', 0) or 0 for p in post_data) / len(post_data)
            
            # Collect improvement suggestions
            suggestions = [p.get('improvement_suggestions', '') for p in post_data if p.get('improvement_suggestions')]
            
            # Predictions data
            predictions_response = self.client.table('predictions').select('*').execute()
            predictions = predictions_response.data or []
            
            return {
                # Basic counts
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "total_ratings": total_ratings,
                "total_questionnaires": len(post_data),
                "total_predictions": len(predictions),
                
                # Participant demographics
                "participant_backgrounds": backgrounds,
                "credit_experiences": credit_experiences,
                "avg_ai_familiarity": round(sum(ai_familiarity_scores) / len(ai_familiarity_scores), 2) if ai_familiarity_scores else 0,
                "preferred_explanation_styles": explanation_styles,
                
                # Overall averages with standard deviations
                "avg_understanding": round(avg_understanding, 2),
                "avg_communicability": round(avg_communicability, 2),
                "avg_fairness": round(avg_fairness, 2),
                "avg_cognitive_load": round(avg_cognitive_load, 2),
                "avg_reliance": round(avg_reliance, 2),
                "std_understanding": round(std_understanding, 2),
                "std_communicability": round(std_communicability, 2),
                "std_fairness": round(std_fairness, 2),
                "std_cognitive_load": round(std_cognitive_load, 2),
                "std_reliance": round(std_reliance, 2),
                
                # Per-layer breakdown
                "layer_stats": layer_stats,
                
                # Per-persona breakdown
                "persona_stats": persona_stats,
                
                # Layer preferences (all 3 questions)
                "layer_preferences": most_helpful_prefs,  # backward compatibility
                "most_helpful_layer": most_helpful_prefs,
                "most_trusted_layer": most_trusted_prefs,
                "best_for_customer": best_for_customer_prefs,
                
                # Post-questionnaire
                "avg_intuitiveness": round(avg_intuitiveness, 2),
                "avg_usefulness": round(avg_usefulness, 2),
                "improvement_suggestions": suggestions,
                
                # === ADVANCED ANALYTICS DATA ===
                
                # Raw ratings for box plots (per layer, per dimension)
                "raw_ratings_by_layer": self._get_raw_ratings_by_layer(ratings),
                
                # Time-on-task data per layer
                "time_stats_by_layer": self._get_time_stats_by_layer(ratings),
                
                # Funnel data (drop-off analysis)
                "funnel_data": self._get_funnel_data(consented_sessions, ratings, predictions),
                
                # Correlation matrix data
                "correlation_data": self._get_correlation_data(ratings),
                
                # Ratings by demographic for filtering
                "ratings_by_background": self._get_ratings_by_background(ratings, consented_sessions),
            }
            
        except Exception as e:
            print(f"[ERROR] Error getting dashboard stats: {e}")
            import traceback
            traceback.print_exc()
            return {
                "total_sessions": 0,
                "completed_sessions": 0,
                "total_ratings": 0,
                "error": str(e)
            }
    
    def _get_raw_ratings_by_layer(self, ratings: list) -> Dict:
        """Get raw rating values for box plot visualization"""
        result = {}
        for layer_num in [1, 2, 3, 4]:
            layer_ratings = [r for r in ratings if r.get('layer_number') == layer_num]
            result[f'layer_{layer_num}'] = {
                'understanding': [r.get('understanding_rating', 0) or 0 for r in layer_ratings],
                'communicability': [r.get('communicability_rating', 0) or 0 for r in layer_ratings],
                'fairness': [r.get('perceived_fairness_rating', 0) or 0 for r in layer_ratings],
                'cognitive_load': [r.get('cognitive_load_rating', 0) or 0 for r in layer_ratings],
                'reliance': [r.get('reliance_intention_rating', 0) or 0 for r in layer_ratings],
                'time_seconds': [r.get('time_spent_seconds', 0) or 0 for r in layer_ratings],
            }
        return result
    
    def _get_time_stats_by_layer(self, ratings: list) -> Dict:
        """Get detailed time statistics per layer"""
        import statistics
        result = {}
        for layer_num in [1, 2, 3, 4]:
            times = [r.get('time_spent_seconds', 0) or 0 for r in ratings if r.get('layer_number') == layer_num]
            if times:
                result[f'layer_{layer_num}'] = {
                    'mean': round(sum(times) / len(times), 1),
                    'median': round(statistics.median(times), 1) if times else 0,
                    'min': min(times),
                    'max': max(times),
                    'std': round(statistics.stdev(times), 1) if len(times) > 1 else 0,
                    'values': times
                }
            else:
                result[f'layer_{layer_num}'] = {'mean': 0, 'median': 0, 'min': 0, 'max': 0, 'std': 0, 'values': []}
        return result
    
    def _get_funnel_data(self, sessions: list, ratings: list, predictions: list) -> Dict:
        """Calculate drop-off funnel data"""
        total_consented = len(sessions)
        
        # Sessions with at least one prediction (started a persona)
        sessions_with_predictions = set(p.get('session_id') for p in predictions)
        started_persona = len(sessions_with_predictions)
        
        # Sessions with ratings for each persona
        persona_completion = {}
        for persona in ['elderly-woman', 'young-entrepreneur']:
            sessions_with_persona = set(
                r.get('session_id') for r in ratings 
                if r.get('persona_id') == persona
            )
            # Count sessions that completed all 4 layers for this persona
            completed_sessions = set()
            for session_id in sessions_with_persona:
                layer_count = len([r for r in ratings if r.get('session_id') == session_id and r.get('persona_id') == persona])
                if layer_count >= 4:
                    completed_sessions.add(session_id)
            persona_completion[persona] = len(completed_sessions)
        
        # Sessions that completed all 3 personas
        completed_all = len([s for s in sessions if s.get('completed')])
        
        return {
            'consented': total_consented,
            'started_persona_1': started_persona,
            'completed_persona_1': persona_completion.get('elderly-woman', 0),
            'completed_persona_2': persona_completion.get('young-entrepreneur', 0),
            'completed_all': completed_all,
        }
    
    def _get_correlation_data(self, ratings: list) -> Dict:
        """Calculate correlation between dimensions"""
        import statistics
        
        if len(ratings) < 3:
            return {'correlations': {}, 'insufficient_data': True}
        
        # Extract all dimension values
        dims = {
            'understanding': [r.get('understanding_rating', 0) or 0 for r in ratings],
            'communicability': [r.get('communicability_rating', 0) or 0 for r in ratings],
            'fairness': [r.get('perceived_fairness_rating', 0) or 0 for r in ratings],
            'cognitive_load': [r.get('cognitive_load_rating', 0) or 0 for r in ratings],
            'reliance': [r.get('reliance_intention_rating', 0) or 0 for r in ratings],
        }
        
        # Calculate Pearson correlation for each pair
        def pearson_corr(x, y):
            n = len(x)
            if n < 3:
                return 0
            mean_x, mean_y = sum(x)/n, sum(y)/n
            std_x = statistics.stdev(x) if n > 1 else 1
            std_y = statistics.stdev(y) if n > 1 else 1
            if std_x == 0 or std_y == 0:
                return 0
            cov = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n)) / (n - 1)
            return round(cov / (std_x * std_y), 3)
        
        correlations = {}
        dim_names = list(dims.keys())
        for i, dim1 in enumerate(dim_names):
            for dim2 in dim_names[i+1:]:
                key = f"{dim1}_vs_{dim2}"
                correlations[key] = pearson_corr(dims[dim1], dims[dim2])
        
        return {'correlations': correlations, 'insufficient_data': False}
    
    def _get_ratings_by_background(self, ratings: list, sessions: list) -> Dict:
        """Get ratings grouped by participant background for filtering"""
        # Create session -> background mapping
        session_bg = {s.get('session_id'): s.get('participant_background') for s in sessions}
        
        result = {}
        for bg in ['banking', 'data_analytics', 'student', 'other']:
            bg_ratings = [r for r in ratings if session_bg.get(r.get('session_id')) == bg]
            if bg_ratings:
                result[bg] = {
                    'count': len(bg_ratings),
                    'layer_stats': {}
                }
                for layer_num in [1, 2, 3, 4]:
                    layer_ratings = [r for r in bg_ratings if r.get('layer_number') == layer_num]
                    if layer_ratings:
                        result[bg]['layer_stats'][f'layer_{layer_num}'] = {
                            'count': len(layer_ratings),
                            'understanding': round(sum(r.get('understanding_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                            'communicability': round(sum(r.get('communicability_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                            'fairness': round(sum(r.get('perceived_fairness_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                            'cognitive_load': round(sum(r.get('cognitive_load_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                            'reliance': round(sum(r.get('reliance_intention_rating', 0) or 0 for r in layer_ratings) / len(layer_ratings), 2),
                        }
        return result
