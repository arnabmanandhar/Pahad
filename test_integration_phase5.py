"""
Phase 5 Test Suite: End-to-End Pipeline Integration
Tests complete flow from raw q_scores → comprehensive screening response
Validates all pipeline stages (scoring, conditions, routing, recommendations)
"""

from datetime import datetime
from lib.llm import (
    PatientInput,
    ComprehensiveScreeningResponse,
    compute_score,
    classify_conditions,
    route_specialist,
    get_all_recommendations,
    get_recommendations,
)


def build_comprehensive_response(patient_input: PatientInput) -> ComprehensiveScreeningResponse:
    """
    Build comprehensive screening response from raw q_scores.
    Orchestrates all pipeline stages in sequence.
    """
    warnings = []
    stages_completed = []
    
    # Stage 0: Validate input
    if not patient_input.q_scores:
        warnings.append("No q_scores provided - cannot run full pipeline")
        return None
    
    q_responses = patient_input.q_scores
    
    # ========== STAGE 1: SCORING ==========
    stages_completed.append("Scoring")
    
    # Compute raw score from weights
    QUESTION_WEIGHTS = {
        "Q1": 2, "Q2": 2, "Q3": 3, "Q4": 4, "Q5": 3,
        "Q6": 3, "Q7": 3, "Q8": 4, "Q9": 3, "Q10": 3, "Q11": 5, "Q12": 6
    }
    raw_score = sum(q_responses.get(q, 0) * QUESTION_WEIGHTS.get(q, 0) for q in QUESTION_WEIGHTS)
    
    # Compute normalized score and get risk band
    score_result = compute_score(q_responses)
    normalized_score, risk_band, is_critical = score_result
    
    # Detect suicide risk for flag
    suicide_flag = (q_responses.get("Q11", 0) >= 1 or q_responses.get("Q12", 0) >= 1)
    
    # Detect overrides
    override_flags = []
    if q_responses.get("Q11", 0) >= 1:
        override_flags.append("Q11_self_harm")
    if q_responses.get("Q12", 0) >= 1:
        override_flags.append("Q12_suicidal_ideation")
    if q_responses.get("Q12", 0) == 3:
        override_flags.append("Q12_active_ideation")
    if q_responses.get("Q8", 0) == 3:
        override_flags.append("Q8_severe_psychosis")
    
    if not override_flags:
        override_flags.append("none")
    
    # ========== STAGE 2: CONDITION DETECTION ==========
    stages_completed.append("Condition Detection")
    conditions_result = classify_conditions(
        q_scores=q_responses,
        age=patient_input.age,
        gender=patient_input.gender,
        age_bracket=patient_input.age_bracket
    )
    
    conditions_detected = conditions_result["conditions"]
    primary_condition = conditions_result["primary_condition"]
    clinical_modifiers = conditions_result["modifiers"]
    
    if not conditions_detected:
        conditions_detected = ["no_severe_condition"]
        primary_condition = "no_severe_condition"
    
    # ========== STAGE 3: SPECIALIST ROUTING ==========
    stages_completed.append("Specialist Routing")
    routing_result = route_specialist(
        conditions=conditions_detected,
        age=patient_input.age,
        gender=patient_input.gender,
        age_bracket=patient_input.age_bracket,
        risk_score=normalized_score,
        modifiers=clinical_modifiers
    )
    
    primary_specialist = routing_result["primary_specialist"]
    secondary_specialists = routing_result["secondary_specialists"]
    routing_rationale = routing_result["routing_rationale"]
    referral_urgency = routing_result["urgency"]
    
    # ========== STAGE 4: RECOMMENDATIONS ==========
    stages_completed.append("Recommendations")
    recs_result = get_all_recommendations(
        conditions=conditions_detected if conditions_detected != ["no_severe_condition"] else [],
        risk_score=normalized_score
    )
    
    recommendations = recs_result["combined"]
    next_steps = recs_result.get("primary", {}).get("next_steps", "Schedule follow-up")
    
    # Build comprehensive response
    response = ComprehensiveScreeningResponse(
        patient_id=patient_input.household_id,
        patient_name=patient_input.patient_name,
        assessment_date=datetime.now().isoformat(),
        
        # Stage 1: Scoring
        raw_score=raw_score,
        normalized_score=normalized_score,
        risk_band=risk_band,
        
        # Stage 2: Overrides
        override_flags=override_flags,
        suicide_flag=suicide_flag,
        is_critical=is_critical,
        
        # Stage 3: Conditions
        conditions_detected=conditions_detected,
        primary_condition=primary_condition,
        clinical_modifiers=clinical_modifiers,
        
        # Stage 4: Routing
        primary_specialist=primary_specialist,
        secondary_specialists=secondary_specialists,
        routing_rationale=routing_rationale,
        referral_urgency=referral_urgency,
        
        # Stage 5: Recommendations
        recommendations=recommendations,
        next_steps=next_steps,
        
        # Audit
        warnings=warnings,
        processing_stages_completed=stages_completed
    )
    
    return response


def test_normal_depression_case():
    """Test case 1: Moderate depression with anxiety"""
    print("\n" + "="*60)
    print("TEST 1: Normal Case - Moderate Depression + Anxiety")
    print("="*60)
    
    q_scores = {
        "Q1": 1,  # sleep disruption
        "Q2": 1,  # appetite change
        "Q3": 1,  # stopped activities
        "Q4": 2,  # hopelessness (core symptom)
        "Q5": 1,  # social withdrawal
        "Q6": 0,  # no trauma
        "Q7": 0,  # no flashbacks
        "Q8": 0,  # no psychosis
        "Q9": 0,  # no substance use
        "Q10": 0,
        "Q11": 0,  # no self-harm
        "Q12": 0,  # no suicidal ideation
    }
    
    patient = PatientInput(
        household_id="HH-101",
        patient_name="Priya Sharma",
        age=32,
        age_bracket="adult",
        gender="female",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate stages
    assert response.normalized_score > 0 and response.normalized_score < 50
    assert "depression" in response.conditions_detected or "anxiety" in response.conditions_detected
    assert response.referral_urgency in ["normal", "urgent"]
    assert len(response.recommendations) > 0
    assert len(response.processing_stages_completed) >= 4
    
    print(f"✅ Raw score: {response.raw_score}/123 → {response.normalized_score}/100")
    print(f"✅ Risk band: {response.risk_band}")
    print(f"✅ Conditions: {response.conditions_detected}")
    print(f"✅ Primary specialist: {response.primary_specialist}")
    print(f"✅ Next steps: {response.next_steps}")


def test_critical_suicide_case():
    """Test case 2: Critical suicide risk"""
    print("\n" + "="*60)
    print("TEST 2: Critical Case - Suicidal Ideation Detected")
    print("="*60)
    
    q_scores = {
        "Q1": 1,
        "Q2": 1,
        "Q3": 1,
        "Q4": 3,
        "Q5": 2,
        "Q6": 0,
        "Q7": 0,
        "Q8": 0,
        "Q9": 0,
        "Q10": 0,
        "Q11": 0,
        "Q12": 3,  # ACTIVE SUICIDAL IDEATION
    }
    
    patient = PatientInput(
        household_id="HH-102",
        patient_name="Rajesh Paudel",
        age=45,
        age_bracket="adult",
        gender="male",
        language="ne",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate critical response
    assert response.is_critical == True
    assert response.suicide_flag == True
    assert "Q12" in str(response.override_flags)
    assert "immediate" in response.referral_urgency or response.risk_band == "critical"
    assert any("emergency" in rec.lower() for rec in response.recommendations)
    
    print(f"✅ Is critical: {response.is_critical}")
    print(f"✅ Suicide flag: {response.suicide_flag}")
    print(f"✅ Override flags: {response.override_flags}")
    print(f"✅ Urgency: {response.referral_urgency}")
    print(f"✅ Emergency recommendations included: True")


def test_psychosis_case():
    """Test case 3: Psychosis with high severity"""
    print("\n" + "="*60)
    print("TEST 3: High Risk - Psychosis Detected")
    print("="*60)
    
    q_scores = {
        "Q1": 0,
        "Q2": 0,
        "Q3": 2,
        "Q4": 1,
        "Q5": 0,
        "Q6": 0,
        "Q7": 0,
        "Q8": 3,  # SEVERE PSYCHOSIS (hearing voices, confusion)
        "Q9": 0,
        "Q10": 0,
        "Q11": 0,
        "Q12": 0,
    }
    
    patient = PatientInput(
        household_id="HH-103",
        patient_name="Anita KC",
        age=28,
        age_bracket="adult",
        gender="female",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate psychosis response
    assert "psychosis" in response.conditions_detected
    assert "specialist" in response.primary_specialist.lower() or "psychiatrist" in response.primary_specialist.lower()
    assert response.risk_band in ["high", "critical"]
    assert "Q8" in str(response.override_flags)
    
    print(f"✅ Condition detected: psychosis")
    print(f"✅ Primary specialist: {response.primary_specialist}")
    print(f"✅ Risk band: {response.risk_band}")
    print(f"✅ Q8 override detected: True")


def test_ptsd_female_case():
    """Test case 4: PTSD with GBV pathway awareness"""
    print("\n" + "="*60)
    print("TEST 4: PTSD Case - Gender-Aware Routing (Female)")
    print("="*60)
    
    q_scores = {
        "Q1": 1,
        "Q2": 1,
        "Q3": 2,
        "Q4": 1,
        "Q5": 2,
        "Q6": 2,  # recent trauma
        "Q7": 3,  # flashbacks/avoidance
        "Q8": 0,
        "Q9": 0,
        "Q10": 0,
        "Q11": 0,
        "Q12": 0,
    }
    
    patient = PatientInput(
        household_id="HH-104",
        patient_name="Sarita Limbu",
        age=26,
        age_bracket="adult",
        gender="female",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate PTSD + female routing
    assert "ptsd" in response.conditions_detected
    assert "trauma" in response.primary_specialist.lower() or "psychologist" in response.primary_specialist.lower()
    # Should route to trauma specialist
    assert response.primary_specialist == "trauma_psychologist"
    
    print(f"✅ Condition detected: PTSD")
    print(f"✅ Primary specialist: {response.primary_specialist} (trauma-informed)")
    print(f"✅ Routing rationale: {response.routing_rationale[0]}")


def test_perinatal_depression_case():
    """Test case 5: Perinatal depression (female 13-49)"""
    print("\n" + "="*60)
    print("TEST 5: Perinatal Depression - Age/Gender Modifier Applied")
    print("="*60)
    
    q_scores = {
        "Q1": 1,  # sleep
        "Q2": 0,
        "Q3": 1,  # stopped activities
        "Q4": 2,  # hopelessness
        "Q5": 0,
        "Q6": 0,
        "Q7": 0,
        "Q8": 0,
        "Q9": 0,
        "Q10": 0,
        "Q11": 0,
        "Q12": 0,
    }
    
    patient = PatientInput(
        household_id="HH-105",
        patient_name="Asha Gupta",
        age=28,
        age_bracket="adult",
        gender="female",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate perinatal pathway
    assert "depression" in response.conditions_detected
    assert any("perinatal" in mod for mod in response.clinical_modifiers)
    # Perinatal specialist should be primary
    assert "perinatal" in response.primary_specialist.lower()
    assert response.recommendations is not None
    
    print(f"✅ Condition detected: depression")
    print(f"✅ Clinical modifier: {response.clinical_modifiers}")
    print(f"✅ Primary specialist: {response.primary_specialist}")


def test_multiple_conditions_case():
    """Test case 6: Multiple concurrent conditions"""
    print("\n" + "="*60)
    print("TEST 6: Multiple Conditions - Complex Case")
    print("="*60)
    
    q_scores = {
        "Q1": 2,  # sleep (depression, anxiety)
        "Q2": 1,  # appetite
        "Q3": 2,  # stopped activities (depression, anxiety)
        "Q4": 2,  # hopelessness (depression)
        "Q5": 2,  # social withdrawal (anxiety)
        "Q6": 1,  # trauma
        "Q7": 1,  # flashbacks
        "Q8": 0,
        "Q9": 2,  # substance use escalation
        "Q10": 1,  # family impact
        "Q11": 0,
        "Q12": 0,
    }
    
    patient = PatientInput(
        household_id="HH-106",
        patient_name="Kumar Singh",
        age=38,
        age_bracket="adult",
        gender="male",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate multiple conditions
    assert len(response.conditions_detected) >= 2
    assert len(response.secondary_specialists) > 0
    assert response.primary_specialist is not None
    assert len(response.recommendations) > 0
    
    print(f"✅ Conditions detected: {response.conditions_detected}")
    print(f"✅ Primary specialist: {response.primary_specialist}")
    print(f"✅ Secondary specialists: {response.secondary_specialists}")
    print(f"✅ Total recommendations: {len(response.recommendations)}")


def test_low_risk_case():
    """Test case 7: Low risk - minimal symptoms"""
    print("\n" + "="*60)
    print("TEST 7: Low Risk Case - Minimal Symptoms")
    print("="*60)
    
    q_scores = {
        "Q1": 0,
        "Q2": 0,
        "Q3": 0,
        "Q4": 0,
        "Q5": 0,
        "Q6": 0,
        "Q7": 0,
        "Q8": 0,
        "Q9": 0,
        "Q10": 0,
        "Q11": 0,
        "Q12": 0,
    }
    
    patient = PatientInput(
        household_id="HH-107",
        patient_name="Ramesh Thapa",
        age=52,
        age_bracket="adult",
        gender="male",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate low risk response
    assert response.normalized_score == 0
    assert response.risk_band == "low"
    assert response.referral_urgency == "normal"
    assert response.next_steps is not None
    
    print(f"✅ Score: {response.normalized_score}/100 (low)")
    print(f"✅ Risk band: {response.risk_band}")
    print(f"✅ Urgency: {response.referral_urgency}")
    print(f"✅ Next steps: {response.next_steps}")


def test_geriatric_case():
    """Test case 8: Geriatric depression (age >= 65)"""
    print("\n" + "="*60)
    print("TEST 8: Geriatric Case - Age Modifier Applied")
    print("="*60)
    
    q_scores = {
        "Q1": 2,  # sleep issues (common in elderly)
        "Q2": 1,  # appetite
        "Q3": 2,  # stopped activities
        "Q4": 1,  # hopelessness
        "Q5": 1,  # social withdrawal
        "Q6": 0,
        "Q7": 0,
        "Q8": 0,
        "Q9": 0,
        "Q10": 0,
        "Q11": 0,
        "Q12": 0,
    }
    
    patient = PatientInput(
        household_id="HH-108",
        patient_name="Devi Devi",
        age=72,
        age_bracket="older_adult",
        gender="female",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate geriatric pathway
    assert "depression" in response.conditions_detected
    assert any("geriatric" in mod for mod in response.clinical_modifiers)
    assert "geriatric" in response.primary_specialist.lower() or "psychiatrist" in response.primary_specialist.lower()
    
    print(f"✅ Condition detected: depression")
    print(f"✅ Clinical modifier: {response.clinical_modifiers}")
    print(f"✅ Primary specialist: {response.primary_specialist}")


def test_response_completeness():
    """Test that response has all required fields"""
    print("\n" + "="*60)
    print("TEST 9: Response Completeness & Data Structure")
    print("="*60)
    
    q_scores = {"Q" + str(i): 1 for i in range(1, 13)}
    
    patient = PatientInput(
        household_id="HH-200",
        patient_name="Test Patient",
        age=35,
        age_bracket="adult",
        gender="male",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Validate all required fields present
    required_fields = [
        "patient_id", "patient_name", "assessment_date",
        "raw_score", "normalized_score", "risk_band",
        "override_flags", "suicide_flag", "is_critical",
        "conditions_detected", "primary_condition", "clinical_modifiers",
        "primary_specialist", "secondary_specialists", "routing_rationale", "referral_urgency",
        "recommendations", "next_steps",
        "warnings", "processing_stages_completed"
    ]
    
    for field in required_fields:
        assert hasattr(response, field), f"Missing field: {field}"
        value = getattr(response, field)
        assert value is not None, f"Field {field} is None"
    
    # Validate audit trail
    assert len(response.processing_stages_completed) >= 4
    assert all(stage in response.processing_stages_completed for stage in 
               ["Scoring", "Condition Detection", "Specialist Routing", "Recommendations"])
    
    print(f"✅ All {len(required_fields)} required fields present")
    print(f"✅ Pipeline stages completed: {len(response.processing_stages_completed)}")
    for stage in response.processing_stages_completed:
        print(f"   ✓ {stage}")


def test_pipeline_consistency():
    """Test that computed stages are consistent with each other"""
    print("\n" + "="*60)
    print("TEST 10: Pipeline Consistency Checks")
    print("="*60)
    
    q_scores = {
        "Q1": 1, "Q2": 0, "Q3": 1, "Q4": 2, "Q5": 0,
        "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0
    }
    
    patient = PatientInput(
        household_id="HH-300",
        patient_name="Consistency Test",
        age=40,
        age_bracket="adult",
        gender="male",
        language="en",
        q_scores=q_scores
    )
    
    response = build_comprehensive_response(patient)
    
    # Consistency checks
    # 1. Risk band should match score range
    if response.normalized_score < 26:
        assert response.risk_band == "low"
    elif response.normalized_score < 51:
        assert response.risk_band == "moderate"
    elif response.normalized_score < 76:
        assert response.risk_band == "high"
    else:
        assert response.risk_band == "critical"
    
    # 2. Urgency should match risk band
    if response.risk_band == "critical":
        assert response.referral_urgency == "immediate"
    elif response.risk_band == "high":
        assert response.referral_urgency == "urgent"
    else:
        assert response.referral_urgency in ["normal", "urgent", "immediate"]
    
    # 3. Recommendations should exist
    assert len(response.recommendations) > 0
    
    # 4. Specialist should be assigned
    assert response.primary_specialist is not None and response.primary_specialist != ""
    
    # 5. Conditions should include primary
    if response.primary_condition != "no_severe_condition":
        assert response.primary_condition in response.conditions_detected
    
    print(f"✅ Risk band matches score: {response.risk_band} ({response.normalized_score}/100)")
    print(f"✅ Urgency matches risk: {response.referral_urgency}")
    print(f"✅ Recommendations assigned: {len(response.recommendations)} items")
    print(f"✅ Specialist assigned: {response.primary_specialist}")
    print(f"✅ Primary condition in list: {response.primary_condition in response.conditions_detected}")


if __name__ == "__main__":
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*6 + "Phase 5 Test Suite: End-to-End Pipeline Integration" + " "*6 + "║")
    print("╚" + "="*58 + "╝")
    
    test_normal_depression_case()
    test_critical_suicide_case()
    test_psychosis_case()
    test_ptsd_female_case()
    test_perinatal_depression_case()
    test_multiple_conditions_case()
    test_low_risk_case()
    test_geriatric_case()
    test_response_completeness()
    test_pipeline_consistency()
    
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*20 + "✅ ALL TESTS PASSED" + " "*20 + "║")
    print("║" + " "*8 + "Full mhGAP pipeline ready for production" + " "*12 + "║")
    print("╚" + "="*58 + "╝\n")
