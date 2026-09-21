from typing import Optional
from app.features.activity.repository import ActivityLogRepository


class ActivityLogService:
    """
    Simple service that provides easy-to-use methods for logging system activities.

    Usage:
        logger = ActivityLogService()
        logger.log_recruiter_action(recruiter_id=10, action="LOGIN", module="Auth")
        logger.log_admin_action(admin_id=1, action="CREATE_RECRUITER", module="Recruiters")
    """

    def __init__(self):
        self.repository = ActivityLogRepository()

    # ── Recruiter Actions ─────────────────────────────────────────────────────

    def log_recruiter_action(
        self,
        recruiter_id: int,
        action: str,
        module: str,
        status: str = "SUCCESS",
    ) -> None:
        """Log an action performed by a recruiter."""
        self.repository.create_log(
            action=action,
            module=module,
            status=status,
            recruiter_id=recruiter_id,
            admin_id=None,
        )

    # ── Admin Actions ─────────────────────────────────────────────────────────

    def log_admin_action(
        self,
        admin_id: int,
        action: str,
        module: str,
        status: str = "SUCCESS",
    ) -> None:
        """Log an action performed by an administrator."""
        self.repository.create_log(
            action=action,
            module=module,
            status=status,
            recruiter_id=None,
            admin_id=admin_id,
        )
