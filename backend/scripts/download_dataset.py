# Script to download German Credit dataset from Kaggle and upload to Cloudflare R2

import os
import sys
from pathlib import Path
import boto3
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

def setup_kaggle():
    """Configure Kaggle API credentials"""
    kaggle_username = os.getenv('KAGGLE_USERNAME')
    kaggle_key = os.getenv('KAGGLE_KEY')
    
    if not kaggle_username or not kaggle_key:
        raise ValueError("KAGGLE_USERNAME and KAGGLE_KEY must be set in .env")
    
    # Set Kaggle credentials
    os.environ['KAGGLE_USERNAME'] = kaggle_username
    os.environ['KAGGLE_KEY'] = kaggle_key
    
    print(f"✓ Kaggle credentials configured for user: {kaggle_username}")

def download_from_kaggle():
    """Download UCI German Credit dataset from Kaggle"""
    print("\n📥 Downloading dataset from Kaggle...")
    
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        
        api = KaggleApi()
        api.authenticate()
        
        # Download German Credit dataset
        # Using the UCI repository dataset
        dataset = "uciml/german-credit"
        download_path = "./data"
        
        os.makedirs(download_path, exist_ok=True)
        
        api.dataset_download_files(
            dataset,
            path=download_path,
            unzip=True
        )
        
        print(f"✓ Dataset downloaded to {download_path}")
        
        # Find the CSV file
        csv_files = list(Path(download_path).glob("*.csv"))
        if csv_files:
            csv_file = csv_files[0]
            print(f"✓ Found dataset file: {csv_file.name}")
            return str(csv_file)
        else:
            raise FileNotFoundError("No CSV file found in downloaded data")
            
    except Exception as e:
        print(f"✗ Error downloading from Kaggle: {e}")
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
        # Step 1: Configure Kaggle
        setup_kaggle()
        
        # Step 2: Download from Kaggle
        csv_file = download_from_kaggle()
        
        # Step 3: Upload to R2
        upload_to_r2(csv_file)
        
        print("\n" + "=" * 60)
        print("✓ Pipeline completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"✗ Pipeline failed: {e}")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
