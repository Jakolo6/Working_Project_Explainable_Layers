# Preprocessing pipeline for German Credit dataset
# Handles feature engineering, encoding, and bias feature exclusion

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Dict, Tuple, List, Optional
import joblib


class GermanCreditPreprocessor:
    """
    Preprocessing pipeline for German Credit dataset.
    
    Excludes bias features:
    - Personal status and sex (attribute 9)
    - Foreign worker (attribute 20)
    
    Handles both training (fit_transform) and prediction (transform) modes.
    """
    
    def __init__(self):
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.categorical_features: List[str] = []
        self.numerical_features: List[str] = []
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
        
        # Fit label encoders for categorical features
        for col in self.categorical_features:
            le = LabelEncoder()
            le.fit(X[col].astype(str))
            self.label_encoders[col] = le
        
        # Fit scaler for numerical features
        if self.numerical_features:
            self.scaler = StandardScaler()
            self.scaler.fit(X[self.numerical_features])
        
        # Store feature names in order
        self.feature_names = self.categorical_features + self.numerical_features
        self.is_fitted = True
        
        return self
    
    def transform(self, df: pd.DataFrame, target_col: Optional[str] = 'class') -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        """
        Transform data using fitted preprocessor.
        
        Args:
            df: DataFrame to transform
            target_col: Name of target column (None for prediction mode)
            
        Returns:
            Tuple of (X_transformed, y) where y is None if target_col not in df
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
        
        # Transform categorical features
        X_transformed = X.copy()
        for col in self.categorical_features:
            if col in X_transformed.columns:
                X_transformed[col] = self.label_encoders[col].transform(X_transformed[col].astype(str))
        
        # Transform numerical features
        if self.numerical_features and self.scaler:
            X_transformed[self.numerical_features] = self.scaler.transform(X_transformed[self.numerical_features])
        
        # Ensure correct column order
        X_transformed = X_transformed[self.feature_names]
        
        return X_transformed, y
    
    def fit_transform(self, df: pd.DataFrame, target_col: str = 'class') -> Tuple[pd.DataFrame, pd.Series]:
        """
        Fit and transform in one step.
        
        Args:
            df: DataFrame with features and target
            target_col: Name of target column
            
        Returns:
            Tuple of (X_transformed, y)
        """
        self.fit(df, target_col)
        X, y = self.transform(df, target_col)
        
        # Remap target labels from [1, 2] to [0, 1] for sklearn compatibility
        if y is not None and y.min() == 1:
            y = y - 1
        
        return X, y
    
    def _remove_bias_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove bias features from dataset"""
        cols_to_drop = [col for col in self.bias_features if col in df.columns]
        if cols_to_drop:
            print(f"Removing bias features: {cols_to_drop}")
            df = df.drop(columns=cols_to_drop)
        return df
    
    def prepare_input_for_prediction(self, input_data: Dict) -> pd.DataFrame:
        """
        Prepare user input for prediction.
        
        Args:
            input_data: Dictionary with feature values
            
        Returns:
            Preprocessed DataFrame ready for model prediction
        """
        if not self.is_fitted:
            raise ValueError("Preprocessor must be fitted before preparing input.")
        
        # Convert to DataFrame
        df = pd.DataFrame([input_data])
        
        # Transform (without target)
        X_transformed, _ = self.transform(df, target_col=None)
        
        return X_transformed
    
    def get_feature_info(self) -> Dict:
        """Get information about features for frontend form generation"""
        return {
            'categorical_features': {
                col: {
                    'type': 'categorical',
                    'classes': self.label_encoders[col].classes_.tolist() if col in self.label_encoders else []
                }
                for col in self.categorical_features
            },
            'numerical_features': {
                col: {
                    'type': 'numerical'
                }
                for col in self.numerical_features
            },
            'excluded_features': self.bias_features
        }
    
    def save(self, filepath: str):
        """Save preprocessor to file"""
        joblib.dump({
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'is_fitted': self.is_fitted
        }, filepath)
        print(f"Preprocessor saved to {filepath}")
    
    def load(self, filepath: str):
        """Load preprocessor from file"""
        data = joblib.load(filepath)
        self.label_encoders = data['label_encoders']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        self.categorical_features = data['categorical_features']
        self.numerical_features = data['numerical_features']
        self.is_fitted = data['is_fitted']
        print(f"Preprocessor loaded from {filepath}")
