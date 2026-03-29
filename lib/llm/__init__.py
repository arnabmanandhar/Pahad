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
]
