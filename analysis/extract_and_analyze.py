#!/usr/bin/env python3
"""
XAI Layers Master Thesis - Data Extraction and Analysis Script
Connects to Supabase, exports analysis-ready CSV, and computes summary statistics
"""

import os
import sys
import pandas as pd
import numpy as np
from supabase import create_client, Client
from scipy import stats
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURATION
# ============================================================================

# You need to set these environment variables or edit them here:
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Please set SUPABASE_URL and SUPABASE_KEY environment variables")
    print("Example:")
    print("  export SUPABASE_URL='https://your-project.supabase.co'")
    print("  export SUPABASE_KEY='your-anon-key'")
    sys.exit(1)

# Output directory
OUTPUT_DIR = Path(__file__).parent / 'output'
OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================================================
# TASK 1: SCHEMA DISCOVERY & DATA DICTIONARY
# ============================================================================

def print_data_dictionary():
    """Print data dictionary mapping required fields to table.column"""
    print("\n" + "="*80)
    print("TASK 1: DATA DICTIONARY")
    print("="*80)
    
    dictionary = {
        "Participant/Session Identifiers": {
            "session_id": "sessions.session_id (TEXT, unique)",
            "participant_id": "sessions.session_id (same as session_id)"
        },
        "Demographics & Pre-Experiment": {
            "age": "sessions.age (INTEGER)",
            "gender": "sessions.gender (TEXT)",
            "financial_relationship": "sessions.financial_relationship (TEXT)",
            "ai_trust_instinct": "sessions.ai_trust_instinct (TEXT)",
            "ai_fairness_stance": "sessions.ai_fairness_stance (TEXT)",
            "preferred_explanation_style": "sessions.preferred_explanation_style (TEXT)"
        },
        "Persona & Decision": {
            "persona_id": "predictions.persona_id (TEXT: 'elderly-woman', 'young-entrepreneur')",
            "decision_outcome": "predictions.decision (TEXT: 'approved', 'rejected')",
            "probability": "predictions.probability (DECIMAL)"
        },
        "Per-Layer Ratings": {
            "layer_number": "layer_ratings.layer_number (INTEGER: 1-4)",
            "layer_name": "layer_ratings.layer_name (TEXT)",
            "understanding_rating": "layer_ratings.understanding_rating (INTEGER: 1-5)",
            "communicability_rating": "layer_ratings.communicability_rating (INTEGER: 1-5)",
            "cognitive_load_rating": "layer_ratings.cognitive_load_rating (INTEGER: 1-5, lower=better)",
            "time_spent_seconds": "layer_ratings.time_spent_seconds (INTEGER)",
            "layer_comment": "layer_ratings.comment (TEXT)"
        },
        "Post-Persona Questionnaire": {
            "most_helpful_layer": "post_questionnaires.most_helpful_layer (TEXT: 'layer_1' to 'layer_4')",
            "most_trusted_layer": "post_questionnaires.most_trusted_layer (TEXT)",
            "best_for_customer": "post_questionnaires.best_for_customer (TEXT)",
            "overall_intuitiveness": "post_questionnaires.overall_intuitiveness (INTEGER: 1-5)",
            "ai_usefulness": "post_questionnaires.ai_usefulness (INTEGER: 1-5)",
            "improvement_suggestions": "post_questionnaires.improvement_suggestions (TEXT)"
        }
    }
    
    for category, fields in dictionary.items():
        print(f"\n{category}:")
        for field, mapping in fields.items():
            print(f"  • {field:30s} → {mapping}")
    
    print("\n" + "="*80 + "\n")

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def connect_to_supabase() -> Client:
    """Connect to Supabase database"""
    print("Connecting to Supabase...")
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✓ Connected successfully\n")
        return client
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        sys.exit(1)

# ============================================================================
# TASK 2: EXPORT DENORMALIZED CSV
# ============================================================================

def extract_denormalized_data(client: Client) -> pd.DataFrame:
    """
    Extract denormalized data where each row = one participant × one persona × one layer
    """
    print("="*80)
    print("TASK 2: EXTRACTING DENORMALIZED DATA")
    print("="*80)
    
    # Fetch all tables
    print("Fetching sessions...")
    sessions_response = client.table('sessions').select('*').execute()
    sessions = pd.DataFrame(sessions_response.data)
    print(f"  → {len(sessions)} sessions")
    
    print("Fetching predictions...")
    predictions_response = client.table('predictions').select('*').execute()
    predictions = pd.DataFrame(predictions_response.data)
    print(f"  → {len(predictions)} predictions")
    
    print("Fetching layer_ratings...")
    ratings_response = client.table('layer_ratings').select('*').execute()
    ratings = pd.DataFrame(ratings_response.data)
    print(f"  → {len(ratings)} layer ratings")
    
    print("Fetching post_questionnaires...")
    questionnaires_response = client.table('post_questionnaires').select('*').execute()
    questionnaires = pd.DataFrame(questionnaires_response.data)
    print(f"  → {len(questionnaires)} post-questionnaires\n")
    
    # Merge data
    print("Merging tables...")
    
    # Start with layer_ratings as base (one row per layer)
    df = ratings.copy()
    
    # Add session data
    df = df.merge(
        sessions[['session_id', 'age', 'gender', 'financial_relationship', 
                  'ai_trust_instinct', 'ai_fairness_stance', 'preferred_explanation_style',
                  'completed', 'created_at']],
        on='session_id',
        how='left'
    )
    
    # Add prediction data (decision outcome)
    df = df.merge(
        predictions[['session_id', 'persona_id', 'decision', 'probability']],
        on=['session_id', 'persona_id'],
        how='left'
    )
    
    # Add post-questionnaire data
    df = df.merge(
        questionnaires[['session_id', 'persona_id', 'most_helpful_layer', 'most_trusted_layer',
                       'best_for_customer', 'overall_intuitiveness', 'ai_usefulness',
                       'improvement_suggestions']],
        on=['session_id', 'persona_id'],
        how='left',
        suffixes=('', '_post')
    )
    
    # Rename and reorder columns for analysis
    df = df.rename(columns={
        'decision': 'decision_outcome',
        'comment': 'layer_comment_text',
        'improvement_suggestions': 'post_persona_suggestion_text'
    })
    
    # Add interface_id (layer_number maps to interface)
    df['interface_id'] = df['layer_number'].map({
        1: 'Layer1_SHAP_Table',
        2: 'Layer2_Visual_Dashboard', 
        3: 'Layer3_Narrative',
        4: 'Layer4_Counterfactual'
    })
    
    # Add participant_id (same as session_id)
    df['participant_id'] = df['session_id']
    
    # Add role_group based on financial_relationship
    df['role_group'] = df['financial_relationship'].apply(
        lambda x: 'bank_clerk' if x in ['bank_employee', 'financial_advisor'] else 'non_clerk'
    )
    
    # Add language (assuming all German for now, adjust if needed)
    df['language'] = 'de'
    
    # Calculate interface_order (order in which participant saw this layer)
    df = df.sort_values(['session_id', 'persona_id', 'created_at'])
    df['interface_order'] = df.groupby(['session_id', 'persona_id']).cumcount() + 1
    
    # Select and order final columns
    final_columns = [
        'session_id', 'participant_id', 'role_group', 'language', 'age', 'gender',
        'preferred_explanation_style', 'ai_trust_instinct', 'ai_fairness_stance',
        'persona_id', 'decision_outcome', 'probability',
        'interface_id', 'layer_number', 'layer_name', 'interface_order',
        'understanding_rating', 'communicability_rating', 'cognitive_load_rating',
        'time_spent_seconds',
        'most_helpful_layer', 'most_trusted_layer', 'best_for_customer',
        'overall_intuitiveness', 'ai_usefulness',
        'layer_comment_text', 'post_persona_suggestion_text',
        'completed', 'created_at'
    ]
    
    df = df[final_columns]
    
    print(f"✓ Merged data: {len(df)} rows × {len(df.columns)} columns\n")
    
    return df

# ============================================================================
# TASK 3: SUMMARY STATISTICS
# ============================================================================

def compute_descriptive_stats(df: pd.DataFrame, output_dir: Path):
    """Compute descriptive statistics by interface"""
    print("="*80)
    print("TASK 3: COMPUTING SUMMARY STATISTICS")
    print("="*80)
    
    summary_dir = output_dir / 'summary_tables'
    summary_dir.mkdir(exist_ok=True)
    
    results_summary = []
    
    # A) Overall by interface
    print("\nA) Descriptive statistics by interface...")
    by_interface = df.groupby('interface_id').agg({
        'understanding_rating': ['count', 'mean', 'std', 'median'],
        'communicability_rating': ['mean', 'std', 'median'],
        'cognitive_load_rating': ['mean', 'std', 'median'],
        'time_spent_seconds': ['mean', 'std', 'median', 'min', 'max']
    }).round(2)
    by_interface.columns = ['_'.join(col).strip() for col in by_interface.columns.values]
    by_interface.to_csv(summary_dir / 'A_by_interface.csv')
    print(f"  → Saved to A_by_interface.csv")
    results_summary.append(f"\n## Overall by Interface\n{by_interface.to_string()}")
    
    # B) By persona outcome
    print("B) Statistics by persona outcome (approved vs rejected)...")
    by_outcome = df.groupby(['interface_id', 'decision_outcome']).agg({
        'understanding_rating': ['count', 'mean', 'std'],
        'communicability_rating': ['mean', 'std'],
        'cognitive_load_rating': ['mean', 'std'],
        'time_spent_seconds': ['mean', 'std']
    }).round(2)
    by_outcome.columns = ['_'.join(col).strip() for col in by_outcome.columns.values]
    by_outcome.to_csv(summary_dir / 'B_by_outcome.csv')
    print(f"  → Saved to B_by_outcome.csv")
    results_summary.append(f"\n## By Decision Outcome\n{by_outcome.to_string()}")
    
    # C) By role group
    print("C) Statistics by role group (bank_clerk vs non_clerk)...")
    by_role = df.groupby(['interface_id', 'role_group']).agg({
        'understanding_rating': ['count', 'mean', 'std'],
        'communicability_rating': ['mean', 'std'],
        'cognitive_load_rating': ['mean', 'std'],
        'time_spent_seconds': ['mean', 'std']
    }).round(2)
    by_role.columns = ['_'.join(col).strip() for col in by_role.columns.values]
    by_role.to_csv(summary_dir / 'C_by_role_group.csv')
    print(f"  → Saved to C_by_role_group.csv")
    results_summary.append(f"\n## By Role Group\n{by_role.to_string()}")
    
    # D) Layer preferences
    print("D) Layer preference counts...")
    preferences = pd.DataFrame({
        'most_helpful': df.groupby('most_helpful_layer')['session_id'].nunique(),
        'most_trusted': df.groupby('most_trusted_layer')['session_id'].nunique(),
        'best_for_customer': df.groupby('best_for_customer')['session_id'].nunique()
    }).fillna(0).astype(int)
    preferences.to_csv(summary_dir / 'D_layer_preferences.csv')
    print(f"  → Saved to D_layer_preferences.csv")
    results_summary.append(f"\n## Layer Preferences\n{preferences.to_string()}")
    
    # E) Statistical tests
    print("E) Nonparametric tests (Friedman + Wilcoxon)...")
    test_results = perform_statistical_tests(df)
    test_results.to_csv(summary_dir / 'E_statistical_tests.csv')
    print(f"  → Saved to E_statistical_tests.csv")
    results_summary.append(f"\n## Statistical Tests\n{test_results.to_string()}")
    
    print("\n✓ All summary tables saved\n")
    
    return results_summary

def perform_statistical_tests(df: pd.DataFrame) -> pd.DataFrame:
    """Perform Friedman test and pairwise Wilcoxon tests"""
    results = []
    
    # Prepare data in wide format for within-subject tests
    metrics = ['understanding_rating', 'communicability_rating', 'cognitive_load_rating', 'time_spent_seconds']
    
    for metric in metrics:
        # Pivot to wide format: rows=participants, columns=layers
        wide = df.pivot_table(
            index='session_id',
            columns='layer_number',
            values=metric,
            aggfunc='mean'
        ).dropna()
        
        if len(wide) < 3:
            continue
        
        # Friedman test
        try:
            stat, p_value = stats.friedmanchisquare(*[wide[col] for col in wide.columns])
            results.append({
                'metric': metric,
                'test': 'Friedman',
                'statistic': round(stat, 3),
                'p_value': round(p_value, 4),
                'significant': '***' if p_value < 0.001 else '**' if p_value < 0.01 else '*' if p_value < 0.05 else 'ns'
            })
            
            # Pairwise Wilcoxon if Friedman is significant
            if p_value < 0.05:
                layers = list(wide.columns)
                for i in range(len(layers)):
                    for j in range(i+1, len(layers)):
                        stat_w, p_w = stats.wilcoxon(wide[layers[i]], wide[layers[j]])
                        # Calculate effect size (r = Z / sqrt(N))
                        n = len(wide)
                        z = stats.norm.ppf(1 - p_w/2)
                        r = abs(z) / np.sqrt(n)
                        
                        results.append({
                            'metric': metric,
                            'test': f'Wilcoxon Layer{layers[i]} vs Layer{layers[j]}',
                            'statistic': round(stat_w, 3),
                            'p_value': round(p_w, 4),
                            'effect_size_r': round(r, 3),
                            'significant': '***' if p_w < 0.001 else '**' if p_w < 0.01 else '*' if p_w < 0.05 else 'ns'
                        })
        except Exception as e:
            print(f"  Warning: Could not compute {metric} tests: {e}")
    
    return pd.DataFrame(results)

# ============================================================================
# TASK 4: QUALITY CHECKS
# ============================================================================

def perform_quality_checks(df: pd.DataFrame) -> list:
    """Check for missing values, outliers, and incomplete flows"""
    print("="*80)
    print("TASK 4: QUALITY CHECKS")
    print("="*80)
    
    checks = []
    
    # Missing values
    print("\n1. Missing values check...")
    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(1)
    missing_report = pd.DataFrame({'count': missing, 'percentage': missing_pct})
    missing_report = missing_report[missing_report['count'] > 0].sort_values('count', ascending=False)
    
    if len(missing_report) > 0:
        print(f"  ⚠ Found missing values in {len(missing_report)} columns:")
        print(missing_report.to_string())
        checks.append(f"\n## Missing Values\n{missing_report.to_string()}")
    else:
        print("  ✓ No missing values")
        checks.append("\n## Missing Values\n✓ No missing values found")
    
    # Time outliers
    print("\n2. Time outliers check...")
    q1 = df['time_spent_seconds'].quantile(0.25)
    q3 = df['time_spent_seconds'].quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - 3 * iqr
    upper_bound = q3 + 3 * iqr
    
    outliers = df[(df['time_spent_seconds'] < lower_bound) | (df['time_spent_seconds'] > upper_bound)]
    print(f"  → IQR method: {len(outliers)} outliers (< {lower_bound:.0f}s or > {upper_bound:.0f}s)")
    
    if len(outliers) > 0:
        outlier_summary = outliers.groupby('interface_id')['time_spent_seconds'].agg(['count', 'min', 'max'])
        print(outlier_summary.to_string())
        checks.append(f"\n## Time Outliers\n{outlier_summary.to_string()}")
    else:
        checks.append("\n## Time Outliers\n✓ No extreme outliers detected")
    
    # Incomplete flows
    print("\n3. Incomplete participant flows...")
    expected_ratings_per_session = 8  # 2 personas × 4 layers
    
    ratings_per_session = df.groupby('session_id').size()
    incomplete = ratings_per_session[ratings_per_session < expected_ratings_per_session]
    
    print(f"  → {len(incomplete)} sessions with incomplete data:")
    if len(incomplete) > 0:
        incomplete_df = pd.DataFrame({
            'session_id': incomplete.index,
            'ratings_count': incomplete.values,
            'missing': expected_ratings_per_session - incomplete.values
        })
        print(incomplete_df.to_string(index=False))
        checks.append(f"\n## Incomplete Sessions\n{incomplete_df.to_string(index=False)}")
    else:
        print("  ✓ All sessions complete")
        checks.append("\n## Incomplete Sessions\n✓ All sessions have complete data")
    
    # Completion status
    print("\n4. Completion status...")
    completed_count = df[df['completed'] == True]['session_id'].nunique()
    total_count = df['session_id'].nunique()
    print(f"  → {completed_count}/{total_count} sessions marked as completed ({completed_count/total_count*100:.1f}%)")
    checks.append(f"\n## Completion Status\n{completed_count}/{total_count} sessions completed ({completed_count/total_count*100:.1f}%)")
    
    print("\n✓ Quality checks complete\n")
    
    return checks

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function"""
    print("\n" + "="*80)
    print("XAI LAYERS MASTER THESIS - DATA EXTRACTION & ANALYSIS")
    print("="*80 + "\n")
    
    # Task 1: Print data dictionary
    print_data_dictionary()
    
    # Connect to database
    client = connect_to_supabase()
    
    # Task 2: Extract denormalized data
    df = extract_denormalized_data(client)
    
    # Save main CSV
    main_csv = OUTPUT_DIR / 'xai_layers_analysis_ready.csv'
    df.to_csv(main_csv, index=False)
    print(f"✓ Main CSV saved: {main_csv}")
    print(f"  → {len(df)} rows × {len(df.columns)} columns\n")
    
    # Task 3: Compute summary statistics
    summary_results = compute_descriptive_stats(df, OUTPUT_DIR)
    
    # Task 4: Quality checks
    quality_results = perform_quality_checks(df)
    
    # Save combined summary
    summary_file = OUTPUT_DIR / 'short_results_summary.txt'
    with open(summary_file, 'w') as f:
        f.write("="*80 + "\n")
        f.write("XAI LAYERS MASTER THESIS - RESULTS SUMMARY\n")
        f.write("="*80 + "\n")
        f.write(f"\nDataset: {len(df)} observations from {df['session_id'].nunique()} participants\n")
        f.write(f"Interfaces: {df['interface_id'].nunique()} (Layers 1-4)\n")
        f.write(f"Personas: {df['persona_id'].nunique()} (Maria, Jonas)\n")
        
        for section in summary_results:
            f.write(section)
        
        f.write("\n\n" + "="*80 + "\n")
        f.write("QUALITY CHECKS\n")
        f.write("="*80 + "\n")
        
        for check in quality_results:
            f.write(check)
    
    print(f"✓ Summary saved: {summary_file}\n")
    
    # Final summary
    print("="*80)
    print("DELIVERABLES COMPLETE")
    print("="*80)
    print(f"\n📁 Output directory: {OUTPUT_DIR}")
    print(f"\n📊 Files created:")
    print(f"  1. xai_layers_analysis_ready.csv ({len(df)} rows)")
    print(f"  2. summary_tables/A_by_interface.csv")
    print(f"  3. summary_tables/B_by_outcome.csv")
    print(f"  4. summary_tables/C_by_role_group.csv")
    print(f"  5. summary_tables/D_layer_preferences.csv")
    print(f"  6. summary_tables/E_statistical_tests.csv")
    print(f"  7. short_results_summary.txt")
    print("\n✓ Analysis complete! Ready for thesis evaluation.\n")

if __name__ == '__main__':
    main()
