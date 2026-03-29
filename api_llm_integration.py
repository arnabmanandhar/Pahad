"""
FastAPI integration for mhGAP mental health LLM pipeline
Provides HTTP endpoints for FCHV assessment processing
"""

from fastapi import FastAPI, HTTPException
from typing import Dict, List
from lib.llm import (
    PatientInput,
    ScreeningResponse,
    MentalHealthLLMPipeline,
    create_pipeline,
)

# Initialize FastAPI app
app = FastAPI(
    title="Pahad mhGAP LLM Pipeline",
    description="Mental Health Assessment API for FCHVs",
    version="1.0.0"
)

# Initialize LLM pipeline (default to mock for testing)
llm_pipeline = create_pipeline(provider="mock")

@app.post("/api/llm/assess", response_model=ScreeningResponse)
def assess_patient(patient_data: PatientInput):
    """
    Process patient screening data through LLM interpretation pipeline.
    
    Returns:
        ScreeningResponse with structured data and explanation
    """
    try:
        result = llm_pipeline.process(patient_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/llm/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "llm_provider": llm_pipeline.llm_provider,
        "model": llm_pipeline.model_name
    }

@app.get("/api/llm/config")
def get_config():
    """Get pipeline configuration"""
    return {
        "provider": llm_pipeline.llm_provider,
        "model": llm_pipeline.model_name,
        "safety_enabled": True,
        "critical_case_handling": "template-only"
    }

@app.post("/api/llm/validate-safety")
def validate_output(output_text: str):
    """
    Validate LLM output against safety guidelines.
    Useful for testing and debugging.
    """
    from lib.llm import SafeguardValidator
    
    validator = SafeguardValidator()
    result = validator.run_full_validation(output_text, is_critical=False)
    
    return {
        "is_safe": result["is_safe"],
        "errors": result["errors"],
        "warnings": result["warnings"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
