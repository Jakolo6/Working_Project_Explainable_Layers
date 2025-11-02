# Script to download German Credit dataset from UCI ML Repository and upload to Cloudflare R2

import os
import sys
from pathlib import Path
import boto3
import pandas as pd
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

def download_from_uci():
    """Download German Credit dataset from UCI ML Repository"""
    print("\n📥 Downloading dataset from UCI ML Repository...")
    
    try:
        from ucimlrepo import fetch_ucirepo
        
        # Fetch dataset (ID 144 = Statlog German Credit Data)
        print("Fetching Statlog German Credit Data (ID: 144)...")
        statlog_german_credit_data = fetch_ucirepo(id=144)
        
        # Get features and target
        X = statlog_german_credit_data.data.features
        y = statlog_german_credit_data.data.targets
        
        print(f"✓ Features shape: {X.shape}")
        print(f"✓ Target shape: {y.shape}")
        
        # Combine features and target into single DataFrame
        df = pd.concat([X, y], axis=1)
        
        print(f"✓ Combined dataset: {df.shape[0]} rows, {df.shape[1]} columns")
        print(f"✓ Columns: {df.columns.tolist()}")
        
        # Save to temporary CSV file
        download_path = "./data"
        os.makedirs(download_path, exist_ok=True)
        csv_file = os.path.join(download_path, "german_credit_data.csv")
        
        df.to_csv(csv_file, index=False)
        print(f"✓ Dataset saved to {csv_file}")
        
        return csv_file
            
    except Exception as e:
        print(f"✗ Error downloading from UCI: {e}")
        raise

def upload_to_r2(file_path: str):
    """Upload dataset to Cloudflare R2"""
    print("\n☁️  Uploading dataset to Cloudflare R2...")
    
    r2_account_id = os.getenv('R2_ACCOUNT_ID')
    r2_access_key = os.getenv('R2_ACCESS_KEY_ID')
    r2_secret_key = os.getenv('R2_SECRET_ACCESS_KEY')
    r2_bucket = os.getenv('R2_BUCKET_NAME', 'xai-financial-data')
    
    if not all([r2_account_id, r2_access_key, r2_secret_key]):
        raise ValueError("R2 credentials must be set in .env")
    
    # Construct R2 endpoint
    endpoint_url = f"https://{r2_account_id}.r2.cloudflarestorage.com"
    
    # Create S3 client for R2
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=r2_access_key,
        aws_secret_access_key=r2_secret_key
    )
    
    # Upload file
    r2_key = os.getenv('DATASET_PATH', 'data/german_credit_data.csv')
    
    try:
        with open(file_path, 'rb') as f:
            s3_client.put_object(
                Bucket=r2_bucket,
                Key=r2_key,
                Body=f
            )
        
        print(f"✓ Dataset uploaded to R2: s3://{r2_bucket}/{r2_key}")
        
        # Verify upload
        response = s3_client.head_object(Bucket=r2_bucket, Key=r2_key)
        file_size = response['ContentLength']
        print(f"✓ File size: {file_size / 1024:.2f} KB")
        
        return True
        
    except Exception as e:
        print(f"✗ Error uploading to R2: {e}")
        raise

def main():
    """Main execution flow"""
    print("=" * 60)
    print("Dataset Download and Upload Pipeline")
    print("=" * 60)
    
    try:
        # Step 1: Download from UCI ML Repository
        csv_file = download_from_uci()
        
        # Step 2: Upload to R2
        upload_to_r2(csv_file)
        
        print("\n" + "=" * 60)
        print("✓ Pipeline completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ Pipeline failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
