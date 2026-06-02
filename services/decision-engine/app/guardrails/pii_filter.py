"""PII Filter — Masks personally identifiable information before logging or LLM calls."""
import re
from typing import Any

# Regex patterns for common PII types
_PATTERNS = {
    "email": re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.IGNORECASE),
    "phone": re.compile(r"\+?\d[\d\s\-().]{7,}\d"),
    "credit_card": re.compile(r"\b(?:\d[ \-]?){13,16}\b"),
    "passport": re.compile(r"\b[A-Z]{1,2}\d{6,9}\b"),
    "national_id": re.compile(r"\b\d{11}\b"),  # Turkish TC Kimlik No
}


class PIIFilter:
    """Masks PII in strings and dicts before they are logged or sent to an LLM."""

    def mask(self, text: str) -> str:
        """Replace all detected PII tokens with redacted placeholders."""
        for label, pattern in _PATTERNS.items():
            text = pattern.sub(f"[REDACTED_{label.upper()}]", text)
        return text

    def mask_dict(self, data: dict) -> dict:
        """Recursively mask PII in all string values of a dict."""
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = self.mask(value)
            elif isinstance(value, dict):
                result[key] = self.mask_dict(value)
            elif isinstance(value, list):
                result[key] = [
                    self.mask(item) if isinstance(item, str)
                    else self.mask_dict(item) if isinstance(item, dict)
                    else item
                    for item in value
                ]
            else:
                result[key] = value
        return result

    def is_safe(self, text: str) -> bool:
        """Return True if no PII is detected in the text."""
        return not any(p.search(text) for p in _PATTERNS.values())
