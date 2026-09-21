from typing import Any, Dict
from fastapi import HTTPException
from app.features.job.repository import JobRepository

VALID_STATUSES = {"Draft", "Active", "Closed"}
VALID_TYPES = {"Full-Time", "Part-Time", "Internship", "Contract"}

class JobService:
    """Enforces business rules before data reaches the repository."""

    def __init__(self):
        self.repository = JobRepository()

    def validate_job_data(self, data: Dict[str, Any]) -> None:
        """Checks business rules for creating or updating a job."""
        
        if data["status"] not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status.")

        if data.get("type") and data["type"] not in VALID_TYPES:
            raise HTTPException(status_code=400, detail="Invalid employment type.")

        salary_min = data.get("salary_min")
        salary_max = data.get("salary_max")
        if salary_min is not None and salary_max is not None and salary_min > salary_max:
            raise HTTPException(status_code=400, detail="Salary minimum cannot be greater than salary maximum.")

        if not data.get("required_skills"):
            raise HTTPException(status_code=400, detail="At least one required skill must be provided.")
