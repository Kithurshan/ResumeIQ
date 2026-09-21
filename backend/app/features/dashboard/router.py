# ============================================================
# dashboard/routes.py
# The API endpoint for the recruiter dashboard.
# This is beginner-friendly: one endpoint that returns everything.
# ============================================================

from fastapi import APIRouter, Header, HTTPException
from typing import Optional

from app.features.dashboard.repository import DashboardRepository
from app.features.dashboard.schemas import (
    DashboardResponse,
    DashboardStats,
    StatusBreakdown,
    MonthlyTrend,
    JobApplicationCount,
    RecentRanking,
    ActiveJobListing,
)

# Create the router with a /dashboard prefix
router = APIRouter(
    prefix="/dashboard",
    tags=["Recruiter Dashboard"],
)

# Create one instance of our repository to run database queries
repository = DashboardRepository()


@router.get(
    "",
    response_model=DashboardResponse,
    summary="Get all dashboard data for the recruiter"
)
async def get_dashboard(x_recruiter_id: Optional[str] = Header(default=None)):
    """
    Returns everything the recruiter dashboard needs in one API call:
    - 4 summary stat cards (total jobs, active, shortlisted, pending)
    - Candidate status breakdown for the doughnut chart
    - Monthly applications trend for the line chart
    - Applications per job for the bar chart
    - Recent AI rankings table
    - Active job listings table
    """

    # Step 1: Validate the recruiter ID from the request header
    if not x_recruiter_id:
        raise HTTPException(status_code=401, detail="Missing x-recruiter-id header")
    try:
        recruiter_id = int(x_recruiter_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recruiter ID format")

    try:
        # Step 2: Run all 6 database queries
        raw_stats           = repository.get_stats(recruiter_id)
        raw_status          = repository.get_status_breakdown(recruiter_id)
        raw_monthly         = repository.get_monthly_trend(recruiter_id)
        raw_apps_per_job    = repository.get_apps_per_job(recruiter_id)
        raw_rankings        = repository.get_recent_rankings(recruiter_id)
        raw_active_jobs     = repository.get_active_jobs(recruiter_id)

        # Step 3: Build the stats card object
        stats = DashboardStats(
            total_jobs=raw_stats.get("total_jobs", 0),
            active_jobs=raw_stats.get("active_jobs", 0),
            shortlisted_count=raw_stats.get("shortlisted_count", 0),
            pending_reviews=raw_stats.get("pending_reviews", 0),
        )

        # Step 4: Build the doughnut chart list
        status_breakdown = [
            StatusBreakdown(status=row["status"], count=row["count"])
            for row in raw_status
        ]

        # Step 5: Build the monthly trend list
        monthly_trend = [
            MonthlyTrend(month=row["month"], count=row["count"])
            for row in raw_monthly
        ]

        # Step 6: Build the bar chart list
        apps_per_job = [
            JobApplicationCount(job_title=row["job_title"], count=row["count"])
            for row in raw_apps_per_job
        ]

        # Step 7: Build the recent rankings table
        recent_rankings = [
            RecentRanking(
                candidate_id=row["candidate_id"],
                candidate_name=row["candidate_name"],
                job_title=row["job_title"],
                rank_position=row["rank_position"],
                overall_score=row["overall_score"],
                status=row["status"],
            )
            for row in raw_rankings
        ]

        # Step 8: Build the active jobs table
        active_jobs = [
            ActiveJobListing(
                job_id=row["job_id"],
                job_title=row["job_title"],
                applicant_count=row["applicant_count"],
                application_deadline=row.get("application_deadline"),
                status=row["status"],
            )
            for row in raw_active_jobs
        ]

        # Step 9: Return everything combined
        return DashboardResponse(
            success=True,
            stats=stats,
            status_breakdown=status_breakdown,
            monthly_trend=monthly_trend,
            apps_per_job=apps_per_job,
            recent_rankings=recent_rankings,
            active_jobs=active_jobs,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching dashboard data: {str(error)}"
        )
