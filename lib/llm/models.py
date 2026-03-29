from pydantic import BaseModel
from typing import List, Dict, Optional

class PatientInput(BaseModel):
    """Structured patient data for LLM processing
    
    Supports two workflows:
    1. Pre-computed: risk_band, score, conditions, specialist provided
    2. Raw input: q_scores dict provided, other fields computed by pipeline
    """
    household_id: str                           # e.g., HH-101
    patient_name: str
    age: int
    age_bracket: str                            # child / adolescent / adult / older_adult
    gender: str                                 # male / female / other
    language: str                               # en / nepali
    
    # PHASE 5: Raw input (q_scores Q1-Q12 responses)
    q_scores: Optional[Dict[str, int]] = None   # Q1-Q12 screening responses (0-3 scale)
    
    # Computed fields (can be pre-filled or auto-computed from q_scores)
    risk_band: Optional[str] = None             # low / moderate / high / critical
    score: Optional[int] = None                 # 0-100 normalized score
    conditions: Optional[List[str]] = None      # depression, anxiety, ptsd, psychosis, alcohol
    override_flags: Optional[List[str]] = None  # PHASE 5: Detected overrides (Q11, Q12, Q8)
    specialist: Optional[str] = None
    urgency: Optional[str] = None               # normal / urgent / immediate
    suicide_flag: Optional[bool] = None
    recommendations: Optional[List[str]] = None

class ScreeningResponse(BaseModel):
    """LLM interpretation output"""
    structured_data: Dict
    explanation: Dict  # Contains 'english' and 'nepali' keys
    status: str  # success / critical / error


class ComprehensiveScreeningResponse(BaseModel):
    """PHASE 5: Complete response with all computed pipeline stages"""
    # Input summary
    patient_id: str
    patient_name: str
    assessment_date: str  # ISO format
    
    # Stage 1: Scoring
    raw_score: int                              # 0-123 weighted sum
    normalized_score: int                       # 0-100 normalized
    risk_band: str                              # low/moderate/high/critical
    
    # Stage 2: Overrides & Flags
    override_flags: List[str]                   # Applied overrides (Q11, Q12, Q8)
    suicide_flag: bool                          # Suicide risk detected
    is_critical: bool                           # Override resulted in critical
    
    # Stage 3: Condition Detection
    conditions_detected: List[str]              # All conditions found
    primary_condition: Optional[str] = None
    clinical_modifiers: List[str]               # Age/sex modifiers applied
    
    # Stage 4: Specialist Routing
    primary_specialist: str
    secondary_specialists: List[str]
    routing_rationale: List[str]
    referral_urgency: str                       # immediate/urgent/normal
    
    # Stage 5: Recommendations
    recommendations: List[str]
    next_steps: str                             # Clear FCHV action
    
    # LLM Response (if applicable)
    llm_explanation_en: Optional[str] = None
    llm_explanation_ne: Optional[str] = None
    llm_status: str = "success"                 # success/critical/error
    
    # Audit trail
    warnings: List[str] = []                    # Any issues encountered
    processing_stages_completed: List[str]      # Audit log of pipeline stages
