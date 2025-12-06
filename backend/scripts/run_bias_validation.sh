#!/bin/bash

# Run Installment Rate Survivorship Bias Validation
# ==================================================

echo "Starting Installment Rate Bias Validation..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/.." || exit 1

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d "../venv" ]; then
    echo "Activating virtual environment..."
    source ../venv/bin/activate
fi

# Run the validation script
echo "Running analysis..."
echo ""
python scripts/validate_installment_bias.py

# Save output to file
echo ""
echo "Saving output to bias_validation_report.txt..."
python scripts/validate_installment_bias.py > bias_validation_report.txt 2>&1

echo ""
echo "✓ Analysis complete!"
echo "  Report saved to: bias_validation_report.txt"
