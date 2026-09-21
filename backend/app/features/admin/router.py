import os
import uuid

from fastapi import APIRouter, HTTPException, status, UploadFile, File

from app.features.admin.schemas import AdminLoginRequest, AdminPasswordUpdateRequest, AdminProfileUpdateRequest
from app.features.report.repository import ReportsRepository
reports_repo = ReportsRepository()
from app.features.admin.repository import AdminRepository
from app.features.admin.service import AdminAuthService
from app.features.activity.service import ActivityLogService
from app.features.notification.repository import NotificationRepository

router = APIRouter(
    prefix="/admins",
    tags=["Admin Auth"],
)

UPLOAD_FOLDER = "uploads/admins"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

activity_logger = ActivityLogService()
notif_repo = NotificationRepository()


@router.post("/login")
def admin_login(payload: AdminLoginRequest):
    repository = AdminRepository()
    service = AdminAuthService(repository)

    try:
        data = service.login(payload.email, payload.password, payload.remember_me)

        # Log successful admin login
        activity_logger.log_admin_action(
            admin_id=data["user"]["admin_id"],
            action="LOGIN",
            module="Auth",
        )

        # Notification: Admin logged in
        notif_repo.create_admin_notification(
            admin_id=data["user"]["admin_id"],
            title="Login Successful",
            message="You have successfully logged into the admin dashboard."
        )

        return {"success": True, "data": data}
    except HTTPException as exc:
        # Log failed admin login
        activity_logger.log_admin_action(
            admin_id=0,
            action="LOGIN",
            module="Auth",
            status="FAILED",
        )
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/profile/{admin_id}")
def get_admin_profile(admin_id: int):
    repository = AdminRepository()
    service = AdminAuthService(repository)

    try:
        profile = service.get_profile(admin_id)
        return {"success": True, "data": profile}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.put("/profile/{admin_id}")
def update_admin_profile(admin_id: int, payload: AdminProfileUpdateRequest):
    repository = AdminRepository()
    service = AdminAuthService(repository)

    try:
        updated_profile = service.update_profile(admin_id, payload.full_name, payload.email, payload.phone)

        # Log profile update
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="UPDATE_PROFILE",
            module="Admin",
        )

        # Notification: Profile updated
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Profile Updated",
            message="Your admin profile details have been updated successfully."
        )

        return {"success": True, "message": "Profile updated successfully.", "data": updated_profile}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.put("/change-password/{admin_id}")
def change_admin_password(admin_id: int, payload: AdminPasswordUpdateRequest):
    repository = AdminRepository()
    service = AdminAuthService(repository)

    try:
        result = service.change_password(admin_id, payload.current_password, payload.new_password)

        # Log password change
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="CHANGE_PASSWORD",
            module="Auth",
        )

        # Notification: Password changed
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Password Changed",
            message="Your admin password has been changed successfully."
        )

        return {"success": True, **result}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/upload-profile-image")
async def upload_admin_profile_image(file: UploadFile = File(...)):
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


@router.put("/update-profile-image/{admin_id}")
def update_admin_profile_image(admin_id: int, image_url: str):
    repository = AdminRepository()
    service = AdminAuthService(repository)

    try:
        service.update_profile_image(admin_id, image_url)

        # Log profile image update
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="UPDATE_PROFILE_IMAGE",
            module="Admin",
        )

        # Notification: Profile image updated
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Profile Image Updated",
            message="Your admin profile image has been updated successfully."
        )

        return {
            "success": True,
            "message": "Profile image updated successfully.",
        }
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/logout")
def admin_logout(admin_id: int | None = None):
    repository = AdminRepository()
    service = AdminAuthService(repository)

    try:
        result = service.logout(admin_id)

        # Log admin logout
        if admin_id:
            activity_logger.log_admin_action(
                admin_id=admin_id,
                action="LOGOUT",
                module="Auth",
            )

        return result
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

from app.features.job.repository import JobRepository

@router.get("/jobs")
def get_all_jobs_for_admin():
    repository = JobRepository()
    try:
        jobs = repository.get_all_jobs_for_admin()
        return {"success": True, "data": jobs}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/jobs/{job_id}")
def get_job_details_for_admin(job_id: int):
    from app.features.job.repository import JobRepository
    repository = JobRepository()
    try:
        job = repository.get_job_for_admin(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")
        return {"success": True, "data": job}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/resumes")
def get_all_resumes_for_admin():
    from app.features.resume.repository import ResumeRepository
    repository = ResumeRepository()
    try:
        resumes = repository.get_all_resumes_for_admin()
        return {"success": True, "data": resumes}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/resumes/{resume_id}")
def get_resume_details_for_admin(resume_id: int):
    from app.features.resume.repository import ResumeRepository
    repository = ResumeRepository()
    try:
        resume = repository.get_resume_for_admin(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")
        return {"success": True, "data": resume}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/rankings")
def get_all_rankings_for_admin():
    from app.features.ranking.repository import RankingRepository
    repository = RankingRepository()
    try:
        rankings = repository.get_all_rankings_for_admin()
        return {"success": True, "data": rankings}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/rankings/{ranking_id}")
def get_ranking_details_for_admin(ranking_id: int):
    from app.features.ranking.repository import RankingRepository
    repository = RankingRepository()
    try:
        data = repository.get_ranking_details_for_admin(ranking_id)
        if not data:
            raise HTTPException(status_code=404, detail="Ranking not found.")
        return {"success": True, "data": data}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

from app.features.activity.repository import ActivityLogRepository

@router.get("/activity-logs")
def get_all_activity_logs():
    repository = ActivityLogRepository()
    try:
        data = repository.get_all_activity_logs()
        return {"success": True, "data": data}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/activity-logs/{log_id}")
def get_activity_log_details(log_id: int):
    repository = ActivityLogRepository()
    try:
        data = repository.get_activity_log_by_id(log_id)
        if not data:
            raise HTTPException(status_code=404, detail="Activity log not found.")
        return {"success": True, "data": data}
    except HTTPException as exc:
        raise exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/shortlisted")
def get_all_shortlisted_for_admin():
    from app.features.ranking.repository import RankingRepository
    repository = RankingRepository()
    try:
        shortlisted = repository.get_all_shortlisted_for_admin()
        return {"success": True, "data": shortlisted}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/ai-processing")
def get_all_ai_processing_records():
    from app.features.resume.repository import ResumeRepository
    repository = ResumeRepository()
    try:
        data = repository.get_all_ai_processing_records()
        return {"success": True, "data": data}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

@router.get("/ai-processing/{resume_id}")
def get_ai_processing_details_for_admin(resume_id: int):
    from app.features.resume.repository import ResumeRepository
    repository = ResumeRepository()
    try:
        data = repository.get_ai_processing_details_for_admin(resume_id)
        if not data:
            raise HTTPException(status_code=404, detail="Resume processing details not found")
        return {"success": True, "data": data}
    except HTTPException as e:
        raise e
    except Exception as exc:
        import traceback; traceback.print_exc(); raise HTTPException(status_code=500, detail=str(exc))

@router.get("/reports/dashboard-analytics")
def get_dashboard_analytics():
    try:
        data = reports_repo.get_dashboard_analytics()
        return {"success": True, "data": data}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

@router.get("/reports/recruitment")
def get_recruitment_reports():
    try:
        data = reports_repo.get_recruitment_reports()
        return {"success": True, "data": data}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

@router.get("/reports/recruitment/{job_id}")
def get_recruitment_report_details(job_id: int):
    try:
        data = reports_repo.get_recruitment_report_details(job_id)
        if data:
            return {"success": True, "data": data}
        return {"success": False, "error": "Report not found for this job"}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

@router.get("/reports/recruiters")
def get_recruiter_reports():
    try:
        data = reports_repo.get_recruiter_reports()
        return {"success": True, "data": data}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

@router.get("/reports/recruiters/{recruiter_id}")
def get_recruiter_report_details(recruiter_id: int):
    try:
        data = reports_repo.get_recruiter_report_details(recruiter_id)
        if data:
            return {"success": True, "data": data}
        return {"success": False, "error": "Report not found for this recruiter"}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

@router.get("/reports/ai")
def get_ai_reports_summary():
    try:
        data = reports_repo.get_ai_reports_summary()
        return {"success": True, "data": data}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

@router.get("/reports/ai/{job_id}")
def get_ai_report_details(job_id: int):
    try:
        data = reports_repo.get_ai_report_details(job_id)
        if data:
            return {"success": True, "data": data}
        return {"success": False, "error": "Report not found"}
    except Exception as e:
        print("Error:", e)
        return {"success": False, "error": str(e)}

import csv
import io
from fastapi.responses import Response

def generate_csv_response(data, filename):
    if not data:
        return Response(content="No data available", media_type="text/plain")
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    for row in data:
        writer.writerow(row)
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
    )

@router.get("/reports/export-all")
def export_all_reports_legacy():
    data = reports_repo.get_full_export_data()
    return generate_csv_response(data, "All_System_Reports_Deep")

@router.get("/reports/recruitment/{job_id}/export")
def export_recruitment_report(job_id: int):
    data = reports_repo.get_job_export_data(job_id)
    return generate_csv_response(data, f"Recruitment_Report_Job_{job_id}")

@router.get("/reports/recruiters/{recruiter_id}/export")
def export_recruiter_report(recruiter_id: int):
    data = reports_repo.get_recruiter_export_data(recruiter_id)
    return generate_csv_response(data, f"Recruiter_Report_{recruiter_id}")

@router.get("/reports/ai/{job_id}/export")
def export_ai_report(job_id: int):
    data = reports_repo.get_ai_job_export_data(job_id)
    return generate_csv_response(data, f"AI_Processing_Report_Job_{job_id}")

from app.features.report.export_service import reports_export_service

@router.get("/reports/export/excel")
def export_all_reports_excel():
    memory_file = reports_export_service.get_all_reports_excel()
    return Response(
        content=memory_file.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ResumeIQ_Analytics_Report.xlsx"}
    )

