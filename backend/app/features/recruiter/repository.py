"""
Repository handles all database operations.
It's the layer between the service and the database.
"""

from typing import Optional, Dict, Any
from app.core.database import get_database_connection
from fastapi import HTTPException


class RecruiterRepository:
    """Handles all database operations for recruiters."""

    def create_recruiter(self, recruiter_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert a new recruiter into the database.
        
        Args:
            recruiter_data: Dictionary with recruiter information
            
        Returns:
            Dictionary with the created recruiter data including ID
        """
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                # SQL query to insert the recruiter
                query = """
                    INSERT INTO recruiters 
                    (full_name, email, password, phone, department, position, office_location, profile_image, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING recruiter_id, full_name, email, phone, position, 
                              office_location, department, status, created_at
                """
                
                cursor.execute(
                    query,
                    (
                        recruiter_data["full_name"],
                        recruiter_data["email"],
                        recruiter_data["password_hash"],  # Already hashed
                        recruiter_data["phone"],
                        recruiter_data["department"],
                        recruiter_data["position"],
                        recruiter_data["office_location"],
                        recruiter_data.get("profile_image"),
                        recruiter_data["status"],
                    )
                )
                
                # Get the inserted record
                result = cursor.fetchone()
                connection.commit()
                
                return dict(result) if result else None

        except Exception as exc:
            connection.rollback()
            # Check if it's a duplicate email error
            if "duplicate key value violates unique constraint" in str(exc):
                raise HTTPException(
                    status_code=400,
                    detail="This email is already registered."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(exc)}"
            )
        finally:
            connection.close()

    def find_by_id(self, recruiter_id: int) -> Optional[Dict[str, Any]]:
        """Return recruiter data for a given recruiter ID."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = "SELECT recruiter_id, email, full_name FROM recruiters WHERE recruiter_id = %s"
                cursor.execute(query, (recruiter_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Check if an email already exists.
        
        Args:
            email: Email address to check
            
        Returns:
            Recruiter data if found, None otherwise
        """
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = "SELECT recruiter_id, email FROM recruiters WHERE email = %s"
                cursor.execute(query, (email.strip().lower(),))
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_profile_image(self, recruiter_id: int, image_url: str):
        """Save the real uploaded image URL into the recruiter record."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE recruiters
                    SET profile_image = %s
                    WHERE recruiter_id = %s
                """
                cursor.execute(query, (image_url, recruiter_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error updating profile image: {str(exc)}")
        finally:
            connection.close()

    def get_profile_by_id(self, recruiter_id: int) -> Optional[Dict[str, Any]]:
        """Get the full recruiter profile along with dynamic recruitment activity counts."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")

        try:
            with connection.cursor() as cursor:
                # 1. Fetch recruiter profile info
                query = """
                    SELECT recruiter_id, full_name, email, phone, department, position,
                           office_location, profile_image, status, created_at, last_login
                    FROM recruiters
                    WHERE recruiter_id = %s
                """
                cursor.execute(query, (recruiter_id,))
                row = cursor.fetchone()
                if not row:
                    return None

                profile = dict(row)

                # 2. Count Jobs Created by this recruiter
                cursor.execute("SELECT COUNT(*) AS count FROM job_descriptions WHERE recruiter_id = %s", (recruiter_id,))
                jobs_res = cursor.fetchone()
                jobs_created = int(jobs_res["count"]) if jobs_res and jobs_res["count"] is not None else 0

                # 3. Count Resumes Uploaded by this recruiter
                cursor.execute("SELECT COUNT(*) AS count FROM resumes WHERE recruiter_id = %s", (recruiter_id,))
                resumes_res = cursor.fetchone()
                resumes_uploaded = int(resumes_res["count"]) if resumes_res and resumes_res["count"] is not None else 0

                # 4. Count Shortlisted Candidates for this recruiter
                cursor.execute("""
                    SELECT COUNT(DISTINCT candidate_id) AS count 
                    FROM candidate_selection 
                    WHERE (recruiter_id = %s OR job_id IN (SELECT job_id FROM job_descriptions WHERE recruiter_id = %s))
                      AND status = 'Shortlisted'
                """, (recruiter_id, recruiter_id))
                shortlisted_res = cursor.fetchone()
                shortlisted_count = int(shortlisted_res["count"]) if shortlisted_res and shortlisted_res["count"] is not None else 0

                profile["activity"] = {
                    "jobs_created": jobs_created,
                    "resumes_uploaded": resumes_uploaded,
                    "shortlisted_candidates": shortlisted_count
                }

                return profile
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()
    def get_all_recruiters(self) -> list:
        """Fetch all recruiters from the database."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT recruiter_id, full_name, email, phone, department, position,
                           office_location, profile_image, status, created_at, last_login
                    FROM recruiters
                    ORDER BY created_at DESC
                """
                cursor.execute(query)
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_status(self, recruiter_id: int, status: str):
        """Update the status (Active/Inactive) of a recruiter."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
        try:
            with connection.cursor() as cursor:
                query = "UPDATE recruiters SET status = %s WHERE recruiter_id = %s"
                cursor.execute(query, (status, recruiter_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def delete_recruiter(self, recruiter_id: int):
        """Delete a recruiter from the database."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
        try:
            with connection.cursor() as cursor:
                query = "DELETE FROM recruiters WHERE recruiter_id = %s"
                cursor.execute(query, (recruiter_id,))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_recruiter(self, recruiter_id: int, data: dict):
        """Update recruiter profile information."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE recruiters
                    SET full_name = %s, email = %s, phone = %s, department = %s, 
                        position = %s, office_location = %s, status = %s
                    WHERE recruiter_id = %s
                """
                cursor.execute(
                    query,
                    (
                        data.get("full_name"),
                        data.get("email"),
                        data.get("phone"),
                        data.get("department"),
                        data.get("position"),
                        data.get("office_location"),
                        data.get("status"),
                        recruiter_id
                    )
                )
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()
