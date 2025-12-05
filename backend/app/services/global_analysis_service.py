# Global XGBoost Analysis Service - Generates comprehensive text-based model analysis
# Creates a detailed report of model behavior, SHAP values, and global patterns

import pandas as pd
import numpy as np
import joblib
import shap
import boto3
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List, Tuple

from app.config import get_settings


class GlobalAnalysisService:
    """
    Service for generating comprehensive global XGBoost model analysis.
    Produces a text-only report with SHAP-based insights.
    """
    
    # Human-readable feature names
    FEATURE_NAMES = {
        'duration': 'Loan Duration (months)',
        'credit_amount': 'Credit Amount',
        'installment_commitment': 'Installment Rate',
        'residence_since': 'Years at Residence',
        'age': 'Age',
        'existing_credits': 'Existing Credits',
        'num_dependents': 'Number of Dependents',
        'monthly_burden': 'Monthly Payment Burden',
        'stability_score': 'Financial Stability Score',
        'risk_ratio': 'Credit Risk Ratio',
        'credit_to_income_proxy': 'Credit to Income Ratio',
        'duration_risk': 'Duration Risk Score',
        'checking_status': 'Checking Account Status',
        'credit_history': 'Credit History',
        'purpose': 'Loan Purpose',
        'savings_status': 'Savings Account Status',
        'employment': 'Employment Duration',
        'other_debtors': 'Other Debtors/Guarantors',
        'property_magnitude': 'Property Ownership',
        'other_payment_plans': 'Other Payment Plans',
        'housing': 'Housing Status',
        'job': 'Job Type',
        'own_telephone': 'Telephone Registration'
    }
    
    # Categorical features for grouping
    CATEGORICAL_FEATURES = [
        'checking_status', 'credit_history', 'purpose', 'savings_status',
        'employment', 'other_debtors', 'property_magnitude', 'other_payment_plans',
        'housing', 'job', 'own_telephone', 'installment_commitment'
    ]
    
    def __init__(self):
        self.config = get_settings()
        self.model = None
        self.dataset = None
        self.explainer = None
        self.shap_values = None
        self.X_transformed = None
        self.feature_names = None
        
    def _create_r2_client(self):
        """Create S3 client for R2"""
        return boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key
        )
    
    def load_model_and_data(self):
        """Load the trained XGBoost model and dataset from R2"""
        r2 = self._create_r2_client()
        
        # Load model
        print("[INFO] Loading XGBoost model from R2...")
        obj = r2.get_object(
            Bucket=self.config.r2_bucket_name,
            Key='models/xgboost_model.pkl'
        )
        self.model = joblib.load(BytesIO(obj['Body'].read()))
        print(f"[INFO] Model loaded: {type(self.model).__name__}")
        
        # Load dataset
        print("[INFO] Loading dataset from R2...")
        obj = r2.get_object(
            Bucket=self.config.r2_bucket_name,
            Key='data/german_credit_clean.csv'
        )
        self.dataset = pd.read_csv(BytesIO(obj['Body'].read()))
        print(f"[INFO] Dataset loaded: {len(self.dataset)} rows, {len(self.dataset.columns)} columns")
        
    def compute_shap_values(self):
        """Compute SHAP values for the entire dataset"""
        print("[INFO] Computing SHAP values for entire dataset...")
        
        # Prepare features (exclude target)
        X = self.dataset.drop(columns=['credit_risk'], errors='ignore')
        
        # Add engineered features
        employment_years_map = {
            'unemployed': 0, 'lt_1_year': 0.5, '1_to_4_years': 2.5,
            '4_to_7_years': 5.5, 'ge_7_years': 10
        }
        X['employment_years'] = X['employment'].map(employment_years_map)
        X['monthly_burden'] = X['credit_amount'] / X['duration']
        X['stability_score'] = X['age'] * X['employment_years']
        X['risk_ratio'] = X['credit_amount'] / (X['age'] * 100)
        X['credit_to_income_proxy'] = X['credit_amount'] / X['age']
        X['duration_risk'] = X['duration'] * X['credit_amount']
        
        # Transform using model's preprocessor
        self.X_transformed = self.model.named_steps['preprocess'].transform(X)
        self.feature_names = list(self.model.named_steps['preprocess'].get_feature_names_out())
        
        X_df = pd.DataFrame(self.X_transformed, columns=self.feature_names)
        
        # Create SHAP explainer
        self.explainer = shap.TreeExplainer(self.model.named_steps['model'])
        
        # Compute SHAP values
        shap_values_raw = self.explainer.shap_values(X_df)
        
        # Get values for bad credit class (class 1)
        if isinstance(shap_values_raw, list):
            self.shap_values = shap_values_raw[1]  # Class 1 (bad credit)
        else:
            self.shap_values = shap_values_raw
            
        print(f"[INFO] SHAP values computed: shape {self.shap_values.shape}")
        
    def _get_base_feature(self, encoded_name: str) -> str:
        """Extract base feature name from encoded column name"""
        # Remove transformer prefix
        clean = encoded_name
        if '__' in encoded_name:
            clean = encoded_name.split('__', 1)[1]
        
        # Check if it's a one-hot encoded categorical
        for cat in self.CATEGORICAL_FEATURES:
            if clean.startswith(cat + '_'):
                return cat
        
        return clean
    
    def _get_display_name(self, feature: str) -> str:
        """Get human-readable display name for a feature"""
        return self.FEATURE_NAMES.get(feature, feature.replace('_', ' ').title())
    
    def compute_grouped_importance(self) -> List[Dict[str, Any]]:
        """Compute mean |SHAP| importance grouped by base feature"""
        # Calculate mean absolute SHAP for each encoded feature
        mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
        
        # Group by base feature
        grouped = {}
        for i, feat_name in enumerate(self.feature_names):
            base = self._get_base_feature(feat_name)
            if base not in grouped:
                grouped[base] = 0.0
            grouped[base] += mean_abs_shap[i]
        
        # Sort by importance
        sorted_features = sorted(grouped.items(), key=lambda x: x[1], reverse=True)
        
        result = []
        for feat, importance in sorted_features:
            result.append({
                'feature': feat,
                'display_name': self._get_display_name(feat),
                'mean_abs_shap': float(importance),
                'is_categorical': feat in self.CATEGORICAL_FEATURES
            })
        
        return result
    
    def compute_direction_effects(self) -> Dict[str, Dict[str, Any]]:
        """Compute the direction of effects for each feature"""
        # Group SHAP values by base feature
        grouped_shap = {}
        
        for i, feat_name in enumerate(self.feature_names):
            base = self._get_base_feature(feat_name)
            if base not in grouped_shap:
                grouped_shap[base] = []
            grouped_shap[base].extend(self.shap_values[:, i].tolist())
        
        results = {}
        for feat, values in grouped_shap.items():
            values = np.array(values)
            results[feat] = {
                'display_name': self._get_display_name(feat),
                'mean_shap': float(np.mean(values)),
                'std_shap': float(np.std(values)),
                'min_shap': float(np.min(values)),
                'max_shap': float(np.max(values)),
                'pct_positive': float((values > 0).mean() * 100),
                'pct_negative': float((values < 0).mean() * 100),
                'direction': 'increases_risk' if np.mean(values) > 0 else 'decreases_risk'
            }
        
        return results
    
    def compute_dependence_insights(self, top_n: int = 10) -> List[Dict[str, Any]]:
        """Compute dependence insights for top features"""
        importance = self.compute_grouped_importance()
        insights = []
        
        # Get numerical features for dependence analysis
        numerical_features = [f for f in importance[:top_n] if not f['is_categorical']]
        
        for feat_info in numerical_features[:10]:
            feat = feat_info['feature']
            
            # Find the column index for this feature
            col_idx = None
            for i, name in enumerate(self.feature_names):
                base = self._get_base_feature(name)
                if base == feat:
                    col_idx = i
                    break
            
            if col_idx is None:
                continue
            
            # Get feature values and SHAP values
            feat_values = self.X_transformed[:, col_idx]
            shap_vals = self.shap_values[:, col_idx]
            
            # Compute correlation
            correlation = np.corrcoef(feat_values, shap_vals)[0, 1]
            
            # Find thresholds (quartiles)
            q25, q50, q75 = np.percentile(feat_values, [25, 50, 75])
            
            # SHAP values at different ranges
            low_mask = feat_values <= q25
            mid_mask = (feat_values > q25) & (feat_values <= q75)
            high_mask = feat_values > q75
            
            shap_low = np.mean(shap_vals[low_mask]) if low_mask.any() else 0
            shap_mid = np.mean(shap_vals[mid_mask]) if mid_mask.any() else 0
            shap_high = np.mean(shap_vals[high_mask]) if high_mask.any() else 0
            
            # Detect nonlinearity
            is_nonlinear = abs(shap_mid - (shap_low + shap_high) / 2) > 0.05
            
            insights.append({
                'feature': feat,
                'display_name': self._get_display_name(feat),
                'correlation': float(correlation),
                'q25': float(q25),
                'q50': float(q50),
                'q75': float(q75),
                'shap_at_low': float(shap_low),
                'shap_at_mid': float(shap_mid),
                'shap_at_high': float(shap_high),
                'is_nonlinear': is_nonlinear,
                'relationship': 'positive' if correlation > 0.1 else ('negative' if correlation < -0.1 else 'complex')
            })
        
        return insights
    
    def get_model_statistics(self) -> Dict[str, Any]:
        """Get model-level statistics"""
        xgb_model = self.model.named_steps['model']
        
        # Get model parameters
        params = xgb_model.get_params()
        
        # Load metrics from R2 if available
        metrics = {}
        try:
            r2 = self._create_r2_client()
            obj = r2.get_object(
                Bucket=self.config.r2_bucket_name,
                Key='models/metrics.json'
            )
            import json
            metrics = json.loads(obj['Body'].read().decode('utf-8'))
        except:
            pass
        
        # Dataset statistics
        y = self.dataset['credit_risk'] if 'credit_risk' in self.dataset.columns else None
        baseline_risk = float(y.mean()) if y is not None else None
        
        return {
            'model_type': 'XGBoost Classifier',
            'n_estimators': params.get('n_estimators', 'N/A'),
            'max_depth': params.get('max_depth', 'N/A'),
            'learning_rate': params.get('learning_rate', 'N/A'),
            'subsample': params.get('subsample', 'N/A'),
            'colsample_bytree': params.get('colsample_bytree', 'N/A'),
            'n_features': len(self.feature_names),
            'n_samples': len(self.dataset),
            'baseline_risk': baseline_risk,
            'metrics': metrics.get('xgboost', {})
        }
    
    def generate_report(self) -> str:
        """Generate the complete global analysis report"""
        # Load data and compute SHAP
        self.load_model_and_data()
        self.compute_shap_values()
        
        # Compute all analyses
        importance = self.compute_grouped_importance()
        directions = self.compute_direction_effects()
        dependence = self.compute_dependence_insights()
        model_stats = self.get_model_statistics()
        
        # Build report
        report = []
        report.append("=" * 80)
        report.append("GLOBAL XGBOOST CREDIT RISK MODEL ANALYSIS")
        report.append("=" * 80)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        report.append("")
        
        # Section 1: Model Overview
        report.append("-" * 80)
        report.append("1. MODEL OVERVIEW")
        report.append("-" * 80)
        report.append(f"Model Type: {model_stats['model_type']}")
        report.append(f"Number of Trees: {model_stats['n_estimators']}")
        report.append(f"Max Depth: {model_stats['max_depth']}")
        report.append(f"Learning Rate: {model_stats['learning_rate']}")
        report.append(f"Subsample: {model_stats['subsample']}")
        report.append(f"Column Sample by Tree: {model_stats['colsample_bytree']}")
        report.append(f"Total Features (after encoding): {model_stats['n_features']}")
        report.append(f"Training Samples: {model_stats['n_samples']}")
        if model_stats['baseline_risk']:
            report.append(f"Baseline Default Rate: {model_stats['baseline_risk']*100:.1f}%")
        report.append("")
        
        # Model performance metrics
        if model_stats['metrics']:
            m = model_stats['metrics']
            report.append("Performance Metrics:")
            if 'accuracy' in m:
                report.append(f"  - Accuracy: {m['accuracy']*100:.2f}%")
            if 'precision' in m:
                report.append(f"  - Precision: {m['precision']*100:.2f}%")
            if 'recall' in m:
                report.append(f"  - Recall: {m['recall']*100:.2f}%")
            if 'f1' in m:
                report.append(f"  - F1 Score: {m['f1']*100:.2f}%")
            if 'roc_auc' in m:
                report.append(f"  - ROC-AUC: {m['roc_auc']:.4f}")
        report.append("")
        
        # Section 2: Feature Importance
        report.append("-" * 80)
        report.append("2. FEATURE IMPORTANCE (Mean |SHAP| - Grouped)")
        report.append("-" * 80)
        report.append("Ranked by average absolute impact on model predictions:")
        report.append("")
        for i, feat in enumerate(importance, 1):
            cat_marker = " [categorical]" if feat['is_categorical'] else ""
            report.append(f"  {i:2d}. {feat['display_name']:<35} {feat['mean_abs_shap']:.4f}{cat_marker}")
        report.append("")
        
        # Section 3: Direction of Effects
        report.append("-" * 80)
        report.append("3. DIRECTION OF EFFECTS (Global SHAP Summary)")
        report.append("-" * 80)
        report.append("How each feature typically affects credit risk:")
        report.append("  (+) Positive mean SHAP = Increases default risk")
        report.append("  (-) Negative mean SHAP = Decreases default risk")
        report.append("")
        
        # Sort by absolute mean SHAP
        sorted_directions = sorted(directions.items(), key=lambda x: abs(x[1]['mean_shap']), reverse=True)
        
        for feat, d in sorted_directions:
            direction_symbol = "↑" if d['mean_shap'] > 0 else "↓"
            report.append(f"  {d['display_name']:<35}")
            report.append(f"    Mean SHAP: {d['mean_shap']:+.4f} {direction_symbol}")
            report.append(f"    Range: [{d['min_shap']:.4f}, {d['max_shap']:.4f}]")
            report.append(f"    % Positive: {d['pct_positive']:.1f}% | % Negative: {d['pct_negative']:.1f}%")
            report.append("")
        
        # Section 4: Dependence Insights
        report.append("-" * 80)
        report.append("4. DEPENDENCE INSIGHTS (Top Numerical Features)")
        report.append("-" * 80)
        report.append("How feature values relate to SHAP contributions:")
        report.append("")
        
        for insight in dependence:
            report.append(f"  {insight['display_name']}:")
            report.append(f"    Correlation with SHAP: {insight['correlation']:.3f} ({insight['relationship']})")
            report.append(f"    Value Quartiles: Q25={insight['q25']:.2f}, Q50={insight['q50']:.2f}, Q75={insight['q75']:.2f}")
            report.append(f"    SHAP at Low Values (≤Q25): {insight['shap_at_low']:+.4f}")
            report.append(f"    SHAP at Mid Values (Q25-Q75): {insight['shap_at_mid']:+.4f}")
            report.append(f"    SHAP at High Values (>Q75): {insight['shap_at_high']:+.4f}")
            if insight['is_nonlinear']:
                report.append(f"    ⚠️ Nonlinear pattern detected")
            report.append("")
        
        # Section 5: Risk Patterns
        report.append("-" * 80)
        report.append("5. GLOBAL RISK PATTERNS")
        report.append("-" * 80)
        
        # Features that increase risk
        risk_increasing = [(f, d) for f, d in sorted_directions if d['mean_shap'] > 0.01]
        risk_increasing.sort(key=lambda x: x[1]['mean_shap'], reverse=True)
        
        report.append("")
        report.append("Features that INCREASE default risk (positive mean SHAP):")
        for feat, d in risk_increasing[:10]:
            report.append(f"  • {d['display_name']}: +{d['mean_shap']:.4f}")
        
        # Features that decrease risk
        risk_decreasing = [(f, d) for f, d in sorted_directions if d['mean_shap'] < -0.01]
        risk_decreasing.sort(key=lambda x: x[1]['mean_shap'])
        
        report.append("")
        report.append("Features that DECREASE default risk (negative mean SHAP):")
        for feat, d in risk_decreasing[:10]:
            report.append(f"  • {d['display_name']}: {d['mean_shap']:.4f}")
        
        # Section 6: Notable Patterns
        report.append("")
        report.append("-" * 80)
        report.append("6. NOTABLE PATTERNS AND THRESHOLDS")
        report.append("-" * 80)
        report.append("")
        
        # Identify notable patterns from dependence analysis
        for insight in dependence:
            if insight['is_nonlinear']:
                report.append(f"• {insight['display_name']}: Shows nonlinear relationship")
                report.append(f"  - Low values ({insight['q25']:.0f}) → SHAP {insight['shap_at_low']:+.3f}")
                report.append(f"  - Mid values ({insight['q50']:.0f}) → SHAP {insight['shap_at_mid']:+.3f}")
                report.append(f"  - High values ({insight['q75']:.0f}) → SHAP {insight['shap_at_high']:+.3f}")
                report.append("")
        
        # Section 7: Key Insights Summary
        report.append("-" * 80)
        report.append("7. KEY INSIGHTS SUMMARY")
        report.append("-" * 80)
        report.append("")
        
        # Top 3 most important features
        report.append("Most Important Features (by mean |SHAP|):")
        for i, feat in enumerate(importance[:3], 1):
            d = directions[feat['feature']]
            effect = "increases" if d['mean_shap'] > 0 else "decreases"
            report.append(f"  {i}. {feat['display_name']} - {effect} risk on average")
        report.append("")
        
        # Strongest risk factors
        report.append("Strongest Risk Factors:")
        if risk_increasing:
            top_risk = risk_increasing[0]
            report.append(f"  • {top_risk[1]['display_name']} has the strongest risk-increasing effect")
        if risk_decreasing:
            top_protective = risk_decreasing[0]
            report.append(f"  • {top_protective[1]['display_name']} has the strongest protective effect")
        report.append("")
        
        # Dataset note
        report.append("-" * 80)
        report.append("8. DATA SOURCE AND LIMITATIONS")
        report.append("-" * 80)
        report.append("")
        report.append("Dataset: German Credit Data (UCI ML Repository)")
        report.append("Original collection: 1994")
        report.append("Sample size: 1,000 loan applications")
        report.append("")
        report.append("⚠️ IMPORTANT LIMITATIONS:")
        report.append("• Historical data from 1994 may not reflect current credit patterns")
        report.append("• Selection bias: Only approved loans are in the dataset")
        report.append("• Some features (e.g., credit_history) show counterintuitive patterns")
        report.append("  due to historical selection effects")
        report.append("• This model is for research/educational purposes only")
        report.append("")
        
        report.append("=" * 80)
        report.append("END OF REPORT")
        report.append("=" * 80)
        
        return "\n".join(report)
    
    def generate_and_upload(self) -> Dict[str, Any]:
        """Generate the report and upload to R2"""
        print("[INFO] Generating global XGBoost analysis report...")
        
        report_content = self.generate_report()
        
        # Upload to R2
        r2 = self._create_r2_client()
        
        r2.put_object(
            Bucket=self.config.r2_bucket_name,
            Key='global_explanation/global_xgboost_analysis.txt',
            Body=report_content.encode('utf-8'),
            ContentType='text/plain'
        )
        
        print("[INFO] Report uploaded to R2: global_explanation/global_xgboost_analysis.txt")
        
        return {
            'success': True,
            'message': 'Global XGBoost analysis report generated and uploaded',
            'r2_key': 'global_explanation/global_xgboost_analysis.txt',
            'generated_at': datetime.now().isoformat(),
            'report_content': report_content
        }
