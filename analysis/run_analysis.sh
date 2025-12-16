#!/bin/bash
# Helper script to run the analysis with credentials from Railway environment

echo "=========================================="
echo "XAI Layers - Data Analysis Runner"
echo "=========================================="
echo ""

# Check if running from correct directory
if [ ! -f "extract_and_analyze.py" ]; then
    echo "Error: Please run this script from the analysis/ directory"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import pandas" 2>/dev/null; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
    echo ""
fi

# Check for environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "⚠️  Supabase credentials not found in environment"
    echo ""
    echo "Please provide your credentials:"
    echo ""
    read -p "Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
    read -p "Supabase Key (anon public key): " SUPABASE_KEY
    echo ""
    
    export SUPABASE_URL
    export SUPABASE_KEY
fi

echo "✓ Credentials loaded"
echo ""
echo "Starting analysis..."
echo ""

# Run the analysis
python3 extract_and_analyze.py

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ Analysis Complete!"
    echo "=========================================="
    echo ""
    echo "Check the output/ directory for results:"
    echo "  - xai_layers_analysis_ready.csv"
    echo "  - summary_tables/*.csv"
    echo "  - short_results_summary.txt"
    echo ""
else
    echo ""
    echo "✗ Analysis failed. Check the error messages above."
    exit 1
fi
