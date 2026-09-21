import os
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, Header, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
from app.features.resume.schemas import ResumeUploadResponse, ResumeStatusResponse
from app.features.resume.service import ResumeService
from app.features.activity.service import ActivityLogService
from app.core.resumes_exceptions import (
    InvalidResumeFile, JobNotFound, UnauthorizedJobAccess, 
    ResumeParsingError, CandidateCreationError,
    CorruptedDocumentError, EmptyDocumentError
)
from app.features.setting.repository import SettingsRepository

router = APIRouter()
resume_service = ResumeService()
activity_logger = ActivityLogService()

def get_current_recruiter_id(x_recruiter_id: Optional[str] = Header(default=None)) -> int:
    if x_recruiter_id is None or x_recruiter_id == "" or not isinstance(x_recruiter_id, (str, int)):
        raise HTTPException(status_code=401, detail="Missing recruiter identity. Please login again.")

    try:
        return int(x_recruiter_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid recruiter identity")

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: int = Form(...),
    recruiter_id: int = Depends(get_current_recruiter_id)
):
    try:
        data = resume_service.process_upload(file, job_id, recruiter_id, background_tasks)
        
        # Add a notification
        try:
            from app.core.database import get_database_connection
            conn = get_database_connection()
            cur = conn.cursor()
            filename = file.filename if file else "A resume"
            cur.execute(
                "INSERT INTO notifications (recruiter_id, title, message, is_read) VALUES (%s, %s, %s, false)",
                (recruiter_id, "Resume Uploaded", f"Successfully uploaded {filename} for job #{job_id}.")
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print("Failed to create notification:", e)

        # Log resume upload
        activity_logger.log_recruiter_action(
            recruiter_id=recruiter_id,
            action="RESUME_UPLOAD",
            module="Resumes",
        )

        return ResumeUploadResponse(
            success=True,
            message="Resume uploaded successfully.",
            data=data
        )
    except (InvalidResumeFile, CorruptedDocumentError, EmptyDocumentError) as e:
        activity_logger.log_recruiter_action(
            recruiter_id=recruiter_id,
            action="RESUME_UPLOAD",
            module="Resumes",
            status="FAILED",
        )
        raise HTTPException(status_code=400, detail=str(e))
    except JobNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedJobAccess as e:
        raise HTTPException(status_code=403, detail=str(e))
    except (ResumeParsingError, CandidateCreationError) as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/{resume_id}/status", response_model=ResumeStatusResponse)
async def get_resume_status(resume_id: int):
    try:
        status_data = resume_service.get_status(resume_id)
        return ResumeStatusResponse(
            success=True,
            data=status_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-upload")
async def bulk_upload_resumes(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    job_id: int = Form(...),
    recruiter_id: int = Depends(get_current_recruiter_id)
):
    try:
        # Generate a batch ID for this upload operation
        date_str = datetime.now().strftime("%Y%m%d")
        unique_suffix = uuid.uuid4().hex[:4].upper()
        batch_id = f"BATCH-{date_str}-{unique_suffix}"
        
        settings_repo = SettingsRepository()
        resume_settings = settings_repo.get_setting("global_resume_settings") or {}
        max_bulk_upload = resume_settings.get("maxBulkUpload", 500)
        duplicate_detection = resume_settings.get("duplicateDetection", True)
        
        if len(files) > max_bulk_upload:
            raise HTTPException(status_code=400, detail=f"Cannot upload more than {max_bulk_upload} resumes at once.")
        
        results = []
        seen_hashes = set()
        
        for file in files:
            try:
                # Calculate file hash for duplicate detection within this upload
                file_bytes = await file.read()
                
                if duplicate_detection:
                    file_hash = hashlib.sha256(file_bytes).hexdigest()
                    if file_hash in seen_hashes:
                        results.append({"filename": file.filename, "status": "Failed", "error": "Duplicate detected: Same file uploaded in this batch"})
                        continue
                    # Add to seen hashes
                    seen_hashes.add(file_hash)
                    
                # Reset file pointer for service processing
                await file.seek(0)
                
                data = resume_service.process_upload(file, job_id, recruiter_id, background_tasks)
                results.append({"filename": file.filename, "status": "Success", "data": data})
            except Exception as e:
                results.append({"filename": file.filename, "status": "Failed", "error": str(e)})
        
        # Add a notification
        try:
            from app.core.database import get_database_connection
            conn = get_database_connection()
            cur = conn.cursor()
            success_count = sum(1 for r in results if r["status"] == "Uploaded")
            if success_count > 0:
                cur.execute(
                    "INSERT INTO notifications (recruiter_id, title, message, is_read) VALUES (%s, %s, %s, false)",
                    (recruiter_id, "Bulk Upload Completed", f"Successfully uploaded {success_count} resumes for job #{job_id}.")
                )
                conn.commit()
            conn.close()
        except Exception as e:
            print("Failed to create bulk notification:", e)

        # Log bulk upload
        activity_logger.log_recruiter_action(
            recruiter_id=recruiter_id,
            action="BULK_RESUME_UPLOAD",
            module="Resumes",
        )

        return {
            "success": True,
            "message": f"Processed {len(files)} files.",
            "batch_id": batch_id,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{resume_id}/download")
async def download_resume(resume_id: int):
    try:
        file_path = resume_service.get_resume_file_path(resume_id)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File physically missing on server")
        
        # Get original file name from DB
        status_data = resume_service.get_status(resume_id)
        filename = status_data.get("file_name", "resume.pdf")
        
        return FileResponse(
            path=file_path, 
            filename=filename,
            content_disposition_type="inline"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resume_id}")
async def delete_resume(resume_id: int):
    try:
        resume_service.delete_resume(resume_id)

        # Log resume deletion
        activity_logger.log_recruiter_action(
            recruiter_id=0,
            action="DELETE_RESUME",
            module="Resumes",
        )

        return {"success": True, "message": f"Resume {resume_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
