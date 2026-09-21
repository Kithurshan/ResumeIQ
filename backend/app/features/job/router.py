from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Query

from app.features.job.schemas import JobCreateRequest, JobUpdateRequest
from app.features.job.service import JobService
from app.features.activity.service import ActivityLogService
from app.features.notification.repository import NotificationRepository

# Create the router for these endpoints
router = APIRouter(prefix="/jobs", tags=["Recruiter Jobs"])

# Create shared instances
job_service = JobService()
activity_logger = ActivityLogService()
notif_repo = NotificationRepository()


# ── GET /api/jobs/stats ───────────────────────────────────────────────────────
@router.get("/stats", summary="Get job count statistics")
def get_job_stats(recruiter_id: int = Header(..., alias="X-Recruiter-ID")):
    return job_service.repository.get_stats(recruiter_id)


# ── GET /api/jobs ─────────────────────────────────────────────────────────────
@router.get("", summary="List all jobs (with search, filter, sort, pagination)")
def list_jobs(
    recruiter_id: int = Header(..., alias="X-Recruiter-ID"),
    search: Optional[str] = Query(None, description="Search by job title or department"),
    department: Optional[str] = Query(None, description="Filter by department name"),
    employment_type: Optional[str] = Query(None, alias="type", description="Filter by employment type"),
    status: Optional[str] = Query(None, description="Filter by status: Active, Draft, or Closed"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort: str = Query("newest")
):
    result = job_service.repository.list_jobs(
        recruiter_id=recruiter_id,
        search=search, department=department, employment_type=employment_type,
        status=status, page=page, page_size=page_size, sort=sort
    )

    total = result["total"]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": result["items"],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": total_pages,
    }


# ── GET /api/jobs/{job_id} ────────────────────────────────────────────────────
@router.get("/{job_id}", summary="Get a single job by ID")
def get_job(job_id: int, recruiter_id: int = Header(..., alias="X-Recruiter-ID")):
    
    # 🌟 BEGINNER FRIENDLY DEMONSTRATION OF BINARY SEARCH 🌟
    # We fetch all jobs and use binary search instead of SQL querying by ID.
    from app.utils.binary_search import binary_search
    
    all_jobs_result = job_service.repository.list_jobs(
        recruiter_id=recruiter_id, search=None, department=None, 
        employment_type=None, status=None, page=1, page_size=10000, sort="oldest" 
    )
    
    sorted_jobs = sorted(all_jobs_result["items"], key=lambda j: j["id"])
    
    index = binary_search(sorted_list=sorted_jobs, target=job_id, key=lambda j: j["id"])
    
    job = sorted_jobs[index] if index != -1 else None

    if not job:
        raise HTTPException(
            status_code=404, detail=f"Job with ID {job_id} was not found or does not belong to you."
        )

    return job


# ── POST /api/jobs ────────────────────────────────────────────────────────────
@router.post("", status_code=201, summary="Create a new job")
def create_job(payload: JobCreateRequest, recruiter_id: int = Header(..., alias="X-Recruiter-ID")):
    data = payload.dict(by_alias=False)
    job_service.validate_job_data(data)
    created = job_service.repository.create_job(recruiter_id, data)

    # Log job creation
    activity_logger.log_recruiter_action(
        recruiter_id=recruiter_id,
        action="CREATE_JOB",
        module="Jobs",
    )

    # Notification: Job created
    notif_repo.create_notification(
        recruiter_id=recruiter_id,
        title="Job Created",
        message=f"New job '{data.get('title', '')}' has been created successfully."
    )

    return created


# ── PUT /api/jobs/{job_id} ────────────────────────────────────────────────────
@router.put("/{job_id}", summary="Update (replace) an existing job")
def update_job(job_id: int, payload: JobUpdateRequest, recruiter_id: int = Header(..., alias="X-Recruiter-ID")):
    data = payload.dict(by_alias=False)
    job_service.validate_job_data(data)
    
    updated_job = job_service.repository.update_job(job_id, recruiter_id, data)
    if not updated_job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

    # Log job update
    activity_logger.log_recruiter_action(
        recruiter_id=recruiter_id,
        action="UPDATE_JOB",
        module="Jobs",
    )

    # Notification: Job updated
    notif_repo.create_notification(
        recruiter_id=recruiter_id,
        title="Job Updated",
        message=f"Job #{job_id} has been updated successfully."
    )

    return updated_job


# ── DELETE /api/jobs/{job_id} ─────────────────────────────────────────────────
@router.delete("/{job_id}", summary="Delete a job permanently")
def delete_job(job_id: int, recruiter_id: int = Header(..., alias="X-Recruiter-ID")):
    was_deleted = job_service.repository.delete_job(job_id, recruiter_id)
    if not was_deleted:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

    # Log job deletion
    activity_logger.log_recruiter_action(
        recruiter_id=recruiter_id,
        action="DELETE_JOB",
        module="Jobs",
    )

    # Notification: Job deleted
    notif_repo.create_notification(
        recruiter_id=recruiter_id,
        title="Job Deleted",
        message=f"Job #{job_id} has been permanently deleted."
    )

    return {"message": "Job deleted successfully.", "id": job_id}
