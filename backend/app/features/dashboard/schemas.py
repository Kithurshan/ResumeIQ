# ============================================================
# dashboard/models.py
# These are the data shapes (blueprints) for what the API returns.
# FastAPI uses these to automatically validate + document the responses.
# ============================================================

from pydantic import BaseModel
from typing import List, Optional


# ── Summary cards at the top of the dashboard ──────────────
class DashboardStats(BaseModel):
    total_jobs: int           # Total job posts ever created
    active_jobs: int          # Jobs with status = 'Active'
    shortlisted_count: int    # Total candidates shortlisted
    pending_reviews: int      # Candidates still in 'Pending' status


# ── One row in the "Candidate Status" doughnut chart ───────
class StatusBreakdown(BaseModel):
    status: str     # e.g. "Shortlisted", "Rejected", "Pending"
    count: int      # How many candidates have this status


# ── One point in the "Monthly Applications" line chart ─────
class MonthlyTrend(BaseModel):
    month: str      # e.g. "Jan 2026"
    count: int      # Number of resumes uploaded that month


# ── One bar in the "Applications per Job" bar chart ────────
class JobApplicationCount(BaseModel):
    job_title: str  # Job name
    count: int      # Number of resumes applied for that job


# ── One row in the "Recent AI Rankings" table ──────────────
class RecentRanking(BaseModel):
    candidate_id: int
    candidate_name: str
    job_title: str
    rank_position: int
    overall_score: float
    status: str       # Pending / Shortlisted / Rejected etc.


# ── One row in the "Active Job Listings" table ─────────────
class ActiveJobListing(BaseModel):
    job_id: int
    job_title: str
    applicant_count: int
    application_deadline: Optional[str]   # formatted as a string e.g. "2026-09-15"
    status: str


# ── The final combined response for the whole dashboard ────
class DashboardResponse(BaseModel):
    success: bool = True
    stats: DashboardStats
    status_breakdown: List[StatusBreakdown]
    monthly_trend: List[MonthlyTrend]
    apps_per_job: List[JobApplicationCount]
    recent_rankings: List[RecentRanking]
    active_jobs: List[ActiveJobListing]
