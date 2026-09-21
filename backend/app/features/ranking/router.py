from fastapi import APIRouter, Depends, Query, HTTPException, Header
from typing import Optional

from app.features.ranking.service import RankingService
from app.features.ranking.schemas import RankingListResponse, CandidateDetailedResponse, CandidateStatusUpdateRequest, DecidedCandidatesResponse
from app.features.activity.service import ActivityLogService
from app.features.notification.repository import NotificationRepository

router = APIRouter(
    prefix="/rankings",
    tags=["AI Candidate Rankings"],
)

ranking_service = RankingService()
activity_logger = ActivityLogService()
notif_repo = NotificationRepository()

@router.get(
    "/jobs/{job_id}", 
    response_model=RankingListResponse,
    summary="Get AI Candidate Rankings for a Job"
)
async def get_job_rankings(
    job_id: int,
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page")
):
    """
    Fetches the AI-ranked list of candidates for a specific job position.
    The results are strictly ordered by their AI `rank_position` (1 is best).
    Supports pagination.
    """
    try:
        response = ranking_service.get_job_rankings(job_id=job_id, page=page, page_size=page_size)
        return response
    except HTTPException:
        # Re-raise FastApi HTTPExceptions (like 404 Not Found) directly
        raise
    except Exception as error:
        # Catch any unexpected server errors and format cleanly
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while fetching rankings: {str(error)}"
        )

@router.get(
    "/jobs/{job_id}/candidates/{candidate_id}", 
    response_model=CandidateDetailedResponse,
    summary="Get Detailed Candidate Profile"
)
async def get_candidate_details(job_id: int, candidate_id: int):
    """
    Fetches the full profile for a candidate, including extracted resume data,
    all AI component scores, and contact information.
    """
    try:
        return ranking_service.get_candidate_details(job_id, candidate_id)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while fetching candidate details: {str(error)}"
        )

@router.put(
    "/jobs/{job_id}/candidates/{candidate_id}/status",
    summary="Update Candidate Selection Status"
)
async def update_candidate_status(
    job_id: int, 
    candidate_id: int, 
    payload: CandidateStatusUpdateRequest,
    x_recruiter_id: Optional[str] = Header(default=None)
):
    """
    Updates the candidate's selection status (e.g. Shortlisted, Waitlisted, Rejected) for a specific job.
    """
    if not x_recruiter_id:
        raise HTTPException(status_code=401, detail="Missing x-recruiter-id header")
    try:
        recruiter_id = int(x_recruiter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recruiter id format")
        
    try:
        result = ranking_service.update_candidate_status(job_id, candidate_id, payload.status, recruiter_id)

        # Log candidate status update (Shortlist, Waitlist, Reject)
        action_map = {
            "Shortlisted": "CANDIDATE_SHORTLIST",
            "Waitlisted": "CANDIDATE_WAITLIST",
            "Rejected": "CANDIDATE_REJECT",
        }
        action = action_map.get(payload.status, f"CANDIDATE_STATUS_{payload.status.upper()}")

        activity_logger.log_recruiter_action(
            recruiter_id=recruiter_id,
            action=action,
            module="Rankings",
        )

        # Notification: Candidate status updated
        notif_repo.create_notification(
            recruiter_id=recruiter_id,
            title=f"Candidate {payload.status}",
            message=f"Candidate #{candidate_id} for Job #{job_id} has been marked as '{payload.status}'."
        )

        return result
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while updating status: {str(error)}"
        )

@router.get(
    "/decisions",
    response_model=DecidedCandidatesResponse,
    summary="Get Shortlisted, Waitlisted, and Rejected Candidates"
)
async def get_decided_candidates():
    """
    Fetches all candidates who have a decision status for the Shortlist Page.
    """
    try:
        return ranking_service.get_decided_candidates()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while fetching decisions: {str(error)}"
        )
