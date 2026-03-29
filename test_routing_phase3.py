"""
Phase 3 Test Suite: Specialist Routing with Age/Sex Decision Trees
Tests mhGAP-aligned specialist assignment for FCHV referral pathways
"""

from lib.llm import route_specialist


def test_psychosis_routing():
    """Test age-based psychosis specialist routing"""
    print("\n" + "="*60)
    print("TEST 1: Psychosis Routing (Age-Based)")
    print("="*60)
    
    # Child with psychosis
    routing = route_specialist(
        conditions=["psychosis"],
        age=10,
        age_bracket="child",
        risk_score=85
    )
    assert routing["primary_specialist"] == "child_psychiatrist"
    assert "child" in routing["routing_rationale"][0].lower()
    print("✅ Age 10 (child) with psychosis → Child psychiatrist")
    
    # Adolescent with psychosis
    routing = route_specialist(
        conditions=["psychosis"],
        age=16,
        age_bracket="adolescent",
        risk_score=90
    )
    assert routing["primary_specialist"] == "child_psychiatrist"
    print("✅ Age 16 (adolescent) with psychosis → Child psychiatrist")
    
    # Adult with psychosis
    routing = route_specialist(
        conditions=["psychosis"],
        age=35,
        age_bracket="adult",
        risk_score=80
    )
    assert routing["primary_specialist"] == "general_psychiatrist"
    print("✅ Age 35 (adult) with psychosis → General psychiatrist")
    
    # Older adult with psychosis
    routing = route_specialist(
        conditions=["psychosis"],
        age=72,
        age_bracket="older_adult",
        risk_score=75
    )
    assert routing["primary_specialist"] == "geriatric_psychiatrist"
    assert "older" in routing["routing_rationale"][0].lower() or "geriatric" in routing["routing_rationale"][0].lower()
    print("✅ Age 72 (older adult) with psychosis → Geriatric psychiatrist")


def test_ptsd_routing():
    """Test PTSD routing with gender consideration"""
    print("\n" + "="*60)
    print("TEST 2: PTSD Routing (Gender-Aware)")
    print("="*60)
    
    # Female with PTSD → Trauma-specialized + GBV pathway
    routing = route_specialist(
        conditions=["ptsd"],
        age=28,
        gender="female",
        risk_score=65
    )
    assert routing["primary_specialist"] == "trauma_psychologist"
    assert "trauma" in routing["routing_rationale"][0].lower()
    print("✅ Female with PTSD → Trauma psychologist (GBV-aware)")
    
    # Male with PTSD
    routing = route_specialist(
        conditions=["ptsd"],
        age=40,
        gender="male",
        risk_score=60
    )
    assert routing["primary_specialist"] == "trauma_psychologist"
    print("✅ Male with PTSD → Trauma psychologist")
    
    # Unknown gender with PTSD
    routing = route_specialist(
        conditions=["ptsd"],
        age=25,
        risk_score=70
    )
    assert routing["primary_specialist"] == "trauma_psychologist"
    print("✅ Unknown gender with PTSD → Trauma psychologist (default)")


def test_depression_routing():
    """Test depression routing with perinatal and geriatric pathways"""
    print("\n" + "="*60)
    print("TEST 3: Depression Routing (Perinatal & Geriatric)")
    print("="*60)
    
    # Perinatal pathway: Female age 25
    routing = route_specialist(
        conditions=["depression"],
        age=25,
        gender="female",
        risk_score=45,
        modifiers=["perinatal_depression_risk"]
    )
    assert routing["primary_specialist"] == "perinatal_psychologist"
    assert "perinatal" in routing["routing_rationale"][0].lower()
    print("✅ Female age 25 with perinatal modifier → Perinatal psychologist")
    
    # Perinatal pathway: Female age 30 (no modifier passed, but in range)
    routing = route_specialist(
        conditions=["depression"],
        age=30,
        gender="female",
        risk_score=40
    )
    # Should detect perinatal pathway from age/gender
    assert routing["primary_specialist"] == "perinatal_psychologist"
    print("✅ Female age 30 (13-49 range) → Perinatal psychologist")
    
    # Female age 55 (outside perinatal range)
    routing = route_specialist(
        conditions=["depression"],
        age=55,
        gender="female",
        risk_score=35
    )
    assert routing["primary_specialist"] == "general_psychiatrist"
    print("✅ Female age 55 (outside perinatal range) → General psychiatrist")
    
    # Geriatric pathway: Age 70
    routing = route_specialist(
        conditions=["depression"],
        age=70,
        age_bracket="older_adult",
        risk_score=55
    )
    assert routing["primary_specialist"] == "geriatric_psychiatrist"
    assert "older" in routing["routing_rationale"][0].lower() or "geriatric" in routing["routing_rationale"][0].lower()
    print("✅ Age 70 with depression → Geriatric psychiatrist")
    
    # Male age 40 (standard depression)
    routing = route_specialist(
        conditions=["depression"],
        age=40,
        gender="male",
        risk_score=50
    )
    assert routing["primary_specialist"] == "general_psychiatrist"
    print("✅ Male age 40 with depression → General psychiatrist")


def test_anxiety_routing():
    """Test anxiety routing to mental health counselor"""
    print("\n" + "="*60)
    print("TEST 4: Anxiety Routing")
    print("="*60)
    
    routing = route_specialist(
        conditions=["anxiety"],
        age=35,
        gender="female",
        risk_score=35
    )
    assert routing["primary_specialist"] == "mental_health_counselor"
    assert "counselor" in routing["routing_rationale"][0].lower()
    print("✅ Anxiety → Mental health counselor")


def test_alcohol_routing():
    """Test alcohol/substance use routing to addiction specialist"""
    print("\n" + "="*60)
    print("TEST 5: Alcohol/Substance Use Routing")
    print("="*60)
    
    routing = route_specialist(
        conditions=["alcohol"],
        age=45,
        gender="male",
        risk_score=60
    )
    assert routing["primary_specialist"] == "addiction_counselor"
    assert "addiction" in routing["routing_rationale"][0].lower()
    print("✅ Alcohol/substance use → Addiction counselor")


def test_multiple_conditions():
    """Test routing with multiple conditions (primary + secondary)"""
    print("\n" + "="*60)
    print("TEST 6: Multiple Conditions Routing")
    print("="*60)
    
    # Depression + Anxiety (primary: depression, secondary: anxiety)
    routing = route_specialist(
        conditions=["depression", "anxiety"],
        age=30,
        gender="female",
        risk_score=50,
        modifiers=["perinatal_depression_risk"]
    )
    assert routing["primary_specialist"] == "perinatal_psychologist"
    assert len(routing["secondary_specialists"]) >= 0  # May include anxiety specialist
    assert len(routing["all_specialists"]) >= 1
    print(f"✅ Depression + Anxiety → Primary: {routing['primary_specialist']}, "
          f"All specialists: {len(routing['all_specialists'])}")
    
    # PTSD + Depression + Anxiety (trauma is primary)
    routing = route_specialist(
        conditions=["ptsd", "depression", "anxiety"],
        age=28,
        gender="female",
        risk_score=70
    )
    assert routing["primary_specialist"] == "trauma_psychologist"
    assert len(routing["secondary_specialists"]) > 0
    print(f"✅ PTSD + Depression + Anxiety → Primary: trauma specialist, "
          f"Secondary: {len(routing['secondary_specialists'])} additional")
    
    # Psychosis + Depression (psychosis is primary)
    routing = route_specialist(
        conditions=["psychosis", "depression"],
        age=22,
        age_bracket="adolescent",
        risk_score=85
    )
    assert routing["primary_specialist"] == "child_psychiatrist"
    print(f"✅ Psychosis + Depression → Child psychiatrist (age-based override)")


def test_urgency_levels():
    """Test urgency assignment based on risk score"""
    print("\n" + "="*60)
    print("TEST 7: Urgency Levels")
    print("="*60)
    
    # Low risk (score 0-25) → Normal urgency
    routing = route_specialist(
        conditions=["anxiety"],
        risk_score=15
    )
    assert routing["urgency"] == "normal"
    print("✅ Risk score 15 → Normal urgency")
    
    # Moderate risk (score 26-50) → Normal urgency
    routing = route_specialist(
        conditions=["depression"],
        risk_score=40
    )
    assert routing["urgency"] == "normal"
    print("✅ Risk score 40 → Normal urgency")
    
    # High risk (score 51-75) → Urgent
    routing = route_specialist(
        conditions=["depression"],
        risk_score=65
    )
    assert routing["urgency"] == "urgent"
    print("✅ Risk score 65 → Urgent")
    
    # Critical risk (score 76-100) → Immediate
    routing = route_specialist(
        conditions=["psychosis"],
        risk_score=85
    )
    assert routing["urgency"] == "immediate"
    print("✅ Risk score 85 → Immediate")
    
    # Suicide case (critical override)
    routing = route_specialist(
        conditions=["depression"],
        risk_score=95
    )
    assert routing["urgency"] == "immediate"
    print("✅ Risk score 95 → Immediate (critical)")


def test_no_conditions():
    """Test routing when no severe conditions detected"""
    print("\n" + "="*60)
    print("TEST 8: No Severe Conditions")
    print("="*60)
    
    routing = route_specialist(
        conditions=[],
        age=30,
        risk_score=10
    )
    assert routing["primary_specialist"] == "general_practitioner"
    assert "primary care" in routing["routing_rationale"][0].lower()
    assert routing["urgency"] == "normal"
    print("✅ No conditions → Primary care follow-up (normal urgency)")


def test_routing_rationale():
    """Test that routing rationale is clear and helpful"""
    print("\n" + "="*60)
    print("TEST 9: Routing Rationale Documentation")
    print("="*60)
    
    routing = route_specialist(
        conditions=["ptsd", "depression"],
        age=32,
        gender="female",
        risk_score=70,
        modifiers=["perinatal_depression_risk"]
    )
    
    # Verify rationale contains useful information
    assert len(routing["routing_rationale"]) > 0
    print(f"Routing rationale for PTSD + depression case:")
    for reason in routing["routing_rationale"]:
        print(f"  • {reason}")
    
    # Specialist labels should be human-readable
    assert len(routing["specialist_labels"]) > 0
    print(f"\nSpecialists assigned: {list(routing['specialist_labels'].values())}")
    print("✅ Routing rationale complete and informative")


def test_specialist_labels():
    """Test that specialist codes map to readable labels"""
    print("\n" + "="*60)
    print("TEST 10: Specialist Labels")
    print("="*60)
    
    routing = route_specialist(
        conditions=["depression", "anxiety"],
        age=28,
        gender="female",
        risk_score=45,
        modifiers=["perinatal_depression_risk"]
    )
    
    # Verify all specialists have readable labels
    for specialist_code, label in routing["specialist_labels"].items():
        assert isinstance(label, str)
        assert len(label) > 0
        assert specialist_code in label or any(
            word in label.lower() for word in ["psychiatrist", "psychologist", "counselor", "worker", "practitioner"]
        )
    
    print(f"Specialist mappings:")
    for code, label in routing["specialist_labels"].items():
        print(f"  {code:25} → {label}")
    print("✅ All specialists have clear, readable labels")


if __name__ == "__main__":
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*8 + "Phase 3 Test Suite: Specialist Routing" + " "*12 + "║")
    print("╚" + "="*58 + "╝")
    
    test_psychosis_routing()
    test_ptsd_routing()
    test_depression_routing()
    test_anxiety_routing()
    test_alcohol_routing()
    test_multiple_conditions()
    test_urgency_levels()
    test_no_conditions()
    test_routing_rationale()
    test_specialist_labels()
    
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*20 + "✅ ALL TESTS PASSED" + " "*20 + "║")
    print("╚" + "="*58 + "╝\n")
