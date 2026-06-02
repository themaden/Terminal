"""Prompt Guard — Detects and blocks prompt injection attacks before LLM calls."""
import re

# Known injection patterns (extend as needed)
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions?", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(a\s+)?", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?", re.IGNORECASE),
    re.compile(r"act\s+as\s+(if\s+you\s+are|a)\s+", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"DAN\s+mode", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"<\|?system\|?>", re.IGNORECASE),
    re.compile(r"\[INST\]|\[/INST\]", re.IGNORECASE),
]

# Maximum allowed input length (characters) to prevent token-stuffing attacks
MAX_INPUT_LENGTH = 4000


class PromptGuard:
    """Validates LLM inputs for prompt injection and token abuse."""

    def check(self, text: str) -> tuple[bool, str]:
        """Return (is_safe, reason).

        Args:
            text: The text to validate before sending to an LLM.

        Returns:
            A tuple of (True, '') if safe, or (False, reason) if rejected.
        """
        if len(text) > MAX_INPUT_LENGTH:
            return False, f"Input too long ({len(text)} chars). Max: {MAX_INPUT_LENGTH}."

        for pattern in _INJECTION_PATTERNS:
            match = pattern.search(text)
            if match:
                return False, f"Potential prompt injection detected: '{match.group()}'"

        return True, ""

    def sanitize(self, text: str) -> str:
        """Remove injection patterns from text (best-effort sanitization).

        Prefer check() + rejection over sanitize() in production.
        """
        for pattern in _INJECTION_PATTERNS:
            text = pattern.sub("[BLOCKED]", text)
        return text[:MAX_INPUT_LENGTH]
