import base64
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

import bcrypt
from fastapi import HTTPException

from app.features.admin.repository import AdminRepository
from app.features.auth.repository import RecruiterAuthRepository


class AdminAuthService:
    """Simple admin authentication service using bcrypt and existing remember-me helpers."""

    def __init__(self, repository: AdminRepository):
        self.repository = repository
        # reuse the recruiter auth repository to store remember tokens (in-memory helper)
        self._remember_repo = RecruiterAuthRepository()

    def login(self, email: str, password: str, remember_me: bool = False) -> Dict[str, Any]:
        admin = self.repository.find_by_email(email)

        if not admin:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if admin.get("status") != "Active":
            raise HTTPException(status_code=403, detail="This admin account is inactive.")

        stored_password_hash = admin.get("password")
        if not stored_password_hash or not bcrypt.checkpw(password.encode(), stored_password_hash.encode()):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        login_time = datetime.utcnow()
        self.repository.update_last_login(admin["admin_id"], login_time)

        token = self._create_token({
            "admin_id": admin["admin_id"],
            "email": admin["email"],
            "role": "admin",
            "full_name": admin.get("full_name"),
        }, remember_me)

        if remember_me:
            remember_token = str(uuid.uuid4())
            remember_expires = datetime.utcnow() + timedelta(days=7)
            # reuse existing in-memory store
            self._remember_repo.save_remember_token(admin["admin_id"], remember_token, remember_expires)

        return {
            "token": token,
            "user": {
                "admin_id": admin["admin_id"],
                "full_name": admin.get("full_name"),
                "email": admin.get("email"),
                "role": "admin",
                "last_login": login_time.isoformat(),
            },
        }

    def get_profile(self, admin_id: int) -> Dict[str, Any]:
        admin = self.repository.get_profile_by_id(admin_id)

        if not admin:
            raise HTTPException(status_code=404, detail="Admin profile not found.")

        return {
            "admin_id": admin.get("admin_id"),
            "full_name": admin.get("full_name"),
            "email": admin.get("email"),
            "phone": admin.get("phone"),
            "role": admin.get("role") or "admin",
            "status": admin.get("status"),
            "profile_image": admin.get("profile_image"),
            "last_login": admin.get("last_login"),
        }

    def update_profile(self, admin_id: int, full_name: str, email: str, phone: str | None = None) -> Dict[str, Any]:
        if not full_name or not full_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required.")

        if not email or not email.strip():
            raise HTTPException(status_code=400, detail="Email is required.")

        existing_admin = self.repository.find_by_id(admin_id)
        if not existing_admin:
            raise HTTPException(status_code=404, detail="Admin not found.")

        email = email.strip().lower()
        same_email_admin = self.repository.find_by_email(email)
        if same_email_admin and same_email_admin.get("admin_id") != admin_id:
            raise HTTPException(status_code=400, detail="This email is already in use.")

        updated_phone = phone.strip() if phone and phone.strip() else None
        self.repository.update_profile(admin_id, full_name.strip(), email, updated_phone)

        updated_admin = self.repository.find_by_id(admin_id)
        return {
            "admin_id": updated_admin.get("admin_id"),
            "full_name": updated_admin.get("full_name"),
            "email": updated_admin.get("email"),
            "phone": updated_admin.get("phone"),
            "role": "admin",
            "status": updated_admin.get("status"),
            "last_login": updated_admin.get("last_login"),
        }

    def change_password(self, admin_id: int, current_password: str, new_password: str) -> Dict[str, Any]:
        admin = self.repository.find_by_id(admin_id)
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found.")

        if not current_password:
            raise HTTPException(status_code=400, detail="Current password is required.")

        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

        stored_hash = admin.get("password")
        if not stored_hash or not bcrypt.checkpw(current_password.encode(), stored_hash.encode()):
            raise HTTPException(status_code=401, detail="Current password is incorrect.")

        hashed_new_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode("utf-8")
        self.repository.update_password(admin_id, hashed_new_password)

        return {"message": "Password updated successfully."}

    def update_profile_image(self, admin_id: int, image_url: str) -> Dict[str, Any]:
        admin = self.repository.find_by_id(admin_id)
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found.")

        if not image_url or not image_url.strip():
            raise HTTPException(status_code=400, detail="Profile image URL is required.")

        self.repository.update_profile_image(admin_id, image_url.strip())
        return {"message": "Profile image updated successfully."}

    def logout(self, admin_id: int | None = None):
        if admin_id is None:
            return {"message": "Logged out successfully."}

        self._remember_repo.clear_remember_token(admin_id)
        return {"message": "Logged out successfully."}

    def _create_token(self, payload: Dict[str, Any], remember_me: bool = False) -> str:
        expiration_seconds = 7 * 24 * 60 * 60 if remember_me else 12 * 60 * 60
        token_data = {
            "payload": payload,
            "exp": int(time.time()) + expiration_seconds,
        }

        raw_data = json.dumps(token_data, separators=(",", ":")).encode("utf-8")
        encoded = base64.urlsafe_b64encode(raw_data).decode("utf-8")
        return encoded.rstrip("=")
