from datetime import date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class JobCreateRequest(BaseModel):
    """Data validation model for creating a new job."""
    
    title: str = Field(..., min_length=2, max_length=255, alias="title")
    deadline: date
    description: str = Field(..., min_length=1, alias="jobDescription")

    department: Optional[str] = Field(None, max_length=150)
    location: Optional[str] = Field(None, max_length=255)
    type: Optional[str] = Field(None, alias="employmentType", max_length=100)
    salary_min: Optional[float] = Field(None, ge=0, alias="salaryMin")
    salary_max: Optional[float] = Field(None, ge=0, alias="salaryMax")
    responsibilities: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list, alias="requiredSkills")
    preferred_skills: List[str] = Field(default_factory=list, alias="preferredSkills")
    experience: Optional[str] = Field(None, alias="experienceRequired")
    education: Optional[str] = None
    vacancies: int = Field(1, ge=1)
    status: str = "Draft"

    model_config = ConfigDict(populate_by_name=True)


class JobUpdateRequest(JobCreateRequest):
    """Data validation model for updating an existing job (same rules as create)."""
    pass
