from typing import Any, Dict
from fastapi import HTTPException
import math

from app.features.ranking.repository import RankingRepository
from app.features.ranking.schemas import (
    RankingListResponse, 
    CandidateRankingItem, 
    CandidateScores, 
    PaginationMetadata,
    CandidateDetailedResponse,
    ExtractedEducation,
    ExtractedExperience
)

class RankingService:
    """
    Business logic layer for AI Candidate Rankings.
    Formats and processes raw data from the repository into API response models.
    """
    
    def __init__(self):
        self.repository = RankingRepository()

    def get_job_rankings(self, job_id: int, page: int = 1, page_size: int = 10) -> RankingListResponse:
        """
        Retrieves the ranked list of candidates for a job and formats it into the 
        RankingListResponse Pydantic model with full pagination metadata.
        """
        # Validate inputs
        if page < 1:
            raise HTTPException(status_code=400, detail="Page number must be 1 or greater.")
        if page_size < 1 or page_size > 100:
            raise HTTPException(status_code=400, detail="Page size must be between 1 and 100.")
            
        # Verify the job exists first
        if not self.repository.check_job_exists(job_id):
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found.")

        # Fetch paginated raw data from database
        raw_results, total_items = self.repository.get_job_rankings_paginated(job_id, page, page_size)
        
        # Format the raw database rows into our structured Pydantic models
        ranking_items = []
        for row in raw_results:
            
            # Extract scores sub-object
            scores = CandidateScores(
                skill_score=row.get("skill_score") or 0.0,
                experience_score=row.get("experience_score") or 0.0,
                education_score=row.get("education_score") or 0.0,
                certification_score=row.get("certification_score") or 0.0,
                semantic_score=row.get("semantic_score") or 0.0,
                project_score=row.get("project_score") or 0.0,
                portfolio_score=row.get("portfolio_score") or 0.0,
                linkedin_score=row.get("linkedin_score") or 0.0,
                overall_score=row.get("overall_score") or 0.0,
                xgboost_probability=row.get("xgboost_probability")
            )
            
            # Construct main item
            item = CandidateRankingItem(
                ranking_id=row["ranking_id"],
                candidate_id=row["candidate_id"],
                job_id=row["job_id"],
                rank_position=row["rank_position"],
                
                candidate_name=row["candidate_name"],
                candidate_email=row["candidate_email"],
                candidate_phone=row["candidate_phone"],
                
                resume_id=row.get("resume_id"),
                resume_status=row.get("resume_status"),
                
                scores=scores,
                recommendation=row.get("recommendation"),
                selection_status=row.get("selection_status", "Pending"),
                created_at=row["created_at"]
            )
            ranking_items.append(item)
            
        # Calculate pagination metadata
        total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1
        
        pagination = PaginationMetadata(
            total_items=total_items,
            total_pages=total_pages,
            current_page=page,
            page_size=page_size,
            has_next=page < total_pages,
            has_previous=page > 1
        )
        
        return RankingListResponse(
            success=True,
            message=f"Retrieved {len(ranking_items)} candidates for job {job_id}.",
            data=ranking_items,
            pagination=pagination
        )

    def get_candidate_details(self, job_id: int, candidate_id: int) -> CandidateDetailedResponse:
        """
        Retrieves the complete details for a single candidate for a specific job,
        including extracted resume data and scores.
        """
        raw_data = self.repository.get_candidate_detailed_ranking(job_id, candidate_id)
        if not raw_data:
            raise HTTPException(status_code=404, detail="Candidate ranking not found for this job.")
            
        scores = CandidateScores(
            skill_score=raw_data.get("skill_score") or 0.0,
            experience_score=raw_data.get("experience_score") or 0.0,
            education_score=raw_data.get("education_score") or 0.0,
            certification_score=raw_data.get("certification_score") or 0.0,
            semantic_score=raw_data.get("semantic_score") or 0.0,
            project_score=raw_data.get("project_score") or 0.0,
            portfolio_score=raw_data.get("portfolio_score") or 0.0,
            linkedin_score=raw_data.get("linkedin_score") or 0.0,
            overall_score=raw_data.get("overall_score") or 0.0,
            xgboost_probability=raw_data.get("xgboost_probability")
        )
        
        education = [ExtractedEducation(**edu) for edu in raw_data.get("education", [])]
        experience = [ExtractedExperience(**exp) for exp in raw_data.get("experience", [])]
        
        return CandidateDetailedResponse(
            candidate_id=raw_data["candidate_id"],
            job_id=raw_data["job_id"],
            candidate_name=raw_data["candidate_name"],
            job_title=raw_data["job_title"],
            selection_status=raw_data["selection_status"],
            rank_position=raw_data["rank_position"],
            recommendation=raw_data.get("recommendation"),
            email=raw_data.get("candidate_email"),
            phone=raw_data.get("candidate_phone"),
            location=raw_data.get("address"),
            resume_id=raw_data.get("resume_id"),
            linkedin_url=raw_data.get("linkedin_url"),
            portfolio_url=raw_data.get("portfolio_url"),
            education=education,
            experience=experience,
            skills=raw_data.get("skills", []),
            scores=scores
            ,
            linkedin_profile=raw_data.get("linkedin_parsed"),
            portfolio_profile=raw_data.get("portfolio_parsed")
        )
        
    def update_candidate_status(self, job_id: int, candidate_id: int, status: str, recruiter_id: int):
        """
        Updates the recruiter's selection status for a candidate.
        """
        valid_statuses = ["Pending", "Shortlisted", "Waitlisted", "Rejected"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
            
        success = self.repository.update_candidate_selection_status(job_id, candidate_id, status, recruiter_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update candidate status.")
            
        return {"success": True, "message": f"Candidate status updated to {status}."}

    def get_decided_candidates(self) -> Dict[str, Any]:
        """
        Retrieves candidates with a decision status.
        """
        raw_results = self.repository.get_decided_candidates()
        
        # We can format the data to match the UI expectations exactly
        from app.features.ranking.schemas import DecidedCandidateItem
        items = []
        for row in raw_results:
            item = DecidedCandidateItem(
                id=row["id"],
                name=row["name"],
                job_id=row["job_id"],
                job=row["job"],
                score=row["score"],
                recommendation=row.get("recommendation"),
                status=row["status"],
                decisionDate=row.get("decision_date") or ""
            )
            items.append(item)
            
        return {
            "success": True,
            "data": items
        }
