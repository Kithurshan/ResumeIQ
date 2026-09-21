"""
Service handles business logic.
It validates data and calls the repository.
"""

import bcrypt
from typing import Dict, Any
from fastapi import HTTPException


class RecruiterService:
    """Handles business logic for recruiter operations."""

    def __init__(self, repository):
        """
        Initialize the service with a repository.
        
        Args:
            repository: RecruiterRepository instance
        """
        self.repository = repository

    def create_recruiter(self, recruiter_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new recruiter with validation.
        
        Args:
            recruiter_request: The recruiter data from the frontend
            
        Returns:
            The created recruiter data
            
        Raises:
            HTTPException: If validation fails or email already exists
        """
        
        # Step 1: Validate email format (basic check)
        email = recruiter_request["email"].strip().lower()
        if "@" not in email or "." not in email:
            raise HTTPException(
                status_code=400,
                detail="Please provide a valid email address."
            )

        # Step 2: Check if email already exists
        existing_recruiter = self.repository.find_by_email(email)
        if existing_recruiter:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered. Please use a different email."
            )

        # Step 3: Validate password length
        password = recruiter_request["password"]
        if len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long."
            )

        # Step 4: Hash the password using bcrypt
        # bcrypt is secure and beginner-friendly
        try:
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Error hashing password: {str(exc)}"
            )

        # Step 5: Prepare data for database
        recruiter_data = {
            "full_name": recruiter_request["fullName"].strip(),
            "email": email,
            "password_hash": password_hash,
            "phone": recruiter_request["phone"].strip(),
            "position": recruiter_request["position"].strip(),
            "office_location": recruiter_request["location"].strip(),
            "department": recruiter_request.get("department", "Human Resources"),
            "status": recruiter_request.get("status", "Active"),
            "profile_image": recruiter_request.get("profileImage"),
        }

        # Step 6: Save to database
        created_recruiter = self.repository.create_recruiter(recruiter_data)

        if not created_recruiter:
            raise HTTPException(
                status_code=500,
                detail="Failed to create recruiter. Please try again."
            )

        return created_recruiter

    def get_profile_by_id(self, recruiter_id: int) -> Dict[str, Any]:
        """Return a recruiter profile for the frontend."""
        recruiter = self.repository.get_profile_by_id(recruiter_id)

        if not recruiter:
            raise HTTPException(status_code=404, detail="Recruiter profile not found.")

        return {
            "recruiter_id": recruiter.get("recruiter_id"),
            "full_name": recruiter.get("full_name"),
            "email": recruiter.get("email"),
            "phone": recruiter.get("phone"),
            "department": recruiter.get("department"),
            "position": recruiter.get("position"),
            "office_location": recruiter.get("office_location"),
            "profile_image": recruiter.get("profile_image"),
            "status": recruiter.get("status"),
            "created_at": recruiter.get("created_at"),
            "last_login": recruiter.get("last_login"),
            "activity": recruiter.get("activity", {
                "jobs_created": 0,
                "resumes_uploaded": 0,
                "shortlisted_candidates": 0
            })
        }
    def get_all_recruiters(self) -> list:
        """Get all recruiters."""
        return self.repository.get_all_recruiters()

    def update_recruiter_status(self, recruiter_id: int, status: str):
        """Update recruiter status."""
        valid_statuses = ["Active", "Inactive"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status.")
        self.repository.update_status(recruiter_id, status)
        return {"message": f"Recruiter status updated to {status}."}

    def delete_recruiter(self, recruiter_id: int):
        """Delete recruiter."""
        self.repository.delete_recruiter(recruiter_id)
        return {"message": "Recruiter deleted successfully."}

    def update_recruiter(self, recruiter_id: int, data: dict):
        """Update recruiter details with basic validation."""
        if "email" in data:
            email = data["email"].strip().lower()
            if "@" not in email or "." not in email:
                raise HTTPException(status_code=400, detail="Please provide a valid email address.")
            
            existing = self.repository.find_by_email(email)
            if existing and existing["recruiter_id"] != recruiter_id:
                raise HTTPException(status_code=400, detail="This email is already registered to another recruiter.")
            
            data["email"] = email
            
        self.repository.update_recruiter(recruiter_id, data)
        return {"message": "Recruiter updated successfully."}
