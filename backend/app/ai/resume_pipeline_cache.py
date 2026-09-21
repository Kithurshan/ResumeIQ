import time
from threading import Lock
from typing import Any, Dict, Optional


class SimpleResumeCache:
    """Small in-memory cache for expensive resume analysis results.

    This is beginner-friendly and good for a prototype or small production setup.
    It stores values with a TTL so repeated LinkedIn or portfolio URLs do not
    get analyzed again and again.
    """

    def __init__(self, ttl_seconds: int = 1800):
        self.ttl_seconds = ttl_seconds
        self._data: Dict[str, Dict[str, Any]] = {}
        self._lock = Lock()

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return None

            if now - item["saved_at"] > self.ttl_seconds:
                del self._data[key]
                return None

            return item["value"]

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._data[key] = {
                "value": value,
                "saved_at": time.time(),
            }

    def clear(self) -> None:
        with self._lock:
            self._data.clear()
