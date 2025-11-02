# SHAP explanation generation service

import shap
import numpy as np
import pandas as pd
from typing import List, Dict
import random

class SHAPExplainer:
    """Generates SHAP-based explanations for credit decisions"""
    
    EXPLANATION_LAYERS = [
        "feature_importance",  # Simple feature ranking
        "numerical_shap",      # Numerical SHAP values
        "visual_bar",          # Bar chart explanation
        "counterfactual",      # What-if scenarios
        "textual_narrative"    # Natural language explanation
    ]
    
    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        self._initialize_explainer()
    
    def _initialize_explainer(self):
        """Initialize SHAP TreeExplainer for XGBoost"""
        self.explainer = shap.TreeExplainer(self.model)
    
    def assign_random_layer(self) -> str:
        """Randomly assign one of five explanation layers"""
        return random.choice(self.EXPLANATION_LAYERS)
    
    def compute_shap_values(self, features: pd.DataFrame):
        """Compute SHAP values for input features"""
        shap_values = self.explainer.shap_values(features)
        
        # For binary classification, get values for positive class
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        return shap_values
    
    def get_top_features(self, features_scaled: pd.DataFrame, features_raw: pd.DataFrame = None, top_n: int = 5) -> List[Dict]:
        """Get top N contributing features with SHAP values
        
        Args:
            features_scaled: Scaled features for SHAP computation
            features_raw: Raw feature values for interpretable display
            top_n: Number of top features to return
            
        Returns:
            List of feature explanations with human-readable values
        """
        shap_values = self.compute_shap_values(features_scaled)
        
        # Use raw features for display if available, otherwise use scaled
        display_features = features_raw if features_raw is not None else features_scaled
        feature_values = display_features.iloc[0].to_dict()
        
        # Get absolute SHAP values for ranking
        abs_shap = np.abs(shap_values[0])
        top_indices = np.argsort(abs_shap)[-top_n:][::-1]
        
        explanations = []
        for idx in top_indices:
            feature_name = self.feature_names[idx]
            raw_value = feature_values.get(feature_name, 0)
            
            explanations.append({
                'feature': feature_name,
                'value': float(raw_value),
                'contribution': float(shap_values[0][idx]),
                'direction': 'increases' if shap_values[0][idx] > 0 else 'decreases'
            })
        
        return explanations
    
    def generate_explanation(self, features_scaled: pd.DataFrame, features_raw: pd.DataFrame = None, layer: str = "feature_importance") -> List[Dict]:
        """
        Generate explanation based on assigned layer
        
        Args:
            features_scaled: Scaled features for SHAP computation
            features_raw: Raw features for display
            layer: Explanation layer type
            
        Returns:
            List of feature explanations
        """
        # Get SHAP-based top features with raw values
        top_features = self.get_top_features(features_scaled, features_raw, top_n=5)
        
        # TODO: Implement layer-specific formatting in future phases
        # For now, return raw SHAP data for all layers
        return top_features
    
    def format_for_layer(self, explanations: List[Dict], layer: str) -> Dict:
        """
        Format explanation data based on layer type
        Currently returns same format; will be customized per layer later
        """
        return {
            'layer': layer,
            'explanations': explanations,
            'description': self._get_layer_description(layer)
        }
    
    def _get_layer_description(self, layer: str) -> str:
        """Get description for each explanation layer"""
        descriptions = {
            'feature_importance': 'Top features ranked by importance',
            'numerical_shap': 'Numerical SHAP contribution values',
            'visual_bar': 'Visual bar chart of feature contributions',
            'counterfactual': 'What-if scenario analysis',
            'textual_narrative': 'Natural language explanation'
        }
        return descriptions.get(layer, 'Feature contribution analysis')
