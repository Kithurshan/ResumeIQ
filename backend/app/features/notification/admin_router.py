from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from app.features.notification.repository import NotificationRepository

router = APIRouter(prefix="/admin/notifications", tags=["Admin Notifications"])
repo = NotificationRepository()

def get_admin_id(x_admin_id: Optional[str] = Header(None)) -> int:
    if not x_admin_id:
        raise HTTPException(status_code=401, detail="Missing x-admin-id header")
    return int(x_admin_id)

@router.get("/")
def fetch_admin_notifications(admin_id: int = Header(None, alias="x-admin-id")):
    aid = get_admin_id(admin_id)
    notifications = repo.get_admin_notifications(aid)
    # Convert dates to ISO strings for frontend
    for n in notifications:
        if "created_at" in n and n["created_at"]:
            n["created_at"] = n["created_at"].isoformat()
    return {"success": True, "data": notifications}

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, admin_id: int = Header(None, alias="x-admin-id")):
    aid = get_admin_id(admin_id)
    repo.mark_admin_as_read(notification_id, aid)
    return {"success": True}

@router.put("/read-all")
def mark_all_read(admin_id: int = Header(None, alias="x-admin-id")):
    aid = get_admin_id(admin_id)
    repo.mark_all_admin_as_read(aid)
    return {"success": True}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, admin_id: int = Header(None, alias="x-admin-id")):
    aid = get_admin_id(admin_id)
    repo.delete_admin_notification(notification_id, aid)
    return {"success": True}
