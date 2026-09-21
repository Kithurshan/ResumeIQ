from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RecruiterCreateRequest(BaseModel):
    """
    Model for creating a new recruiter.
    This defines what data we expect from the frontend.
    """
    fullName: str = Field(..., min_length=2, max_length=255, description="Recruiter's full name")
    email: EmailStr = Field(..., description="Unique email address")
    phone: str = Field(..., min_length=5, max_length=50, description="Phone number")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    position: str = Field(..., min_length=2, max_length=150, description="Job position")
    location: str = Field(..., min_length=2, max_length=255, description="Office location")
    department: str = Field(default="Human Resources", max_length=150, description="Department")
    status: str = Field(default="Active", description="Status (Active or Inactive)")
    profileImage: Optional[str] = Field(default=None, description="Profile image as base64 or URL (optional)")


class RecruiterResponse(BaseModel):
    """
    Model for the response when a recruiter is created.
    This is what we send back to the frontend.
    """
    recruiter_id: int
    full_name: str
    email: str
    phone: str
    position: str
    office_location: str
    department: str
    status: str
    created_at: str

    class Config:
        from_attributes = True
