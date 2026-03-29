from pydantic import BaseModel
from typing import List, Dict

class PatientInput(BaseModel):
    """Structured patient data for LLM processing"""
    household_id: str           # e.g., HH-101
    patient_name: str
    age: int
    age_bracket: str            # child / adolescent / adult / older_adult
    gender: str                 # male / female / other
    language: str               # en / nepali
    risk_band: str              # low / moderate / high / critical
    score: int
    conditions: List[str]       # depression, anxiety, ptsd, psychosis, alcohol, suicide
    specialist: str
    urgency: str                # normal / urgent / immediate
    suicide_flag: bool
    recommendations: List[str]

class ScreeningResponse(BaseModel):
    """LLM interpretation output"""
    structured_data: Dict
    explanation: Dict  # Contains 'english' and 'nepali' keys
    status: str  # success / critical / error
