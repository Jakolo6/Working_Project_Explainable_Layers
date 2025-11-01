# Script to generate EDA (Exploratory Data Analysis) and upload to R2

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

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.config import get_settings

load_dotenv()

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
    """Generate comprehensive dataset statistics"""
    stats = {
        "overview": {
            "total_records": int(df.shape[0]),
            "total_features": int(df.shape[1]),
            "memory_usage_mb": float(df.memory_usage(deep=True).sum() / 1024**2)
        },
        "target_distribution": {},
        "numerical_features": {},
        "categorical_features": {},
        "missing_values": {},
        "correlations": {}
    }
    
    # Target distribution
    if 'credit_risk' in df.columns:
        target_counts = df['credit_risk'].value_counts().to_dict()
        stats["target_distribution"] = {
            "good": int(target_counts.get('good', 0)),
            "bad": int(target_counts.get('bad', 0)),
            "good_percentage": float(target_counts.get('good', 0) / len(df) * 100),
            "bad_percentage": float(target_counts.get('bad', 0) / len(df) * 100)
        }
    
    # Numerical features
    numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numerical_cols:
        stats["numerical_features"][col] = {
            "mean": float(df[col].mean()),
            "median": float(df[col].median()),
            "std": float(df[col].std()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "q25": float(df[col].quantile(0.25)),
            "q75": float(df[col].quantile(0.75))
        }
    
    # Categorical features
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    for col in categorical_cols:
        value_counts = df[col].value_counts().head(10).to_dict()
        stats["categorical_features"][col] = {
            "unique_values": int(df[col].nunique()),
            "top_values": {str(k): int(v) for k, v in value_counts.items()}
        }
    
    # Missing values
    missing = df.isnull().sum()
    stats["missing_values"] = {
        col: {
            "count": int(missing[col]),
            "percentage": float(missing[col] / len(df) * 100)
        }
        for col in df.columns if missing[col] > 0
    }
    
    # Correlations (top 10)
    if len(numerical_cols) > 1:
        corr_matrix = df[numerical_cols].corr()
        # Get top correlations (excluding diagonal)
        corr_pairs = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_pairs.append({
                    "feature1": corr_matrix.columns[i],
                    "feature2": corr_matrix.columns[j],
                    "correlation": float(corr_matrix.iloc[i, j])
                })
        corr_pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        stats["correlations"]["top_10"] = corr_pairs[:10]
    
    return stats

def generate_visualizations(df, config, s3_client):
    """Generate and upload visualization plots"""
    sns.set_style("whitegrid")
    plots_uploaded = []
    
    # 1. Target distribution
    if 'credit_risk' in df.columns:
        plt.figure(figsize=(8, 6))
        df['credit_risk'].value_counts().plot(kind='bar', color=['#2ecc71', '#e74c3c'])
        plt.title('Credit Risk Distribution', fontsize=14, fontweight='bold')
        plt.xlabel('Credit Risk')
        plt.ylabel('Count')
        plt.xticks(rotation=0)
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/target_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/target_distribution.png')
        plt.close()
    
    # 2. Age distribution
    if 'age' in df.columns:
        plt.figure(figsize=(10, 6))
        plt.hist(df['age'], bins=30, color='#3498db', edgecolor='black', alpha=0.7)
        plt.title('Age Distribution', fontsize=14, fontweight='bold')
        plt.xlabel('Age')
        plt.ylabel('Frequency')
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/age_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/age_distribution.png')
        plt.close()
    
    # 3. Credit amount distribution
    if 'credit_amount' in df.columns:
        plt.figure(figsize=(10, 6))
        plt.hist(df['credit_amount'], bins=50, color='#9b59b6', edgecolor='black', alpha=0.7)
        plt.title('Credit Amount Distribution', fontsize=14, fontweight='bold')
        plt.xlabel('Credit Amount')
        plt.ylabel('Frequency')
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/credit_amount_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/credit_amount_distribution.png')
        plt.close()
    
    # 4. Correlation heatmap
    numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numerical_cols) > 1:
        plt.figure(figsize=(12, 10))
        corr = df[numerical_cols].corr()
        sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0,
                    square=True, linewidths=1, cbar_kws={"shrink": 0.8})
        plt.title('Feature Correlation Heatmap', fontsize=14, fontweight='bold')
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/correlation_heatmap.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/correlation_heatmap.png')
        plt.close()
    
    # 5. Purpose distribution
    if 'purpose' in df.columns:
        plt.figure(figsize=(12, 6))
        df['purpose'].value_counts().head(10).plot(kind='barh', color='#1abc9c')
        plt.title('Top 10 Credit Purposes', fontsize=14, fontweight='bold')
        plt.xlabel('Count')
        plt.ylabel('Purpose')
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        buf.seek(0)
        
        s3_client.put_object(
            Bucket=config.r2_bucket_name,
            Key='eda/purpose_distribution.png',
            Body=buf.getvalue(),
            ContentType='image/png'
        )
        plots_uploaded.append('eda/purpose_distribution.png')
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
