"""
Token Bucket Rate Limiter for Aero-Agent Notification Service.
Prevents exceeding Twilio API rate limits.
"""

import threading
import time


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter.

    Tokens are added at a fixed rate. Each request consumes one token.
    If no tokens are available, the request is rejected.

    Attributes:
        rate: Number of tokens added per second.
        capacity: Maximum number of tokens in the bucket.
    """

    def __init__(self, rate: int = 10, capacity: int = 20):
        self.rate = rate
        self.capacity = capacity
        self._tokens = float(capacity)
        self._last_refill = time.monotonic()
        self._lock = threading.Lock()

    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self._last_refill
        new_tokens = elapsed * self.rate
        self._tokens = min(self.capacity, self._tokens + new_tokens)
        self._last_refill = now

    def acquire(self) -> bool:
        """
        Try to acquire a single token.

        Returns:
            True if a token was acquired, False if rate limit is exceeded.
        """
        with self._lock:
            self._refill()
            if self._tokens >= 1.0:
                self._tokens -= 1.0
                return True
            return False

    def available_tokens(self) -> float:
        """Return the current number of available tokens."""
        with self._lock:
            self._refill()
            return round(self._tokens, 2)

    def wait_and_acquire(self, timeout: float = 5.0) -> bool:
        """
        Wait until a token is available or timeout expires.

        Args:
            timeout: Maximum seconds to wait.

        Returns:
            True if a token was acquired within the timeout.
        """
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self.acquire():
                return True
            # Sleep for a fraction of the token generation interval
            time.sleep(1.0 / self.rate / 2)
        return False
