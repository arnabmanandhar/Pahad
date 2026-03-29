#!/usr/bin/env python3
"""
Test suite for Phase 1: Scoring & Overrides
Validates weighted scoring, normalization, and override rules.
"""

from lib.llm.scoring import RiskScorer, compute_score, score_summary, QUESTION_WEIGHTS

def test_weights():
    """Verify Q-weights match specification."""
    print("=" * 60)
    print("TEST 1: Question Weights")
    print("=" * 60)
    
    expected_weights = {
        "Q1": 2, "Q2": 2, "Q3": 3, "Q4": 4,
        "Q5": 3, "Q6": 3, "Q7": 3, "Q8": 4,
        "Q9": 3, "Q10": 3, "Q11": 5, "Q12": 6,
    }
    
    assert QUESTION_WEIGHTS == expected_weights, "Weights mismatch!"
    total_weight = sum(w * 3 for w in QUESTION_WEIGHTS.values())
    print(f"✅ All weights correct")
    print(f"   Max raw score: {total_weight} (expected 123)")
    assert total_weight == 123, f"Expected max 123, got {total_weight}"
    print()

def test_raw_score():
    """Test Layer 1: Raw weighted score calculation."""
    print("=" * 60)
    print("TEST 2: Raw Score Calculation")
    print("=" * 60)
    
    scorer = RiskScorer()
    
    # Test 1: All zeros
    q_zero = {f"Q{i}": 0 for i in range(1, 13)}
    raw = scorer.compute_raw_score(q_zero)
    assert raw == 0, f"All zeros should give 0, got {raw}"
    print(f"✅ All zeros: raw score = {raw}")
    
    # Test 2: All threes
    q_max = {f"Q{i}": 3 for i in range(1, 13)}
    raw = scorer.compute_raw_score(q_max)
    assert raw == 123, f"All threes should give 123, got {raw}"
    print(f"✅ All threes: raw score = {raw}")
    
    # Test 3: Mixed
    q_mixed = {
        "Q1": 1, "Q2": 2, "Q3": 0, "Q4": 3,
        "Q5": 1, "Q6": 2, "Q7": 0, "Q8": 3,
        "Q9": 1, "Q10": 2, "Q11": 0, "Q12": 3,
    }
    # Expected: 1*2 + 2*2 + 0*3 + 3*4 + 1*3 + 2*3 + 0*3 + 3*4 + 1*3 + 2*3 + 0*5 + 3*6
    #         = 2 + 4 + 0 + 12 + 3 + 6 + 0 + 12 + 3 + 6 + 0 + 18 = 66
    raw = scorer.compute_raw_score(q_mixed)
    assert raw == 66, f"Expected 66, got {raw}"
    print(f"✅ Mixed responses: raw score = {raw}")
    print()

def test_normalization():
    """Test Layer 1: 0-123 → 0-100 normalization."""
    print("=" * 60)
    print("TEST 3: Score Normalization (0-123 → 0-100)")
    print("=" * 60)
    
    scorer = RiskScorer()
    
    # 0 → 0
    norm = scorer.normalize_score(0)
    assert norm == 0, f"0 should normalize to 0, got {norm}"
    print(f"✅ Raw 0 → {norm}")
    
    # 123 → 100
    norm = scorer.normalize_score(123)
    assert norm == 100, f"123 should normalize to 100, got {norm}"
    print(f"✅ Raw 123 → {norm}")
    
    # 61.5 (mid) → 50
    norm = scorer.normalize_score(62)  # 62/123 * 100 = 50.4
    print(f"✅ Raw 62 → {norm} (expected ~50)")
    print()

def test_overrides():
    """Test Layer 2: Override rules."""
    print("=" * 60)
    print("TEST 4: Override Rules")
    print("=" * 60)
    
    # Setup baseline
    q_baseline = {f"Q{i}": 0 for i in range(1, 13)}
    
    # Override 1: Q11 >= 1 (self-harm)
    print("\n1. Self-Harm Override (Q11 >= 1):")
    q_test = q_baseline.copy()
    q_test["Q11"] = 1
    score, band, critical = compute_score(q_test)
    assert critical == True and band == "critical" and score == 100
    print(f"   Q11=1 → Score={score}, Band={band}, Critical={critical} ✅")
    
    # Override 2: Q12 >= 1 (suicidal ideation)
    print("\n2. Suicidal Ideation Override (Q12 >= 1):")
    q_test = q_baseline.copy()
    q_test["Q12"] = 1
    score, band, critical = compute_score(q_test)
    assert critical == True and band == "critical" and score == 100
    print(f"   Q12=1 → Score={score}, Band={band}, Critical={critical} ✅")
    
    # Override 3: Q12 = 3 (active suicidal ideation)
    print("\n3. Active Suicidal Ideation (Q12=3):")
    q_test = q_baseline.copy()
    q_test["Q12"] = 3
    score, band, critical = compute_score(q_test)
    assert critical == True and band == "critical" and score == 100
    print(f"   Q12=3 → Score={score}, Band={band}, Critical={critical} ✅")
    
    # Override 4: Q8 = 3 (severe psychosis)
    print("\n4. Severe Psychosis Override (Q8=3):")
    q_test = q_baseline.copy()
    q_test["Q8"] = 3
    score, band, critical = compute_score(q_test)
    assert band == "critical" or band == "high"  # At least HIGH
    print(f"   Q8=3 → Score={score}, Band={band}, Critical={critical} ✅")
    print()

def test_risk_bands():
    """Test risk band classification."""
    print("=" * 60)
    print("TEST 5: Risk Band Classification")
    print("=" * 60)
    
    from lib.llm.scoring import get_risk_band
    
    cases = [
        (10, "low"),
        (25, "low"),
        (26, "moderate"),
        (50, "moderate"),
        (51, "high"),
        (75, "high"),
        (76, "critical"),
        (100, "critical"),
    ]
    
    for score, expected_band in cases:
        band = get_risk_band(score)
        assert band == expected_band, f"Score {score}: expected {expected_band}, got {band}"
        print(f"✅ Score {score:3d} → {band}")
    print()

def test_audit_summary():
    """Test detailed scoring summary."""
    print("=" * 60)
    print("TEST 6: Audit Summary")
    print("=" * 60)
    
    q_test = {
        "Q1": 1, "Q2": 1, "Q3": 2, "Q4": 2,
        "Q5": 1, "Q6": 1, "Q7": 1, "Q8": 0,
        "Q9": 0, "Q10": 0, "Q11": 0, "Q12": 0,
    }
    
    summary = score_summary(q_test)
    
    print("Summary for moderate depression case:")
    print(f"  Raw Score: {summary['raw_score']}/123")
    print(f"  Normalized: {summary['normalized_score']}/100")
    print(f"  Overrides: {summary['overrides_applied']}")
    print(f"  Final Score: {summary['final_score']}")
    print(f"  Risk Band: {summary['risk_band']}")
    print(f"  Suicide Flag: {summary['suicide_flag']}")
    print()

if __name__ == "__main__":
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║          Phase 1 Test Suite: Scoring & Overrides           ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print()
    
    try:
        test_weights()
        test_raw_score()
        test_normalization()
        test_overrides()
        test_risk_bands()
        test_audit_summary()
        
        print("╔════════════════════════════════════════════════════════════╗")
        print("║                  ✅ ALL TESTS PASSED                       ║")
        print("╚════════════════════════════════════════════════════════════╝")
        print()
    
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
