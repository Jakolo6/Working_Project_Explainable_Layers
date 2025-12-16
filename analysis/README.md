# XAI Layers Master Thesis - Data Analysis

This directory contains the data extraction and analysis script for your master thesis evaluation of 4 XAI interfaces.

## Quick Start

### 1. Install Dependencies

```bash
cd analysis
pip install -r requirements.txt
```

### 2. Set Environment Variables

You need to provide your Supabase credentials. You can either:

**Option A: Export environment variables**
```bash
export SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_KEY='your-anon-key'
```

**Option B: Create a .env file**
```bash
# Create .env file in the analysis directory
echo "SUPABASE_URL=https://your-project.supabase.co" > .env
echo "SUPABASE_KEY=your-anon-key" >> .env
```

To find your credentials:
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" (SUPABASE_URL)
4. Copy the "anon public" key (SUPABASE_KEY)

### 3. Run the Analysis

```bash
python extract_and_analyze.py
```

## What It Does

The script performs 4 main tasks:

### Task 1: Schema Discovery
- Lists all tables and columns
- Provides a data dictionary mapping fields to database locations

### Task 2: Export Analysis-Ready CSV
Creates `xai_layers_analysis_ready.csv` with denormalized data where each row represents:
- One participant × one persona × one interface (layer)

Columns include:
- Demographics (age, gender, role_group, etc.)
- Pre-experiment questionnaire data
- Persona and decision outcome
- Per-layer ratings (understanding, communicability, cognitive load)
- Time spent per layer
- Post-persona questionnaire responses
- Free-text comments

### Task 3: Summary Statistics
Creates CSV files in `summary_tables/`:

- **A_by_interface.csv**: Descriptive stats by interface (mean, std, median)
- **B_by_outcome.csv**: Stats split by decision outcome (approved vs rejected)
- **C_by_role_group.csv**: Stats split by role (bank_clerk vs non_clerk)
- **D_layer_preferences.csv**: Counts for most helpful/trusted/best layers
- **E_statistical_tests.csv**: Friedman tests + pairwise Wilcoxon with effect sizes

### Task 4: Quality Checks
Reports on:
- Missing values
- Time outliers (using IQR method)
- Incomplete participant flows
- Completion status

## Output Files

After running, you'll find in the `output/` directory:

```
output/
├── xai_layers_analysis_ready.csv    # Main denormalized dataset
├── short_results_summary.txt         # Plain-language summary
└── summary_tables/
    ├── A_by_interface.csv
    ├── B_by_outcome.csv
    ├── C_by_role_group.csv
    ├── D_layer_preferences.csv
    └── E_statistical_tests.csv
```

## Data Dictionary

### Key Mappings

**Participant Identifiers:**
- `session_id` / `participant_id` → `sessions.session_id`

**Demographics:**
- `age` → `sessions.age`
- `gender` → `sessions.gender`
- `financial_relationship` → `sessions.financial_relationship`
- `ai_trust_instinct` → `sessions.ai_trust_instinct`
- `ai_fairness_stance` → `sessions.ai_fairness_stance`
- `preferred_explanation_style` → `sessions.preferred_explanation_style`

**Persona & Decision:**
- `persona_id` → `predictions.persona_id` (elderly-woman, young-entrepreneur)
- `decision_outcome` → `predictions.decision` (approved, rejected)

**Per-Layer Ratings:**
- `understanding_rating` → `layer_ratings.understanding_rating` (1-5)
- `communicability_rating` → `layer_ratings.communicability_rating` (1-5)
- `cognitive_load_rating` → `layer_ratings.cognitive_load_rating` (1-5, lower is better)
- `time_spent_seconds` → `layer_ratings.time_spent_seconds`

**Post-Persona Questionnaire:**
- `most_helpful_layer` → `post_questionnaires.most_helpful_layer`
- `most_trusted_layer` → `post_questionnaires.most_trusted_layer`
- `best_for_customer` → `post_questionnaires.best_for_customer`
- `overall_intuitiveness` → `post_questionnaires.overall_intuitiveness` (1-5)
- `ai_usefulness` → `post_questionnaires.ai_usefulness` (1-5)

## Interface Mapping

- **Layer 1** = SHAP Table (baseline)
- **Layer 2** = Visual Dashboard
- **Layer 3** = Narrative Explanation
- **Layer 4** = Counterfactual

## Statistical Tests

The script performs:

1. **Friedman Test**: Non-parametric within-subjects test across all 4 layers
2. **Wilcoxon Signed-Rank Tests**: Pairwise comparisons between layers (if Friedman is significant)
3. **Effect Sizes**: Calculated as r = Z / √N

Significance levels:
- `***` p < 0.001
- `**` p < 0.01
- `*` p < 0.05
- `ns` not significant

## Troubleshooting

**Error: "Please set SUPABASE_URL and SUPABASE_KEY"**
- Make sure you've exported the environment variables or created a .env file

**Error: Connection failed**
- Check that your Supabase URL and key are correct
- Verify your internet connection
- Ensure your Supabase project is active

**Warning: Missing values**
- Check the quality checks section in the output
- Some missing values are expected (e.g., optional comments)

## For SPSS/R Analysis

The main CSV file (`xai_layers_analysis_ready.csv`) is ready to import into SPSS or R for further analysis:

```r
# R example
library(tidyverse)
data <- read_csv("output/xai_layers_analysis_ready.csv")

# Friedman test
friedman.test(understanding_rating ~ layer_number | session_id, data = data)
```

```python
# Python example
import pandas as pd
df = pd.read_csv("output/xai_layers_analysis_ready.csv")

# Descriptive stats
df.groupby('interface_id')['understanding_rating'].describe()
```

## Contact

For questions about the analysis script, refer to the master thesis documentation or contact the researcher.
