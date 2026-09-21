from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.features.auth.repository import RecruiterAuthRepository
from app.features.auth.service import RecruiterAuthService
from app.features.activity.service import ActivityLogService

router = APIRouter(prefix="/api/auth", tags=["Recruiter Auth"])

activity_logger = ActivityLogService()


class RecruiterLoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class LogoutRequest(BaseModel):
    recruiter_id: int | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/recruiter/login")
def recruiter_login(payload: RecruiterLoginRequest):
    service = RecruiterAuthService(RecruiterAuthRepository())

    try:
        login_data = service.login(payload.email, payload.password, payload.remember_me)

        # Log successful login
        activity_logger.log_recruiter_action(
            recruiter_id=login_data["user"]["recruiter_id"],
            action="LOGIN",
            module="Auth",
        )

        return {
            "success": True,
            "message": "Recruiter login successful.",
            "data": login_data,
        }
    except ValueError as exc:
        # Log failed login attempt
        activity_logger.log_recruiter_action(
            recruiter_id=0,
            action="LOGIN",
            module="Auth",
            status="FAILED",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(exc)}",
        )


@router.post("/recruiter/logout")
def recruiter_logout(payload: LogoutRequest):
    service = RecruiterAuthService(RecruiterAuthRepository())

    try:
        service.logout(payload.recruiter_id)

        # Log logout
        if payload.recruiter_id:
            activity_logger.log_recruiter_action(
                recruiter_id=payload.recruiter_id,
                action="LOGOUT",
                module="Auth",
            )

        return {
            "success": True,
            "message": "Logged out successfully.",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(exc)}",
        )


@router.post("/recruiter/forgot-password")
def recruiter_forgot_password(payload: ForgotPasswordRequest):
    service = RecruiterAuthService(RecruiterAuthRepository())

    try:
        result = service.forgot_password(payload.email)
        return {
            "success": True,
            "message": result["message"],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forgot password failed: {str(exc)}",
        )


@router.post("/recruiter/reset-password")
def recruiter_reset_password(payload: ResetPasswordRequest):
    service = RecruiterAuthService(RecruiterAuthRepository())

    try:
        result = service.reset_password(payload.token, payload.new_password)

        # Log password reset
        activity_logger.log_recruiter_action(
            recruiter_id=0,
            action="RESET_PASSWORD",
            module="Auth",
        )

        return {
            "success": True,
            "message": result["message"],
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(exc)}",
        )
