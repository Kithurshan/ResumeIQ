from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.features.dashboard.admin_repository import AdminDashboardRepository

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])
repo = AdminDashboardRepository()

@router.get("/")
def get_admin_dashboard_data(x_admin_id: Optional[str] = Header(None)):
    """Fetch all statistics and charts for the Admin Dashboard."""
    
    # We require an admin ID to make sure they are somewhat logged in
    if not x_admin_id:
        raise HTTPException(status_code=401, detail="Missing x-admin-id header")
        
    try:
        stats = repo.get_dashboard_stats()
        ai_status = repo.get_ai_status_data()
        decisions = repo.get_candidate_decisions_data()
        recent_activity = repo.get_recent_activity()
        processing_trend = repo.get_processing_trend()
        recruiter_activity = repo.get_recruiter_activity_chart()
        recent_recruiters = repo.get_recently_added_recruiters()
        recent_ai_processing = repo.get_latest_ai_processing()
        
        # Convert datetime objects in recent_activity to strings
        for act in recent_activity:
            if "created_at" in act and act["created_at"]:
                act["created_at"] = act["created_at"].isoformat()
                
        # Convert datetime objects in recent_recruiters to strings
        for rec in recent_recruiters:
            if "joined_date" in rec and rec["joined_date"]:
                rec["joined_date"] = rec["joined_date"].isoformat()
                
        return {
            "success": True,
            "data": {
                "stats": stats,
                "ai_status": ai_status,
                "decisions": decisions,
                "recent_activity": recent_activity,
                "processing_trend": processing_trend,
                "recruiter_activity": recruiter_activity,
                "recent_recruiters": recent_recruiters,
                "recent_ai_processing": recent_ai_processing
            }
        }
    except Exception as e:
        print(f"Admin Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
