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


# ============================================================================
# PHASE 2: CONDITION DETECTION
# ============================================================================
# ICD-11 aligned condition classification from raw q_scores
# Implements mhGAP diagnostic thresholds with age/sex modifiers

class ConditionClassifier:
    """
    Detects mental health conditions from q_scores using ICD-11 thresholds.
    Layer 2.5 of pipeline (between scoring and specialist routing).
    """
    
    def __init__(self):
        # ICD-11 based thresholds for each condition
        self.thresholds = {
            "psychosis": {"Q8": 1},  # Psychosis signs
            "depression": {
                "core": ["Q4"],  # Hopelessness (core depression symptom)
                "supporting": ["Q1", "Q2", "Q3"],  # Sleep, appetite, functional impairment
                "min_supporting": 1,  # At least 1 supporting symptom needed
            },
            "ptsd": {
                "trauma": "Q6",  # Trauma exposure required
                "consequence": "Q7",  # Fear/flashbacks/avoidance required
            },
            "anxiety": {
                "items": ["Q1", "Q3", "Q5"],  # Sleep disruption, functional, social withdrawal
                "min_present": 2,
            },
            "alcohol": {
                "primary": "Q9",  # Substance use increase
                "escalation": "Q10",  # Family neglect due to substance
            },
            "suicide": {
                "items": ["Q11", "Q12"],  # Self-harm or wish to die
                "min_present": 1,
            }
        }
    
    def detect_psychosis(self, q_scores: Dict[str, int]) -> bool:
        """
        Detect psychosis: Q8 ≥ 1 (hearing voices, paranoia, confusion)
        ICD-11: 6A20 (Schizophrenia) requires psychotic symptoms
        """
        return q_scores.get("Q8", 0) >= 1
    
    def detect_depression(self, q_scores: Dict[str, int], age: int = None, gender: str = None) -> bool:
        """
        Detect depression with ICD-11 criteria.
        Requires: core symptom (Q4) + at least 1 supporting symptom
        
        ICD-11: 6A70 (Major depressive disorder, single episode)
                6A71 (Major depressive disorder, recurrent)
        
        Age modifier: Geriatric depression (>65) may present differently
        Gender modifier: Perinatal depression (females 13-49)
        """
        core_symptom = q_scores.get("Q4", 0) >= 1  # Hopelessness/worthlessness
        supporting_items = [
            q_scores.get("Q1", 0) >= 1,  # Sleep changes
            q_scores.get("Q2", 0) >= 1,  # Appetite changes
            q_scores.get("Q3", 0) >= 1,  # Stopped daily activities
        ]
        has_supporting = sum(supporting_items) >= 1
        
        return core_symptom and has_supporting
    
    def detect_ptsd(self, q_scores: Dict[str, int]) -> bool:
        """
        Detect PTSD: Requires both trauma exposure AND trauma consequences
        
        ICD-11: 6A40 (Post-traumatic stress disorder)
        Requires: exposure to actual/threatened death, serious injury, sexual violence
                  AND one of: re-experiencing, avoidance, sense of current threat
        """
        trauma_exposure = q_scores.get("Q6", 0) >= 1  # Recent trauma or loss
        trauma_consequence = q_scores.get("Q7", 0) >= 1  # Fear/flashbacks/avoidance
        
        return trauma_exposure and trauma_consequence
    
    def detect_anxiety(self, q_scores: Dict[str, int]) -> bool:
        """
        Detect anxiety: Multiple items indicate worry/anxiety symptoms
        
        ICD-11: 6A80 (Generalized anxiety disorder)
        Includes symptoms: worry, irritability, sleep disturbance, tension
        """
        anxiety_items = [
            q_scores.get("Q1", 0) >= 1,  # Sleep disruption (anxiety symptom)
            q_scores.get("Q3", 0) >= 1,  # Functional impairment
            q_scores.get("Q5", 0) >= 1,  # Social withdrawal/worry
        ]
        # Anxiety detected if at least 2 relevant items present
        return sum(anxiety_items) >= 2
    
    def detect_alcohol(self, q_scores: Dict[str, int]) -> bool:
        """
        Detect alcohol/substance use disorders.
        
        ICD-11: 6C40 (Alcohol use disorder)
        Screening: Q9 (substance use increase) indicates active use problem
        """
        substance_use = q_scores.get("Q9", 0) >= 1  # Substance use increase
        return substance_use
    
    def detect_suicide(self, q_scores: Dict[str, int]) -> bool:
        """
        Detect suicide risk (also covered by scoring overrides).
        
        Q11: Self-harm thoughts/behavior
        Q12: Wish to die
        """
        return (q_scores.get("Q11", 0) >= 1 or q_scores.get("Q12", 0) >= 1)
    
    def classify(
        self,
        q_scores: Dict[str, int],
        age: int = None,
        gender: str = None,
        age_bracket: str = None
    ) -> Dict[str, any]:
        """
        Classify all conditions present based on q_scores.
        
        Args:
            q_scores: Dict with Q1-Q12 responses
            age: Patient age (for age-based modifiers)
            gender: Patient gender (for gender-based modifiers)
            age_bracket: Pre-computed age bracket (child/adolescent/adult/older_adult)
        
        Returns:
            Dict with:
                - conditions: List of detected conditions
                - details: Detailed detection info for each condition
                - modifiers: Applied age/sex modifiers
                - has_suicide_risk: Boolean for immediate safety concern
        """
        conditions = []
        details = {}
        modifiers = []
        
        # Detect psychosis (highest priority)
        if self.detect_psychosis(q_scores):
            conditions.append("psychosis")
            details["psychosis"] = {
                "detected": True,
                "q8_value": q_scores.get("Q8", 0),
                "reason": "Hearing voices, paranoia, or confusion"
            }
        
        # Detect PTSD (requires both trauma exposure AND consequence)
        if self.detect_ptsd(q_scores):
            conditions.append("ptsd")
            details["ptsd"] = {
                "detected": True,
                "q6_value": q_scores.get("Q6", 0),
                "q7_value": q_scores.get("Q7", 0),
                "reason": "Trauma exposure with fear/flashbacks/avoidance"
            }
        
        # Detect depression (core + supporting)
        if self.detect_depression(q_scores, age, gender):
            conditions.append("depression")
            details["depression"] = {
                "detected": True,
                "q4_value": q_scores.get("Q4", 0),
                "supporting": [q for q in ["Q1", "Q2", "Q3"] if q_scores.get(q, 0) >= 1],
                "reason": "Hopelessness with sleep/appetite/functional changes"
            }
            
            # Age/sex modifiers for depression
            if gender and gender.lower() in ["female", "f"] and age and 13 <= age <= 49:
                modifiers.append("perinatal_depression_risk")
                details["depression"]["modifier"] = "perinatal_risk (females 13-49)"
            
            if age_bracket == "older_adult" or (age and age >= 65):
                modifiers.append("geriatric_depression")
                details["depression"]["modifier"] = f"geriatric_depression ({age or 'older_adult'})"
        
        # Detect anxiety (multiple items)
        if self.detect_anxiety(q_scores):
            conditions.append("anxiety")
            details["anxiety"] = {
                "detected": True,
                "items_present": [q for q in ["Q1", "Q3", "Q5"] if q_scores.get(q, 0) >= 1],
                "reason": "Sleep disruption + functional/social symptoms"
            }
        
        # Detect alcohol use disorder
        if self.detect_alcohol(q_scores):
            conditions.append("alcohol")
            details["alcohol"] = {
                "detected": True,
                "q9_value": q_scores.get("Q9", 0),
                "q10_escalation": q_scores.get("Q10", 0) >= 1,
                "reason": "Increased substance use"
            }
        
        # Detect suicide risk (separate from conditions but critical)
        has_suicide = self.detect_suicide(q_scores)
        if has_suicide:
            # Suicide is handled by scoring overrides, but add to details
            details["suicide"] = {
                "detected": True,
                "q11_value": q_scores.get("Q11", 0),
                "q12_value": q_scores.get("Q12", 0),
                "reason": "Active suicidal or self-harm ideation"
            }
        
        return {
            "conditions": conditions,
            "details": details,
            "modifiers": modifiers,
            "has_suicide_risk": has_suicide,
            "primary_condition": conditions[0] if conditions else "no_severe_condition"
        }


# Convenience functions for Phase 2
_classifier = ConditionClassifier()

def classify_conditions(
    q_scores: Dict[str, int],
    age: int = None,
    gender: str = None,
    age_bracket: str = None
) -> Dict:
    """
    Classify all mental health conditions from q_scores.
    
    Usage:
        result = classify_conditions(
            q_scores={"Q1": 1, "Q2": 0, ..., "Q12": 2},
            age=35,
            gender="female"
        )
        print(result["conditions"])  # ['depression', 'anxiety']
    """
    return _classifier.classify(q_scores, age, gender, age_bracket)


# ============================================================================
# PHASE 3: SPECIALIST ROUTING
# ============================================================================
# Age/sex-based decision trees for assigning appropriate specialists
# Ensures community health workers route to correct referral pathway

class SpecialistRouter:
    """
    Routes patients to appropriate specialists based on:
    - Primary condition(s)
    - Age and age bracket
    - Gender
    - Risk level
    
    Uses mhGAP and WHO guidelines for routing decisions.
    Layer 3 of Pahad pipeline.
    """
    
    def __init__(self):
        # Specialist types available in Nepal FCHV context
        self.specialists = {
            # Psychiatry
            "general_psychiatrist": "General psychiatrist",
            "child_psychiatrist": "Child and adolescent psychiatrist",
            "geriatric_psychiatrist": "Psychiatrist specializing in older adults",
            
            # Psychology
            "clinical_psychologist": "Clinical psychologist",
            "trauma_psychologist": "Psychologist specializing in trauma/PTSD",
            "perinatal_psychologist": "Psychologist specializing in perinatal mental health",
            
            # Counseling
            "mental_health_counselor": "Mental health counselor",
            "addiction_counselor": "Addiction and substance abuse counselor",
            "gbv_counselor": "Counselor trained in gender-based violence",
            
            # Primary Care
            "general_practitioner": "General practitioner (for low-risk support)",
            "mental_health_worker": "General mental health worker / nurse",
        }
    
    def route_psychosis(self, age: int = None, age_bracket: str = None) -> str:
        """
        Route psychosis cases by age group.
        Psychosis in youth requires specialist assessment urgently.
        
        mhGAP: ICD-11 6A20 (Schizophrenia) - specialist referral required
        """
        if not age and not age_bracket:
            return "general_psychiatrist"  # Default when age unknown
        
        # Determine age bracket if not provided
        if not age_bracket and age:
            if age < 12:
                age_bracket = "child"
            elif age < 18:
                age_bracket = "adolescent"
            elif age < 65:
                age_bracket = "adult"
            else:
                age_bracket = "older_adult"
        
        # Age-based routing for psychosis
        if age_bracket == "child":
            return "child_psychiatrist"  # Urgent pediatric psychiatric assessment
        elif age_bracket == "adolescent":
            return "child_psychiatrist"  # Adolescent psychiatrist
        elif age_bracket == "older_adult":
            return "geriatric_psychiatrist"  # Geriatric psychiatrist
        else:
            return "general_psychiatrist"  # Adult psychiatrist
    
    def route_ptsd(self, gender: str = None) -> str:
        """
        Route PTSD cases with gender considerations.
        Females with PTSD may have gender-based violence history.
        
        mhGAP: ICD-11 6A40 (PTSD) - trauma-informed specialist required
        """
        if gender and gender.lower() in ["female", "f"]:
            # Female with PTSD: GBV pathway + trauma specialist
            return "trauma_psychologist"  # Trauma-informed specialist
        
        # Default: trauma-specialized mental health worker
        return "trauma_psychologist"
    
    def route_depression(self, age: int = None, gender: str = None, 
                        age_bracket: str = None, has_perinatal_modifier: bool = False) -> str:
        """
        Route depression cases with age and sex considerations.
        Perinatal depression requires specialized perinatal mental health care.
        Geriatric depression requires geriatric psychiatry assessment.
        
        mhGAP: ICD-11 6A70/6A71 (Major depressive disorder)
        """
        # Perinatal pathway: Females aged 13-49
        if has_perinatal_modifier or (gender and gender.lower() in ["female", "f"] and 
                                       age and 13 <= age <= 49):
            return "perinatal_psychologist"  # Perinatal mental health specialist
        
        # Geriatric pathway: Age >= 65
        if age_bracket == "older_adult" or (age and age >= 65):
            return "geriatric_psychiatrist"  # Geriatric psychiatrist
        
        # Standard depression routing
        return "general_psychiatrist"
    
    def route_anxiety(self) -> str:
        """
        Route anxiety cases to general mental health worker.
        
        mhGAP: ICD-11 6A80 (Generalized anxiety disorder)
        Most anxiety cases manageable with counseling + CBT by trained mental health worker.
        """
        return "mental_health_counselor"
    
    def route_alcohol(self) -> str:
        """
        Route alcohol/substance use to addiction specialist.
        
        mhGAP: ICD-11 6C40 (Alcohol use disorder)
        Requires addiction-trained specialist.
        """
        return "addiction_counselor"
    
    def route(
        self,
        conditions: list,
        age: int = None,
        gender: str = None,
        age_bracket: str = None,
        risk_score: int = None,
        modifiers: list = None
    ) -> Dict:
        """
        Route patient to appropriate specialist(s) based on:
        - Primary and secondary conditions
        - Demographic factors (age, gender)
        - Risk level
        - Clinical modifiers
        
        Args:
            conditions: List of detected conditions (e.g., ['depression', 'anxiety'])
            age: Patient age in years
            gender: Patient gender (male/female/other)
            age_bracket: Pre-computed age bracket (child/adolescent/adult/older_adult)
            risk_score: Normalized risk score (0-100)
            modifiers: List of clinical modifiers (e.g., ['perinatal_depression_risk'])
        
        Returns:
            Dict with:
                - primary_specialist: Main specialist for primary condition
                - secondary_specialists: List of specialists for secondary conditions
                - all_specialists: Combined list of all specialist types needed
                - routing_rationale: Explanation of routing decisions
                - urgency: immediate/urgent/normal based on risk
        """
        modifiers = modifiers or []
        conditions = conditions or []
        
        routing_rationale = []
        all_specialists = set()
        
        if not conditions:
            return {
                "primary_specialist": "general_practitioner",
                "secondary_specialists": [],
                "all_specialists": ["general_practitioner"],
                "routing_rationale": ["No severe conditions detected - primary care follow-up"],
                "urgency": "normal"
            }
        
        # Determine urgency based on risk score and suicide risk
        if risk_score and risk_score >= 76:
            urgency = "immediate"
        elif risk_score and risk_score >= 51:
            urgency = "urgent"
        else:
            urgency = "normal"
        
        # Primary condition gets first priority in routing
        primary_condition = conditions[0]
        
        # Route primary condition
        if primary_condition == "psychosis":
            primary_specialist = self.route_psychosis(age, age_bracket)
            routing_rationale.append(f"Psychosis → {self.specialists[primary_specialist]} (age-based routing)")
            all_specialists.add(primary_specialist)
        
        elif primary_condition == "ptsd":
            primary_specialist = self.route_ptsd(gender)
            routing_rationale.append(f"PTSD → {self.specialists[primary_specialist]} (trauma-informed)")
            all_specialists.add(primary_specialist)
        
        elif primary_condition == "depression":
            has_perinatal = "perinatal_depression_risk" in modifiers
            primary_specialist = self.route_depression(age, gender, age_bracket, has_perinatal)
            routing_rationale.append(f"Depression → {self.specialists[primary_specialist]}")
            if has_perinatal:
                routing_rationale[-1] += " (perinatal pathway)"
            all_specialists.add(primary_specialist)
        
        elif primary_condition == "alcohol":
            primary_specialist = self.route_alcohol()
            routing_rationale.append(f"Alcohol/Substance use → {self.specialists[primary_specialist]}")
            all_specialists.add(primary_specialist)
        
        elif primary_condition == "anxiety":
            primary_specialist = self.route_anxiety()
            routing_rationale.append(f"Anxiety → {self.specialists[primary_specialist]}")
            all_specialists.add(primary_specialist)
        
        else:  # Unknown condition
            primary_specialist = "general_psychiatrist"
            routing_rationale.append(f"{primary_condition.title()} → Psychiatrist")
            all_specialists.add(primary_specialist)
        
        # Route secondary conditions
        secondary_specialists = []
        for condition in conditions[1:]:
            if condition == "psychosis":
                specialist = self.route_psychosis(age, age_bracket)
            elif condition == "ptsd":
                specialist = self.route_ptsd(gender)
            elif condition == "depression":
                specialist = self.route_depression(age, gender, age_bracket)
            elif condition == "alcohol":
                specialist = self.route_alcohol()
            elif condition == "anxiety":
                specialist = self.route_anxiety()
            else:
                specialist = "general_psychiatrist"
            
            if specialist not in all_specialists:
                secondary_specialists.append(specialist)
                routing_rationale.append(f"Secondary: {condition.title()} → {self.specialists[specialist]}")
                all_specialists.add(specialist)
        
        return {
            "primary_specialist": primary_specialist,
            "primary_condition": primary_condition,
            "secondary_specialists": secondary_specialists,
            "all_specialists": list(all_specialists),
            "specialist_labels": {s: self.specialists.get(s, s) for s in all_specialists},
            "routing_rationale": routing_rationale,
            "urgency": urgency
        }


# Convenience functions for Phase 3
_router = SpecialistRouter()

def route_specialist(
    conditions: list,
    age: int = None,
    gender: str = None,
    age_bracket: str = None,
    risk_score: int = None,
    modifiers: list = None
) -> Dict:
    """
    Route patient to appropriate specialist(s).
    
    Usage:
        routing = route_specialist(
            conditions=['depression', 'anxiety'],
            age=30,
            gender='female',
            risk_score=45,
            modifiers=['perinatal_depression_risk']
        )
        print(routing['primary_specialist'])  # perinatal_psychologist
    """
    return _router.route(conditions, age, gender, age_bracket, risk_score, modifiers)
