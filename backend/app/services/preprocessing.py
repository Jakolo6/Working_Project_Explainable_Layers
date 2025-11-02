# Preprocessing pipeline for German Credit dataset
# Handles feature engineering, one-hot encoding, and bias feature exclusion

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Dict, Tuple, List, Optional
import joblib


class GermanCreditPreprocessor:
    """
    Preprocessing pipeline for German Credit dataset.
    
    Uses one-hot encoding for categorical features to maintain interpretability.
    Preserves both raw and scaled features for SHAP explanations.
    
    Excludes bias features:
    - Personal status and sex (attribute 9)
    - Foreign worker (attribute 20)
    
    Handles both training (fit_transform) and prediction (transform) modes.
    """
    
    def __init__(self):
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.categorical_features: List[str] = []
        self.numerical_features: List[str] = []
        self.onehot_feature_names: List[str] = []
        self.categorical_mappings: Dict[str, List[str]] = {}
        self.is_fitted: bool = False
        
        # Define bias features to exclude (based on German Credit dataset documentation)
        self.bias_features = [
            'personal_status',  # Attribute 9: Personal status and sex
            'foreign_worker'    # Attribute 20: Foreign worker
        ]
        
        # Expected categorical features (after bias exclusion)
        self.expected_categorical = [
            'checking_status',      # Attribute 1
            'credit_history',       # Attribute 3
            'purpose',              # Attribute 4
            'savings_status',       # Attribute 6
            'employment',           # Attribute 7
            'other_parties',        # Attribute 10
            'property_magnitude',   # Attribute 12
            'other_payment_plans',  # Attribute 14
            'housing',              # Attribute 15
            'job',                  # Attribute 17
            'own_telephone'         # Attribute 19
        ]
        
        # Expected numerical features
        self.expected_numerical = [
            'duration',                    # Attribute 2
            'credit_amount',               # Attribute 5
            'installment_commitment',      # Attribute 8
            'residence_since',             # Attribute 11
            'age',                         # Attribute 13
            'existing_credits',            # Attribute 16
            'num_dependents'               # Attribute 18
        ]
    
    def fit(self, df: pd.DataFrame, target_col: str = 'class') -> 'GermanCreditPreprocessor':
        """
        Fit the preprocessor on training data.
        
        Args:
            df: DataFrame with features and target
            target_col: Name of target column
            
        Returns:
            self for method chaining
        """
        # Remove bias features
        df_clean = self._remove_bias_features(df.copy())
        
        # Separate features and target
        if target_col in df_clean.columns:
            X = df_clean.drop(columns=[target_col])
        else:
            X = df_clean
        
        # Identify categorical and numerical features
        self.categorical_features = [col for col in X.columns if X[col].dtype == 'object']
        self.numerical_features = [col for col in X.columns if X[col].dtype in ['int64', 'float64']]
        
        print(f"Categorical features ({len(self.categorical_features)}): {self.categorical_features}")
        print(f"Numerical features ({len(self.numerical_features)}): {self.numerical_features}")
        
        # Store categorical value mappings for one-hot encoding
        for col in self.categorical_features:
            unique_vals = sorted(X[col].astype(str).unique())
            self.categorical_mappings[col] = unique_vals
            print(f"  {col}: {unique_vals}")
        
        # Apply one-hot encoding to get feature names
        X_encoded = pd.get_dummies(X, columns=self.categorical_features, drop_first=False)
        
        # Store one-hot encoded feature names
        self.onehot_feature_names = [col for col in X_encoded.columns if col not in self.numerical_features]
        
        # Fit scaler for numerical features
        if self.numerical_features:
            self.scaler = StandardScaler()
            self.scaler.fit(X_encoded[self.numerical_features])
        
        # Store final feature names (one-hot + numerical)
        self.feature_names = self.onehot_feature_names + self.numerical_features
        self.is_fitted = True
        
        print(f"Total features after one-hot encoding: {len(self.feature_names)}")
        print(f"Feature names: {self.feature_names[:10]}...")  # Show first 10
        
        return self
    
    def transform(self, df: pd.DataFrame, target_col: Optional[str] = 'class') -> Tuple[pd.DataFrame, Optional[pd.Series], pd.DataFrame]:
        """
        Transform data using fitted preprocessor.
        
        Args:
            df: DataFrame to transform
            target_col: Name of target column (None for prediction mode)
            
        Returns:
            Tuple of (X_scaled, y, X_raw) where:
                - X_scaled: One-hot encoded + scaled numerical features
                - y: Target variable (None if not present)
                - X_raw: Raw feature values before scaling (for interpretability)
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor must be fitted before transform. Call fit() first.")
        
        # Remove bias features
        df_clean = self._remove_bias_features(df.copy())
        
        # Separate features and target
        y = None
        if target_col and target_col in df_clean.columns:
            y = df_clean[target_col]
            X = df_clean.drop(columns=[target_col])
        else:
            X = df_clean
        
        # Apply one-hot encoding
        X_encoded = pd.get_dummies(X, columns=self.categorical_features, drop_first=False)
        
        # Ensure all expected one-hot columns exist (handle missing categories)
        for col in self.feature_names:
            if col not in X_encoded.columns:
                X_encoded[col] = 0
        
        # Keep raw values before scaling
        X_raw = X_encoded[self.feature_names].copy()
        
        # Scale numerical features
        X_scaled = X_encoded.copy()
        if self.numerical_features and self.scaler:
            X_scaled[self.numerical_features] = self.scaler.transform(X_scaled[self.numerical_features])
        
        # Ensure correct column order
        X_scaled = X_scaled[self.feature_names]
        X_raw = X_raw[self.feature_names]
        
        return X_scaled, y, X_raw
    
    def fit_transform(self, df: pd.DataFrame, target_col: str = 'class') -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
        """
        Fit and transform in one step.
        
        Args:
            df: DataFrame with features and target
            target_col: Name of target column
            
        Returns:
            Tuple of (X_scaled, y, X_raw)
        """
        self.fit(df, target_col)
        X_scaled, y, X_raw = self.transform(df, target_col)
        
        # Remap target labels from [1, 2] to [0, 1] for sklearn compatibility
        if y is not None and y.min() == 1:
            y = y - 1
        
        return X_scaled, y, X_raw
    
    def _remove_bias_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove bias features from dataset"""
        # Handle both symbolic names (Attribute9, Attribute20) and readable names
        bias_feature_variants = self.bias_features + ['Attribute9', 'Attribute20']
        cols_to_drop = [col for col in bias_feature_variants if col in df.columns]
        if cols_to_drop:
            print(f"Removing bias features: {cols_to_drop}")
            df = df.drop(columns=cols_to_drop)
        return df
    
    def prepare_input_for_prediction(self, input_data: Dict) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Prepare user input for prediction.
        
        Args:
            input_data: Dictionary with feature values
            
        Returns:
            Tuple of (X_scaled, X_raw) preprocessed DataFrames
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor must be fitted before preparing input.")
        
        # Convert to DataFrame
        df = pd.DataFrame([input_data])
        
        # Transform (without target)
        X_scaled, _, X_raw = self.transform(df, target_col=None)
        
        return X_scaled, X_raw
    
    def get_feature_info(self) -> Dict:
        """Get information about features for frontend form generation"""
        return {
            'categorical_features': {
                col: {
                    'type': 'categorical',
                    'classes': self.categorical_mappings.get(col, [])
                }
                for col in self.categorical_features
            },
            'numerical_features': {
                col: {
                    'type': 'numerical'
                }
                for col in self.numerical_features
            },
            'onehot_feature_names': self.onehot_feature_names,
            'all_feature_names': self.feature_names,
            'excluded_features': self.bias_features
        }
    
    def save(self, filepath: str):
        """Save preprocessor to file"""
        joblib.dump({
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'onehot_feature_names': self.onehot_feature_names,
            'categorical_mappings': self.categorical_mappings,
            'is_fitted': self.is_fitted
        }, filepath)
        print(f"Preprocessor saved to {filepath}")
    
    def load(self, filepath: str):
        """Load preprocessor from file"""
        data = joblib.load(filepath)
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        self.categorical_features = data['categorical_features']
        self.numerical_features = data['numerical_features']
        self.onehot_feature_names = data['onehot_feature_names']
        self.categorical_mappings = data['categorical_mappings']
        self.is_fitted = data['is_fitted']
        print(f"Preprocessor loaded from {filepath}")
