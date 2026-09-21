from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.features.setting.repository import SettingsRepository
from app.features.notification.repository import NotificationRepository
from app.features.activity.service import ActivityLogService

router = APIRouter(prefix="/settings", tags=["System Settings"])
repo = SettingsRepository()
notif_repo = NotificationRepository()
activity_logger = ActivityLogService()

class SystemSettingsUpdate(BaseModel):
    resume_settings: Dict[str, Any]
    ai_settings: Dict[str, Any]
    notification_settings: Dict[str, Any]

@router.get("/")
def get_all_settings():
    """Fetch all global system settings."""
    try:
        resume_settings = repo.get_setting("global_resume_settings") or {
            "maxFileSize": 5,
            "allowedTypes": {"pdf": True, "docx": True},
            "maxBulkUpload": 500,
            "duplicateDetection": True
        }
        
        ai_settings = repo.get_setting("global_ai_settings") or {
            "minScore": 70
        }
        
        notification_settings = repo.get_setting("global_notification_settings") or {
            "recruiterCreated": True,
            "resumeUploaded": True,
            "aiFailed": True,
            "aiRetrained": True,
            "reportGenerated": True,
            "settingsUpdated": True
        }
        
        return {
            "status": "success",
            "data": {
                "resume_settings": resume_settings,
                "ai_settings": ai_settings,
                "notification_settings": notification_settings
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/")
def update_all_settings(settings: SystemSettingsUpdate, x_admin_id: Optional[str] = Header(None)):
    """Update all global system settings at once."""
    admin_id = int(x_admin_id) if x_admin_id else 1
    try:
        repo.update_setting("global_resume_settings", settings.resume_settings)
        repo.update_setting("global_ai_settings", settings.ai_settings)
        repo.update_setting("global_notification_settings", settings.notification_settings)
        
        # Log settings change
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="UPDATE_SYSTEM_SETTINGS",
            module="Settings",
        )
        
        # Notification: Settings updated
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="System Settings Updated",
            message="Global system settings (Resume, AI, Notifications) have been updated."
        )
        
        return {
            "status": "success",
            "message": "System settings updated successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
