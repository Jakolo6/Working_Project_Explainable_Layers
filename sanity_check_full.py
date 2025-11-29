#!/usr/bin/env python3
"""
COMPREHENSIVE MODEL SANITY CHECK
================================
Tests model predictions and SHAP values for logical consistency.
"""

import requests
import json
import uuid
from typing import Dict, Any, List
from dataclasses import dataclass, field

API_BASE = "https://workingprojectexplainablelayers-production.up.railway.app"
PREDICT_ENDPOINT = f"{API_BASE}/api/v1/experiment/predict_persona"

# ============================================================================
# TEST APPLICANTS
# ============================================================================

TEST_APPLICANTS = {
    "A_very_safe": {
        "label": "A — Very Safe Applicant",
        "description": "High income, long employment, stable, all-paid history",
        "expected_decision": "approved",
        "data": {
            "checking_status": "ge_200_dm",
            "duration": 12,
            "credit_history": "all_paid",
            "purpose": "new_car",
            "credit_amount": 2000,
            "savings_status": "ge_1000_dm",
            "employment": "ge_7_years",
            "installment_commitment": 1,
            "other_debtors": "guarantor",
            "residence_since": 4,
            "property_magnitude": "real_estate",
            "age": 45,
            "other_payment_plans": "none",
            "housing": "own",
            "existing_credits": 1,
            "job": "management",
            "num_dependents": 1,
            "own_telephone": "yes"
        }
    },
    "B_very_risky": {
        "label": "B — Very Risky Applicant",
        "description": "Unemployed, bad history, high debt, all red flags",
        "expected_decision": "rejected",
        "data": {
            "checking_status": "lt_0_dm",
            "duration": 48,
            "credit_history": "critical",
            "purpose": "vacation",
            "credit_amount": 15000,
            "savings_status": "lt_100_dm",
            "employment": "unemployed",
            "installment_commitment": 4,
            "other_debtors": "none",
            "residence_since": 1,
            "property_magnitude": "unknown",
            "age": 22,
            "other_payment_plans": "bank",
            "housing": "rent",
            "existing_credits": 4,
            "job": "unemployed_unskilled",
            "num_dependents": 2,
            "own_telephone": "none"
        }
    },
    "C_borderline": {
        "label": "C — Borderline Applicant",
        "description": "Mixed signals, moderate risk",
        "expected_decision": "uncertain",
        "data": {
            "checking_status": "0_to_200_dm",
            "duration": 24,
            "credit_history": "delayed_past",
            "purpose": "furniture",
            "credit_amount": 5000,
            "savings_status": "100_to_500_dm",
            "employment": "1_to_4_years",
            "installment_commitment": 2,
            "other_debtors": "none",
            "residence_since": 2,
            "property_magnitude": "car_other",
            "age": 32,
            "other_payment_plans": "none",
            "housing": "rent",
            "existing_credits": 2,
            "job": "skilled",
            "num_dependents": 1,
            "own_telephone": "yes"
        }
    },
    "D_conflicting": {
        "label": "D — Conflicting Signals",
        "description": "High income/stability BUT bad credit history",
        "expected_decision": "uncertain",
        "data": {
            "checking_status": "ge_200_dm",
            "duration": 36,
            "credit_history": "critical",
            "purpose": "business",
            "credit_amount": 8000,
            "savings_status": "ge_1000_dm",
            "employment": "ge_7_years",
            "installment_commitment": 4,
            "other_debtors": "none",
            "residence_since": 4,
            "property_magnitude": "real_estate",
            "age": 50,
            "other_payment_plans": "bank",
            "housing": "own",
            "existing_credits": 3,
            "job": "management",
            "num_dependents": 1,
            "own_telephone": "yes"
        }
    },
    "E_young_stable": {
        "label": "E — Young with Good Stability",
        "description": "Young applicant, short history but good indicators",
        "expected_decision": "approved",
        "data": {
            "checking_status": "0_to_200_dm",
            "duration": 12,
            "credit_history": "existing_paid",
            "purpose": "education",
            "credit_amount": 3000,
            "savings_status": "500_to_1000_dm",
            "employment": "1_to_4_years",
            "installment_commitment": 2,
            "other_debtors": "none",
            "residence_since": 2,
            "property_magnitude": "car_other",
            "age": 25,
            "other_payment_plans": "none",
            "housing": "rent",
            "existing_credits": 1,
            "job": "skilled",
            "num_dependents": 0,
            "own_telephone": "yes"
        }
    },
    "F_older_low_income": {
        "label": "F — Older with Long History but Low Resources",
        "description": "Older applicant, long history but financial strain",
        "expected_decision": "uncertain",
        "data": {
            "checking_status": "lt_0_dm",
            "duration": 24,
            "credit_history": "existing_paid",
            "purpose": "repairs",
            "credit_amount": 4000,
            "savings_status": "lt_100_dm",
            "employment": "ge_7_years",
            "installment_commitment": 3,
            "other_debtors": "none",
            "residence_since": 4,
            "property_magnitude": "building_society",
            "age": 58,
            "other_payment_plans": "none",
            "housing": "own",
            "existing_credits": 2,
            "job": "unskilled_resident",
            "num_dependents": 0,
            "own_telephone": "none"
        }
    }
}

# ============================================================================
# REAL-WORLD EXPECTATION RULES
# ============================================================================

# Features that should NEVER support approval (positive SHAP is CORRECT for these risky values)
MUST_BE_RISK_INCREASING = {
    "employment": ["unemployed"],
    "checking_status": ["lt_0_dm"],
    "credit_history": ["critical", "delayed_past"],
    "job": ["unemployed_unskilled"],
    "savings_status": ["unknown", "lt_100_dm"],
    "other_payment_plans": ["bank"]
}

# Features that should NEVER raise concerns (negative SHAP is CORRECT for these safe values)
MUST_BE_RISK_DECREASING = {
    "employment": ["ge_7_years"],
    "checking_status": ["ge_200_dm"],
    "credit_history": ["all_paid"],
    "savings_status": ["ge_1000_dm"],
    "housing": ["own"],
    "job": ["management"]
}


def get_prediction(applicant_data: Dict[str, Any]) -> Dict[str, Any]:
    """Send applicant to model and get prediction + SHAP values."""
    session_id = str(uuid.uuid4())
    
    payload = {
        "session_id": session_id,
        "persona_id": "sanity_check_test",
        "application_data": applicant_data
    }
    
    try:
        response = requests.post(PREDICT_ENDPOINT, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ API Error: {e}")
        return None


def check_shap_consistency(shap_features: List[Dict], decision: str, probability: float) -> Dict:
    """Check if SHAP values are consistent with prediction."""
    positive_count = sum(1 for f in shap_features if f['shap_value'] > 0)
    negative_count = sum(1 for f in shap_features if f['shap_value'] < 0)
    total_positive = sum(f['shap_value'] for f in shap_features if f['shap_value'] > 0)
    total_negative = sum(f['shap_value'] for f in shap_features if f['shap_value'] < 0)
    net_shap = total_positive + total_negative
    
    # Check direction match
    if decision == "rejected":
        direction_matches = net_shap > 0 or positive_count > negative_count
    else:  # approved
        direction_matches = net_shap < 0 or negative_count > positive_count
    
    return {
        "positive_count": positive_count,
        "negative_count": negative_count,
        "total_positive": total_positive,
        "total_negative": total_negative,
        "net_shap": net_shap,
        "direction_matches": direction_matches
    }


def check_ui_consistency(shap_features: List[Dict]) -> List[str]:
    """Check if UI labels match SHAP signs."""
    issues = []
    
    for f in shap_features:
        shap_val = f['shap_value']
        impact = f.get('impact', '')
        
        # SHAP > 0 should be 'positive' impact (risk increasing)
        # SHAP < 0 should be 'negative' impact (risk decreasing)
        if shap_val > 0 and impact != 'positive':
            issues.append(f"UI mismatch: {f['feature']} has SHAP={shap_val:.3f} (>0) but impact='{impact}' (should be 'positive')")
        elif shap_val < 0 and impact != 'negative':
            issues.append(f"UI mismatch: {f['feature']} has SHAP={shap_val:.3f} (<0) but impact='{impact}' (should be 'negative')")
    
    return issues


def check_real_world_expectations(shap_features: List[Dict], applicant_data: Dict) -> List[str]:
    """Check if SHAP values match real-world expectations."""
    issues = []
    
    # Build lookup of feature values
    shap_lookup = {}
    for f in shap_features:
        # Handle OneHotEncoded features (e.g., "cat__credit_history_critical")
        feature_name = f['feature']
        shap_lookup[feature_name] = f
    
    # Check features that MUST be risk-increasing
    for feature, risky_values in MUST_BE_RISK_INCREASING.items():
        applicant_value = applicant_data.get(feature)
        if applicant_value in risky_values:
            # Find SHAP for this feature
            for f in shap_features:
                if feature.lower() in f['feature'].lower() and str(applicant_value).lower() in f['feature'].lower():
                    if f['shap_value'] < -0.05:  # Allow small tolerance
                        issues.append(f"🚨 CRITICAL: {feature}={applicant_value} has SHAP={f['shap_value']:.3f} (<0) = 'supports approval' - THIS IS WRONG!")
                    break
                # Also check if feature name contains the value directly
                elif feature.lower() in f['feature'].lower() and f.get('value') == applicant_value:
                    if f['shap_value'] < -0.05:
                        issues.append(f"🚨 CRITICAL: {feature}={applicant_value} has SHAP={f['shap_value']:.3f} (<0) = 'supports approval' - THIS IS WRONG!")
                    break
    
    # Check features that MUST be risk-decreasing
    for feature, safe_values in MUST_BE_RISK_DECREASING.items():
        applicant_value = applicant_data.get(feature)
        if applicant_value in safe_values:
            for f in shap_features:
                if feature.lower() in f['feature'].lower() and str(applicant_value).lower() in f['feature'].lower():
                    if f['shap_value'] > 0.05:  # Allow small tolerance
                        issues.append(f"🚨 CRITICAL: {feature}={applicant_value} has SHAP={f['shap_value']:.3f} (>0) = 'raises concerns' - THIS IS WRONG!")
                    break
                elif feature.lower() in f['feature'].lower() and f.get('value') == applicant_value:
                    if f['shap_value'] > 0.05:
                        issues.append(f"🚨 CRITICAL: {feature}={applicant_value} has SHAP={f['shap_value']:.3f} (>0) = 'raises concerns' - THIS IS WRONG!")
                    break
    
    return issues


def run_sanity_check():
    """Run full sanity check on all test applicants."""
    
    print("=" * 80)
    print("CREDIT RISK MODEL - COMPREHENSIVE SANITY CHECK")
    print("=" * 80)
    print(f"API: {API_BASE}")
    print("=" * 80)
    
    results = []
    all_issues = []
    
    for key, applicant in TEST_APPLICANTS.items():
        print(f"\n{'=' * 80}")
        print(f"TESTING: {applicant['label']}")
        print(f"Description: {applicant['description']}")
        print(f"Expected Decision: {applicant['expected_decision']}")
        print("=" * 80)
        
        # Get prediction
        result = get_prediction(applicant['data'])
        
        if not result:
            print("❌ Failed to get prediction")
            continue
        
        decision = result.get('decision', 'unknown')
        probability = result.get('probability', 0)
        prob_good = result.get('probability_good', 0)
        prob_bad = result.get('probability_bad', 0)
        shap_features = result.get('shap_features', [])
        
        # Display results
        print(f"\n📊 MODEL OUTPUT:")
        print(f"   Decision: {decision.upper()}")
        print(f"   Confidence: {probability:.1%}")
        print(f"   P(Good Credit): {prob_good:.1%}")
        print(f"   P(Bad Credit): {prob_bad:.1%}")
        
        # Display SHAP features (top 10)
        print(f"\n📈 TOP 10 SHAP FEATURES:")
        print("-" * 70)
        sorted_features = sorted(shap_features, key=lambda x: abs(x['shap_value']), reverse=True)[:10]
        print(f"{'Feature':<40} {'Value':<15} {'SHAP':>8} {'Impact':<10}")
        print("-" * 70)
        for f in sorted_features:
            shap_val = f['shap_value']
            impact_icon = "🔴" if f['impact'] == 'positive' else "🟢"
            print(f"{f['feature']:<40} {str(f.get('value', 'N/A')):<15} {shap_val:>+8.3f} {impact_icon} {f['impact']:<10}")
        
        # Run checks
        print(f"\n🔍 CONSISTENCY CHECKS:")
        
        # Check A - SHAP direction
        shap_check = check_shap_consistency(shap_features, decision, probability)
        print(f"\n   Check A - SHAP direction matches prediction:")
        print(f"      Positive SHAP features (risk-increasing): {shap_check['positive_count']}")
        print(f"      Negative SHAP features (risk-decreasing): {shap_check['negative_count']}")
        print(f"      Total positive SHAP: {shap_check['total_positive']:.3f}")
        print(f"      Total negative SHAP: {shap_check['total_negative']:.3f}")
        print(f"      Net SHAP: {shap_check['net_shap']:.3f}")
        print(f"      Direction matches: {'✅ YES' if shap_check['direction_matches'] else '❌ NO'}")
        
        # Check B - UI consistency
        ui_issues = check_ui_consistency(shap_features)
        print(f"\n   Check B - UI label consistency:")
        if ui_issues:
            for issue in ui_issues:
                print(f"      ❌ {issue}")
        else:
            print(f"      ✅ All UI labels match SHAP signs")
        
        # Check C - Real-world expectations
        real_world_issues = check_real_world_expectations(shap_features, applicant['data'])
        print(f"\n   Check C - Real-world expectations:")
        if real_world_issues:
            for issue in real_world_issues:
                print(f"      {issue}")
                all_issues.append(issue)
        else:
            print(f"      ✅ All features match real-world expectations")
        
        # Check prediction matches expectation
        prediction_matches = True
        if applicant['expected_decision'] == "approved" and decision != "approved":
            prediction_matches = False
        elif applicant['expected_decision'] == "rejected" and decision != "rejected":
            prediction_matches = False
        # For "uncertain", either decision is acceptable
        
        # Build audit result
        audit = {
            "applicant_label": applicant['label'],
            "prediction_matches_expectation": prediction_matches,
            "shap_direction_matches_probability": shap_check['direction_matches'],
            "ui_text_consistency": len(ui_issues) == 0,
            "ui_color_consistency": len(ui_issues) == 0,
            "real_world_consistency": len([i for i in real_world_issues if 'CRITICAL' in i]) == 0,
            "contradictions": ui_issues + real_world_issues,
            "passes_sanity_check": (
                shap_check['direction_matches'] and
                len(ui_issues) == 0 and
                len([i for i in real_world_issues if 'CRITICAL' in i]) == 0
            )
        }
        
        results.append(audit)
        
        # Print audit summary
        print("\n📋 AUDIT SUMMARY:")
        print("   {")
        print(f'     "applicant_label": "{audit["applicant_label"]}",')
        print(f'     "prediction_matches_expectation": {str(audit["prediction_matches_expectation"]).lower()},')
        print(f'     "shap_direction_matches_probability": {str(audit["shap_direction_matches_probability"]).lower()},')
        print(f'     "ui_text_consistency": {str(audit["ui_text_consistency"]).lower()},')
        print(f'     "ui_color_consistency": {str(audit["ui_color_consistency"]).lower()},')
        print(f'     "real_world_consistency": {str(audit["real_world_consistency"]).lower()},')
        print(f'     "contradictions_found": {len(audit["contradictions"])},')
        final = "✅ PASSES" if audit["passes_sanity_check"] else "❌ FAILS"
        print(f'     "final_assessment": "{final}"')
        print("   }")
    
    # ========================================================================
    # OVERALL REPORT
    # ========================================================================
    print("\n" + "=" * 80)
    print("OVERALL SANITY CHECK REPORT")
    print("=" * 80)
    
    passed = sum(1 for r in results if r['passes_sanity_check'])
    failed = len(results) - passed
    
    print(f"\n📊 SUMMARY:")
    print(f"   Total applicants tested: {len(results)}")
    print(f"   Passed sanity check: {passed}")
    print(f"   Failed sanity check: {failed}")
    
    print(f"\n🔍 SYSTEMATIC ISSUES:")
    
    # Find critical issues
    critical_issues = [i for i in all_issues if 'CRITICAL' in i]
    if critical_issues:
        print(f"\n   🚨 CRITICAL ISSUES ({len(critical_issues)}):")
        for issue in critical_issues:
            print(f"      - {issue}")
    else:
        print(f"\n   ✅ No critical issues found")
    
    # Final verdict
    print("\n" + "=" * 80)
    print("FINAL VERDICT")
    print("=" * 80)
    
    if failed == 0 and len(critical_issues) == 0:
        print("\n✅ MODEL PASSES SANITY CHECK")
        print("\n   The model's predictions and SHAP values are logically consistent.")
        print("   SHAP signs correctly indicate risk direction.")
        print("   UI labels match SHAP semantics.")
    else:
        print("\n❌ MODEL FAILS SANITY CHECK")
        print(f"\n   Issues to fix:")
        if failed > 0:
            print(f"   - {failed} applicant(s) have inconsistent SHAP/prediction mapping")
        if critical_issues:
            print(f"   - {len(critical_issues)} critical real-world expectation violations")
    
    return results


if __name__ == "__main__":
    results = run_sanity_check()
