#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Convert raw German Credit data to cleaned format
"""

import pandas as pd
from pathlib import Path

def convert_raw_data():
    """Convert raw German Credit data to cleaned format."""
    print("Converting raw German Credit data...")
    
    # Column names for the German Credit dataset
    columns = [
        'checking_status', 'duration', 'credit_history', 'purpose', 'credit_amount',
        'savings_status', 'employment', 'installment_commitment', 'personal_status',
        'other_debtors', 'residence_since', 'property_magnitude', 'age',
        'other_payment_plans', 'housing', 'existing_credits', 'job',
        'num_dependents', 'own_telephone', 'foreign_worker', 'class'
    ]
    
    # Read the raw data
    raw_path = Path('data/german_credit_raw.csv')
    if not raw_path.exists():
        print(f"Error: {raw_path} not found!")
        return None
    
    # Read with space separator (German Credit data uses spaces)
    df = pd.read_csv(raw_path, sep=' ', header=None, names=columns)
    print(f"Loaded raw data: {df.shape}")
    
    # Map categorical values to human-readable format
    print("Mapping categorical values...")
    
    # Checking account status
    checking_map = {
        'A11': 'no_checking',
        'A12': 'lt_0_dm', 
        'A13': '0_to_200_dm',
        'A14': 'ge_200_dm'
    }
    df['checking_status'] = df['checking_status'].map(checking_map)
    
    # Credit history
    history_map = {
        'A30': 'no_credits',
        'A31': 'all_paid',
        'A32': 'existing_paid',
        'A33': 'delayed_past',
        'A34': 'critical'
    }
    df['credit_history'] = df['credit_history'].map(history_map)
    
    # Purpose
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
    df['purpose'] = df['purpose'].map(purpose_map)
    
    # Savings status
    savings_map = {
        'A61': 'lt_100_dm',
        'A62': '100_to_500_dm',
        'A63': '500_to_1000_dm',
        'A64': 'ge_1000_dm',
        'A65': 'unknown'
    }
    df['savings_status'] = df['savings_status'].map(savings_map)
    
    # Employment
    employment_map = {
        'A71': 'unemployed',
        'A72': 'lt_1_year',
        'A73': '1_to_4_years',
        'A74': '4_to_7_years',
        'A75': 'ge_7_years'
    }
    df['employment'] = df['employment'].map(employment_map)
    
    # Personal status (we'll keep this but not use it for modeling due to bias)
    personal_map = {
        'A91': 'male_divorced',
        'A92': 'female_divorced',
        'A93': 'male_single',
        'A94': 'male_married',
        'A95': 'female_single'
    }
    df['personal_status'] = df['personal_status'].map(personal_map)
    
    # Other debtors
    debtors_map = {
        'A101': 'none',
        'A102': 'co_applicant',
        'A103': 'guarantor'
    }
    df['other_debtors'] = df['other_debtors'].map(debtors_map)
    
    # Property
    property_map = {
        'A121': 'real_estate',
        'A122': 'building_society',
        'A123': 'car_other',
        'A124': 'unknown'
    }
    df['property_magnitude'] = df['property_magnitude'].map(property_map)
    
    # Other payment plans
    payment_map = {
        'A141': 'bank',
        'A142': 'stores',
        'A143': 'none'
    }
    df['other_payment_plans'] = df['other_payment_plans'].map(payment_map)
    
    # Housing
    housing_map = {
        'A151': 'rent',
        'A152': 'own',
        'A153': 'for_free'
    }
    df['housing'] = df['housing'].map(housing_map)
    
    # Job
    job_map = {
        'A171': 'unemployed_unskilled',
        'A172': 'unskilled_resident',
        'A173': 'skilled',
        'A174': 'management'
    }
    df['job'] = df['job'].map(job_map)
    
    # Telephone
    phone_map = {
        'A191': 'none',
        'A192': 'yes'
    }
    df['own_telephone'] = df['own_telephone'].map(phone_map)
    
    # Foreign worker
    foreign_map = {
        'A201': 'yes',
        'A202': 'no'
    }
    df['foreign_worker'] = df['foreign_worker'].map(foreign_map)
    
    # Remove personal_status and foreign_worker to avoid bias
    df = df.drop(['personal_status', 'foreign_worker'], axis=1)
    
    print("Mapping completed!")
    print(f"Final dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Save cleaned dataset
    output_path = Path('data/german_credit_clean.csv')
    df.to_csv(output_path, index=False)
    print(f"✓ Saved cleaned dataset to: {output_path.resolve()}")
    
    return df

if __name__ == "__main__":
    convert_raw_data()
