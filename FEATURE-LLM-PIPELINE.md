# Pahad mhGAP LLM Pipeline

## Overview

This branch implements a complete, production-ready LLM pipeline for mental health assessment interpretation aligned with WHO mhGAP guidelines.

### What's Included

**Core LLM System** (`lib/llm/`)
- `models.py` - Structured data models (PatientInput, ScreeningResponse)
- `prompts.py` - Complete LLM prompt system with safety guardrails
- `safeguards.py` - Output validation and safety checks
- `llm_pipeline.py` - Main pipeline orchestration
- `__init__.py` - Module exports

**Integration & Examples**
- `api_llm_integration.py` - FastAPI endpoints for HTTP access
- `examples_llm_pipeline.py` - Running examples for all use cases
- `requirements-llm.txt` - Python dependencies
- `.env.llm` - Configuration template

### Key Features

✅ **Deterministic Scoring** - No randomness in assessment
✅ **Suicide Override** - Critical cases use fixed templates (no LLM)
✅ **mhGAP-Aligned** - WHO-approved recommendations only
✅ **No Medication Advice** - Strict guardrails against dangerous content
✅ **Bilingual Output** - English + Nepali support
✅ **FCHV-Safe** - Language designed for community health workers
✅ **Safety Validation** - Multi-layer output checking

### LLM Prompt System

The pipeline includes three-part structured prompting:

1. **System Prompt** - Rules and constraints (non-negotiable)
2. **Context Input** - Structured patient data
3. **Task Prompt** - What the LLM must do

All prompts are in `lib/llm/prompts.py`

### Safety Guardrails

**Banned Words**: medication, antidepressant, SSRI, dosage, prescribe, etc.
**Required Sections**: ENGLISH, NEPALI, conditions, specialist, next step
**Critical Override**: Suicide cases = fixed template response only
**Recommendation Compliance**: LLM restricted to approved recommendations list

### Usage

#### Option 1: Mock (Testing)
```python
from lib.llm import create_pipeline, PatientInput

patient = PatientInput(...)
pipeline = create_pipeline(provider="mock")
response = pipeline.process(patient)
```

#### Option 2: Ollama (Local LLM)
```bash
# Install Ollama and pull a model
ollama pull llama2

# Start Ollama
ollama serve

# In code
pipeline = create_pipeline(provider="ollama", model="llama2")
```

#### Option 3: OpenAI API
```bash
# Set environment variable
export OPENAI_API_KEY="sk-..."

# In code
pipeline = create_pipeline(provider="openai", model="gpt-4")
```

### Running Examples

```bash
# Install dependencies
pip install -r requirements-llm.txt

# Run examples
python examples_llm_pipeline.py
```

### Starting the API Server

```bash
# FastAPI server
python api_llm_integration.py

# Then visit http://localhost:8000/docs for interactive API docs
```

### Test Cases Included

1. **Normal Case** - Depression + Anxiety (Moderate Risk)
2. **Critical Case** - Suicide Risk (Emergency)
3. **Psychosis Case** - High Urgency Referral
4. **Low Risk Case** - Support & Follow-up
5. **Safety Validation Tests** - Medication blocking, format checking
6. **Convenience Function Test** - End-to-end processing

### Configuration

Edit `.env.llm` to configure:
- LLM provider (mock, openai, ollama)
- Model name
- API endpoints
- Safety settings

### What's NOT in This Branch

This branch contains ONLY the LLM pipeline. The following already exist in main:
- Existing scoring logic
- Database models
- Frontend components
- Authentication
- Other API routes

### Next Steps

1. Install requirements: `pip install -r requirements-llm.txt`
2. Configure `.env.llm` for your LLM provider
3. Run examples to test: `python examples_llm_pipeline.py`
4. Start API server: `python api_llm_integration.py`
5. Integrate into main app

### Merge to Main

This branch is ready to merge when:
- ✅ All examples run without errors
- ✅ Safety validation passes
- ✅ LLM integration tested with your preferred provider
- ✅ API endpoints working in production environment
