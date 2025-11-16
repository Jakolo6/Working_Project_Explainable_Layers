#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Download and clean German Credit dataset for EDA
Based on DownloadingCleaning.ipynb
"""

import pandas as pd
from pathlib import Path

def download_and_clean_data():
    """Download and clean the German Credit dataset."""
    print("Downloading German Credit dataset from UCI...")
    
    try:
        from ucimlrepo import fetch_ucirepo
    except ImportError:
        print("Installing ucimlrepo...")
        import subprocess
        subprocess.check_call(["pip3", "install", "ucimlrepo"])
        from ucimlrepo import fetch_ucirepo
    
    # Download dataset
    statlog_german_credit_data = fetch_ucirepo(id=144)
    
    # Get features and target
    X = statlog_german_credit_data.data.features
    y = statlog_german_credit_data.data.targets
    
    # Combine features and target
    if y is not None:
        if isinstance(y, pd.DataFrame):
            y_df = y
        else:
            y_df = pd.DataFrame(y, columns=['class'])
        df = pd.concat([X.reset_index(drop=True), y_df.reset_index(drop=True)], axis=1)
    else:
        df = X.copy()
    
    print(f"Downloaded dataset shape: {df.shape}")
    
    # Basic cleaning - map categorical values to human-readable format
    # (This is a simplified version - the full notebook has more detailed mapping)
    
    # Map checking account status
    checking_map = {
        'A11': 'no_checking',
        'A12': 'lt_0_dm', 
        'A13': '0_to_200_dm',
        'A14': 'ge_200_dm'
    }
    if 'checking_status' in df.columns:
        df['checking_status'] = df['checking_status'].map(checking_map).fillna(df['checking_status'])
    
    # Map credit history
    history_map = {
        'A30': 'no_credits',
        'A31': 'all_paid',
        'A32': 'existing_paid',
        'A33': 'delayed_past',
        'A34': 'critical'
    }
    if 'credit_history' in df.columns:
        df['credit_history'] = df['credit_history'].map(history_map).fillna(df['credit_history'])
    
    # Map purpose
    purpose_map = {
        'A40': 'new_car',
        'A41': 'used_car',
        'A42': 'furniture',
        'A43': 'radio_tv',
        'A44': 'domestic_appliances',
        'A45': 'repairs',
        'A46': 'education',
        'A47': 'vacation',
        'A48': 'retraining',
        'A49': 'business',
        'A410': 'others'
    }
    if 'purpose' in df.columns:
        df['purpose'] = df['purpose'].map(purpose_map).fillna(df['purpose'])
    
    # Map savings status
    savings_map = {
        'A61': 'lt_100_dm',
        'A62': '100_to_500_dm',
        'A63': '500_to_1000_dm',
        'A64': 'ge_1000_dm',
        'A65': 'unknown'
    }
    if 'savings_status' in df.columns:
        df['savings_status'] = df['savings_status'].map(savings_map).fillna(df['savings_status'])
    
    # Map employment
    employment_map = {
        'A71': 'unemployed',
        'A72': 'lt_1_year',
        'A73': '1_to_4_years',
        'A74': '4_to_7_years',
        'A75': 'ge_7_years'
    }
    if 'employment' in df.columns:
        df['employment'] = df['employment'].map(employment_map).fillna(df['employment'])
    
    # Map other debtors
    debtors_map = {
        'A101': 'none',
        'A102': 'co_applicant',
        'A103': 'guarantor'
    }
    if 'other_debtors' in df.columns:
        df['other_debtors'] = df['other_debtors'].map(debtors_map).fillna(df['other_debtors'])
    
    # Map property
    property_map = {
        'A121': 'real_estate',
        'A122': 'building_society',
        'A123': 'car_other',
        'A124': 'unknown'
    }
    if 'property_magnitude' in df.columns:
        df['property_magnitude'] = df['property_magnitude'].map(property_map).fillna(df['property_magnitude'])
    
    # Map other payment plans
    payment_map = {
        'A141': 'bank',
        'A142': 'stores',
        'A143': 'none'
    }
    if 'other_payment_plans' in df.columns:
        df['other_payment_plans'] = df['other_payment_plans'].map(payment_map).fillna(df['other_payment_plans'])
    
    # Map housing
    housing_map = {
        'A151': 'rent',
        'A152': 'own',
        'A153': 'for_free'
    }
    if 'housing' in df.columns:
        df['housing'] = df['housing'].map(housing_map).fillna(df['housing'])
    
    # Map job
    job_map = {
        'A171': 'unemployed_unskilled',
        'A172': 'unskilled_resident',
        'A173': 'skilled',
        'A174': 'management'
    }
    if 'job' in df.columns:
        df['job'] = df['job'].map(job_map).fillna(df['job'])
    
    # Map telephone
    phone_map = {
        'A191': 'none',
        'A192': 'yes'
    }
    if 'own_telephone' in df.columns:
        df['own_telephone'] = df['own_telephone'].map(phone_map).fillna(df['own_telephone'])
    
    # Map foreign worker
    foreign_map = {
        'A201': 'yes',
        'A202': 'no'
    }
    if 'foreign_worker' in df.columns:
        df['foreign_worker'] = df['foreign_worker'].map(foreign_map).fillna(df['foreign_worker'])
    
    # Save cleaned dataset
    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)
    output_path = data_dir / 'german_credit_clean.csv'
    
    df.to_csv(output_path, index=False)
    print(f"✓ Saved cleaned dataset to: {output_path.resolve()}")
    print(f"✓ Dataset shape: {df.shape}")
    print(f"✓ Columns: {list(df.columns)}")
    
    return df

if __name__ == "__main__":
    download_and_clean_data()
