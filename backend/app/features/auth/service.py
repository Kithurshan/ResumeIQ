import base64
import json
import smtplib
import time
import uuid
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Dict, Any

import bcrypt
from fastapi import HTTPException


class RecruiterAuthService:
    """Simple business logic for recruiter login and password reset."""

    def __init__(self, repository):
        self.repository = repository

    def login(self, email: str, password: str, remember_me: bool = False) -> Dict[str, Any]:
        recruiter = self.repository.find_by_email(email)

        if not recruiter:
            raise ValueError("Invalid email or password.")

        if recruiter.get("status") != "Active":
            raise ValueError("This recruiter account is inactive.")

        stored_password_hash = recruiter.get("password")
        if not bcrypt.checkpw(password.encode(), stored_password_hash.encode()):
            raise ValueError("Invalid email or password.")

        login_time = datetime.utcnow()
        self.repository.update_last_login(recruiter["recruiter_id"], login_time)

        token = self._create_token({
            "recruiter_id": recruiter["recruiter_id"],
            "email": recruiter["email"],
            "role": "recruiter",
            "full_name": recruiter["full_name"],
        }, remember_me)

        if remember_me:
            remember_token = str(uuid.uuid4())
            remember_expires = datetime.utcnow() + timedelta(days=7)
            self.repository.save_remember_token(recruiter["recruiter_id"], remember_token, remember_expires)

        return {
            "token": token,
            "user": {
                "recruiter_id": recruiter["recruiter_id"],
                "full_name": recruiter["full_name"],
                "email": recruiter["email"],
                "role": "recruiter",
                "last_login": login_time.isoformat(),
            },
        }

    def forgot_password(self, email: str):
        recruiter = self.repository.find_by_email(email)

        if not recruiter:
            return {"message": "If this email exists in our system, a password reset link has been sent."}

        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        self.repository.save_reset_token(recruiter["recruiter_id"], token, expires_at)

        reset_link = f"http://localhost:5173/recruiter/reset-password/{token}"

        try:
            self._send_reset_email(recruiter["email"], reset_link)
        except Exception as exc:
            print(f"Email send failed for forgot password: {exc}")
            return {"message": "If this email exists in our system, a password reset link has been sent."}

        return {"message": "If this email exists in our system, a password reset link has been sent."}

    def reset_password(self, token: str, new_password: str):
        if not token or not new_password:
            raise ValueError("Token and password are required.")

        if len(new_password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        recruiter = self.repository.find_by_reset_token(token)

        if not recruiter:
            raise ValueError("Invalid or expired reset link.")

        expires_at = recruiter.get("reset_token_expires_at")
        if expires_at is None:
            raise ValueError("Invalid or expired reset link.")

        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)

        if datetime.utcnow() > expires_at:
            raise ValueError("This reset link has expired.")

        password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        self.repository.update_password(recruiter["recruiter_id"], password_hash)

        return {"message": "Password updated successfully."}

    def _send_reset_email(self, email: str, reset_link: str):
        sender_email = "uca.aarm.2022.14@gmail.com"
        app_password = "wwut stpg gudi csji"

        message = EmailMessage()
        message["Subject"] = "ResumeIQ Password Reset"
        message["From"] = sender_email
        message["To"] = email
        message.set_content(
            f"Click this link to reset your password:\n\n{reset_link}\n\n"
            "If you did not request this, you can ignore this email."
        )

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, app_password)
                server.send_message(message)
        except Exception as exc:
            print(f"SMTP email error: {exc}")
            raise Exception(f"Email sending failed: {str(exc)}")

    def logout(self, recruiter_id: int | None = None):
        if recruiter_id is None:
            return {"message": "Logged out successfully."}

        self.repository.clear_remember_token(recruiter_id)
        return {"message": "Logged out successfully."}

    def _create_token(self, payload: Dict[str, Any], remember_me: bool = False) -> str:
        """Create a simple token without extra libraries."""
        expiration_seconds = 7 * 24 * 60 * 60 if remember_me else 12 * 60 * 60
        token_data = {
            "payload": payload,
            "exp": int(time.time()) + expiration_seconds,
        }

        raw_data = json.dumps(token_data, separators=(",", ":")).encode("utf-8")
        encoded = base64.urlsafe_b64encode(raw_data).decode("utf-8")
        return encoded.rstrip("=")
