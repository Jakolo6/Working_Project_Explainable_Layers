#!/usr/bin/env python3
"""
XAI Layers Master Thesis - Data Extraction via API
Uses the existing backend API instead of direct Supabase connection
"""

import requests
import pandas as pd
import numpy as np
from scipy import stats
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURATION
# ============================================================================

API_URL = 'https://workingprojectexplainablelayers-production.up.railway.app'
OUTPUT_DIR = Path(__file__).parent / 'output'
OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================================================
# DATA EXTRACTION VIA API
# ============================================================================

def fetch_research_results():
    """Fetch aggregated research results from API"""
    print("Fetching research results from API...")
    try:
        response = requests.get(f'{API_URL}/api/v1/experiment/research-results', timeout=30)
        response.raise_for_status()
        data = response.json()
        print(f"✓ Fetched research data")
        return data
    except Exception as e:
        print(f"✗ Error fetching research results: {e}")
        return None

def fetch_all_sessions(research_data):
    """Fetch detailed data for all sessions"""
    print("\nFetching detailed session data...")
    
    session_ids = [s['session_id'] for s in research_data.get('session_data', [])]
    print(f"Found {len(session_ids)} sessions")
    
    all_data = []
    failed = []
    
    for i, session_id in enumerate(session_ids, 1):
        print(f"  [{i}/{len(session_ids)}] Fetching {session_id[:20]}...", end=' ')
        try:
            response = requests.get(
                f'{API_URL}/api/v1/experiment/participant/{session_id}',
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                all_data.append(data)
                print("✓")
            elif response.status_code == 404:
                print("✗ Not found")
                failed.append(session_id)
            else:
                print(f"✗ Error {response.status_code}")
                failed.append(session_id)
        except Exception as e:
            print(f"✗ {str(e)[:50]}")
            failed.append(session_id)
    
    print(f"\n✓ Successfully fetched {len(all_data)}/{len(session_ids)} sessions")
    if failed:
        print(f"⚠ Failed to fetch {len(failed)} sessions")
    
    return all_data

# ============================================================================
# DATA TRANSFORMATION
# ============================================================================

def transform_to_denormalized(session_data_list):
    """Transform API data to denormalized format"""
    print("\nTransforming data to analysis format...")
    
    rows = []
    
    for session in session_data_list:
        session_id = session['session_id']
        demographics = session.get('demographics', {})
        session_info = session.get('session_info', {})
        
        # Process each layer rating
        for rating in session.get('layer_ratings', []):
            # Get post-questionnaire data for this persona
            post_q = session.get('post_questionnaire') or {}
            
            row = {
                # Identifiers
                'session_id': session_id,
                'participant_id': session_id,
                
                # Demographics
                'age': demographics.get('age'),
                'gender': demographics.get('gender'),
                'financial_relationship': demographics.get('financial_relationship'),
                'ai_trust_instinct': demographics.get('ai_trust_instinct'),
                'ai_fairness_stance': demographics.get('ai_fairness_stance'),
                'preferred_explanation_style': demographics.get('preferred_explanation_style'),
                
                # Derived fields
                'role_group': 'bank_clerk' if demographics.get('financial_relationship') in ['bank_employee', 'financial_advisor'] else 'non_clerk',
                'language': 'de',
                
                # Persona and decision
                'persona_id': rating.get('persona_id'),
                'decision_outcome': rating.get('prediction_decision'),
                'probability': rating.get('prediction_probability'),
                
                # Layer info
                'layer_number': rating.get('layer_number'),
                'interface_id': f"Layer{rating.get('layer_number')}",
                'interface_order': rating.get('layer_number'),  # Simplified
                
                # Ratings
                'understanding_rating': rating.get('understanding_rating'),
                'communicability_rating': rating.get('communicability_rating'),
                'cognitive_load_rating': rating.get('cognitive_load_rating'),
                'time_spent_seconds': rating.get('time_spent_seconds'),
                
                # Post-questionnaire (same for all layers of same persona)
                'most_helpful_layer': post_q.get('most_helpful_layer'),
                'most_trusted_layer': post_q.get('most_trusted_layer'),
                'best_for_customer': post_q.get('best_for_customer'),
                'overall_intuitiveness': post_q.get('overall_intuitiveness'),
                'ai_usefulness': post_q.get('ai_usefulness'),
                
                # Comments
                'layer_comment_text': '',  # Not available in current API
                'post_persona_suggestion_text': post_q.get('improvement_suggestions', ''),
                
                # Meta
                'completed': session_info.get('completed'),
                'created_at': rating.get('created_at'),
            }
            
            rows.append(row)
    
    df = pd.DataFrame(rows)
    print(f"✓ Created dataset with {len(df)} rows × {len(df.columns)} columns")
    
    return df

# ============================================================================
# ANALYSIS FUNCTIONS (same as before)
# ============================================================================

def compute_descriptive_stats(df: pd.DataFrame, output_dir: Path):
    """Compute descriptive statistics by interface"""
    print("\n" + "="*80)
    print("COMPUTING SUMMARY STATISTICS")
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
    print(by_interface)
    results_summary.append(f"\n## Overall by Interface\n{by_interface.to_string()}")
    
    # B) By persona outcome
    print("\nB) Statistics by persona outcome...")
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
    print("\nC) Statistics by role group...")
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
    print("\nD) Layer preference counts...")
    # Remove NaN values before counting
    df_clean = df.dropna(subset=['most_helpful_layer', 'most_trusted_layer', 'best_for_customer'])
    
    preferences = pd.DataFrame({
        'most_helpful': df_clean.groupby('most_helpful_layer')['session_id'].nunique(),
        'most_trusted': df_clean.groupby('most_trusted_layer')['session_id'].nunique(),
        'best_for_customer': df_clean.groupby('best_for_customer')['session_id'].nunique()
    }).fillna(0).astype(int)
    preferences.to_csv(summary_dir / 'D_layer_preferences.csv')
    print(f"  → Saved to D_layer_preferences.csv")
    print(preferences)
    results_summary.append(f"\n## Layer Preferences\n{preferences.to_string()}")
    
    # E) Statistical tests
    print("\nE) Nonparametric tests...")
    test_results = perform_statistical_tests(df)
    if len(test_results) > 0:
        test_results.to_csv(summary_dir / 'E_statistical_tests.csv', index=False)
        print(f"  → Saved to E_statistical_tests.csv")
        print(test_results.to_string(index=False))
        results_summary.append(f"\n## Statistical Tests\n{test_results.to_string(index=False)}")
    else:
        print("  → Not enough data for statistical tests")
        results_summary.append("\n## Statistical Tests\nNot enough data for within-subject tests")
    
    print("\n✓ All summary tables saved")
    
    return results_summary

def perform_statistical_tests(df: pd.DataFrame) -> pd.DataFrame:
    """Perform Friedman test and pairwise Wilcoxon tests"""
    results = []
    
    metrics = ['understanding_rating', 'communicability_rating', 'cognitive_load_rating', 'time_spent_seconds']
    
    for metric in metrics:
        # Pivot to wide format
        wide = df.pivot_table(
            index='session_id',
            columns='layer_number',
            values=metric,
            aggfunc='mean'
        ).dropna()
        
        if len(wide) < 3 or len(wide.columns) < 2:
            continue
        
        # Friedman test
        try:
            stat, p_value = stats.friedmanchisquare(*[wide[col] for col in wide.columns])
            results.append({
                'metric': metric,
                'test': 'Friedman',
                'statistic': round(stat, 3),
                'p_value': round(p_value, 4),
                'effect_size_r': None,
                'significant': '***' if p_value < 0.001 else '**' if p_value < 0.01 else '*' if p_value < 0.05 else 'ns'
            })
            
            # Pairwise Wilcoxon if significant
            if p_value < 0.05:
                layers = list(wide.columns)
                for i in range(len(layers)):
                    for j in range(i+1, len(layers)):
                        try:
                            stat_w, p_w = stats.wilcoxon(wide[layers[i]], wide[layers[j]])
                            n = len(wide)
                            z = stats.norm.ppf(1 - p_w/2) if p_w > 0 else 0
                            r = abs(z) / np.sqrt(n)
                            
                            results.append({
                                'metric': metric,
                                'test': f'Wilcoxon L{layers[i]} vs L{layers[j]}',
                                'statistic': round(stat_w, 3),
                                'p_value': round(p_w, 4),
                                'effect_size_r': round(r, 3),
                                'significant': '***' if p_w < 0.001 else '**' if p_w < 0.01 else '*' if p_w < 0.05 else 'ns'
                            })
                        except:
                            pass
        except Exception as e:
            print(f"  Warning: Could not compute {metric} tests: {e}")
    
    return pd.DataFrame(results)

def perform_quality_checks(df: pd.DataFrame) -> list:
    """Check for missing values, outliers, and incomplete flows"""
    print("\n" + "="*80)
    print("QUALITY CHECKS")
    print("="*80)
    
    checks = []
    
    # Missing values
    print("\n1. Missing values check...")
    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(1)
    missing_report = pd.DataFrame({'count': missing, 'percentage': missing_pct})
    missing_report = missing_report[missing_report['count'] > 0].sort_values('count', ascending=False)
    
    if len(missing_report) > 0:
        print(f"  ⚠ Found missing values in {len(missing_report)} columns")
        print(missing_report.head(10).to_string())
        checks.append(f"\n## Missing Values\n{missing_report.head(10).to_string()}")
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
    print(f"  → {len(outliers)} outliers (< {lower_bound:.0f}s or > {upper_bound:.0f}s)")
    checks.append(f"\n## Time Outliers\n{len(outliers)} outliers detected")
    
    # Incomplete flows
    print("\n3. Incomplete participant flows...")
    expected_ratings = 8  # 2 personas × 4 layers
    ratings_per_session = df.groupby('session_id').size()
    incomplete = ratings_per_session[ratings_per_session < expected_ratings]
    
    print(f"  → {len(incomplete)} sessions with incomplete data")
    checks.append(f"\n## Incomplete Sessions\n{len(incomplete)} sessions incomplete")
    
    # Completion status
    print("\n4. Completion status...")
    completed_count = df[df['completed'] == True]['session_id'].nunique()
    total_count = df['session_id'].nunique()
    print(f"  → {completed_count}/{total_count} sessions completed ({completed_count/total_count*100:.1f}%)")
    checks.append(f"\n## Completion\n{completed_count}/{total_count} completed ({completed_count/total_count*100:.1f}%)")
    
    return checks

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function"""
    print("\n" + "="*80)
    print("XAI LAYERS MASTER THESIS - DATA EXTRACTION VIA API")
    print("="*80 + "\n")
    
    # Fetch data from API
    research_data = fetch_research_results()
    if not research_data:
        print("✗ Failed to fetch research data. Exiting.")
        return
    
    # Fetch detailed session data
    session_data_list = fetch_all_sessions(research_data)
    if not session_data_list:
        print("✗ No session data fetched. Exiting.")
        return
    
    # Transform to denormalized format
    df = transform_to_denormalized(session_data_list)
    
    # Save main CSV
    main_csv = OUTPUT_DIR / 'xai_layers_analysis_ready.csv'
    df.to_csv(main_csv, index=False)
    print(f"\n✓ Main CSV saved: {main_csv}")
    print(f"  → {len(df)} rows × {len(df.columns)} columns")
    
    # Compute summary statistics
    summary_results = compute_descriptive_stats(df, OUTPUT_DIR)
    
    # Quality checks
    quality_results = perform_quality_checks(df)
    
    # Save combined summary
    summary_file = OUTPUT_DIR / 'short_results_summary.txt'
    with open(summary_file, 'w') as f:
        f.write("="*80 + "\n")
        f.write("XAI LAYERS MASTER THESIS - RESULTS SUMMARY\n")
        f.write("="*80 + "\n")
        f.write(f"\nDataset: {len(df)} observations from {df['session_id'].nunique()} participants\n")
        f.write(f"Interfaces: {df['interface_id'].nunique()} (Layers 1-4)\n")
        f.write(f"Personas: {df['persona_id'].nunique()}\n")
        
        for section in summary_results:
            f.write(section)
        
        f.write("\n\n" + "="*80 + "\n")
        f.write("QUALITY CHECKS\n")
        f.write("="*80 + "\n")
        
        for check in quality_results:
            f.write(check)
    
    print(f"\n✓ Summary saved: {summary_file}")
    
    # Final summary
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE!")
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
    print("\n✓ Ready for thesis evaluation!\n")

if __name__ == '__main__':
    main()
