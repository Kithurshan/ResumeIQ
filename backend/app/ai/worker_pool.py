import logging
import os
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


def _get_worker_count(base_count: int, minimum: int = 1) -> int:
    """Return a safe worker count based on CPU power."""
    cpu_count = os.cpu_count() or 4
    safe_count = max(minimum, min(base_count, cpu_count))
    return safe_count


# Different job types use different pool sizes.
# This is simpler and helps avoid one slow scraping task blocking everything else.
parse_pool = ThreadPoolExecutor(max_workers=_get_worker_count(8))
scrape_pool = ThreadPoolExecutor(max_workers=_get_worker_count(4))
score_pool = ThreadPoolExecutor(max_workers=_get_worker_count(8))


def submit_task(func, *args, **kwargs):
    """Default task submission. Used for standard resume parsing and scoring tasks."""
    return submit_parse_task(func, *args, **kwargs)


def submit_parse_task(func, *args, **kwargs):
    """Submit a parsing or extraction task."""
    future = parse_pool.submit(func, *args, **kwargs)
    future.add_done_callback(_handle_task_result)
    return future


def submit_scrape_task(func, *args, **kwargs):
    """Submit a browser or HTTP scraping task."""
    future = scrape_pool.submit(func, *args, **kwargs)
    future.add_done_callback(_handle_task_result)
    return future


def submit_score_task(func, *args, **kwargs):
    """Submit a score/matching task."""
    future = score_pool.submit(func, *args, **kwargs)
    future.add_done_callback(_handle_task_result)
    return future


def _handle_task_result(future):
    """Log task failures without crashing the app."""
    try:
        future.result()
    except Exception as e:
        logger.error(f"Background task failed: {e}", exc_info=True)


def shutdown(wait=True):
    """Shut down all background pools gracefully."""
    logger.info(f"Shutting down worker pools (wait={wait})...")
    parse_pool.shutdown(wait=wait)
    scrape_pool.shutdown(wait=wait)
    score_pool.shutdown(wait=wait)
    logger.info("Worker pools shutdown complete.")
