# 🚀 Quick Start Guide - Thesis Data Analysis

## TL;DR - Get Your Data in 3 Steps

### Step 1: Get Your Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 2: Run the Analysis

```bash
cd analysis
./run_analysis.sh
```

When prompted, paste your Supabase URL and key.

### Step 3: Get Your Results

Check the `output/` folder:
- ✅ `xai_layers_analysis_ready.csv` - Your main dataset
- ✅ `summary_tables/` - All statistical tables
- ✅ `short_results_summary.txt` - Plain-language summary

---

## What You Get

### 📊 Main Dataset (`xai_layers_analysis_ready.csv`)
**Format:** One row per participant × persona × layer

**Columns include:**
- Demographics (age, gender, role_group)
- Pre-experiment data (AI trust, preferred style, etc.)
- Persona info (Maria/Jonas, approved/rejected)
- **Layer ratings** (understanding, communicability, cognitive load)
- **Time spent** per layer
- Post-persona preferences (most helpful, most trusted, best for customer)
- Free-text comments

**Perfect for:** SPSS, R, Python, Excel

### 📈 Summary Tables (`summary_tables/`)

1. **A_by_interface.csv** - Overall stats for each layer
   - Mean, std, median for all ratings
   - Time statistics

2. **B_by_outcome.csv** - Split by decision (approved vs rejected)
   - Do ratings differ based on AI decision?

3. **C_by_role_group.csv** - Split by role (bank clerk vs non-clerk)
   - Do banking professionals rate differently?

4. **D_layer_preferences.csv** - Preference counts
   - Which layer was most helpful/trusted/best?

5. **E_statistical_tests.csv** - Statistical tests
   - Friedman test (overall difference across layers)
   - Pairwise Wilcoxon tests with effect sizes
   - Significance markers (*, **, ***)

### 📝 Results Summary (`short_results_summary.txt`)
Plain-language summary of:
- Dataset overview
- Key statistics
- Statistical test results
- Quality checks

---

## Alternative: Manual Setup

If the shell script doesn't work:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set credentials
export SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_KEY='your-anon-key'

# 3. Run
python extract_and_analyze.py
```

---

## For Interactive Analysis

Want to explore data with visualizations?

```bash
# Install Jupyter
pip install jupyter matplotlib seaborn

# Open notebook
jupyter notebook interactive_analysis.ipynb
```

The notebook includes:
- 📊 Box plots and bar charts
- 🎨 Correlation heatmaps
- 📈 Comparison visualizations
- 🔍 Custom analysis cells

---

## Troubleshooting

### "No module named 'pandas'"
```bash
pip install -r requirements.txt
```

### "Connection failed"
- Double-check your Supabase URL and key
- Make sure they're exported as environment variables
- Verify your Supabase project is active

### "No data found"
- Check that participants have completed the experiment
- Verify data exists in your Supabase tables

---

## Data Dictionary Quick Reference

| What You Need | Where It Lives |
|---------------|----------------|
| Participant ID | `sessions.session_id` |
| Demographics | `sessions.age`, `sessions.gender`, etc. |
| Persona (Maria/Jonas) | `predictions.persona_id` |
| AI Decision | `predictions.decision` |
| Understanding Rating | `layer_ratings.understanding_rating` |
| Communicability Rating | `layer_ratings.communicability_rating` |
| Cognitive Load | `layer_ratings.cognitive_load_rating` |
| Time Spent | `layer_ratings.time_spent_seconds` |
| Most Helpful Layer | `post_questionnaires.most_helpful_layer` |
| Most Trusted Layer | `post_questionnaires.most_trusted_layer` |

---

## Layer Mapping

- **Layer 1** = SHAP Table (baseline)
- **Layer 2** = Visual Dashboard
- **Layer 3** = Narrative Explanation
- **Layer 4** = Counterfactual

---

## Ready for Thesis!

The exported CSV is ready to use in:
- ✅ SPSS (File → Import Data)
- ✅ R (`read_csv()`)
- ✅ Python (`pd.read_csv()`)
- ✅ Excel (Open directly)

All statistical tests are pre-computed in the summary tables.

---

## Need Help?

1. Check `README.md` for detailed documentation
2. Review the data dictionary section
3. Look at example queries in the schema file
4. Check quality checks in the output summary

Good luck with your thesis! 🎓
