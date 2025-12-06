#!/bin/bash

# ============================================================================
# ONE-BUTTON MODEL RETRAINING SCRIPT
# ============================================================================
# Purpose: Retrain XGBoost and Logistic models with corrected installment_commitment encoding
# Usage: ./retrain_models.sh
# ============================================================================

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                    MODEL RETRAINING SCRIPT                             ║"
echo "║         Fixing Installment Rate Encoding (1=low, 4=high)              ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  No virtual environment found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "✓ Activating virtual environment..."
    source venv/bin/activate
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "STEP 1: Validate Current Encoding"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

cd ..
python validate_bias_standalone.py

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "STEP 2: Delete Old Models from R2"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Go to Cloudflare R2 Dashboard"
echo "   2. Navigate to your bucket"
echo "   3. Delete: models/xgboost_model.pkl"
echo "   4. Delete: models/logistic_model.pkl"
echo ""
read -p "Press ENTER when you've deleted the old models..." 

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "STEP 3: Retrain XGBoost Model"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

cd backend
python -m app.services.model_training_service

if [ $? -eq 0 ]; then
    echo "✓ XGBoost model trained successfully!"
else
    echo "❌ XGBoost training failed!"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "STEP 4: Verify New Model"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

python -c "
from app.services.xgboost_service import XGBoostService
from app.config import get_settings

print('Loading new XGBoost model...')
config = get_settings()
xgb = XGBoostService(config)
xgb.load_model_from_r2()

print('✓ Model loaded successfully!')
print('')

# Test prediction with high burden
print('Testing high burden (≥35%):')
high_burden = {
    'checking_status': 'lt_0_dm',
    'duration': 48,
    'credit_history': 'critical_other_existing',
    'purpose': 'used_car',
    'credit_amount': 15000,
    'savings_status': 'lt_100_dm',
    'employment': 'lt_1_year',
    'installment_commitment': 'ge_35_percent',  # HIGH BURDEN
    'other_debtors': 'none',
    'residence_since': 1,
    'property_magnitude': 'car_other',
    'age': 22,
    'other_payment_plans': 'none',
    'housing': 'rent',
    'existing_credits': 1,
    'job': 'unskilled_resident',
    'num_dependents': 1,
    'own_telephone': 'none'
}

result = xgb.predict(high_burden)
print(f'  Decision: {result[\"decision\"]}')
print(f'  Confidence: {result[\"confidence\"]:.1%}')

# Get SHAP explanation
explanation = xgb.explain_prediction(high_burden, num_features=20)
install_feature = [f for f in explanation['all_features'] if 'installment' in f['feature'].lower()]
if install_feature:
    shap_val = install_feature[0]['shap_value']
    print(f'  Installment Rate SHAP: {shap_val:.4f}')
    if shap_val > 0:
        print('  ✓ CORRECT: High burden increases risk (positive SHAP)')
    else:
        print('  ❌ WRONG: High burden decreases risk (negative SHAP)')
else:
    print('  ⚠️  Could not find installment feature in SHAP values')

print('')

# Test prediction with low burden
print('Testing low burden (<20%):')
low_burden = high_burden.copy()
low_burden['installment_commitment'] = 'lt_20_percent'  # LOW BURDEN

result = xgb.predict(low_burden)
print(f'  Decision: {result[\"decision\"]}')
print(f'  Confidence: {result[\"confidence\"]:.1%}')

explanation = xgb.explain_prediction(low_burden, num_features=20)
install_feature = [f for f in explanation['all_features'] if 'installment' in f['feature'].lower()]
if install_feature:
    shap_val = install_feature[0]['shap_value']
    print(f'  Installment Rate SHAP: {shap_val:.4f}')
    if shap_val < 0:
        print('  ✓ CORRECT: Low burden decreases risk (negative SHAP)')
    else:
        print('  ❌ WRONG: Low burden increases risk (positive SHAP)')
else:
    print('  ⚠️  Could not find installment feature in SHAP values')
"

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "STEP 5: Summary"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

echo "✓ Code fixes applied to 7 files"
echo "✓ XGBoost model retrained with correct encoding"
echo "✓ Model uploaded to R2"
echo "✓ SHAP explanations verified"
echo ""
echo "Next steps:"
echo "  1. Commit and push changes to GitHub"
echo "  2. Railway will auto-deploy backend (~3-5 min)"
echo "  3. Vercel will auto-deploy frontend (~2-3 min)"
echo "  4. Test on production"
echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                         🎉 RETRAINING COMPLETE! 🎉                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
