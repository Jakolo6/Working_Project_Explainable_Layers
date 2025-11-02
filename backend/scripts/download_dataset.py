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

def map_to_symbolic_codes(df):
    """
    Map UCI descriptive values to original symbolic codes (A11, A12, etc.)
    This ensures compatibility with the original German Credit dataset format.
    """
    print("\n🔄 Mapping to symbolic codes...")
    
    df = df.copy()
    
    # Mapping dictionaries based on original dataset documentation
    mappings = {
        'checking_status': {
            '< 0 DM': 'A11',
            '0 <= ... < 200 DM': 'A12',
            '>= 200 DM / salary for at least 1 year': 'A13',
            'no checking account': 'A14'
        },
        'credit_history': {
            'no credits taken/all credits paid back duly': 'A30',
            'all credits at this bank paid back duly': 'A31',
            'existing credits paid back duly till now': 'A32',
            'delay in paying off in the past': 'A33',
            'critical account/other credits existing (not at this bank)': 'A34'
        },
        'purpose': {
            'car (new)': 'A40',
            'car (used)': 'A41',
            'furniture/equipment': 'A42',
            'radio/television': 'A43',
            'domestic appliances': 'A44',
            'repairs': 'A45',
            'education': 'A46',
            'retraining': 'A48',
            'business': 'A49',
            'others': 'A410'
        },
        'savings': {
            '< 100 DM': 'A61',
            '100 <= ... < 500 DM': 'A62',
            '500 <= ... < 1000 DM': 'A63',
            '>= 1000 DM': 'A64',
            'unknown/no savings account': 'A65'
        },
        'employment_duration': {
            'unemployed': 'A71',
            '< 1 year': 'A72',
            '1 <= ... < 4 years': 'A73',
            '4 <= ... < 7 years': 'A74',
            '>= 7 years': 'A75'
        },
        'personal_status_sex': {
            'male : divorced/separated': 'A91',
            'female : divorced/separated/married': 'A92',
            'male : single': 'A93',
            'male : married/widowed': 'A94',
            'female : single': 'A95'
        },
        'other_debtors': {
            'none': 'A101',
            'co-applicant': 'A102',
            'guarantor': 'A103'
        },
        'property': {
            'real estate': 'A121',
            'building society savings agreement/life insurance': 'A122',
            'car or other': 'A123',
            'unknown / no property': 'A124'
        },
        'other_installment_plans': {
            'bank': 'A141',
            'stores': 'A142',
            'none': 'A143'
        },
        'housing': {
            'rent': 'A151',
            'own': 'A152',
            'for free': 'A153'
        },
        'job': {
            'unemployed/unskilled - non-resident': 'A171',
            'unskilled - resident': 'A172',
            'skilled employee/official': 'A173',
            'management/self-employed/highly qualified employee/officer': 'A174'
        },
        'telephone': {
            'none': 'A191',
            'yes': 'A192'
        },
        'foreign_worker': {
            'yes': 'A201',
            'no': 'A202'
        }
    }
    
    # Apply mappings
    for col, mapping in mappings.items():
        if col in df.columns:
            # Check current values
            unique_vals = df[col].unique()
            print(f"  Mapping {col}: {len(unique_vals)} unique values")
            
            # Apply mapping
            df[col] = df[col].map(mapping)
            
            # Check for unmapped values
            unmapped = df[col].isna().sum()
            if unmapped > 0:
                print(f"    ⚠️  Warning: {unmapped} unmapped values in {col}")
                print(f"    Original values: {unique_vals.tolist()}")
    
    print(f"✓ Symbolic mapping complete")
    return df

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
        
        # Map to symbolic codes (A11, A12, etc.)
        df = map_to_symbolic_codes(df)
        
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
