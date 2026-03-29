"""
Example usage and testing script for mhGAP LLM pipeline
Demonstrates all key scenarios: normal cases, critical cases, validation
"""

from lib.llm import (
    PatientInput,
    create_pipeline,
    process_patient,
    SafeguardValidator,
)

def example_normal_case():
    """Example: Normal depression/anxiety case"""
    print("=" * 60)
    print("EXAMPLE 1: Normal Case - Depression + Anxiety (Moderate Risk)")
    print("=" * 60)
    
    patient = PatientInput(
        household_id="HH-101",
        patient_name="Sita Kumari",
        age=28,
        age_bracket="adult",
        gender="female",
        language="en",
        risk_band="moderate",
        score=18,
        conditions=["depression", "anxiety"],
        specialist="Community Mental Health Worker",
        urgency="normal",
        suicide_flag=False,
        recommendations=[
            "Structured problem-solving",
            "Behavioral activation (resume daily activities)",
            "Weekly follow-up with health worker"
        ]
    )
    
    pipeline = create_pipeline(provider="mock")
    response = pipeline.process(patient)
    
    print(f"\nStatus: {response.status}")
    print(f"\nExplanation (Raw):")
    print(response.explanation.get("raw", "N/A"))
    print()

def example_critical_case():
    """Example: Critical case with suicide risk"""
    print("=" * 60)
    print("EXAMPLE 2: CRITICAL CASE - Suicide Risk")
    print("=" * 60)
    
    patient = PatientInput(
        household_id="HH-102",
        patient_name="Ram Bahadur",
        age=35,
        age_bracket="adult",
        gender="male",
        language="en",
        risk_band="critical",
        score=35,
        conditions=["depression", "suicide"],
        specialist="Emergency Psychiatric Services",
        urgency="immediate",
        suicide_flag=True,
        recommendations=[
            "Immediate emergency referral",
            "Do not leave person alone",
            "Contact supervisor immediately"
        ]
    )
    
    pipeline = create_pipeline(provider="mock")
    response = pipeline.process(patient)
    
    print(f"\nStatus: {response.status}")
    print(f"\nEnglish Response:")
    print(response.explanation.get("english", "N/A"))
    print(f"\nNepali Response:")
    print(response.explanation.get("nepali", "N/A"))
    print()

def example_psychosis_case():
    """Example: Psychosis with high urgency"""
    print("=" * 60)
    print("EXAMPLE 3: Psychosis Case (High Priority)")
    print("=" * 60)
    
    patient = PatientInput(
        household_id="HH-103",
        patient_name="Priya Sharma",
        age=22,
        age_bracket="adolescent",
        gender="female",
        language="nepali",
        risk_band="high",
        score=28,
        conditions=["psychosis"],
        specialist="Adolescent Mental Health Specialist",
        urgency="urgent",
        suicide_flag=False,
        recommendations=[
            "Urgent referral to mental health specialist",
            "Safety assessment for self and others",
            "Family involvement in care planning"
        ]
    )
    
    pipeline = create_pipeline(provider="mock")
    response = pipeline.process(patient)
    
    print(f"\nStatus: {response.status}")
    print(f"\nExplanation (Raw):")
    print(response.explanation.get("raw", "N/A"))
    print()

def example_low_risk_case():
    """Example: Low risk case with recommendations"""
    print("=" * 60)
    print("EXAMPLE 4: Low Risk Case (Support & Follow-up)")
    print("=" * 60)
    
    patient = PatientInput(
        household_id="HH-104",
        patient_name="Hari Man",
        age=45,
        age_bracket="adult",
        gender="male",
        language="en",
        risk_band="low",
        score=8,
        conditions=["anxiety"],
        specialist="FCHV Follow-up",
        urgency="normal",
        suicide_flag=False,
        recommendations=[
            "Maintain regular sleep schedule",
            "Engage in daily physical activity (30 minutes)",
            "Stay socially connected",
            "Practice breathing exercises"
        ]
    )
    
    pipeline = create_pipeline(provider="mock")
    response = pipeline.process(patient)
    
    print(f"\nStatus: {response.status}")
    print(f"\nExplanation (Raw):")
    print(response.explanation.get("raw", "N/A"))
    print()

def test_safeguards():
    """Test the safety validation system"""
    print("=" * 60)
    print("TEST: Safety Guardrails")
    print("=" * 60)
    
    validator = SafeguardValidator()
    
    # Test 1: Safe text
    safe_text = "The person should engage in daily physical activity and stay socially connected."
    result = validator.check_medication_content(safe_text)
    print(f"\nTest 1 - Safe text: {result}")
    
    # Test 2: Unsafe text (contains medication)
    unsafe_text = "The patient should take antidepressants and SSRIs as prescribed."
    result = validator.check_medication_content(unsafe_text)
    print(f"Test 2 - Unsafe text (medication): {result}")
    
    # Test 3: Format check
    good_format = "ENGLISH:\nSome content\n\nNEPALI:\nकुछ सामग्री"
    result = validator.check_output_format(good_format)
    print(f"Test 3 - Good format: {result}")
    
    # Test 4: Clinical language check
    clinical_text = "The patient meets diagnostic criteria for major depressive disorder with comorbid anxiety."
    result = validator.check_clinical_language(clinical_text)
    print(f"Test 4 - Clinical language: {result}")
    print()

def test_convenience_function():
    """Test the convenience function for processing"""
    print("=" * 60)
    print("TEST: Convenience Function")
    print("=" * 60)
    
    result = process_patient(
        household_id="HH-105",
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
        recommendations=["Behavioral activation", "Weekly follow-up"],
        llm_provider="mock"
    )
    
    print(f"\nStatus: {result['status']}")
    print(f"Patient: {result['data']['patient_name']}")
    print(f"Risk Band: {result['data']['risk_band']}")
    print()

if __name__ == "__main__":
    print("\n")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║      Pahad mhGAP LLM Pipeline - Example Usage                  ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print("\n")
    
    # Run all examples
    example_normal_case()
    example_critical_case()
    example_psychosis_case()
    example_low_risk_case()
    test_safeguards()
    test_convenience_function()
    
    print("\n")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                      Examples Complete                         ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print("\n")
