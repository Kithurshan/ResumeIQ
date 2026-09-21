"""
Routes define the API endpoints.
These are the URLs that the frontend will call.
"""

import os
import uuid

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Header

from app.features.recruiter.schemas import RecruiterCreateRequest
from app.features.recruiter.repository import RecruiterRepository
from app.features.recruiter.service import RecruiterService
from app.features.activity.service import ActivityLogService
from app.features.notification.repository import NotificationRepository
from typing import Optional

# Create a router with a prefix and tags
router = APIRouter(
    prefix="/recruiters",
    tags=["Recruiter Management"],
)

UPLOAD_FOLDER = "uploads/recruiters"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

activity_logger = ActivityLogService()
notif_repo = NotificationRepository()


@router.post("/upload-profile-image")
async def upload_profile_image(file: UploadFile = File(...)):
    """Upload a recruiter profile picture and return a real URL."""
    if not file:
        raise HTTPException(status_code=400, detail="No file selected.")

    allowed_types = [".png", ".jpg", ".jpeg"]
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, and JPEG files are allowed.")

    file_name = f"{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, file_name)

    with open(file_path, "wb") as image_file:
        image_file.write(await file.read())

    image_url = f"http://localhost:5000/{UPLOAD_FOLDER}/{file_name}"

    return {
        "success": True,
        "imageUrl": image_url,
    }


@router.put("/update-profile-image/{recruiter_id}")
def update_profile_image(recruiter_id: int, image_url: str):
    """Save the uploaded real image URL in the recruiter record."""
    repository = RecruiterRepository()

    try:
        repository.update_profile_image(recruiter_id, image_url)
        return {
            "success": True,
            "message": "Profile image updated successfully.",
        }
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile image: {str(exc)}",
        )


@router.post("/new", status_code=status.HTTP_201_CREATED)
def add_recruiter(payload: RecruiterCreateRequest, x_admin_id: Optional[str] = Header(None)):
    """
    Create a new recruiter.
    
    This endpoint:
    1. Receives recruiter data from the frontend
    2. Validates the data
    3. Checks if email already exists
    4. Hashes the password
    5. Saves to database
    6. Returns the created recruiter
    
    Args:
        payload: RecruiterCreateRequest with recruiter details
        
    Returns:
        RecruiterResponse with the created recruiter data
    """
    
    repository = RecruiterRepository()
    service = RecruiterService(repository)

    try:
        recruiter_data = payload.dict()
        created_recruiter = service.create_recruiter(recruiter_data)

        admin_id = int(x_admin_id) if x_admin_id else 1

        # Log recruiter creation (this is an admin action)
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="CREATE_RECRUITER",
            module="Recruiters",
        )

        # Notification: Recruiter created
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Recruiter Created",
            message=f"New recruiter '{created_recruiter.get('full_name', '')}' has been created."
        )

        return {
            "success": True,
            "message": "Recruiter created successfully.",
            "data": created_recruiter,
        }

    except HTTPException as exc:
        raise exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(exc)}",
        )


@router.get("/profile/{recruiter_id}")
def get_recruiter_profile(recruiter_id: int):
    """Return the recruiter profile for the logged-in recruiter."""
    repository = RecruiterRepository()
    service = RecruiterService(repository)

    try:
        recruiter_profile = service.get_profile_by_id(recruiter_id)
        return {
            "success": True,
            "data": recruiter_profile,
        }
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recruiter profile: {str(exc)}",
        )
from pydantic import BaseModel

class StatusUpdateRequest(BaseModel):
    status: str

@router.get("/all")
def get_all_recruiters():
    """Return all recruiters."""
    repository = RecruiterRepository()
    service = RecruiterService(repository)
    try:
        recruiters = service.get_all_recruiters()
        return {"success": True, "data": recruiters}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recruiters: {str(exc)}",
        )

@router.put("/{recruiter_id}/status")
def update_recruiter_status(recruiter_id: int, payload: StatusUpdateRequest, x_admin_id: Optional[str] = Header(None)):
    repository = RecruiterRepository()
    service = RecruiterService(repository)
    admin_id = int(x_admin_id) if x_admin_id else 1
    try:
        result = service.update_recruiter_status(recruiter_id, payload.status)
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="UPDATE_RECRUITER_STATUS",
            module="Recruiters",
        )

        # Notification: Recruiter status changed
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Recruiter Status Updated",
            message=f"Recruiter #{recruiter_id} status changed to '{payload.status}'."
        )

        return {"success": True, "message": result["message"]}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update recruiter: {str(exc)}",
        )

@router.delete("/{recruiter_id}")
def delete_recruiter(recruiter_id: int, x_admin_id: Optional[str] = Header(None)):
    repository = RecruiterRepository()
    service = RecruiterService(repository)
    admin_id = int(x_admin_id) if x_admin_id else 1
    try:
        result = service.delete_recruiter(recruiter_id)
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="DELETE_RECRUITER",
            module="Recruiters",
        )

        # Notification: Recruiter deleted
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Recruiter Deleted",
            message=f"Recruiter #{recruiter_id} has been permanently deleted from the system."
        )

        return {"success": True, "message": result["message"]}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete recruiter: {str(exc)}",
        )

class RecruiterUpdateRequest(BaseModel):
    fullName: str
    email: str
    phone: str
    department: str
    position: str
    location: str
    status: str

@router.put("/update/{recruiter_id}")
def update_recruiter_details(recruiter_id: int, payload: RecruiterUpdateRequest, x_admin_id: Optional[str] = Header(None)):
    repository = RecruiterRepository()
    service = RecruiterService(repository)
    admin_id = int(x_admin_id) if x_admin_id else 1
    try:
        data = {
            "full_name": payload.fullName.strip(),
            "email": payload.email.strip(),
            "phone": payload.phone.strip(),
            "department": payload.department.strip(),
            "position": payload.position.strip(),
            "office_location": payload.location.strip(),
            "status": payload.status
        }
        result = service.update_recruiter(recruiter_id, data)
        
        # Log update action
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="UPDATE_RECRUITER",
            module="Recruiters",
        )
        
        # Notification: Recruiter details updated
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Recruiter Updated",
            message=f"Recruiter '{payload.fullName}' details have been updated."
        )
        
        return {"success": True, "message": result["message"]}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update recruiter: {str(exc)}",
        )
