from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.core.database import get_database_connection


class AdminRepository:
    """Repository for admin database access (simple and beginner-friendly)."""

    def find_by_id(self, admin_id: int) -> Optional[Dict[str, Any]]:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT admin_id, full_name, email, password, status, last_login
                    FROM admins
                    WHERE admin_id = %s
                """
                cursor.execute(query, (admin_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT admin_id, full_name, email, password, status, last_login
                    FROM admins
                    WHERE email = %s
                """
                cursor.execute(query, (email.strip().lower(),))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def get_profile_by_id(self, admin_id: int) -> Optional[Dict[str, Any]]:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT admin_id, full_name, email, phone, profile_image, role, status, last_login
                    FROM admins
                    WHERE admin_id = %s
                """
                cursor.execute(query, (admin_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_profile(self, admin_id: int, full_name: str, email: str, phone: Optional[str] = None):
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE admins
                    SET full_name = %s, email = %s, phone = %s
                    WHERE admin_id = %s
                """
                cursor.execute(query, (full_name.strip(), email.strip().lower(), phone, admin_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating admin profile: {str(exc)}")
        finally:
            connection.close()

    def update_password(self, admin_id: int, password_hash: str):
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE admins
                    SET password = %s
                    WHERE admin_id = %s
                """
                cursor.execute(query, (password_hash, admin_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating password: {str(exc)}")
        finally:
            connection.close()

    def update_profile_image(self, admin_id: int, image_url: str):
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE admins
                    SET profile_image = %s
                    WHERE admin_id = %s
                """
                cursor.execute(query, (image_url, admin_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating profile image: {str(exc)}")
        finally:
            connection.close()

    def update_last_login(self, admin_id: int, login_time):
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE admins
                    SET last_login = %s
                    WHERE admin_id = %s
                """
                cursor.execute(query, (login_time, admin_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating last login: {str(exc)}")
        finally:
            connection.close()
