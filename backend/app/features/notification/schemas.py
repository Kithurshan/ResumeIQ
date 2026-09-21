from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    notification_id: int
    recruiter_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    
class NotificationSettingsUpdate(BaseModel):
    upload_notifs: bool
    analysis_completed: bool
    analysis_failed: bool
    ai_ready: bool
    shortlist_updates: bool
    deadline_reminder: bool
    system_announcements: bool
