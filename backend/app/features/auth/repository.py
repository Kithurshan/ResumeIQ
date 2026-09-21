import datetime
from typing import Optional, Dict, Any

from fastapi import HTTPException

from app.core.database import get_database_connection


RESET_TOKENS = {}
REMEMBER_TOKENS = {}


class RecruiterAuthRepository:
    """Simple auth repo without extra database columns.

    For a beginner project, token data is stored in memory.
    This keeps the database clean and avoids ALTER TABLE calls.
    """

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT recruiter_id, full_name, email, password, status, last_login
                    FROM recruiters
                    WHERE email = %s
                """
                cursor.execute(query, (email.strip().lower(),))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def find_by_id(self, recruiter_id: int) -> Optional[Dict[str, Any]]:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT recruiter_id, email
                    FROM recruiters
                    WHERE recruiter_id = %s
                """
                cursor.execute(query, (recruiter_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_last_login(self, recruiter_id: int, login_time: datetime.datetime):
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE recruiters
                    SET last_login = %s
                    WHERE recruiter_id = %s
                """
                cursor.execute(query, (login_time, recruiter_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating last login: {str(exc)}")
        finally:
            connection.close()

    def save_reset_token(self, recruiter_id: int, token: str, expires_at):
        RESET_TOKENS[token] = {
            "recruiter_id": recruiter_id,
            "expires_at": expires_at,
        }

    def find_by_reset_token(self, token: str):
        token_data = RESET_TOKENS.get(token)
        if not token_data:
            return None

        if datetime.datetime.utcnow() > token_data["expires_at"]:
            RESET_TOKENS.pop(token, None)
            return None

        recruiter = self.find_by_id(token_data["recruiter_id"])
        if not recruiter:
            RESET_TOKENS.pop(token, None)
            return None

        return {
            "recruiter_id": recruiter["recruiter_id"],
            "email": recruiter["email"],
            "reset_token_expires_at": token_data["expires_at"],
        }

    def update_password(self, recruiter_id: int, new_password_hash: str):
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE recruiters
                    SET password = %s
                    WHERE recruiter_id = %s
                """
                cursor.execute(query, (new_password_hash, recruiter_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating password: {str(exc)}")
        finally:
            connection.close()

        for token, value in list(RESET_TOKENS.items()):
            if value.get("recruiter_id") == recruiter_id:
                RESET_TOKENS.pop(token, None)

    def save_remember_token(self, recruiter_id: int, token: str, expires_at):
        REMEMBER_TOKENS[token] = {
            "recruiter_id": recruiter_id,
            "expires_at": expires_at,
        }

    def clear_remember_token(self, recruiter_id: int):
        for token, value in list(REMEMBER_TOKENS.items()):
            if value.get("recruiter_id") == recruiter_id:
                REMEMBER_TOKENS.pop(token, None)

    def find_remember_token(self, token: str):
        token_data = REMEMBER_TOKENS.get(token)
        if not token_data:
            return None

        if datetime.datetime.utcnow() > token_data["expires_at"]:
            REMEMBER_TOKENS.pop(token, None)
            return None

        return token_data
