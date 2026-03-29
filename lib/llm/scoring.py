"""
Risk Scoring Engine - Layer 1 & 2
Implements deterministic weighted scoring + override rules per mhGAP guidelines
"""

from typing import Dict, Tuple

# Q-Weight Mapping (from mhGAP signal prioritization)
QUESTION_WEIGHTS = {
    "Q1": 2,   # Sleep changes (somatic, lower specificity)
    "Q2": 2,   # Appetite changes (somatic, lower specificity)
    "Q3": 3,   # Stopped daily activities (functional impairment)
    "Q4": 4,   # Hopelessness/worthlessness (core depression symptom)
    "Q5": 3,   # Social withdrawal (cross-disorder signal)
    "Q6": 3,   # Recent trauma or loss (PTSD precipitant)
    "Q7": 3,   # Fear/flashbacks (PTSD symptom cluster)
    "Q8": 4,   # Psychosis signs (high clinical risk)
    "Q9": 3,   # Substance use increase (alcohol module)
    "Q10": 3,  # Family neglect due to substance (severity escalator)
    "Q11": 5,  # Self-harm indicators (immediate safety concern)
    "Q12": 6,  # Wish to die (highest risk, immediate escalation)
}

# Maximum possible raw score
MAX_RAW_SCORE = sum(w * 3 for w in QUESTION_WEIGHTS.values())  # 123

# Risk band boundaries (0-100 scale)
RISK_BANDS = {
    "low": (0, 25),
    "moderate": (26, 50),
    "high": (51, 75),
    "critical": (76, 100),
}


class RiskScorer:
    """
    Computes deterministic risk scores and applies override rules.
    Layers 1 & 2 of Pahad scoring pipeline.
    """
    
    def __init__(self):
        self.weights = QUESTION_WEIGHTS
        self.max_raw_score = MAX_RAW_SCORE
    
    def compute_raw_score(self, q_responses: Dict[str, int]) -> int:
        """
        Layer 1: Compute weighted raw score from Q1-Q12 responses.
        
        Args:
            q_responses: Dict like {"Q1": 0, "Q2": 1, ..., "Q12": 3}
                        Each value must be 0-3
        
        Returns:
            Raw score (0-123)
        """
        raw_score = 0
        for q_num, response in q_responses.items():
            if q_num not in self.weights:
                raise ValueError(f"Invalid question: {q_num}")
            if not (0 <= response <= 3):
                raise ValueError(f"{q_num} response must be 0-3, got {response}")
            raw_score += response * self.weights[q_num]
        
        return raw_score
    
    def normalize_score(self, raw_score: int) -> int:
        """
        Normalize raw score (0-123) to 0-100 scale.
        Formula: score = round(raw_sum / 123 × 100)
        
        Args:
            raw_score: Score from 0-123
        
        Returns:
            Normalized score (0-100)
        """
        if not (0 <= raw_score <= self.max_raw_score):
            raise ValueError(f"Raw score out of range: {raw_score}")
        
        normalized = round((raw_score / self.max_raw_score) * 100)
        return min(normalized, 100)  # Cap at 100
    
    def apply_overrides(
        self,
        normalized_score: int,
        q_responses: Dict[str, int]
    ) -> Tuple[int, str, bool]:
        """
        Layer 2: Apply hard override rules based on clinical urgency.
        
        Override Priority (highest to lowest):
        1. Q11 >= 1 OR Q12 >= 1: CRITICAL (suicide/self-harm override)
        2. Q12 = 3: CRITICAL (active suicidal ideation, most urgent)
        3. Q8 = 3: HIGH (severe psychosis requires specialist)
        
        Args:
            normalized_score: Score from 0-100
            q_responses: Q1-Q12 response dict
        
        Returns:
            Tuple of (final_score, risk_band, suicide_flag)
        """
        suicide_flag = False
        
        # Check for suicide/self-harm (highest priority)
        if q_responses.get("Q11", 0) >= 1 or q_responses.get("Q12", 0) >= 1:
            suicide_flag = True
            return 100, "critical", suicide_flag
        
        # Check for active suicidal ideation (Q12 = 3)
        if q_responses.get("Q12", 0) == 3:
            suicide_flag = True
            return 100, "critical", suicide_flag
        
        # Check for severe psychosis (Q8 = 3)
        if q_responses.get("Q8", 0) == 3:
            override_score = max(normalized_score, 51)  # At least HIGH
            risk_band = self.get_risk_band(override_score)
            return override_score, risk_band, suicide_flag
        
        # No overrides, use normalized score
        risk_band = self.get_risk_band(normalized_score)
        return normalized_score, risk_band, suicide_flag
    
    def get_risk_band(self, score: int) -> str:
        """
        Map score to risk band label.
        
        Score Range | Risk Level
        0–25        | Low
        26–50       | Moderate
        51–75       | High
        76–100      | Critical
        """
        for band, (low, high) in RISK_BANDS.items():
            if low <= score <= high:
                return band
        return "critical"  # Default to highest
    
    def compute_score(self, q_responses: Dict[str, int]) -> Tuple[int, str, bool]:
        """
        Full scoring pipeline: Raw → Normalized → Overrides.
        
        Returns:
            Tuple of (final_score, risk_band, suicide_flag)
        """
        # Layer 1: Weighted raw score
        raw_score = self.compute_raw_score(q_responses)
        
        # Layer 1: Normalize to 0-100
        normalized_score = self.normalize_score(raw_score)
        
        # Layer 2: Apply override rules
        final_score, risk_band, suicide_flag = self.apply_overrides(
            normalized_score,
            q_responses
        )
        
        return final_score, risk_band, suicide_flag
    
    def score_summary(self, q_responses: Dict[str, int]) -> Dict:
        """
        Generate detailed scoring summary for debugging/audit.
        
        Returns:
            Dict with raw_score, normalized_score, overrides_applied, final_score, risk_band
        """
        raw_score = self.compute_raw_score(q_responses)
        normalized_score = self.normalize_score(raw_score)
        final_score, risk_band, suicide_flag = self.apply_overrides(
            normalized_score,
            q_responses
        )
        
        overrides_applied = []
        if suicide_flag:
            overrides_applied.append("Suicide/Self-Harm Override (Q11 or Q12)")
        if q_responses.get("Q12", 0) == 3:
            overrides_applied.append("Active Suicidal Ideation (Q12=3)")
        if q_responses.get("Q8", 0) == 3:
            overrides_applied.append("Severe Psychosis (Q8=3)")
        
        return {
            "raw_score": raw_score,
            "raw_max": self.max_raw_score,
            "normalized_score": normalized_score,
            "overrides_applied": overrides_applied if overrides_applied else ["None"],
            "final_score": final_score,
            "risk_band": risk_band,
            "suicide_flag": suicide_flag,
        }


# Convenience functions
_scorer = RiskScorer()

def compute_score(q_responses: Dict[str, int]) -> Tuple[int, str, bool]:
    """
    Compute final risk score, band, and suicide flag.
    
    Usage:
        score, band, is_critical = compute_score({
            "Q1": 0, "Q2": 1, ..., "Q12": 3
        })
    """
    return _scorer.compute_score(q_responses)

def score_summary(q_responses: Dict[str, int]) -> Dict:
    """Get detailed scoring summary for audit/debugging."""
    return _scorer.score_summary(q_responses)

def get_risk_band(score: int) -> str:
    """Map numeric score to band label."""
    return _scorer.get_risk_band(score)
