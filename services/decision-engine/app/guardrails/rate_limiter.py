"""Rate Limiter — Token-bucket based in-memory rate limiting for API endpoints."""
import time
from collections import defaultdict
from threading import Lock
from typing import Tuple


class RateLimiter:
    """Simple token-bucket rate limiter.

    Args:
        max_requests: Maximum allowed requests per window.
        window_seconds: Time window in seconds.
    """

    def __init__(self, max_requests: int = 60, window_seconds: float = 60.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str) -> Tuple[bool, int]:
        """Check whether the given key (e.g., IP, API key) is within rate limits.

        Returns:
            (allowed, remaining) — True if the request is allowed.
        """
        now = time.monotonic()
        window_start = now - self.window_seconds

        with self._lock:
            # Evict timestamps outside the current window
            self._buckets[key] = [
                ts for ts in self._buckets[key] if ts > window_start
            ]

            count = len(self._buckets[key])
            if count >= self.max_requests:
                return False, 0

            self._buckets[key].append(now)
            return True, self.max_requests - count - 1

    def reset(self, key: str) -> None:
        """Clear rate-limit state for a given key (useful in tests)."""
        with self._lock:
            self._buckets.pop(key, None)
