"""
LLM Pipeline for Mental Health Assessment Interpretation
Handles LLM calls with safety guardrails and deterministic critical case handling
"""

from typing import Dict, Optional
from .models import PatientInput, ScreeningResponse
from .prompts import (
    get_system_prompt,
    get_task_prompt,
    get_critical_template,
)
from .safeguards import SafeguardValidator

# Import your LLM provider of choice
# Option 1: OpenAI
# from openai import OpenAI
# Option 2: Ollama (local)
# import requests

class MentalHealthLLMPipeline:
    """
    Main pipeline for LLM-based mental health assessment interpretation.
    Handles both local and API-based LLM inference with safety guarantees.
    """
    
    def __init__(self, llm_provider: str = "ollama", model_name: str = "llama2"):
        """
        Initialize the pipeline.
        
        Args:
            llm_provider: "openai", "ollama", or "mock"
            model_name: Model to use (e.g., "gpt-4", "llama2", "neural-chat")
        """
        self.llm_provider = llm_provider
        self.model_name = model_name
        self.validator = SafeguardValidator()
        
        if llm_provider == "openai":
            from openai import OpenAI
            self.client = OpenAI()
        elif llm_provider == "ollama":
            self.base_url = "http://localhost:11434"
    
    def _call_openai(self, system_prompt: str, user_message: str) -> str:
        """Call OpenAI API"""
        response = self.client.chat.completions.create(
            model=self.model_name,
            temperature=0,  # Deterministic output for safety
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )
        return response.choices[0].message.content
    
    def _call_ollama(self, system_prompt: str, user_message: str) -> str:
        """Call Ollama local LLM"""
        import requests
        
        prompt = f"{system_prompt}\n\nUser:\n{user_message}"
        
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model_name,
                "prompt": prompt,
                "temperature": 0,
                "stream": False,
            }
        )
        
        if response.status_code == 200:
            return response.json()["response"]
        else:
            raise Exception(f"Ollama error: {response.text}")
    
    def _call_mock(self, system_prompt: str, user_message: str) -> str:
        """Mock LLM for testing (returns properly formatted template)"""
        return """ENGLISH:
The person appears to be experiencing some emotional difficulty that would benefit from professional support.

Conditions:
The screening suggests possible mental health concerns that warrant further assessment by a trained professional.

Recommended actions:
- Maintain regular sleep schedule
- Engage in daily physical activity
- Stay socially connected

Specialist:
A mental health professional can provide comprehensive assessment and support.

Next step for FCHV:
Schedule a follow-up visit to provide emotional support and monitor the person's wellbeing.

Optional questions:
- How long have you been feeling this way?
- Is there someone you trust to talk to?

NEPALI:
यो व्यक्तिलाई कुनै भावनात्मक कठिनाई भएको देखिन्छ र व्यावसायिक सहायता लाभकारी हुन सक्छ।

अवस्था:
स्क्रीनिङ्गले मानसिक स्वास्थ्य सम्बन्धी सम्भावित चिन्ता सुझाव दिन्छ जसको लागि प्रशिक्षित पेशेदारको अतिरिक्त मूल्यांकन आवश्यक छ।

सुझाएको कार्य:
- नियमित नींद अनुसूची राख्नुहोस्
- दैनिक व्यायाम गर्नुहोस्
- सामाजिक रूपमा जुर्छन

विशेषज्ञ:
एक मानसिक स्वास्थ्य पेशेदारले व्यापक मूल्यांकन र सहायता प्रदान गर्न सक्छ।

FCHV को लागि अर्को कदम:
अनुवर्ती भ्रमण गरेर भावनात्मक सहयोग प्रदान गर्नुहोस् र व्यक्तिको सुस्थता निगरानी गर्नुहोस्।

वैकल्पिक प्रश्नहरू:
- तपाई यो महसुस गर्दै कति समयदेखि हुनुहुन्छ?
- तपाईसँग कुनै विश्वस्त व्यक्ति छ जससँग कुरा गर्न सक्नुहुन्छ?"""
    
    def _build_user_prompt(self, patient_data: PatientInput) -> str:
        """Build the user message for LLM"""
        data_dict = patient_data.dict()
        
        prompt = f"""
Here is the patient screening data:

Household ID: {data_dict['household_id']}
Patient Name: {data_dict['patient_name']}
Age: {data_dict['age']} ({data_dict['age_bracket']})
Gender: {data_dict['gender']}

Risk Band: {data_dict['risk_band']}
Score: {data_dict['score']}
Conditions Detected: {', '.join(data_dict['conditions'])}
Critical Concern (Suicide): {data_dict['suicide_flag']}

Recommended Specialist: {data_dict['specialist']}
Urgency Level: {data_dict['urgency']}

Approved Recommendations:
{chr(10).join(f"- {rec}" for rec in data_dict['recommendations'])}

Language Preference: {data_dict['language']}

{get_task_prompt()}
"""
        return prompt
    
    def _handle_critical_case(self, patient_data: PatientInput) -> ScreeningResponse:
        """
        Handle critical (suicide/self-harm) cases with fixed template.
        No LLM calls for critical cases - safety first.
        """
        en_text = get_critical_template("en")
        ne_text = get_critical_template("ne")
        
        return ScreeningResponse(
            structured_data=patient_data.dict(),
            explanation={
                "english": en_text,
                "nepali": ne_text
            },
            status="critical"
        )
    
    def process(self, patient_data: PatientInput) -> ScreeningResponse:
        """
        Main processing function.
        
        Args:
            patient_data: Structured patient input
            
        Returns:
            ScreeningResponse with explanation and status
        """
        
        # Step 1: Check for critical case (suicide/self-harm)
        if patient_data.suicide_flag:
            return self._handle_critical_case(patient_data)
        
        # Step 2: Build prompts
        system_prompt = get_system_prompt()
        user_prompt = self._build_user_prompt(patient_data)
        
        # Step 3: Call LLM based on provider
        try:
            if self.llm_provider == "openai":
                llm_output = self._call_openai(system_prompt, user_prompt)
            elif self.llm_provider == "ollama":
                llm_output = self._call_ollama(system_prompt, user_prompt)
            elif self.llm_provider == "mock":
                llm_output = self._call_mock(system_prompt, user_prompt)
            else:
                raise ValueError(f"Unknown LLM provider: {self.llm_provider}")
        
        except Exception as e:
            return ScreeningResponse(
                structured_data=patient_data.dict(),
                explanation={
                    "english": f"Error calling LLM: {str(e)}",
                    "nepali": f"LLM कल गर्न त्रुटि: {str(e)}"
                },
                status="error"
            )
        
        # Step 4: Validate output
        validation_result = self.validator.run_full_validation(
            llm_output,
            is_critical=False,
            approved_recommendations=patient_data.recommendations
        )
        
        if not validation_result["is_safe"]:
            # Output failed safety checks
            error_msg = "; ".join(validation_result["errors"])
            return ScreeningResponse(
                structured_data=patient_data.dict(),
                explanation={
                    "english": f"Safety validation failed: {error_msg}",
                    "nepali": f"सुरक्षा प्रमाणीकरण असफल: {error_msg}"
                },
                status="error"
            )
        
        # Step 5: Return success
        return ScreeningResponse(
            structured_data=patient_data.dict(),
            explanation={"raw": llm_output},  # For now, just return raw output
            status="success"
        )


# Convenience functions for direct use

def create_pipeline(provider: str = "mock", model: str = "llama2") -> MentalHealthLLMPipeline:
    """Factory function to create a pipeline"""
    return MentalHealthLLMPipeline(llm_provider=provider, model_name=model)

def process_patient(
    household_id: str,
    patient_name: str,
    age: int,
    age_bracket: str,
    gender: str,
    language: str,
    risk_band: str,
    score: int,
    conditions: list,
    specialist: str,
    urgency: str,
    suicide_flag: bool,
    recommendations: list,
    llm_provider: str = "mock"
) -> Dict:
    """
    Convenience function to process patient data end-to-end.
    """
    patient_data = PatientInput(
        household_id=household_id,
        patient_name=patient_name,
        age=age,
        age_bracket=age_bracket,
        gender=gender,
        language=language,
        risk_band=risk_band,
        score=score,
        conditions=conditions,
        specialist=specialist,
        urgency=urgency,
        suicide_flag=suicide_flag,
        recommendations=recommendations
    )
    
    pipeline = create_pipeline(provider=llm_provider)
    response = pipeline.process(patient_data)
    
    return {
        "status": response.status,
        "data": response.structured_data,
        "explanation": response.explanation
    }
