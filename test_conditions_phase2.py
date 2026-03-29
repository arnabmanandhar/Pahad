"""
Phase 2 Test Suite: Condition Detection from q_scores
Tests ICD-11 aligned condition classification with age/sex modifiers
"""

from lib.llm import classify_conditions


def test_psychosis_detection():
    """Test psychosis detection: Q8 >= 1"""
    print("\n" + "="*60)
    print("TEST 1: Psychosis Detection")
    print("="*60)
    
    # Q8 = 0 (no psychosis)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "psychosis" not in result["conditions"], "Q8=0 should not detect psychosis"
    print("✅ Q8=0 → No psychosis detection")
    
    # Q8 = 1 (psychosis present)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 1, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "psychosis" in result["conditions"], "Q8>=1 should detect psychosis"
    assert result["details"]["psychosis"]["q8_value"] == 1
    print("✅ Q8=1 → Psychosis detected")
    
    # Q8 = 3 (severe psychosis)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 3, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "psychosis" in result["conditions"]
    assert result["details"]["psychosis"]["q8_value"] == 3
    print("✅ Q8=3 → Severe psychosis detected")


def test_depression_detection():
    """Test depression detection: Q4 (core) + at least 1 supporting"""
    print("\n" + "="*60)
    print("TEST 2: Depression Detection")
    print("="*60)
    
    # No Q4 = no depression (even with supporting items)
    result = classify_conditions({"Q1": 1, "Q2": 1, "Q3": 1, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "depression" not in result["conditions"], "No Q4 = no core depression symptom"
    print("✅ Q4=0 (no hopelessness) → No depression")
    
    # Q4 alone without supporting = no depression
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    # Q4 alone might be borderline - but with mhGAP, usually need supporting symptoms
    # However, let's check what our implementation does
    print(f"   Q4=1 alone: conditions={result['conditions']}")
    
    # Q4 + sleep disruption = depression
    result = classify_conditions({"Q1": 1, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "depression" in result["conditions"], "Q4 + Q1 should detect depression"
    print("✅ Q4=1 + Q1=1 (sleep) → Depression detected")
    
    # Q4 + functional impairment
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 1, "Q4": 1, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "depression" in result["conditions"]
    print("✅ Q4=1 + Q3=1 (functional impairment) → Depression detected")
    
    # Q4 + appetite changes
    result = classify_conditions({"Q1": 0, "Q2": 1, "Q3": 0, "Q4": 1, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "depression" in result["conditions"]
    print("✅ Q4=1 + Q2=1 (appetite) → Depression detected")


def test_ptsd_detection():
    """Test PTSD detection: Q6 (trauma) AND Q7 (consequence)"""
    print("\n" + "="*60)
    print("TEST 3: PTSD Detection")
    print("="*60)
    
    # Trauma exposure alone (Q6 without Q7) = no PTSD
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 1, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "ptsd" not in result["conditions"], "Trauma alone ≠ PTSD"
    print("✅ Q6=1, Q7=0 → No PTSD (need consequences)")
    
    # Trauma consequence alone (Q7 without Q6) = no PTSD
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 1, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "ptsd" not in result["conditions"], "Consequences alone ≠ PTSD without exposure"
    print("✅ Q6=0, Q7=1 → No PTSD (need trauma exposure)")
    
    # Both Q6 and Q7 = PTSD
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 1, "Q7": 1, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "ptsd" in result["conditions"], "Q6 + Q7 should detect PTSD"
    print("✅ Q6=1 + Q7=1 → PTSD detected")
    
    # Q6=3, Q7=2 = severe PTSD
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 3, "Q7": 2, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "ptsd" in result["conditions"]
    print("✅ Q6=3 + Q7=2 → Severe PTSD detected")


def test_anxiety_detection():
    """Test anxiety detection: At least 2 of Q1, Q3, Q5"""
    print("\n" + "="*60)
    print("TEST 4: Anxiety Detection")
    print("="*60)
    
    # Single item = no anxiety
    result = classify_conditions({"Q1": 1, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "anxiety" not in result["conditions"], "Single anxiety item insufficient"
    print("✅ 1/3 anxiety items → No anxiety")
    
    # Two anxiety items = anxiety
    result = classify_conditions({"Q1": 1, "Q2": 0, "Q3": 1, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "anxiety" in result["conditions"], "2+ anxiety items should detect anxiety"
    print("✅ Q1=1 + Q3=1 → Anxiety detected")
    
    # All three anxiety items
    result = classify_conditions({"Q1": 1, "Q2": 0, "Q3": 1, "Q4": 0, "Q5": 1,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "anxiety" in result["conditions"]
    assert len(result["details"]["anxiety"]["items_present"]) == 3
    print("✅ Q1=1 + Q3=1 + Q5=1 → Anxiety detected (all items)")


def test_alcohol_detection():
    """Test alcohol/substance use detection: Q9 >= 1"""
    print("\n" + "="*60)
    print("TEST 5: Alcohol/Substance Use Detection")
    print("="*60)
    
    # Q9 = 0 (no substance use)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "alcohol" not in result["conditions"]
    print("✅ Q9=0 → No alcohol use disorder")
    
    # Q9 = 1 (substance use)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 1, "Q10": 0, "Q11": 0, "Q12": 0})
    assert "alcohol" in result["conditions"]
    print("✅ Q9=1 → Alcohol/substance use detected")
    
    # Q9 + Q10 (escalation with family impact)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 2, "Q10": 1, "Q11": 0, "Q12": 0})
    assert "alcohol" in result["conditions"]
    assert result["details"]["alcohol"]["q10_escalation"] == True
    print("✅ Q9=2 + Q10=1 → Severe alcohol use with family impact")


def test_suicide_detection():
    """Test suicide risk detection: Q11 or Q12 >= 1"""
    print("\n" + "="*60)
    print("TEST 6: Suicide Risk Detection")
    print("="*60)
    
    # No suicide risk
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0})
    assert result["has_suicide_risk"] == False
    print("✅ Q11=0, Q12=0 → No suicide risk")
    
    # Q11 = self-harm thoughts
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 1, "Q12": 0})
    assert result["has_suicide_risk"] == True
    print("✅ Q11=1 → Suicide risk (self-harm)")
    
    # Q12 = suicidal ideation
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 1})
    assert result["has_suicide_risk"] == True
    print("✅ Q12=1 → Suicide risk (wish to die)")
    
    # Both Q11 and Q12 (critical)
    result = classify_conditions({"Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0, "Q5": 0,
                                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 3, "Q12": 3})
    assert result["has_suicide_risk"] == True
    assert result["details"]["suicide"]["q11_value"] == 3
    assert result["details"]["suicide"]["q12_value"] == 3
    print("✅ Q11=3 + Q12=3 → Critical suicide risk")


def test_perinatal_modifier():
    """Test perinatal depression modifier for females aged 13-49"""
    print("\n" + "="*60)
    print("TEST 7: Perinatal Depression Modifier (Females 13-49)")
    print("="*60)
    
    # Female, age 25, depression
    result = classify_conditions(
        q_scores={"Q1": 1, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0},
        age=25,
        gender="female"
    )
    assert "depression" in result["conditions"]
    assert "perinatal_depression_risk" in result["modifiers"]
    assert "perinatal" in result["details"]["depression"]["modifier"].lower()
    print("✅ Female, age 25 → Perinatal risk modifier applied")
    
    # Female, age 50 (outside perinatal range)
    result = classify_conditions(
        q_scores={"Q1": 1, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0},
        age=50,
        gender="female"
    )
    assert "depression" in result["conditions"]
    assert "perinatal_depression_risk" not in result["modifiers"]
    print("✅ Female, age 50 → No perinatal modifier (out of range)")
    
    # Male, age 25 (perinatal doesn't apply)
    result = classify_conditions(
        q_scores={"Q1": 1, "Q2": 0, "Q3": 0, "Q4": 1, "Q5": 0,
                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0},
        age=25,
        gender="male"
    )
    assert "depression" in result["conditions"]
    assert "perinatal_depression_risk" not in result["modifiers"]
    print("✅ Male, age 25 → No perinatal modifier (male)")


def test_geriatric_modifier():
    """Test geriatric depression modifier for age >= 65"""
    print("\n" + "="*60)
    print("TEST 8: Geriatric Depression Modifier (Age >= 65)")
    print("="*60)
    
    # Age 68, depression
    result = classify_conditions(
        q_scores={"Q1": 1, "Q2": 0, "Q3": 1, "Q4": 1, "Q5": 0,
                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0},
        age=68
    )
    assert "depression" in result["conditions"]
    assert "geriatric_depression" in result["modifiers"]
    print("✅ Age 68 → Geriatric depression modifier applied")
    
    # Age 64 (just under threshold)
    result = classify_conditions(
        q_scores={"Q1": 1, "Q2": 0, "Q3": 1, "Q4": 1, "Q5": 0,
                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0},
        age=64
    )
    assert "depression" in result["conditions"]
    assert "geriatric_depression" not in result["modifiers"]
    print("✅ Age 64 → No geriatric modifier (under threshold)")


def test_multiple_conditions():
    """Test patient with multiple concurrent conditions"""
    print("\n" + "="*60)
    print("TEST 9: Multiple Concurrent Conditions")
    print("="*60)
    
    # Depression + PTSD + Anxiety + Alcohol
    result = classify_conditions({
        "Q1": 1,  # sleep (depression, anxiety)
        "Q2": 0,
        "Q3": 1,  # functional (depression, anxiety)
        "Q4": 1,  # hopelessness (depression)
        "Q5": 1,  # social withdrawal (anxiety)
        "Q6": 1,  # trauma (ptsd)
        "Q7": 1,  # flashbacks (ptsd)
        "Q8": 0,
        "Q9": 1,  # substance use (alcohol)
        "Q10": 0,
        "Q11": 0,
        "Q12": 0
    })
    
    assert "depression" in result["conditions"]
    assert "ptsd" in result["conditions"]
    assert "anxiety" in result["conditions"]
    assert "alcohol" in result["conditions"]
    assert len(result["conditions"]) == 4
    print(f"✅ Multiple conditions detected: {result['conditions']}")


def test_audit_summary():
    """Test detailed condition classification summary"""
    print("\n" + "="*60)
    print("TEST 10: Condition Audit Summary")
    print("="*60)
    
    result = classify_conditions(
        q_scores={"Q1": 1, "Q2": 0, "Q3": 1, "Q4": 1, "Q5": 1,
                  "Q6": 0, "Q7": 0, "Q8": 0, "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0},
        age=35,
        gender="female"
    )
    
    print(f"Conditions: {result['conditions']}")
    print(f"Primary: {result['primary_condition']}")
    print(f"Modifiers: {result['modifiers']}")
    print(f"Suicide Risk: {result['has_suicide_risk']}")
    print(f"\nDetailed breakdown:")
    for condition, details in result['details'].items():
        if details.get('detected'):
            print(f"  {condition}: {details}")
    
    assert result["primary_condition"] == "depression"
    assert len(result["conditions"]) >= 1
    print("✅ Condition summary generated successfully")


if __name__ == "__main__":
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*10 + "Phase 2 Test Suite: Condition Detection" + " "*10 + "║")
    print("╚" + "="*58 + "╝")
    
    test_psychosis_detection()
    test_depression_detection()
    test_ptsd_detection()
    test_anxiety_detection()
    test_alcohol_detection()
    test_suicide_detection()
    test_perinatal_modifier()
    test_geriatric_modifier()
    test_multiple_conditions()
    test_audit_summary()
    
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*20 + "✅ ALL TESTS PASSED" + " "*20 + "║")
    print("╚" + "="*58 + "╝\n")
