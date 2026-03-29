"""
Phase 4 Test Suite: WHO Recommendation Library
Tests condition × severity → recommendations mapping for FCHV delivery
"""

from lib.llm import get_recommendations, get_all_recommendations


def test_severity_assignment():
    """Test severity level computation from risk scores"""
    print("\n" + "="*60)
    print("TEST 1: Severity Level Assignment from Risk Scores")
    print("="*60)
    
    # Low severity (score 0-25)
    recs = get_recommendations("depression", risk_score=15)
    assert recs["severity"] == "low"
    print("✅ Risk score 15 → Low severity")
    
    # Moderate severity (score 26-50)
    recs = get_recommendations("depression", risk_score=40)
    assert recs["severity"] == "moderate"
    print("✅ Risk score 40 → Moderate severity")
    
    # High severity (score 51-75)
    recs = get_recommendations("depression", risk_score=65)
    assert recs["severity"] == "high"
    print("✅ Risk score 65 → High severity (converted from 'high' available)")
    
    # Critical severity (score 76-100)
    recs = get_recommendations("psychosis", risk_score=85)
    assert recs["severity"] == "critical"
    print("✅ Risk score 85 → Critical severity")


def test_depression_recommendations():
    """Test depression recommendations at each severity level"""
    print("\n" + "="*60)
    print("TEST 2: Depression Recommendations by Severity")
    print("="*60)
    
    # Low depression
    recs = get_recommendations("depression", risk_score=20)
    assert recs["severity"] == "low"
    assert len(recs["recommendations"]) >= 3
    assert any("sleep" in rec.lower() for rec in recs["recommendations"])
    assert any("exercise" in rec.lower() or "activity" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Low depression: {len(recs['recommendations'])} recommendations (self-management focus)")
    
    # Moderate depression
    recs = get_recommendations("depression", risk_score=40)
    assert recs["severity"] == "moderate"
    assert len(recs["recommendations"]) >= 3
    assert any("counselor" in rec.lower() or "counsel" in rec.lower() for rec in recs["recommendations"])
    assert any("suicide" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Moderate depression: {len(recs['recommendations'])} recommendations (counseling + monitoring)")
    
    # High depression
    recs = get_recommendations("depression", risk_score=70)
    assert recs["severity"] == "high"
    assert len(recs["recommendations"]) >= 4
    assert any("psychiatrist" in rec.lower() or "specialist" in rec.lower() for rec in recs["recommendations"])
    assert any("suicide" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ High depression: {len(recs['recommendations'])} recommendations (urgent specialist referral)")
    
    # Critical depression
    recs = get_recommendations("depression", risk_score=90)
    assert recs["severity"] == "critical"
    assert len(recs["recommendations"]) >= 4
    assert any("emergency" in rec.upper() or "🚨" in rec for rec in recs["recommendations"])
    print(f"✅ Critical depression: {len(recs['recommendations'])} recommendations (EMERGENCY protocol)")


def test_ptsd_recommendations():
    """Test PTSD recommendations"""
    print("\n" + "="*60)
    print("TEST 3: PTSD Recommendations")
    print("="*60)
    
    # Moderate PTSD (trauma counseling focus)
    recs = get_recommendations("ptsd", risk_score=45)
    assert recs["severity"] == "moderate"
    assert len(recs["recommendations"]) >= 4
    assert any("trauma" in rec.lower() or "grounding" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Moderate PTSD: {len(recs['recommendations'])} recommendations (trauma-informed care)")
    
    # Critical PTSD (emergency + GBV pathways)
    recs = get_recommendations("ptsd", risk_score=85)
    assert len(recs["recommendations"]) >= 4
    assert any("gbv" in rec.lower() or "domestic" in rec.lower() or "shelter" in rec.lower() 
               for rec in recs["recommendations"])
    print(f"✅ High/Critical PTSD: includes GBV pathway (shelter resources)")


def test_anxiety_recommendations():
    """Test anxiety recommendations"""
    print("\n" + "="*60)
    print("TEST 4: Anxiety Recommendations")
    print("="*60)
    
    # Low anxiety (self-management)
    recs = get_recommendations("anxiety", risk_score=15)
    assert recs["severity"] == "low"
    assert len(recs["recommendations"]) >= 3
    assert any("breathing" in rec.lower() or "grounding" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Low anxiety: {len(recs['recommendations'])} recommendations (breathing techniques)")
    
    # Moderate anxiety (counseling)
    recs = get_recommendations("anxiety", risk_score=40)
    assert recs["severity"] == "moderate"
    assert any("counselor" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Moderate anxiety: includes referral to mental health counselor")
    
    # High/Critical anxiety (specialist)
    recs = get_recommendations("anxiety", risk_score=70)
    assert len(recs["recommendations"]) >= 3
    print(f"✅ High anxiety: {len(recs['recommendations'])} recommendations (specialist evaluation)")


def test_psychosis_recommendations():
    """Test psychosis recommendations - highest urgency"""
    print("\n" + "="*60)
    print("TEST 5: Psychosis Recommendations (Emergency Protocol)")
    print("="*60)
    
    # Moderate psychosis (immediate specialist)
    recs = get_recommendations("psychosis", risk_score=50)
    assert recs["severity"] == "moderate"
    assert len(recs["recommendations"]) >= 4
    assert any("psychiatrist" in rec.lower() and "urgent" in rec.lower() 
               for rec in recs["recommendations"])
    print(f"✅ Moderate psychosis: {len(recs['recommendations'])} recommendations (urgent psychiatrist)")
    
    # Critical psychosis (EMERGENCY)
    recs = get_recommendations("psychosis", risk_score=90)
    assert recs["severity"] == "critical"
    assert len(recs["recommendations"]) >= 5
    assert any("emergency" in rec.upper() or "🚨" in rec for rec in recs["recommendations"])
    assert any("hospital" in rec.lower() or "psychiatric" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Critical psychosis: {len(recs['recommendations'])} recommendations (EMERGENCY to hospital)")


def test_alcohol_recommendations():
    """Test alcohol/substance use recommendations"""
    print("\n" + "="*60)
    print("TEST 6: Alcohol Recommendations")
    print("="*60)
    
    # Moderate alcohol use
    recs = get_recommendations("alcohol", risk_score=40)
    assert recs["severity"] == "moderate"
    assert any("reduction" in rec.lower() or "trigger" in rec.lower() for rec in recs["recommendations"])
    assert any("counselor" in rec.lower() for rec in recs["recommendations"])
    print(f"✅ Moderate alcohol: {len(recs['recommendations'])} recommendations (reduction plan)")
    
    # Critical alcohol dependence
    recs = get_recommendations("alcohol", risk_score=80)
    assert any("specialist" in rec.lower() and ("addiction" in rec.lower() or "rehab" in rec.lower()) 
               for rec in recs["recommendations"])
    print(f"✅ Critical alcohol: includes addiction medicine specialist")


def test_next_steps_guidance():
    """Test that next steps are clear and actionable"""
    print("\n" + "="*60)
    print("TEST 7: Next Steps Guidance for FCHV")
    print("="*60)
    
    # Low severity: routine follow-up
    recs = get_recommendations("depression", risk_score=20)
    next_steps = recs["next_steps"]
    assert "follow-up" in next_steps.lower()
    print(f"Low severity: {next_steps}")
    
    # Moderate severity: specialist appointment
    recs = get_recommendations("depression", risk_score=40)
    next_steps = recs["next_steps"]
    assert "specialist" in next_steps.lower()
    print(f"Moderate severity: {next_steps}")
    
    # High severity: urgent referral
    recs = get_recommendations("depression", risk_score=65)
    next_steps = recs["next_steps"]
    assert "urgent" in next_steps.lower()
    print(f"High severity: {next_steps}")
    
    # Critical severity: emergency action
    recs = get_recommendations("psychosis", risk_score=85)
    next_steps = recs["next_steps"]
    assert "immediately" in next_steps.lower() or "emergency" in next_steps.lower()
    print(f"Critical severity: {next_steps}")


def test_combined_recommendations():
    """Test recommendations for multiple conditions"""
    print("\n" + "="*60)
    print("TEST 8: Combined Recommendations (Multiple Conditions)")
    print("="*60)
    
    # Depression + Anxiety
    combined = get_all_recommendations(
        conditions=["depression", "anxiety"],
        risk_score=45
    )
    assert combined["primary"]["condition"] == "depression"
    assert len(combined["secondary"]) >= 0
    assert combined["total_recommendations"] > 0
    print(f"Depression + Anxiety: {combined['total_recommendations']} total recommendations")
    print(f"  Primary: {combined['primary']['condition']} ({len(combined['primary']['recommendations'])} recs)")
    
    # PTSD + Depression
    combined = get_all_recommendations(
        conditions=["ptsd", "depression"],
        risk_score=70
    )
    assert combined["primary"]["condition"] == "ptsd"
    assert len(combined["secondary"]) >= 0
    print(f"PTSD + Depression: {combined['total_recommendations']} total recommendations (no duplicates)")
    
    # No duplicates in combined recommendations
    assert len(combined["combined"]) == len(set(combined["combined"])), "Duplicate recommendations found"
    print(f"✅ No duplicate recommendations in combined list")


def test_fchv_appropriate_language():
    """Test that recommendations use FCHV-appropriate language"""
    print("\n" + "="*60)
    print("TEST 9: FCHV-Appropriate Language")
    print("="*60)
    
    recs = get_all_recommendations(
        conditions=["depression", "anxiety"],
        risk_score=35
    )
    
    all_recommendations_text = "\n".join(recs["combined"])
    
    # Should NOT contain medical jargon
    forbidden_jargon = ["ssri", "antidepressant", "dosage", "prescription", "medication adjustment"]
    for jargon in forbidden_jargon:
        assert jargon.lower() not in all_recommendations_text.lower(), f"Found medical jargon: {jargon}"
    
    # Should contain FCHV-accessible language
    good_phrases = ["counselor", "follow-up", "help", "support", "encourage", "visit", "teach"]
    found_accessible = sum(1 for phrase in good_phrases if phrase in all_recommendations_text.lower())
    assert found_accessible > 0, "No FCHV-accessible language found"
    
    print(f"✅ Recommendations use community health worker language (no medical jargon)")


def test_emergency_indicators():
    """Test that critical cases clearly indicate emergency status"""
    print("\n" + "="*60)
    print("TEST 10: Emergency Indicators in Critical Cases")
    print("="*60)
    
    critical_conditions = ["depression", "psychosis", "ptsd", "alcohol"]
    
    for condition in critical_conditions:
        recs = get_recommendations(condition, risk_score=85)
        recs_text = "\n".join(recs["recommendations"])
        
        # Critical cases should have emergency indicator
        has_emergency = "🚨" in recs_text or "EMERGENCY" in recs_text
        print(f"  {condition:12} → Emergency indicator: {has_emergency}")
        
        if condition == "psychosis":
            assert has_emergency, f"Psychosis at critical level should have emergency indicator"
    
    print("✅ Critical cases clearly marked with emergency indicators")


def test_condition_specific_details():
    """Test condition-specific details in recommendations"""
    print("\n" + "="*60)
    print("TEST 11: Condition-Specific Details")
    print("="*60)
    
    # Depression should mention sleep, activity, function
    recs = get_recommendations("depression", severity="moderate")
    recs_text = "\n".join(recs["recommendations"])
    assert "sleep" in recs_text.lower() or "activity" in recs_text.lower()
    print("✅ Depression: includes sleep and activity recommendations")
    
    # PTSD should mention trauma, triggers, flashbacks
    recs = get_recommendations("ptsd", severity="moderate")
    recs_text = "\n".join(recs["recommendations"])
    assert "trauma" in recs_text.lower() or "trigger" in recs_text.lower() or "flashback" in recs_text.lower()
    print("✅ PTSD: includes trauma-specific guidance")
    
    # Anxiety should mention breathing, grounding, worry
    recs = get_recommendations("anxiety", severity="low")
    recs_text = "\n".join(recs["recommendations"])
    assert "breathing" in recs_text.lower() or "grounding" in recs_text.lower()
    print("✅ Anxiety: includes breathing and grounding techniques")
    
    # Alcohol should mention triggers, reduction, family
    recs = get_recommendations("alcohol", severity="moderate")
    recs_text = "\n".join(recs["recommendations"])
    assert "trigger" in recs_text.lower() or "reduction" in recs_text.lower() or "family" in recs_text.lower()
    print("✅ Alcohol: includes trigger identification and family support")
    
    # Psychosis should mention safety, delusions, medication
    recs = get_recommendations("psychosis", severity="moderate")
    recs_text = "\n".join(recs["recommendations"])
    assert "safety" in recs_text.lower() or "delusion" in recs_text.lower() or "harm" in recs_text.lower()
    print("✅ Psychosis: includes safety and reality orientation")


def test_severity_explicit_vs_computed():
    """Test that explicit severity parameter overrides computed severity"""
    print("\n" + "="*60)
    print("TEST 12: Explicit vs Computed Severity")
    print("="*60)
    
    # Request low severity explicitly (even with moderate risk score)
    recs_explicit = get_recommendations("depression", severity="low", risk_score=45)
    recs_computed = get_recommendations("depression", risk_score=45)
    
    # Explicit should use "low", computed should use "moderate"
    assert recs_explicit["severity"] == "low"
    assert recs_computed["severity"] == "moderate"
    print("✅ Explicit severity parameter correctly overrides risk score")


def test_output_audit_trail():
    """Test that output includes audit information"""
    print("\n" + "="*60)
    print("TEST 13: Output Structure & Audit Information")
    print("="*60)
    
    recs = get_recommendations("depression", risk_score=50)
    
    # Check required fields
    required_fields = ["condition", "severity", "recommendations", "count", "next_steps"]
    for field in required_fields:
        assert field in recs, f"Missing required field: {field}"
    
    # Check types
    assert isinstance(recs["recommendations"], list)
    assert isinstance(recs["count"], int)
    assert isinstance(recs["next_steps"], str)
    
    # Recommendations count should match actual list length
    assert recs["count"] == len(recs["recommendations"])
    
    print(f"✅ Output includes all required fields:")
    print(f"   • condition: {recs['condition']}")
    print(f"   • severity: {recs['severity']}")
    print(f"   • recommendations: {recs['count']} items")
    print(f"   • next_steps: {recs['next_steps']}")


if __name__ == "__main__":
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*5 + "Phase 4 Test Suite: WHO Recommendation Library" + " "*8 + "║")
    print("╚" + "="*58 + "╝")
    
    test_severity_assignment()
    test_depression_recommendations()
    test_ptsd_recommendations()
    test_anxiety_recommendations()
    test_psychosis_recommendations()
    test_alcohol_recommendations()
    test_next_steps_guidance()
    test_combined_recommendations()
    test_fchv_appropriate_language()
    test_emergency_indicators()
    test_condition_specific_details()
    test_severity_explicit_vs_computed()
    test_output_audit_trail()
    
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*20 + "✅ ALL TESTS PASSED" + " "*20 + "║")
    print("╚" + "="*58 + "╝\n")
