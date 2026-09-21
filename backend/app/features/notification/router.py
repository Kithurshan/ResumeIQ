from fastapi import APIRouter, HTTPException, Header, status
from typing import List, Optional
from app.features.notification.schemas import NotificationSettingsUpdate
from app.features.notification.repository import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["Notifications"])
repo = NotificationRepository()

def get_recruiter_id(x_recruiter_id: Optional[str] = Header(None)) -> int:
    if not x_recruiter_id:
        raise HTTPException(status_code=401, detail="Missing x-recruiter-id header")
    return int(x_recruiter_id)

@router.get("/")
def fetch_notifications(recruiter_id: int = Header(None, alias="x-recruiter-id")):
    rid = get_recruiter_id(recruiter_id)
    notifications = repo.get_notifications(rid)
    # Convert dates to ISO strings for frontend
    for n in notifications:
        if "created_at" in n and n["created_at"]:
            n["created_at"] = n["created_at"].isoformat()
    return {"success": True, "data": notifications}

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, recruiter_id: int = Header(None, alias="x-recruiter-id")):
    rid = get_recruiter_id(recruiter_id)
    repo.mark_as_read(notification_id, rid)
    return {"success": True}

@router.put("/read-all")
def mark_all_read(recruiter_id: int = Header(None, alias="x-recruiter-id")):
    rid = get_recruiter_id(recruiter_id)
    repo.mark_all_as_read(rid)
    return {"success": True}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, recruiter_id: int = Header(None, alias="x-recruiter-id")):
    rid = get_recruiter_id(recruiter_id)
    repo.delete_notification(notification_id, rid)
    return {"success": True}

@router.get("/settings")
def get_settings(recruiter_id: int = Header(None, alias="x-recruiter-id")):
    rid = get_recruiter_id(recruiter_id)
    settings = repo.get_settings(rid)
    if settings and "updated_at" in settings and settings["updated_at"]:
        settings["updated_at"] = settings["updated_at"].isoformat()
    return {"success": True, "data": settings}

@router.put("/settings")
def update_settings(payload: NotificationSettingsUpdate, recruiter_id: int = Header(None, alias="x-recruiter-id")):
    rid = get_recruiter_id(recruiter_id)
    repo.update_settings(rid, payload.dict())
    return {"success": True}
