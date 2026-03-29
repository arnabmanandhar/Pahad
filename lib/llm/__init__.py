"""
LLM Pipeline module for mhGAP-aligned mental health assessment
"""

from .models import PatientInput, ScreeningResponse
from .prompts import (
    SYSTEM_PROMPT,
    TASK_PROMPT,
    get_system_prompt,
    get_task_prompt,
    get_critical_template,
    get_banned_words,
)
from .safeguards import SafeguardValidator
from .llm_pipeline import (
    MentalHealthLLMPipeline,
    create_pipeline,
    process_patient,
)
from .scoring import (
    RiskScorer,
    compute_score,
    score_summary,
    get_risk_band,
    QUESTION_WEIGHTS,
    MAX_RAW_SCORE,
    RISK_BANDS,
    ConditionClassifier,
    classify_conditions,
    SpecialistRouter,
    route_specialist,
    WhoRecommendationLibrary,
    get_recommendations,
    get_all_recommendations,
)

__all__ = [
    "PatientInput",
    "ScreeningResponse",
    "SYSTEM_PROMPT",
    "TASK_PROMPT",
    "get_system_prompt",
    "get_task_prompt",
    "get_critical_template",
    "get_banned_words",
    "SafeguardValidator",
    "MentalHealthLLMPipeline",
    "create_pipeline",
    "process_patient",
    "RiskScorer",
    "compute_score",
    "score_summary",
    "get_risk_band",
    "QUESTION_WEIGHTS",
    "MAX_RAW_SCORE",
    "RISK_BANDS",
    "ConditionClassifier",
    "classify_conditions",
    "SpecialistRouter",
    "route_specialist",
    "WhoRecommendationLibrary",
    "get_recommendations",
    "get_all_recommendations",
]
