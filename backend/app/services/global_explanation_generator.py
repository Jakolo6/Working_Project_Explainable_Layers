# Global Explanation Generator - Creates comprehensive model explanations with visualizations
# Generates SHAP plots, feature importance charts, and plain-language narratives
# Stores all assets in R2 for consistent display across explanation layers

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import joblib
import boto3
from botocore.config import Config
from io import BytesIO
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

# Import shared feature engineering
from .feature_engineering import engineer_features

from app.config import get_settings


class GlobalExplanationGenerator:
    """
    Generates a comprehensive global explanation package for the XGBoost credit risk model.
    
    The package includes:
    - Feature importance bar chart (mean |SHAP|)
    - SHAP summary dot plot
    - SHAP dependence plots for top features
    - Feature distribution histograms
    - Dataset summary with disclaimers
    - Plain-language narrative
    
    All assets are stored in R2 under 'global_explanation/' folder.
    """
    
    # Human-readable feature names
    FEATURE_DISPLAY_NAMES = {
        'duration': 'Loan Duration (months)',
        'credit_amount': 'Credit Amount (DM)',
        'installment_commitment': 'Installment Rate (% of income)',
        'residence_since': 'Years at Current Residence',
        'age': 'Applicant Age',
        'existing_credits': 'Number of Existing Credits',
        'num_dependents': 'Number of Dependents',
        'monthly_burden': 'Monthly Payment Burden',
        'stability_score': 'Financial Stability Score',
        'risk_ratio': 'Credit-to-Age Risk Ratio',
        'credit_to_income_proxy': 'Credit-to-Income Proxy',
        'duration_risk': 'Duration Risk Score',
        'checking_status': 'Checking Account Status',
        'credit_history': 'Credit History',
        'purpose': 'Loan Purpose',
        'savings_status': 'Savings Account Status',
        'employment': 'Employment Duration',
        'other_debtors': 'Guarantors/Co-applicants',
        'property_magnitude': 'Property Ownership',
        'other_payment_plans': 'Other Payment Plans',
        'housing': 'Housing Status',
        'job': 'Job Type',
        'own_telephone': 'Telephone Registration'
    }
    
    # Feature descriptions for non-technical users
    FEATURE_DESCRIPTIONS = {
        'checking_status': 'The balance in the applicant\'s checking account. Higher balances indicate better financial management.',
        'credit_history': 'How the applicant has handled previous credits. A clean history strongly supports approval.',
        'duration': 'The length of the loan in months. Shorter loans are generally less risky.',
        'credit_amount': 'The total amount of money requested. Larger amounts relative to the applicant\'s profile increase risk.',
        'savings_status': 'The level of savings the applicant has. More savings provide a financial safety buffer.',
        'employment': 'How long the applicant has been employed. Stable, long-term employment reduces risk.',
        'age': 'The applicant\'s age. Middle-aged applicants (30-55) typically have the most stable profiles.',
        'housing': 'Whether the applicant owns, rents, or lives for free. Home ownership indicates stability.',
        'purpose': 'What the loan will be used for. Some purposes (like car purchases) are considered lower risk.',
        'installment_commitment': 'Percentage of disposable income dedicated to loan payments. Categories range from <20% (low burden) to ≥35% (high burden). Lower burdens indicate more comfortable repayment capacity.',
        'property_magnitude': 'What property or assets the applicant owns. Real estate ownership is favorable.',
        'existing_credits': 'How many other loans the applicant has. Fewer existing obligations are better.',
        'other_debtors': 'Whether there are guarantors or co-applicants. Having a guarantor reduces risk.',
        'other_payment_plans': 'Other installment plans the applicant has. Fewer obligations are better.',
        'job': 'The type of employment. Skilled and management positions are viewed favorably.',
        'num_dependents': 'How many people depend on the applicant financially.',
        'own_telephone': 'Whether the applicant has a registered telephone. Indicates stability and reachability.',
        'monthly_burden': 'Calculated monthly payment amount (credit amount / duration).',
        'stability_score': 'Combined measure of age and employment stability.',
        'risk_ratio': 'Loan amount relative to age-based earning capacity.',
        'credit_to_income_proxy': 'Estimated debt burden relative to earning potential.',
        'duration_risk': 'Combined risk from loan amount and duration.'
    }
    
    # Credit history anomaly disclaimer
    CREDIT_HISTORY_DISCLAIMER = """
**Important Research Note: Credit History Data Anomaly**

In this 1994 German Credit Dataset, the 'credit_history' feature shows counterintuitive patterns:
- Applicants labeled 'critical' (worst history) had a 17.4% default rate
- Applicants labeled 'all_paid' (best history) had a 36.5% default rate

This inversion is due to historical selection bias: banks in 1994 were more cautious with 
applicants who had 'critical' histories, approving only the most creditworthy among them.

**This is a known data anomaly that we have intentionally preserved for research transparency.**
The model learns from this historical data as-is, which means SHAP values for credit_history 
may appear counterintuitive. This demonstrates an important lesson about ML models learning 
from historical biases rather than causal relationships.
"""

    def __init__(self, config=None):
        self.config = config or get_settings()
        self.model = None
        self.explainer = None
        self.X_sample = None
        self.feature_names = None
        self.generation_log = []
        
    def log(self, message: str):
        """Add message to generation log."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.generation_log.append(f"[{timestamp}] {message}")
        print(f"[GlobalExplanation] {message}")
    
    def _create_r2_client(self):
        """Create Cloudflare R2 client."""
        return boto3.client(
            's3',
            endpoint_url=self.config.r2_endpoint_url,
            aws_access_key_id=self.config.r2_access_key_id,
            aws_secret_access_key=self.config.r2_secret_access_key,
            config=Config(signature_version='s3v4', region_name='auto')
        )
    
    def load_model_and_data(self):
        """Load the trained model and sample data from R2."""
        self.log("Loading model and data from R2...")
        r2 = self._create_r2_client()
        
        # Load model
        obj = r2.get_object(
            Bucket=self.config.r2_bucket_name,
            Key='models/xgboost_model.pkl'
        )
        self.model = joblib.load(BytesIO(obj['Body'].read()))
        self.log("✓ Model loaded")
        
        # Load training data
        obj = r2.get_object(
            Bucket=self.config.r2_bucket_name,
            Key='data/german_credit_clean.csv'
        )
        df = pd.read_csv(BytesIO(obj['Body'].read()))
        self.log(f"✓ Loaded {len(df)} records")
        
        # Engineer features (same as training)
        df = self._engineer_features(df)
        
        # Get feature columns
        num_features = ['duration', 'credit_amount', 
                       'residence_since', 'age', 'existing_credits', 'num_dependents',
                       'monthly_burden', 'stability_score', 'risk_ratio',
                       'credit_to_income_proxy', 'duration_risk']
        cat_features = ['checking_status', 'credit_history', 'purpose', 'savings_status', 
                       'employment', 'housing', 'job', 'other_debtors', 
                       'property_magnitude', 'other_payment_plans', 'own_telephone', 
                       'installment_commitment']
        
        self.X_sample = df[num_features + cat_features]
        self.feature_names = num_features + cat_features
        self.df_raw = df
        self.log(f"✓ Prepared {len(self.feature_names)} features")
        
    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply same feature engineering as training using shared module."""
        return engineer_features(df)
    
    def compute_shap_values(self, sample_size: int = 200):
        """Compute SHAP values for a sample of the data."""
        self.log(f"Computing SHAP values for {sample_size} samples...")
        
        # Sample data for SHAP computation
        if len(self.X_sample) > sample_size:
            X_shap = self.X_sample.sample(n=sample_size, random_state=42)
        else:
            X_shap = self.X_sample
        
        # Transform through pipeline
        X_transformed = self.model.named_steps['preprocess'].transform(X_shap)
        self.encoded_feature_names = list(self.model.named_steps['preprocess'].get_feature_names_out())
        
        # Create SHAP explainer
        self.explainer = shap.TreeExplainer(self.model.named_steps['model'])
        
        # Compute SHAP values (for class 1 = bad credit)
        shap_values = self.explainer.shap_values(X_transformed)
        if isinstance(shap_values, list):
            self.shap_values = shap_values[1]  # Class 1 (bad credit)
        else:
            self.shap_values = shap_values
            
        self.X_transformed = X_transformed
        self.X_shap_raw = X_shap
        self.log(f"✓ SHAP values computed: shape {self.shap_values.shape}")
        
    def _get_display_name(self, encoded_name: str) -> str:
        """Convert encoded feature name to display name."""
        # Remove transformer prefixes
        if '__' in encoded_name:
            parts = encoded_name.split('__')
            base_name = parts[-1]
        else:
            base_name = encoded_name
            
        # Check if it's a one-hot encoded categorical
        for feat in self.FEATURE_DISPLAY_NAMES:
            if base_name.startswith(feat + '_') or base_name == feat:
                return self.FEATURE_DISPLAY_NAMES.get(feat, feat)
        
        return self.FEATURE_DISPLAY_NAMES.get(base_name, base_name)
    
    def generate_feature_importance_chart(self) -> bytes:
        """Generate bar chart of mean absolute SHAP values."""
        self.log("Generating feature importance chart...")
        
        # Calculate mean |SHAP| for each feature
        mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
        
        # Aggregate by base feature (sum one-hot encoded categories)
        feature_importance = {}
        for i, name in enumerate(self.encoded_feature_names):
            # Extract base feature name
            if '__' in name:
                base = name.split('__')[-1]
                # Remove category suffix for one-hot encoded features
                for feat in self.feature_names:
                    if base.startswith(feat + '_') or base == feat:
                        base = feat
                        break
            else:
                base = name
            
            if base not in feature_importance:
                feature_importance[base] = 0
            feature_importance[base] += mean_abs_shap[i]
        
        # Sort and get top 15
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:15]
        features = [self.FEATURE_DISPLAY_NAMES.get(f[0], f[0]) for f in sorted_features]
        values = [f[1] for f in sorted_features]
        
        # Create chart
        fig, ax = plt.subplots(figsize=(12, 8))
        colors = plt.cm.RdYlGn_r(np.linspace(0.2, 0.8, len(features)))
        
        bars = ax.barh(range(len(features)), values, color=colors)
        ax.set_yticks(range(len(features)))
        ax.set_yticklabels(features, fontsize=11)
        ax.invert_yaxis()
        ax.set_xlabel('Mean |SHAP Value| (Impact on Model Output)', fontsize=12)
        ax.set_title('Feature Importance: Which Factors Matter Most?', fontsize=14, fontweight='bold')
        
        # Add value labels
        for i, (bar, val) in enumerate(zip(bars, values)):
            ax.text(val + 0.01, bar.get_y() + bar.get_height()/2, 
                   f'{val:.3f}', va='center', fontsize=10)
        
        plt.tight_layout()
        
        # Save to bytes
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        plt.close()
        buf.seek(0)
        
        self.log("✓ Feature importance chart generated")
        return buf.getvalue()
    
    def generate_shap_summary_plot(self) -> bytes:
        """Generate SHAP summary dot plot."""
        self.log("Generating SHAP summary plot...")
        
        # Aggregate SHAP values by base feature for cleaner visualization
        # Group one-hot encoded features
        base_features = []
        base_shap = []
        base_values = []
        
        for feat in self.feature_names[:12]:  # Top 12 base features
            # Find all encoded columns for this feature
            indices = [i for i, name in enumerate(self.encoded_feature_names) 
                      if feat in name.split('__')[-1]]
            
            if indices:
                # Sum SHAP values for this feature
                feat_shap = self.shap_values[:, indices].sum(axis=1)
                
                # Get raw values if available
                if feat in self.X_shap_raw.columns:
                    feat_values = self.X_shap_raw[feat].values
                else:
                    feat_values = np.zeros(len(feat_shap))
                
                base_features.append(self.FEATURE_DISPLAY_NAMES.get(feat, feat))
                base_shap.append(feat_shap)
                base_values.append(feat_values)
        
        # Create custom summary plot
        fig, ax = plt.subplots(figsize=(12, 10))
        
        for i, (feat, shap_vals, raw_vals) in enumerate(zip(base_features, base_shap, base_values)):
            # Normalize raw values for coloring
            if np.std(raw_vals) > 0:
                colors = plt.cm.coolwarm((raw_vals - raw_vals.min()) / (raw_vals.max() - raw_vals.min() + 1e-10))
            else:
                colors = plt.cm.coolwarm(np.ones_like(raw_vals) * 0.5)
            
            # Add jitter to y position
            y_jitter = np.random.normal(i, 0.15, len(shap_vals))
            
            ax.scatter(shap_vals, y_jitter, c=colors, alpha=0.5, s=20)
        
        ax.axvline(x=0, color='gray', linestyle='--', alpha=0.5)
        ax.set_yticks(range(len(base_features)))
        ax.set_yticklabels(base_features, fontsize=11)
        ax.invert_yaxis()
        ax.set_xlabel('SHAP Value (Impact on Default Risk Prediction)', fontsize=12)
        ax.set_title('SHAP Summary: How Each Feature Affects Predictions', fontsize=14, fontweight='bold')
        
        # Add colorbar
        sm = plt.cm.ScalarMappable(cmap='coolwarm')
        sm.set_array([])
        cbar = plt.colorbar(sm, ax=ax, shrink=0.5)
        cbar.set_label('Feature Value\n(Low → High)', fontsize=10)
        
        # Add explanation text
        ax.text(0.02, 0.98, 'Left (negative) = Decreases risk\nRight (positive) = Increases risk',
               transform=ax.transAxes, fontsize=10, verticalalignment='top',
               bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        plt.close()
        buf.seek(0)
        
        self.log("✓ SHAP summary plot generated")
        return buf.getvalue()
    
    def generate_dependence_plots(self, top_n: int = 6) -> Dict[str, bytes]:
        """Generate SHAP dependence plots for top features."""
        self.log(f"Generating dependence plots for top {top_n} features...")
        
        plots = {}
        
        # Get top features by mean |SHAP|
        mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
        feature_importance = {}
        
        for i, name in enumerate(self.encoded_feature_names):
            base = name.split('__')[-1] if '__' in name else name
            for feat in self.feature_names:
                if base.startswith(feat + '_') or base == feat:
                    base = feat
                    break
            if base not in feature_importance:
                feature_importance[base] = 0
            feature_importance[base] += mean_abs_shap[i]
        
        top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        for feat, _ in top_features:
            if feat not in self.X_shap_raw.columns:
                continue
                
            # Find SHAP values for this feature
            indices = [i for i, name in enumerate(self.encoded_feature_names) 
                      if feat in name.split('__')[-1]]
            
            if not indices:
                continue
            
            feat_shap = self.shap_values[:, indices].sum(axis=1)
            feat_values = self.X_shap_raw[feat].values
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Check if categorical
            if feat_values.dtype == 'object' or len(np.unique(feat_values)) < 10:
                # Box plot for categorical
                unique_vals = sorted(self.X_shap_raw[feat].unique())
                data = [feat_shap[feat_values == v] for v in unique_vals]
                
                bp = ax.boxplot(data, labels=unique_vals, patch_artist=True)
                for patch in bp['boxes']:
                    patch.set_facecolor('lightblue')
                
                ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
                ax.set_xlabel(self.FEATURE_DISPLAY_NAMES.get(feat, feat), fontsize=12)
                ax.tick_params(axis='x', rotation=45)
            else:
                # Scatter plot for numerical
                scatter = ax.scatter(feat_values, feat_shap, c=feat_shap, 
                                    cmap='RdYlGn_r', alpha=0.6, s=30)
                ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
                ax.set_xlabel(self.FEATURE_DISPLAY_NAMES.get(feat, feat), fontsize=12)
                plt.colorbar(scatter, ax=ax, label='SHAP Value')
            
            ax.set_ylabel('SHAP Value (Impact on Risk)', fontsize=12)
            ax.set_title(f'How {self.FEATURE_DISPLAY_NAMES.get(feat, feat)} Affects Risk', 
                        fontsize=13, fontweight='bold')
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                       facecolor='white', edgecolor='none')
            plt.close()
            buf.seek(0)
            
            plots[f'dependence_{feat}.png'] = buf.getvalue()
            self.log(f"  ✓ {feat} dependence plot")
        
        return plots
    
    def generate_distribution_histograms(self, top_n: int = 8) -> bytes:
        """Generate distribution histograms for important features."""
        self.log("Generating feature distribution histograms...")
        
        # Select top numerical features
        num_features = ['credit_amount', 'duration', 'age',
                       'monthly_burden', 'stability_score', 'existing_credits', 'residence_since'][:top_n]
        
        fig, axes = plt.subplots(2, 4, figsize=(16, 8))
        axes = axes.flatten()
        
        for i, feat in enumerate(num_features):
            if feat not in self.df_raw.columns:
                continue
            
            ax = axes[i]
            data = self.df_raw[feat].dropna()
            
            # Create histogram with KDE
            ax.hist(data, bins=30, density=True, alpha=0.7, color='steelblue', edgecolor='white')
            
            # Add mean and median lines
            ax.axvline(data.mean(), color='red', linestyle='--', label=f'Mean: {data.mean():.1f}')
            ax.axvline(data.median(), color='green', linestyle=':', label=f'Median: {data.median():.1f}')
            
            ax.set_xlabel(self.FEATURE_DISPLAY_NAMES.get(feat, feat), fontsize=10)
            ax.set_ylabel('Density', fontsize=10)
            ax.legend(fontsize=8)
            ax.set_title(feat.replace('_', ' ').title(), fontsize=11, fontweight='bold')
        
        plt.suptitle('Distribution of Key Features in Training Data', fontsize=14, fontweight='bold', y=1.02)
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        plt.close()
        buf.seek(0)
        
        self.log("✓ Distribution histograms generated")
        return buf.getvalue()
    
    def generate_dataset_summary(self) -> Dict[str, Any]:
        """Generate dataset summary with statistics and disclaimers."""
        self.log("Generating dataset summary...")
        
        df = self.df_raw
        
        # Calculate feature importance for the summary
        mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
        feature_importance_raw = {}
        
        for i, name in enumerate(self.encoded_feature_names):
            base = name.split('__')[-1] if '__' in name else name
            for feat in self.feature_names:
                if base.startswith(feat + '_') or base == feat:
                    base = feat
                    break
            if base not in feature_importance_raw:
                feature_importance_raw[base] = 0
            feature_importance_raw[base] += mean_abs_shap[i]
        
        # Normalize feature importance to 0-1 scale
        max_importance = max(feature_importance_raw.values()) if feature_importance_raw else 1
        feature_importance = {k: float(v / max_importance) for k, v in feature_importance_raw.items()}
        
        # Get top features sorted by importance
        top_features_sorted = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        top_features = [f[0] for f in top_features_sorted[:10]]
        
        # Basic statistics
        summary = {
            "dataset_name": "German Credit Dataset (Statlog)",
            "source": "UCI Machine Learning Repository",
            "year": 1994,
            "total_samples": len(df),
            "features_count": len(self.feature_names),
            "target_distribution": {
                "good_credit": int((df['class'] == 1).sum()),
                "bad_credit": int((df['class'] == 2).sum()),
                "good_credit_rate": float((df['class'] == 1).mean() * 100),
                "bad_credit_rate": float((df['class'] == 2).mean() * 100)
            },
            "numerical_features": [
                {
                    "name": feat,
                    "display_name": self.FEATURE_DISPLAY_NAMES.get(feat, feat),
                    "mean": float(df[feat].mean()) if feat in df.columns else None,
                    "std": float(df[feat].std()) if feat in df.columns else None,
                    "min": float(df[feat].min()) if feat in df.columns else None,
                    "max": float(df[feat].max()) if feat in df.columns else None
                }
                for feat in ['duration', 'credit_amount', 'age', 'installment_commitment']
            ],
            # Feature importance for frontend contextualized global insight
            "top_features": top_features,
            "feature_importance": feature_importance,
            "disclaimers": {
                "historical_data": "This model was trained on 1994 German credit data. Lending practices and economic conditions have changed significantly since then.",
                "credit_history_anomaly": self.CREDIT_HISTORY_DISCLAIMER,
                "not_for_production": "This is a research prototype for studying XAI. It should not be used for actual credit decisions.",
                "bias_warning": "Historical data may contain biases that the model has learned. SHAP values reflect correlations in the data, not causal relationships."
            },
            "generated_at": datetime.now().isoformat()
        }
        
        self.log("✓ Dataset summary generated")
        return summary
    
    def generate_plain_language_narrative(self) -> str:
        """Generate a plain-language explanation of how the model works."""
        self.log("Generating plain-language narrative...")
        
        # Calculate feature importance for narrative
        mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
        feature_importance = {}
        
        for i, name in enumerate(self.encoded_feature_names):
            base = name.split('__')[-1] if '__' in name else name
            for feat in self.feature_names:
                if base.startswith(feat + '_') or base == feat:
                    base = feat
                    break
            if base not in feature_importance:
                feature_importance[base] = 0
            feature_importance[base] += mean_abs_shap[i]
        
        top_5 = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]
        top_features = [self.FEATURE_DISPLAY_NAMES.get(f[0], f[0]) for f in top_5]
        
        narrative = f"""
# How This Credit Risk Assessment Tool Works

## Overview

This tool analyzes credit applications to estimate the likelihood that an applicant will repay their loan successfully. It was trained on historical data from 1,000 German credit applications from 1994.

## What the Model Learned

After analyzing thousands of past credit decisions, the model identified patterns that distinguish successful repayments from defaults. The most influential factors are:

1. **{top_features[0]}** - This is the single most important factor in the model's decisions.
2. **{top_features[1]}** - The second most influential factor.
3. **{top_features[2]}** - Also plays a significant role.
4. **{top_features[3]}** - Contributes meaningfully to decisions.
5. **{top_features[4]}** - Has moderate influence on outcomes.

## Patterns That Support Approval

The model has learned that certain patterns are associated with successful loan repayment:

- **Stable Employment**: Applicants with longer employment history (especially 4+ years) tend to repay more reliably.
- **Financial Reserves**: Having savings provides a safety buffer and shows financial planning ability.
- **Positive Account Balance**: A healthy checking account suggests good money management.
- **Reasonable Loan Size**: Loans that fit the applicant's financial profile are less risky.
- **Shorter Loan Duration**: Shorter repayment periods (under 24 months) reduce overall risk.

## Patterns That Increase Risk

Certain patterns are associated with higher risk of payment difficulties:

- **Unstable Employment**: Short job tenure or unemployment makes regular payments harder.
- **No Financial Buffer**: Lack of savings means less ability to handle unexpected expenses.
- **Account Issues**: Negative balances or no checking account may indicate financial stress.
- **Large Loan Burden**: Very high loans relative to the profile are harder to repay.
- **Long Loan Duration**: Extended repayment periods (over 36 months) increase uncertainty.

## Understanding Confidence Levels

When the tool shows a confidence level:
- **Above 70%**: The applicant clearly fits historical patterns (for approval or rejection).
- **50-70%**: The profile is mixed – some positive and some concerning factors. Human judgment is especially valuable here.
- **Below 50%**: Would indicate the opposite decision is actually more likely.

## Important Limitations

**This tool identifies patterns from historical data - it does not make guarantees or personal judgments.**

Key limitations to understand:
- The training data is from 1994 Germany and may not reflect current economic conditions.
- The model learns correlations, not causal relationships.
- Some historical patterns may reflect past biases in lending decisions.
- Every applicant's situation is unique and deserves individual consideration.

**This tool is designed to support, not replace, professional assessment.**
"""
        
        self.log("✓ Plain-language narrative generated")
        return narrative.strip()
    
    def upload_to_r2(self, assets: Dict[str, Any]) -> Dict[str, str]:
        """Upload all generated assets to R2."""
        self.log("Uploading assets to R2...")
        r2 = self._create_r2_client()
        
        uploaded = {}
        folder = 'global_explanation'
        
        for filename, content in assets.items():
            key = f'{folder}/{filename}'
            
            if isinstance(content, bytes):
                body = content
                content_type = 'image/png'
            elif isinstance(content, str):
                body = content.encode('utf-8')
                content_type = 'text/markdown' if filename.endswith('.md') else 'text/plain'
            elif isinstance(content, dict):
                body = json.dumps(content, indent=2).encode('utf-8')
                content_type = 'application/json'
            else:
                continue
            
            r2.put_object(
                Bucket=self.config.r2_bucket_name,
                Key=key,
                Body=body,
                ContentType=content_type
            )
            
            uploaded[filename] = key
            self.log(f"  ✓ Uploaded {key}")
        
        # Upload manifest
        manifest = {
            "generated_at": datetime.now().isoformat(),
            "files": uploaded,
            "version": "1.0"
        }
        r2.put_object(
            Bucket=self.config.r2_bucket_name,
            Key=f'{folder}/manifest.json',
            Body=json.dumps(manifest, indent=2).encode('utf-8'),
            ContentType='application/json'
        )
        
        self.log(f"✓ All {len(uploaded)} assets uploaded to R2")
        return uploaded
    
    def generate_full_package(self) -> Dict[str, Any]:
        """Generate the complete global explanation package."""
        self.log("=" * 50)
        self.log("Starting Global Explanation Package Generation")
        self.log("=" * 50)
        
        # Load model and data
        self.load_model_and_data()
        
        # Compute SHAP values
        self.compute_shap_values(sample_size=300)
        
        # Generate all assets
        assets = {}
        
        # 1. Feature importance chart
        assets['feature_importance.png'] = self.generate_feature_importance_chart()
        
        # 2. SHAP summary plot
        assets['shap_summary.png'] = self.generate_shap_summary_plot()
        
        # 3. Dependence plots
        dependence_plots = self.generate_dependence_plots(top_n=6)
        assets.update(dependence_plots)
        
        # 4. Distribution histograms
        assets['distributions.png'] = self.generate_distribution_histograms()
        
        # 5. Dataset summary (JSON)
        assets['dataset_summary.json'] = self.generate_dataset_summary()
        
        # 6. Plain-language narrative
        assets['narrative.md'] = self.generate_plain_language_narrative()
        
        # Upload to R2
        uploaded = self.upload_to_r2(assets)
        
        self.log("=" * 50)
        self.log("Global Explanation Package Complete!")
        self.log("=" * 50)
        
        return {
            "success": True,
            "uploaded_files": uploaded,
            "log": self.generation_log,
            "generated_at": datetime.now().isoformat()
        }


def get_global_explanation_assets(config=None) -> Dict[str, Any]:
    """Retrieve global explanation assets from R2."""
    config = config or get_settings()
    
    r2 = boto3.client(
        's3',
        endpoint_url=config.r2_endpoint_url,
        aws_access_key_id=config.r2_access_key_id,
        aws_secret_access_key=config.r2_secret_access_key,
        config=Config(signature_version='s3v4', region_name='auto')
    )
    
    try:
        # Get manifest
        obj = r2.get_object(
            Bucket=config.r2_bucket_name,
            Key='global_explanation/manifest.json'
        )
        manifest = json.loads(obj['Body'].read().decode('utf-8'))
        
        # Get dataset summary
        obj = r2.get_object(
            Bucket=config.r2_bucket_name,
            Key='global_explanation/dataset_summary.json'
        )
        dataset_summary = json.loads(obj['Body'].read().decode('utf-8'))
        
        # Get narrative
        obj = r2.get_object(
            Bucket=config.r2_bucket_name,
            Key='global_explanation/narrative.md'
        )
        narrative = obj['Body'].read().decode('utf-8')
        
        return {
            "available": True,
            "manifest": manifest,
            "dataset_summary": dataset_summary,
            "narrative": narrative,
            "image_urls": {
                "feature_importance": "global_explanation/feature_importance.png",
                "shap_summary": "global_explanation/shap_summary.png",
                "distributions": "global_explanation/distributions.png"
            }
        }
        
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }
