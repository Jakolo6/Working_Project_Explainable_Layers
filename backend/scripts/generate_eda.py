# Script to generate comprehensive EDA for German Credit Dataset and upload to R2
# Based on official dataset documentation with 20 attributes

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
import numpy as np
import boto3
from io import BytesIO, StringIO
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.config import get_settings

load_dotenv()

# German Credit Dataset attribute mapping
ATTRIBUTE_NAMES = {
    'Attribute1': 'checking_status',
    'Attribute2': 'duration',
    'Attribute3': 'credit_history',
    'Attribute4': 'purpose',
    'Attribute5': 'credit_amount',
    'Attribute6': 'savings_status',
    'Attribute7': 'employment',
    'Attribute8': 'installment_commitment',
    'Attribute9': 'personal_status',  # BIAS - excluded from training
    'Attribute10': 'other_parties',
    'Attribute11': 'residence_since',
    'Attribute12': 'property_magnitude',
    'Attribute13': 'age',
    'Attribute14': 'other_payment_plans',
    'Attribute15': 'housing',
    'Attribute16': 'existing_credits',
    'Attribute17': 'job',
    'Attribute18': 'num_dependents',
    'Attribute19': 'own_telephone',
    'Attribute20': 'foreign_worker',  # BIAS - excluded from training
    'class': 'credit_risk'
}

def load_dataset_from_r2(config):
    """Download dataset from Cloudflare R2"""
    s3_client = boto3.client(
        's3',
        endpoint_url=config.r2_endpoint_url,
        aws_access_key_id=config.r2_access_key_id,
        aws_secret_access_key=config.r2_secret_access_key
    )
    
    obj = s3_client.get_object(
        Bucket=config.r2_bucket_name,
        Key=config.dataset_path
    )
    
    df = pd.read_csv(BytesIO(obj['Body'].read()))
    return df, s3_client

def generate_statistics(df):
    """Generate comprehensive statistics for German Credit Dataset"""
    
    # Identify target column
    target_col = 'class' if 'class' in df.columns else None
    
    stats = {
        "dataset_info": {
            "name": "German Credit Data",
            "source": "Professor Dr. Hans Hofmann, Universität Hamburg",
            "total_records": int(df.shape[0]),
            "total_attributes": 20,
            "numerical_attributes": 7,
            "categorical_attributes": 13,
            "bias_features_excluded": ["Attribute9 (personal_status)", "Attribute20 (foreign_worker)"]
        },
        "target_distribution": {},
        "numerical_summary": {},
        "categorical_summary": {},
        "data_quality": {
            "missing_values": {},
            "duplicates": int(df.duplicated().sum())
        },
        "feature_insights": {}
    }
    
    # Target distribution (class: 1=Good, 2=Bad)
    if target_col:
        target_counts = df[target_col].value_counts().sort_index().to_dict()
        total = len(df)
        good_count = target_counts.get(1, 0)
        bad_count = target_counts.get(2, 0)
        
        stats["target_distribution"] = {
            "good_credit": {
                "count": int(good_count),
                "percentage": float(good_count / total * 100),
                "label": "Class 1"
            },
            "bad_credit": {
                "count": int(bad_count),
                "percentage": float(bad_count / total * 100),
                "label": "Class 2"
            },
            "imbalance_ratio": float(good_count / bad_count) if bad_count > 0 else 0,
            "cost_matrix_note": "Misclassifying bad as good costs 5x more than rejecting good customer"
        }
    
    # Numerical features (7 attributes)
    numerical_attrs = ['Attribute2', 'Attribute5', 'Attribute8', 'Attribute11', 'Attribute13', 'Attribute16', 'Attribute18']
    for attr in numerical_attrs:
        if attr in df.columns:
            col_data = df[attr]
            stats["numerical_summary"][ATTRIBUTE_NAMES.get(attr, attr)] = {
                "attribute": attr,
                "mean": float(col_data.mean()),
                "median": float(col_data.median()),
                "std": float(col_data.std()),
                "min": float(col_data.min()),
                "max": float(col_data.max()),
                "q25": float(col_data.quantile(0.25)),
                "q50": float(col_data.quantile(0.50)),
                "q75": float(col_data.quantile(0.75)),
                "skewness": float(col_data.skew()),
                "kurtosis": float(col_data.kurtosis())
            }
    
    # Categorical features (13 attributes)
    categorical_attrs = ['Attribute1', 'Attribute3', 'Attribute4', 'Attribute6', 'Attribute7', 
                         'Attribute9', 'Attribute10', 'Attribute12', 'Attribute14', 'Attribute15',
                         'Attribute17', 'Attribute19', 'Attribute20']
    
    for attr in categorical_attrs:
        if attr in df.columns:
            value_counts = df[attr].value_counts().to_dict()
            is_bias = attr in ['Attribute9', 'Attribute20']
            
            stats["categorical_summary"][ATTRIBUTE_NAMES.get(attr, attr)] = {
                "attribute": attr,
                "unique_values": int(df[attr].nunique()),
                "most_common": str(df[attr].mode()[0]) if len(df[attr].mode()) > 0 else None,
                "distribution": {str(k): int(v) for k, v in sorted(value_counts.items())},
                "excluded_from_training": is_bias,
                "reason": "Bias prevention (gender/nationality)" if is_bias else None
            }
    
    # Missing values check
    missing = df.isnull().sum()
    if missing.sum() > 0:
        stats["data_quality"]["missing_values"] = {
            col: {
                "count": int(missing[col]),
                "percentage": float(missing[col] / len(df) * 100)
            }
            for col in df.columns if missing[col] > 0
        }
    else:
        stats["data_quality"]["missing_values"] = "No missing values detected"
    
    # Feature insights
    if 'Attribute13' in df.columns:  # Age
        stats["feature_insights"]["age"] = {
            "youngest": int(df['Attribute13'].min()),
            "oldest": int(df['Attribute13'].max()),
            "average": float(df['Attribute13'].mean())
        }
    
    if 'Attribute5' in df.columns:  # Credit amount
        stats["feature_insights"]["credit_amount"] = {
            "smallest_dm": float(df['Attribute5'].min()),
            "largest_dm": float(df['Attribute5'].max()),
            "average_dm": float(df['Attribute5'].mean()),
            "median_dm": float(df['Attribute5'].median())
        }
    
    if 'Attribute2' in df.columns:  # Duration
        stats["feature_insights"]["duration"] = {
            "shortest_months": int(df['Attribute2'].min()),
            "longest_months": int(df['Attribute2'].max()),
            "average_months": float(df['Attribute2'].mean())
        }
    
    return stats

def generate_visualizations(df, config, s3_client):
    """Generate comprehensive visualizations for German Credit Dataset"""
    sns.set_style("whitegrid")
    sns.set_palette("husl")
    plots_uploaded = []
    
    target_col = 'class' if 'class' in df.columns else None
    
    # 1. Target distribution (Class 1=Good vs Class 2=Bad)
    if target_col:
        plt.figure(figsize=(10, 6))
        counts = df[target_col].value_counts().sort_index()
        colors = ['#2ecc71', '#e74c3c']
        bars = plt.bar(['Good Credit (1)', 'Bad Credit (2)'], counts.values, color=colors, edgecolor='black', linewidth=1.5)
        plt.title('Credit Risk Distribution\n(1000 Applications)', fontsize=16, fontweight='bold', pad=20)
        plt.ylabel('Number of Applications', fontsize=12)
        plt.ylim(0, max(counts.values) * 1.15)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}\n({height/len(df)*100:.1f}%)',
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
        
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/target_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/target_distribution.png')
        plt.close()
    
    # 2. Age distribution (Attribute 13)
    if 'Attribute13' in df.columns:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # Histogram
        ax1.hist(df['Attribute13'], bins=25, color='#3498db', edgecolor='black', alpha=0.8)
        ax1.axvline(df['Attribute13'].mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {df["Attribute13"].mean():.1f}')
        ax1.axvline(df['Attribute13'].median(), color='green', linestyle='--', linewidth=2, label=f'Median: {df["Attribute13"].median():.1f}')
        ax1.set_title('Age Distribution (Attribute 13)', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Age (years)', fontsize=12)
        ax1.set_ylabel('Frequency', fontsize=12)
        ax1.legend()
        ax1.grid(axis='y', alpha=0.3)
        
        # Box plot by credit risk
        if target_col:
            df_plot = df[[target_col, 'Attribute13']].copy()
            df_plot[target_col] = df_plot[target_col].map({1: 'Good', 2: 'Bad'})
            ax2.boxplot([df[df[target_col]==1]['Attribute13'], df[df[target_col]==2]['Attribute13']],
                       labels=['Good Credit', 'Bad Credit'], patch_artist=True,
                       boxprops=dict(facecolor='#3498db', alpha=0.7),
                       medianprops=dict(color='red', linewidth=2))
            ax2.set_title('Age by Credit Risk', fontsize=14, fontweight='bold')
            ax2.set_ylabel('Age (years)', fontsize=12)
            ax2.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/age_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/age_distribution.png')
        plt.close()
    
    # 3. Credit amount distribution (Attribute 5)
    if 'Attribute5' in df.columns:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # Histogram
        ax1.hist(df['Attribute5'], bins=40, color='#9b59b6', edgecolor='black', alpha=0.8)
        ax1.axvline(df['Attribute5'].mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {df["Attribute5"].mean():.0f} DM')
        ax1.axvline(df['Attribute5'].median(), color='green', linestyle='--', linewidth=2, label=f'Median: {df["Attribute5"].median():.0f} DM')
        ax1.set_title('Credit Amount Distribution (Attribute 5)', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Credit Amount (DM)', fontsize=12)
        ax1.set_ylabel('Frequency', fontsize=12)
        ax1.legend()
        ax1.grid(axis='y', alpha=0.3)
        
        # Box plot by credit risk
        if target_col:
            ax2.boxplot([df[df[target_col]==1]['Attribute5'], df[df[target_col]==2]['Attribute5']],
                       labels=['Good Credit', 'Bad Credit'], patch_artist=True,
                       boxprops=dict(facecolor='#9b59b6', alpha=0.7),
                       medianprops=dict(color='red', linewidth=2))
            ax2.set_title('Credit Amount by Credit Risk', fontsize=14, fontweight='bold')
            ax2.set_ylabel('Credit Amount (DM)', fontsize=12)
            ax2.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/credit_amount_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/credit_amount_distribution.png')
        plt.close()
    
    # 4. Duration distribution (Attribute 2)
    if 'Attribute2' in df.columns:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # Histogram
        ax1.hist(df['Attribute2'], bins=30, color='#e67e22', edgecolor='black', alpha=0.8)
        ax1.axvline(df['Attribute2'].mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {df["Attribute2"].mean():.1f} months')
        ax1.axvline(df['Attribute2'].median(), color='green', linestyle='--', linewidth=2, label=f'Median: {df["Attribute2"].median():.1f} months')
        ax1.set_title('Credit Duration Distribution (Attribute 2)', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Duration (months)', fontsize=12)
        ax1.set_ylabel('Frequency', fontsize=12)
        ax1.legend()
        ax1.grid(axis='y', alpha=0.3)
        
        # Box plot by credit risk
        if target_col:
            ax2.boxplot([df[df[target_col]==1]['Attribute2'], df[df[target_col]==2]['Attribute2']],
                       labels=['Good Credit', 'Bad Credit'], patch_artist=True,
                       boxprops=dict(facecolor='#e67e22', alpha=0.7),
                       medianprops=dict(color='red', linewidth=2))
            ax2.set_title('Duration by Credit Risk', fontsize=14, fontweight='bold')
            ax2.set_ylabel('Duration (months)', fontsize=12)
            ax2.grid(axis='y', alpha=0.3)
        
        plt.tight_layout()
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/duration_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/duration_distribution.png')
        plt.close()
    
    # 5. Purpose distribution (Attribute 4)
    if 'Attribute4' in df.columns:
        plt.figure(figsize=(14, 8))
        purpose_counts = df['Attribute4'].value_counts()
        colors = sns.color_palette('husl', len(purpose_counts))
        bars = plt.barh(range(len(purpose_counts)), purpose_counts.values, color=colors, edgecolor='black', linewidth=1)
        plt.yticks(range(len(purpose_counts)), purpose_counts.index)
        plt.xlabel('Number of Applications', fontsize=12)
        plt.title('Credit Purpose Distribution (Attribute 4)\nSymbolic Codes: A40-A410', fontsize=14, fontweight='bold', pad=20)
        
        # Add value labels
        for i, (bar, val) in enumerate(zip(bars, purpose_counts.values)):
            plt.text(val, bar.get_y() + bar.get_height()/2, f' {val}', 
                    va='center', fontsize=10, fontweight='bold')
        
        plt.grid(axis='x', alpha=0.3)
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/purpose_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/purpose_distribution.png')
        plt.close()
    
    # 6. Checking account status (Attribute 1)
    if 'Attribute1' in df.columns:
        plt.figure(figsize=(12, 7))
        status_counts = df['Attribute1'].value_counts().sort_index()
        colors = ['#e74c3c', '#f39c12', '#2ecc71', '#95a5a6']
        bars = plt.bar(range(len(status_counts)), status_counts.values, color=colors[:len(status_counts)], 
                      edgecolor='black', linewidth=1.5, alpha=0.8)
        plt.xticks(range(len(status_counts)), status_counts.index, fontsize=11)
        plt.ylabel('Number of Applicants', fontsize=12)
        plt.title('Checking Account Status Distribution (Attribute 1)\nA11: <0 DM | A12: 0-200 DM | A13: ≥200 DM | A14: No account', 
                 fontsize=13, fontweight='bold', pad=20)
        
        # Add value labels
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}',
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
        
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/checking_status_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/checking_status_distribution.png')
        plt.close()
    
    # 7. Correlation heatmap (numerical attributes only)
    numerical_attrs = ['Attribute2', 'Attribute5', 'Attribute8', 'Attribute11', 'Attribute13', 'Attribute16', 'Attribute18']
    available_numerical = [col for col in numerical_attrs if col in df.columns]
    
    if len(available_numerical) > 1:
        plt.figure(figsize=(12, 10))
        corr_df = df[available_numerical].copy()
        corr_df.columns = [ATTRIBUTE_NAMES.get(col, col) for col in available_numerical]
        corr = corr_df.corr()
        
        mask = np.triu(np.ones_like(corr, dtype=bool))
        sns.heatmap(corr, mask=mask, annot=True, fmt='.2f', cmap='RdYlGn', center=0,
                    square=True, linewidths=1.5, cbar_kws={"shrink": 0.8},
                    vmin=-1, vmax=1)
        plt.title('Numerical Features Correlation Heatmap\n(7 Numerical Attributes)', 
                 fontsize=14, fontweight='bold', pad=20)
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        buf.seek(0)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/correlation_heatmap.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/correlation_heatmap.png')
        plt.close()
    
    return plots_uploaded

def main():
    """Generate EDA and upload to R2"""
    print("=" * 60)
    print("EDA Generation Pipeline")
    print("=" * 60)
    
    try:
        # Load configuration
        config = get_settings()
        
        # Load dataset from R2
        print("\n📥 Loading dataset from R2...")
        df, s3_client = load_dataset_from_r2(config)
        print(f"✓ Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        
        # Generate statistics
        print("\n📊 Generating statistics...")
        stats = generate_statistics(df)
        print(f"✓ Statistics generated")
        
        # Upload statistics JSON
        print("\n☁️  Uploading statistics to R2...")
        stats_json = json.dumps(stats, indent=2)
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/statistics.json',
            Body=stats_json.encode('utf-8'),
            ContentType='application/json'
        )
        print("✓ Statistics uploaded: eda/statistics.json")
        
        # Generate visualizations
        print("\n📈 Generating visualizations...")
        plots = generate_visualizations(df, config, s3_client)
        print(f"✓ Generated {len(plots)} visualizations:")
        for plot in plots:
            print(f"  - {plot}")
        
        print("\n" + "=" * 60)
        print("✓ EDA pipeline completed!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ EDA generation failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
