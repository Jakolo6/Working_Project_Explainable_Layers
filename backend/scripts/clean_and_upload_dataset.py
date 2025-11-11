#!/usr/bin/env python3
"""
Clean the German Credit dataset and upload to R2.
Maps symbolic codes (Axx) to human-readable values.
"""

import pandas as pd
import boto3
from io import BytesIO
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from app.config import get_settings

def create_r2_client(config):
    """Create Cloudflare R2 client"""
    return boto3.client(
        's3',
        endpoint_url=config.r2_endpoint_url,
        aws_access_key_id=config.r2_access_key_id,
        aws_secret_access_key=config.r2_secret_access_key
    )

def clean_dataset(df):
    """Apply mappings to convert Axx codes to readable values"""
    
    # Define mapping dictionaries
    map_1_checking = {
        'A11': 'negative_balance',
        'A12': '0_to_200_dm',
        'A13': '200_or_more_dm',
        'A14': 'no_checking_account',
    }
    
    map_3_history = {
        'A30': 'no_credits',
        'A31': 'all_paid',
        'A32': 'existing_paid',
        'A33': 'delay',
        'A34': 'critical',
    }
    
    map_4_purpose = {
        'A40': 'car_new', 'A41': 'car_used', 'A42': 'furniture', 'A43': 'radio_tv',
        'A44': 'appliances', 'A45': 'repairs', 'A46': 'education', 'A48': 'retraining',
        'A49': 'business', 'A410': 'others',
    }
    
    map_6_savings = {
        'A61': 'lt_100_dm', 'A62': '100_to_500_dm', 'A63': '500_to_1000_dm',
        'A64': 'ge_1000_dm', 'A65': 'unknown_no_savings',
    }
    
    map_7_employment = {
        'A71': 'unemployed', 'A72': 'lt_1_year', 'A73': '1_to_4_years',
        'A74': '4_to_7_years', 'A75': 'ge_7_years',
    }
    
    map_9_personal_status_sex = {
        'A91': 'male_divorced_separated',
        'A92': 'female_divorced_separated_married',
        'A93': 'male_single',
        'A94': 'male_married_widowed',
        'A95': 'female_single',
    }
    
    map_10_other_debtors = {
        'A101': 'none', 'A102': 'co_applicant', 'A103': 'guarantor',
    }
    
    map_12_property = {
        'A121': 'real_estate', 'A122': 'savings_agreement_or_life_insurance',
        'A123': 'car_or_other', 'A124': 'unknown_no_property',
    }
    
    map_14_other_plans = {
        'A141': 'bank', 'A142': 'stores', 'A143': 'none',
    }
    
    map_15_housing = {
        'A151': 'rent', 'A152': 'own', 'A153': 'for_free',
    }
    
    map_17_job = {
        'A171': 'unemployed_or_unskilled_non_resident',
        'A172': 'unskilled_resident',
        'A173': 'skilled_employee_official',
        'A174': 'management_self_employed_highly_qualified_officer',
    }
    
    map_19_telephone = {
        'A191': 'none', 'A192': 'yes_registered',
    }
    
    map_20_foreign_worker = {
        'A201': 'yes', 'A202': 'no',
    }
    
    # Column name mappings
    col_variants = {
        'checking_status': ['checking_status', 'Status of existing checking account', 'Attribute1'],
        'duration': ['duration', 'Duration in month', 'Attribute2'],
        'credit_history': ['credit_history', 'Credit history', 'Attribute3'],
        'purpose': ['purpose', 'Purpose', 'Attribute4'],
        'credit_amount': ['credit_amount', 'Credit amount', 'Attribute5'],
        'savings_status': ['savings_status', 'Savings account/bonds', 'Attribute6'],
        'employment': ['employment', 'Present employment since', 'Attribute7'],
        'installment_commitment': ['installment_commitment', 'Installment rate in percentage of disposable income', 'Attribute8'],
        'personal_status_sex': ['personal_status_sex', 'Personal status and sex', 'Attribute9'],
        'other_debtors': ['other_debtors', 'Other debtors / guarantors', 'Attribute10'],
        'residence_since': ['residence_since', 'Present residence since', 'Attribute11'],
        'property_magnitude': ['property_magnitude', 'Property', 'Attribute12'],
        'age': ['age', 'Age in years', 'Attribute13'],
        'other_payment_plans': ['other_payment_plans', 'Other installment plans', 'Attribute14'],
        'housing': ['housing', 'Housing', 'Attribute15'],
        'existing_credits': ['existing_credits', 'Number of existing credits at this bank', 'Attribute16'],
        'job': ['job', 'Job', 'Attribute17'],
        'num_dependents': ['num_dependents', 'Number of people being liable to provide maintenance for', 'Attribute18'],
        'own_telephone': ['own_telephone', 'Telephone', 'Attribute19'],
        'foreign_worker': ['foreign_worker', 'foreign worker', 'Attribute20'],
    }
    
    mapping_per_col = {
        'checking_status': map_1_checking,
        'credit_history': map_3_history,
        'purpose': map_4_purpose,
        'savings_status': map_6_savings,
        'employment': map_7_employment,
        'personal_status_sex': map_9_personal_status_sex,
        'other_debtors': map_10_other_debtors,
        'property_magnitude': map_12_property,
        'other_payment_plans': map_14_other_plans,
        'housing': map_15_housing,
        'job': map_17_job,
        'own_telephone': map_19_telephone,
        'foreign_worker': map_20_foreign_worker,
    }
    
    # Apply mappings and rename columns
    for target_name, variants in col_variants.items():
        current = next((c for c in variants if c in df.columns), None)
        if current is None:
            continue
        
        # Apply value mapping if exists
        if target_name in mapping_per_col:
            df[current] = df[current].astype(str).map(mapping_per_col[target_name]).fillna(df[current].astype(str))
        
        # Rename column
        if current != target_name:
            df.rename(columns={current: target_name}, inplace=True)
    
    return df

def main():
    print("=" * 80)
    print("DATASET CLEANING AND UPLOAD PIPELINE")
    print("=" * 80)
    
    # Load config
    config = get_settings()
    s3_client = create_r2_client(config)
    
    # Download raw dataset from R2
    print("\n[1/3] Downloading raw dataset from R2...")
    try:
        obj = s3_client.get_object(
            Bucket=config.r2_bucket_name,
            Key='data/german_credit_data.csv'
        )
        df = pd.read_csv(BytesIO(obj['Body'].read()))
        print(f"✓ Loaded: {df.shape[0]} rows × {df.shape[1]} columns")
        print(f"✓ Columns (before): {list(df.columns[:5])}...")
    except Exception as e:
        print(f"✗ Failed to download dataset: {e}")
        return
    
    # Clean dataset
    print("\n[2/3] Cleaning dataset (mapping Axx codes)...")
    df_clean = clean_dataset(df)
    print(f"✓ Cleaned: {df_clean.shape[0]} rows × {df_clean.shape[1]} columns")
    print(f"✓ Columns (after): {list(df_clean.columns[:5])}...")
    
    # Upload cleaned dataset to R2
    print("\n[3/3] Uploading cleaned dataset to R2...")
    csv_buffer = BytesIO()
    df_clean.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    
    s3_client.put_object(
        Bucket=config.r2_bucket_name,
        Key='data/german_credit_clean.csv',
        Body=csv_buffer.getvalue(),
        ContentType='text/csv'
    )
    print(f"✓ Uploaded to: data/german_credit_clean.csv")
    print(f"✓ File size: {len(csv_buffer.getvalue()) / 1024:.2f} KB")
    
    print("\n" + "=" * 80)
    print("✓ PIPELINE COMPLETED!")
    print("=" * 80)
    print("\nNext step: Run generate_eda_clean.py to create visualizations")

if __name__ == '__main__':
    main()
