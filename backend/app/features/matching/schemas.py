from typing import List, Optional

from pydantic import BaseModel, Field


class CandidateMatchRequest(BaseModel):
    """
    Information extracted from one candidate's resume.
    """

    candidate_id: Optional[int] = None

    name: Optional[str] = None

    skills: List[str] = Field(default_factory=list)

    education: List[dict] = Field(default_factory=list)

    work_experience: List[dict] = Field(default_factory=list)

    projects: List[dict] = Field(default_factory=list)

    summary: Optional[str] = None


class SkillMatch(BaseModel):
    skill: str
    matched: bool
    similarity: float


class MatchResponse(BaseModel):
    candidate_id: Optional[int]

    candidate_name: Optional[str]

    semantic_score: float

    skill_score: float

    education_score: float

    experience_score: float

    project_score: float

    final_score: float

    matched_skills: List[str]

    missing_skills: List[str]

    skill_matches: List[SkillMatch]

    recommendation: str