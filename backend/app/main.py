from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.features.training.router import router as retrain_router
from app.features.job.router import router as jobs_router
from app.features.matching.router import router as matching_router
from app.features.ranking.router import router as rankings_router
from app.features.auth.router import router as recruiter_auth_router
from app.features.recruiter.router import router as recruiters_router
from app.features.admin.router import router as admins_router
from app.features.notification.admin_router import router as admin_notifications_router
from app.features.dashboard.admin_router import router as admin_dashboard_router
from app.features.dashboard.router import router as dashboard_router
from app.features.notification.router import router as notifications_router
from app.features.setting.router import router as settings_router
from app.features.resume.router import router as resumes_router


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

from contextlib import asynccontextmanager
import asyncio
import logging
import app.ai.worker_pool as worker_pool
from app.features.ranking.repository import RankingRepository

logger = logging.getLogger(__name__)

async def deadline_checker_task():
    """
    Runs continuously in the background while the FastAPI server is alive.
    Checks the job deadlines every hour and auto-rejects Pending candidates
    for jobs that have expired.
    """
    repo = RankingRepository()
    while True:
        try:
            rejected_count = repo.auto_reject_expired_candidates()
            if rejected_count > 0:
                logger.info(f"Auto-rejected {rejected_count} pending candidates due to job deadline expiry.")
                
            reminder_count = repo.send_deadline_reminders()
            if reminder_count > 0:
                logger.info(f"Sent {reminder_count} job deadline reminders.")
        except Exception as e:
            logger.error(f"Error in deadline checker task: {e}")
            
        # Wait 1 hour (3600 seconds) before checking again
        await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background deadline checker task
    checker_task = asyncio.create_task(deadline_checker_task())
    yield
    # Shutdown: Cancel the checker task and shutdown the thread pool
    checker_task.cancel()
    worker_pool.shutdown(wait=True)

app = FastAPI(
    title="ResumeIQ ML API",
    version="1.0.0",
    lifespan=lifespan,
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# REGISTER ROUTERS
# ============================================================

# Machine Learning / model retraining
app.include_router(
    retrain_router,
    prefix="/api/ml",
    tags=["Machine Learning"],
)


# Recruiter Authentication
app.include_router(
    recruiter_auth_router,
    tags=["Recruiter Auth"],
)


# Recruiter Management (Add, Edit, Delete, List)
app.include_router(
    recruiters_router,
    prefix="/api",
    tags=["Recruiter Management"],
)


# Admin dashboard routes
app.include_router(
    admin_dashboard_router,
    prefix="/api",
)

# Admin authentication (simple)
app.include_router(
    admins_router,
    prefix="/api",
    tags=["Admin Auth"],
)


# Recruiter Job Description CRUD
app.include_router(
    jobs_router,
    prefix="/api",
    tags=["Recruiter Jobs"],
)

app.include_router(
    settings_router,
    prefix="/api",
    tags=["Settings"],
)

app.include_router(
    resumes_router,
    prefix="/api",
    tags=["Resumes"],
)


# AI Candidate Matching
app.include_router(
    matching_router,
    prefix="/api",
    tags=["AI Candidate Matching"],
)


# AI Candidate Rankings
app.include_router(
    rankings_router,
    prefix="/api",
    tags=["AI Candidate Rankings"],
)


# Resume Upload & Parsing
from app.features.resume.router import router as resumes_router
app.include_router(
    resumes_router,
    prefix="/api/resumes",
    tags=["Resumes"],
)


# Recruiter Dashboard
app.include_router(
    dashboard_router,
    prefix="/api",
    tags=["Recruiter Dashboard"],
)

# Notifications
app.include_router(
    notifications_router,
    prefix="/api",
)
app.include_router(
    admin_notifications_router,
    prefix="/api",
)

# System Settings
from app.features.setting.router import router as settings_router
app.include_router(
    settings_router,
    prefix="/api",
)



# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def health_check():
    return {
        "status": "success",
        "message": "ResumeIQ ML API is running!",
    }


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
    )