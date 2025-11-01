# Feature mappings from human-readable values to German Credit dataset symbolic codes
# Based on UCI German Credit dataset documentation

from typing import Dict, Any, Optional
from enum import Enum


class FeatureMappings:
    """
    Maps human-readable input values to symbolic codes used in German Credit dataset.
    
    All categorical features use codes (A11, A12, etc.) that must be preserved
    for correct model predictions.
    """
    
    @staticmethod
    def checking_status(balance_dm: Optional[float]) -> str:
        """
        Attribute 1: Status of existing checking account
        
        Args:
            balance_dm: Account balance in Deutsche Mark (DM)
            
        Returns:
            Symbolic code (A11-A14)
        """
        if balance_dm is None:
            return 'A14'  # No checking account
        elif balance_dm < 0:
            return 'A11'  # < 0 DM
        elif 0 <= balance_dm < 200:
            return 'A12'  # 0 <= ... < 200 DM
        else:  # >= 200
            return 'A13'  # >= 200 DM / salary assignments for at least 1 year
    
    @staticmethod
    def credit_history(history_type: str) -> str:
        """
        Attribute 3: Credit history
        
        Args:
            history_type: One of:
                - 'no_credits' - No credits taken/all credits paid back duly
                - 'all_paid' - All credits at this bank paid back duly
                - 'existing_paid' - Existing credits paid back duly till now
                - 'delay' - Delay in paying off in the past
                - 'critical' - Critical account/other credits existing (not at this bank)
                
        Returns:
            Symbolic code (A30-A34)
        """
        mapping = {
            'no_credits': 'A30',
            'all_paid': 'A31',
            'existing_paid': 'A32',
            'delay': 'A33',
            'critical': 'A34'
        }
        return mapping.get(history_type, 'A32')  # Default: existing paid
    
    @staticmethod
    def purpose(purpose_type: str) -> str:
        """
        Attribute 4: Purpose of credit
        
        Args:
            purpose_type: One of:
                - 'car_new' - New car
                - 'car_used' - Used car
                - 'furniture' - Furniture/equipment
                - 'radio_tv' - Radio/television
                - 'appliances' - Domestic appliances
                - 'repairs' - Repairs
                - 'education' - Education
                - 'retraining' - Retraining
                - 'business' - Business
                - 'others' - Others
                
        Returns:
            Symbolic code (A40-A410)
        """
        mapping = {
            'car_new': 'A40',
            'car_used': 'A41',
            'furniture': 'A42',
            'radio_tv': 'A43',
            'appliances': 'A44',
            'repairs': 'A45',
            'education': 'A46',
            'retraining': 'A48',
            'business': 'A49',
            'others': 'A410'
        }
        return mapping.get(purpose_type, 'A410')  # Default: others
    
    @staticmethod
    def savings_status(savings_dm: Optional[float]) -> str:
        """
        Attribute 6: Savings account/bonds
        
        Args:
            savings_dm: Savings amount in Deutsche Mark (DM)
            
        Returns:
            Symbolic code (A61-A65)
        """
        if savings_dm is None:
            return 'A65'  # Unknown/no savings account
        elif savings_dm < 100:
            return 'A61'  # < 100 DM
        elif 100 <= savings_dm < 500:
            return 'A62'  # 100 <= ... < 500 DM
        elif 500 <= savings_dm < 1000:
            return 'A63'  # 500 <= ... < 1000 DM
        else:  # >= 1000
            return 'A64'  # >= 1000 DM
    
    @staticmethod
    def employment(years: Optional[float]) -> str:
        """
        Attribute 7: Present employment since
        
        Args:
            years: Years of employment (can be fractional)
            
        Returns:
            Symbolic code (A71-A75)
        """
        if years is None or years == 0:
            return 'A71'  # Unemployed
        elif years < 1:
            return 'A72'  # < 1 year
        elif 1 <= years < 4:
            return 'A73'  # 1 <= ... < 4 years
        elif 4 <= years < 7:
            return 'A74'  # 4 <= ... < 7 years
        else:  # >= 7
            return 'A75'  # >= 7 years
    
    @staticmethod
    def other_parties(party_type: str) -> str:
        """
        Attribute 10: Other debtors/guarantors
        
        Args:
            party_type: One of:
                - 'none' - None
                - 'co_applicant' - Co-applicant
                - 'guarantor' - Guarantor
                
        Returns:
            Symbolic code (A101-A103)
        """
        mapping = {
            'none': 'A101',
            'co_applicant': 'A102',
            'guarantor': 'A103'
        }
        return mapping.get(party_type, 'A101')  # Default: none
    
    @staticmethod
    def property_magnitude(property_type: str) -> str:
        """
        Attribute 12: Property
        
        Args:
            property_type: One of:
                - 'real_estate' - Real estate
                - 'savings_insurance' - Building society savings agreement/life insurance
                - 'car' - Car or other (not in attribute 6)
                - 'none' - Unknown/no property
                
        Returns:
            Symbolic code (A121-A124)
        """
        mapping = {
            'real_estate': 'A121',
            'savings_insurance': 'A122',
            'car': 'A123',
            'none': 'A124'
        }
        return mapping.get(property_type, 'A124')  # Default: no property
    
    @staticmethod
    def other_payment_plans(plan_type: str) -> str:
        """
        Attribute 14: Other installment plans
        
        Args:
            plan_type: One of:
                - 'bank' - Bank
                - 'stores' - Stores
                - 'none' - None
                
        Returns:
            Symbolic code (A141-A143)
        """
        mapping = {
            'bank': 'A141',
            'stores': 'A142',
            'none': 'A143'
        }
        return mapping.get(plan_type, 'A143')  # Default: none
    
    @staticmethod
    def housing(housing_type: str) -> str:
        """
        Attribute 15: Housing
        
        Args:
            housing_type: One of:
                - 'rent' - Rent
                - 'own' - Own
                - 'free' - For free
                
        Returns:
            Symbolic code (A151-A153)
        """
        mapping = {
            'rent': 'A151',
            'own': 'A152',
            'free': 'A153'
        }
        return mapping.get(housing_type, 'A152')  # Default: own
    
    @staticmethod
    def job(job_type: str) -> str:
        """
        Attribute 17: Job
        
        Args:
            job_type: One of:
                - 'unemployed' - Unemployed/unskilled - non-resident
                - 'unskilled' - Unskilled - resident
                - 'skilled' - Skilled employee/official
                - 'management' - Management/self-employed/highly qualified employee/officer
                
        Returns:
            Symbolic code (A171-A174)
        """
        mapping = {
            'unemployed': 'A171',
            'unskilled': 'A172',
            'skilled': 'A173',
            'management': 'A174'
        }
        return mapping.get(job_type, 'A173')  # Default: skilled
    
    @staticmethod
    def own_telephone(has_telephone: bool) -> str:
        """
        Attribute 19: Telephone
        
        Args:
            has_telephone: True if registered telephone, False otherwise
            
        Returns:
            Symbolic code (A191-A192)
        """
        return 'A192' if has_telephone else 'A191'
    
    @staticmethod
    def map_user_input(user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert human-readable user input to symbolic codes expected by the model.
        
        Args:
            user_input: Dictionary with human-readable values
            
        Returns:
            Dictionary with symbolic codes and numerical values
            
        Example:
            Input: {
                'checking_balance': 150.0,
                'duration_months': 12,
                'credit_history': 'existing_paid',
                'purpose': 'car_new',
                'credit_amount': 5000,
                'savings_balance': 250.0,
                'employment_years': 4.5,
                'installment_rate': 4,
                'other_debtors': 'none',
                'residence_years': 2,
                'property': 'car',
                'age': 35,
                'other_plans': 'none',
                'housing': 'own',
                'existing_credits': 1,
                'job': 'skilled',
                'dependents': 1,
                'telephone': True
            }
            
            Output: {
                'Attribute1': 'A12',  # checking_status
                'Attribute2': 12,     # duration
                'Attribute3': 'A32',  # credit_history
                'Attribute4': 'A40',  # purpose
                'Attribute5': 5000,   # credit_amount
                'Attribute6': 'A62',  # savings_status
                'Attribute7': 'A74',  # employment
                'Attribute8': 4,      # installment_commitment
                'Attribute10': 'A101', # other_parties
                'Attribute11': 2,     # residence_since
                'Attribute12': 'A123', # property_magnitude
                'Attribute13': 35,    # age
                'Attribute14': 'A143', # other_payment_plans
                'Attribute15': 'A152', # housing
                'Attribute16': 1,     # existing_credits
                'Attribute17': 'A173', # job
                'Attribute18': 1,     # num_dependents
                'Attribute19': 'A192'  # own_telephone
            }
        """
        mapped = {}
        
        # Categorical features (with mappings)
        mapped['Attribute1'] = FeatureMappings.checking_status(
            user_input.get('checking_balance')
        )
        mapped['Attribute3'] = FeatureMappings.credit_history(
            user_input.get('credit_history', 'existing_paid')
        )
        mapped['Attribute4'] = FeatureMappings.purpose(
            user_input.get('purpose', 'others')
        )
        mapped['Attribute6'] = FeatureMappings.savings_status(
            user_input.get('savings_balance')
        )
        mapped['Attribute7'] = FeatureMappings.employment(
            user_input.get('employment_years')
        )
        mapped['Attribute10'] = FeatureMappings.other_parties(
            user_input.get('other_debtors', 'none')
        )
        mapped['Attribute12'] = FeatureMappings.property_magnitude(
            user_input.get('property', 'none')
        )
        mapped['Attribute14'] = FeatureMappings.other_payment_plans(
            user_input.get('other_plans', 'none')
        )
        mapped['Attribute15'] = FeatureMappings.housing(
            user_input.get('housing', 'own')
        )
        mapped['Attribute17'] = FeatureMappings.job(
            user_input.get('job', 'skilled')
        )
        mapped['Attribute19'] = FeatureMappings.own_telephone(
            user_input.get('telephone', False)
        )
        
        # Numerical features (direct mapping)
        mapped['Attribute2'] = int(user_input.get('duration_months', 12))
        mapped['Attribute5'] = float(user_input.get('credit_amount', 1000))
        mapped['Attribute8'] = int(user_input.get('installment_rate', 4))
        mapped['Attribute11'] = int(user_input.get('residence_years', 1))
        mapped['Attribute13'] = int(user_input.get('age', 30))
        mapped['Attribute16'] = int(user_input.get('existing_credits', 1))
        mapped['Attribute18'] = int(user_input.get('dependents', 1))
        
        return mapped
    
    @staticmethod
    def get_feature_options() -> Dict[str, Any]:
        """
        Get all available options for categorical features.
        Used by frontend to generate form inputs.
        
        Returns:
            Dictionary with feature names and their options
        """
        return {
            'credit_history': {
                'type': 'select',
                'label': 'Credit History',
                'options': [
                    {'value': 'no_credits', 'label': 'No credits taken / All paid back duly'},
                    {'value': 'all_paid', 'label': 'All credits at this bank paid back duly'},
                    {'value': 'existing_paid', 'label': 'Existing credits paid back duly till now'},
                    {'value': 'delay', 'label': 'Delay in paying off in the past'},
                    {'value': 'critical', 'label': 'Critical account / Other credits existing'}
                ]
            },
            'purpose': {
                'type': 'select',
                'label': 'Purpose of Credit',
                'options': [
                    {'value': 'car_new', 'label': 'New car'},
                    {'value': 'car_used', 'label': 'Used car'},
                    {'value': 'furniture', 'label': 'Furniture/equipment'},
                    {'value': 'radio_tv', 'label': 'Radio/television'},
                    {'value': 'appliances', 'label': 'Domestic appliances'},
                    {'value': 'repairs', 'label': 'Repairs'},
                    {'value': 'education', 'label': 'Education'},
                    {'value': 'retraining', 'label': 'Retraining'},
                    {'value': 'business', 'label': 'Business'},
                    {'value': 'others', 'label': 'Others'}
                ]
            },
            'other_debtors': {
                'type': 'select',
                'label': 'Other Debtors/Guarantors',
                'options': [
                    {'value': 'none', 'label': 'None'},
                    {'value': 'co_applicant', 'label': 'Co-applicant'},
                    {'value': 'guarantor', 'label': 'Guarantor'}
                ]
            },
            'property': {
                'type': 'select',
                'label': 'Property',
                'options': [
                    {'value': 'real_estate', 'label': 'Real estate'},
                    {'value': 'savings_insurance', 'label': 'Building society savings / Life insurance'},
                    {'value': 'car', 'label': 'Car or other'},
                    {'value': 'none', 'label': 'No property'}
                ]
            },
            'other_plans': {
                'type': 'select',
                'label': 'Other Installment Plans',
                'options': [
                    {'value': 'none', 'label': 'None'},
                    {'value': 'bank', 'label': 'Bank'},
                    {'value': 'stores', 'label': 'Stores'}
                ]
            },
            'housing': {
                'type': 'select',
                'label': 'Housing',
                'options': [
                    {'value': 'rent', 'label': 'Rent'},
                    {'value': 'own', 'label': 'Own'},
                    {'value': 'free', 'label': 'For free'}
                ]
            },
            'job': {
                'type': 'select',
                'label': 'Job',
                'options': [
                    {'value': 'unemployed', 'label': 'Unemployed / Unskilled non-resident'},
                    {'value': 'unskilled', 'label': 'Unskilled resident'},
                    {'value': 'skilled', 'label': 'Skilled employee / Official'},
                    {'value': 'management', 'label': 'Management / Self-employed / Highly qualified'}
                ]
            },
            'checking_balance': {
                'type': 'number',
                'label': 'Checking Account Balance (DM)',
                'min': -5000,
                'max': 50000,
                'step': 1,
                'nullable': True,
                'help': 'Leave empty if no checking account'
            },
            'duration_months': {
                'type': 'number',
                'label': 'Credit Duration (months)',
                'min': 1,
                'max': 72,
                'step': 1
            },
            'credit_amount': {
                'type': 'number',
                'label': 'Credit Amount (DM)',
                'min': 250,
                'max': 20000,
                'step': 50
            },
            'savings_balance': {
                'type': 'number',
                'label': 'Savings Account Balance (DM)',
                'min': 0,
                'max': 50000,
                'step': 10,
                'nullable': True,
                'help': 'Leave empty if no savings account'
            },
            'employment_years': {
                'type': 'number',
                'label': 'Employment Duration (years)',
                'min': 0,
                'max': 50,
                'step': 0.5,
                'nullable': True,
                'help': 'Enter 0 if unemployed'
            },
            'installment_rate': {
                'type': 'number',
                'label': 'Installment Rate (% of disposable income)',
                'min': 1,
                'max': 4,
                'step': 1
            },
            'residence_years': {
                'type': 'number',
                'label': 'Present Residence Since (years)',
                'min': 1,
                'max': 4,
                'step': 1
            },
            'age': {
                'type': 'number',
                'label': 'Age (years)',
                'min': 18,
                'max': 75,
                'step': 1
            },
            'existing_credits': {
                'type': 'number',
                'label': 'Number of Existing Credits',
                'min': 1,
                'max': 4,
                'step': 1
            },
            'dependents': {
                'type': 'number',
                'label': 'Number of Dependents',
                'min': 1,
                'max': 2,
                'step': 1
            },
            'telephone': {
                'type': 'boolean',
                'label': 'Registered Telephone',
                'help': 'Do you have a telephone registered under your name?'
            }
        }
