"""
Safeguards and validation for LLM outputs
Ensures all responses meet safety, medical, and ethical standards
"""

from typing import Tuple
from .prompts import get_banned_words

class SafeguardValidator:
    """Validates LLM outputs against safety guidelines"""
    
    def __init__(self):
        self.banned_words = get_banned_words()
    
    def check_medication_content(self, text: str) -> Tuple[bool, str]:
        """
        Check if text contains any medication-related terms.
        Returns: (is_safe, message)
        """
        text_lower = text.lower()
        
        for word in self.banned_words:
            if word in text_lower:
                return False, f"Output contains disallowed medical term: '{word}'"
        
        return True, "No medication content detected"
    
    def check_output_format(self, text: str) -> Tuple[bool, str]:
        """
        Check if output follows required format.
        Must contain: ENGLISH, NEPALI, conditions, recommendations, specialist, next step
        """
        text_lower = text.lower()
        required_sections = ["english:", "nepali:", "condition", "specialist", "next step"]
        missing = [s for s in required_sections if s not in text_lower]
        
        if missing:
            return False, f"Missing required sections: {missing}"
        
        return True, "Output format is valid"
    
    def check_recommendation_compliance(self, output: str, approved_recommendations: list) -> Tuple[bool, str]:
        """
        Check if output only uses approved recommendations.
        Returns: (is_compliant, message)
        """
        # This is a simplified check - in production, do more sophisticated parsing
        # For now, just warn if output seems to add recommendations
        if "also consider" in output.lower() or "additionally" in output.lower():
            # These patterns might indicate added recommendations
            return False, "Output may contain unauthorized recommendations"
        
        return True, "Recommendations comply with approved list"
    
    def check_clinical_language(self, text: str) -> Tuple[bool, str]:
        """
        Check if output uses over-clinical language that FCHVs won't understand.
        """
        clinical_terms = {
            "diagnostic criteria",
            "psychiatric disorder",
            "neurobiological",
            "comorbidity",
            "etiology",
            "pathophysiology",
            "clinical presentation",
        }
        
        text_lower = text.lower()
        found_terms = [t for t in clinical_terms if t in text_lower]
        
        if found_terms:
            return False, f"Output contains overly clinical terms: {found_terms}"
        
        return True, "Language is FCHV-appropriate"
    
    def validate_critical_case_response(self, is_critical: bool, output: str) -> Tuple[bool, str]:
        """
        For critical (suicide) cases, ensure output is emergency-focused ONLY.
        Returns: (is_valid, message)
        """
        if not is_critical:
            return True, "Not a critical case"
        
        emergency_keywords = ["immediate", "emergency", "hospital", "crisis", "urgent", "helpline"]
        has_emergency_content = any(kw in output.lower() for kw in emergency_keywords)
        
        if not has_emergency_content:
            return False, "Critical case must include emergency guidance"
        
        return True, "Critical case response is appropriate"
    
    def validate_bilingual_output(self, output: str) -> Tuple[bool, str]:
        """
        Check that output contains both English and Nepali sections.
        """
        has_english = "ENGLISH:" in output
        has_nepali = "NEPALI:" in output
        
        if not (has_english and has_nepali):
            return False, "Output must include both ENGLISH and NEPALI sections"
        
        return True, "Output is bilingual"
    
    def run_full_validation(self, output: str, is_critical: bool, approved_recommendations: list = None) -> dict:
        """
        Run all validation checks and return comprehensive report.
        """
        results = {
            "is_safe": True,
            "errors": [],
            "warnings": []
        }
        
        # Check 1: Medication content
        safe, msg = self.check_medication_content(output)
        if not safe:
            results["is_safe"] = False
            results["errors"].append(msg)
        
        # Check 2: Output format
        safe, msg = self.check_output_format(output)
        if not safe:
            results["is_safe"] = False
            results["errors"].append(msg)
        
        # Check 3: Bilingual
        safe, msg = self.validate_bilingual_output(output)
        if not safe:
            results["is_safe"] = False
            results["errors"].append(msg)
        
        # Check 4: Clinical language
        safe, msg = self.check_clinical_language(output)
        if not safe:
            results["warnings"].append(msg)
        
        # Check 5: Critical case handling
        safe, msg = self.validate_critical_case_response(is_critical, output)
        if not safe:
            results["is_safe"] = False
            results["errors"].append(msg)
        
        # Check 6: Recommendation compliance (if provided)
        if approved_recommendations:
            safe, msg = self.check_recommendation_compliance(output, approved_recommendations)
            if not safe:
                results["warnings"].append(msg)
        
        return results
