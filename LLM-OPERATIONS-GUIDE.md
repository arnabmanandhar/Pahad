# Pahad mhGAP LLM Pipeline - Operations Guide

**Quick Reference for all operations**

---

## Current Status

- **Branch**: `llm-integration` (rename to `feature/mhgap-llm-pipeline` if needed)
- **Status**: Ready to commit and test
- **Main branch**: Untouched - all LLM code is isolated

---

## Essential Git Operations

### 1. Commit LLM Branch Changes

```powershell
git add -A
git commit -m "feat: Add mhGAP LLM pipeline with safety guardrails"
git push origin llm-integration
```

### 2. Rename Branch (Optional)

```powershell
git branch -m llm-integration feature/mhgap-llm-pipeline
git push origin feature/mhgap-llm-pipeline
```

### 3. Switch Between Branches

```powershell
# To main branch
git checkout main

# To LLM branch
git checkout llm-integration
# or
git checkout feature/mhgap-llm-pipeline
```

### 4. Check Status

```powershell
git status
git branch -v
git log --oneline -5
```

---

## Python Environment Setup

### Setup Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-llm.txt
```

### Deactivate

```powershell
deactivate
```

---

## Running the LLM Pipeline

### Option 1: Run Examples (Test All Scenarios)

```powershell
# Must be on a branch with LLM files
python examples_llm_pipeline.py
```

Runs:
- Normal depression case
- **Critical suicide case** (emergency template)
- Psychosis case
- Low risk case
- Safety validation tests

### Option 2: Start API Server

```powershell
python api_llm_integration.py
```

Then open: **http://localhost:8000/docs**

Interactive API with endpoints:
- `POST /api/llm/assess` - Process patient
- `GET /api/llm/health` - Server status
- `GET /api/llm/config` - Configuration

### Option 3: Test Single Case (Python)

```python
from lib.llm import PatientInput, create_pipeline

patient = PatientInput(
    household_id="HH-101",
    patient_name="Test Patient",
    age=30,
    age_bracket="adult",
    gender="female",
    language="en",
    risk_band="moderate",
    score=15,
    conditions=["anxiety"],
    specialist="Mental Health Worker",
    urgency="normal",
    suicide_flag=False,
    recommendations=["Stay active", "Weekly check-in"]
)

pipeline = create_pipeline(provider="mock")
response = pipeline.process(patient)
print(response.explanation)
```

---

## Configuration

Edit `.env.llm` to set LLM provider:

```ini
# Option 1: Testing (default)
LLM_PROVIDER=mock

# Option 2: Local LLM (Ollama)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama2

# Option 3: OpenAI API
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4
```

---

## Project Structure

**LLM Pipeline Files:**
```
lib/llm/
  ├── models.py           # Data validation
  ├── prompts.py          # Complete prompt system
  ├── safeguards.py       # Safety validation
  ├── llm_pipeline.py     # Main orchestration
  └── __init__.py         # Exports

api_llm_integration.py    # FastAPI endpoints
examples_llm_pipeline.py  # Test cases
requirements-llm.txt      # Dependencies
.env.llm                  # Configuration
```

**Documentation:**
- `FEATURE-LLM-PIPELINE.md` - Feature overview
- `BRANCH-CLEANUP.md` - Cleanup instructions
- `LLM-OPERATIONS-GUIDE.md` - This file

---

## Troubleshooting

### "Module not found" Error

```powershell
# Make sure venv is activated
.\venv\Scripts\Activate.ps1

# Reinstall packages
pip install -r requirements-llm.txt
```

### Branch Errors

```powershell
# Check all branches
git branch -a

# Verify current branch
git branch -v

# Force switch
git checkout -f llm-integration
```

### API Server Won't Start

```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill existing process (if needed)
taskkill /PID <PID> /F

# Restart
python api_llm_integration.py
```

---

## Common Workflows

### Workflow 1: Test → Commit → Push

```powershell
# Test
python examples_llm_pipeline.py

# If all good, commit
git add -A
git commit -m "Your message"
git push origin llm-integration
```

### Workflow 2: Switch Branches

```powershell
# Check current
git status

# Switch to main
git checkout main

# Switch back to LLM
git checkout llm-integration
```

### Workflow 3: API Development

```powershell
# Terminal 1: Start API
python api_llm_integration.py

# Terminal 2: Test (while API running)
# Open http://localhost:8000/docs
# Or use curl:
# curl -X POST http://localhost:8000/api/llm/assess -H "Content-Type: application/json" -d '...'
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/llm/prompts.py` | LLM system + task prompts, banned words |
| `lib/llm/safeguards.py` | Output validation (safety checks) |
| `lib/llm/llm_pipeline.py` | Main pipeline logic |
| `.env.llm` | LLM provider configuration |
| `requirements-llm.txt` | Python dependencies |
| `examples_llm_pipeline.py` | Test all scenarios |
| `api_llm_integration.py` | FastAPI server |

---

## Critical Safety Features

✅ **Deterministic Scoring** - No randomness in assessment
✅ **Suicide Override** - Critical cases use fixed templates (NO LLM)
✅ **Medication Blocking** - Strict guardrails against dangerous content
✅ **Bilingual Output** - English + Nepali support
✅ **FCHV-Safe Language** - Non-clinical, community-friendly
✅ **Multi-Layer Validation** - Safety checks on all outputs

---

## When Merging to Main

Before merging `llm-integration` → `main`:

```powershell
# 1. Ensure all tests pass
python examples_llm_pipeline.py

# 2. Check git log
git log --oneline -10

# 3. Make sure files are clean
git status

# 4. Create pull request on GitHub
# Or merge locally:
git checkout main
git merge llm-integration
git push origin main
```

---

## Support Resources

- **Prompts**: `lib/llm/prompts.py` - System prompt, task prompt, critical template
- **Safety**: `lib/llm/safeguards.py` - Validation rules, banned words
- **Examples**: `examples_llm_pipeline.py` - Real usage patterns
- **API Docs**: http://localhost:8000/docs (when running)

---

**Last Updated**: March 29, 2026
**Branch**: llm-integration
**Status**: Ready for testing and deployment
