import json
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from app.core.database import get_database_connection
from app.features.recruiter.repository import RecruiterRepository


class JobRepository:
    """Handles all database operations (SQL queries) for Jobs."""

    def _run_query(self, query: str, values: tuple = (), fetch: str = "none") -> Any:
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Cannot connect to the database.")

        try:
            with connection.cursor() as cursor:
                cursor.execute(query, values)
                if fetch == "one":
                    result = cursor.fetchone()
                elif fetch == "all":
                    result = cursor.fetchall()
                else:
                    result = None
            connection.commit()
            return result
        except HTTPException:
            connection.rollback()
            raise
        except Exception as error:
            connection.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(error)}")
        finally:
            connection.close()

    def list_jobs(self, recruiter_id: int, search: Optional[str], department: Optional[str], 
                  employment_type: Optional[str], status: Optional[str], 
                  page: int, page_size: int, sort: str) -> Dict[str, Any]:
        conditions = ["recruiter_id = %s"]
        values: List[Any] = [recruiter_id]

        if search:
            conditions.append("(job_title ILIKE %s OR department ILIKE %s)")
            values.extend([f"%{search}%", f"%{search}%"])

        if department:
            conditions.append("department = %s")
            values.append(department)

        if employment_type:
            conditions.append("employment_type = %s")
            values.append(employment_type)

        if status:
            conditions.append("status = %s")
            values.append(status)

        sort_options = {
            "newest": "created_at DESC",
            "oldest": "created_at ASC",
            "deadline": "application_deadline ASC",
            "title": "job_title ASC",
        }
        order_by = sort_options.get(sort.lower(), "created_at DESC")
        where_clause = " AND ".join(conditions)
        offset = (page - 1) * page_size

        count_row = self._run_query(
            f"SELECT COUNT(*) AS total FROM job_descriptions WHERE {where_clause}",
            tuple(values), fetch="one"
        )
        total_count = count_row["total"] if count_row else 0

        rows = self._run_query(
            f"""
            SELECT * FROM job_descriptions 
            WHERE {where_clause} ORDER BY {order_by} LIMIT %s OFFSET %s
            """,
            tuple(values + [page_size, offset]), fetch="all"
        )

        return {
            "items": [self._row_to_dict(row) for row in (rows or [])],
            "total": total_count,
        }

    def get_job(self, job_id: int, recruiter_id: int) -> Optional[Dict[str, Any]]:
        row = self._run_query(
            "SELECT * FROM job_descriptions WHERE job_id = %s AND recruiter_id = %s",
            (job_id, recruiter_id), fetch="one"
        )
        return self._row_to_dict(row) if row else None

    def create_job(self, recruiter_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_recruiter_exists(recruiter_id)
        row = self._run_query(
            """
            INSERT INTO job_descriptions (
                recruiter_id, job_title, department, employment_type, location,
                salary_range, required_skills, qualifications, experience_required, 
                job_description, application_deadline, vacancies, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            self._build_values_tuple(recruiter_id, data), fetch="one"
        )
        return self._row_to_dict(row)

    def update_job(self, job_id: int, recruiter_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._ensure_recruiter_exists(recruiter_id)
        values_without_recruiter = self._build_values_tuple(recruiter_id, data)[1:]
        row = self._run_query(
            """
            UPDATE job_descriptions SET
                job_title=%s, department=%s, employment_type=%s, location=%s,
                salary_range=%s, required_skills=%s, qualifications=%s, 
                experience_required=%s, job_description=%s, application_deadline=%s, 
                vacancies=%s, status=%s, updated_at=CURRENT_TIMESTAMP
            WHERE job_id=%s AND recruiter_id=%s RETURNING *
            """,
            values_without_recruiter + (job_id, recruiter_id), fetch="one"
        )
        return self._row_to_dict(row) if row else None

    def delete_job(self, job_id: int, recruiter_id: int) -> bool:
        self._ensure_recruiter_exists(recruiter_id)
        row = self._run_query(
            "DELETE FROM job_descriptions WHERE job_id = %s AND recruiter_id = %s RETURNING job_id",
            (job_id, recruiter_id), fetch="one"
        )
        return row is not None

    def get_stats(self, recruiter_id: int) -> Dict[str, int]:
        rows = self._run_query(
            "SELECT status, COUNT(*) AS count FROM job_descriptions WHERE recruiter_id = %s GROUP BY status",
            (recruiter_id,), fetch="all"
        )
        status_counts = {row["status"]: row["count"] for row in (rows or [])}
        return {
            "total":  sum(status_counts.values()),
            "active": status_counts.get("Active", 0),
            "draft":  status_counts.get("Draft", 0),
            "closed": status_counts.get("Closed", 0),
        }

    @staticmethod
    def _ensure_recruiter_exists(recruiter_id: int) -> None:
        recruiter = RecruiterRepository().find_by_id(recruiter_id)
        if recruiter is None:
            raise HTTPException(status_code=400, detail=f"Recruiter {recruiter_id} was not found. Please log in with a valid recruiter account.")

    @staticmethod
    def _build_values_tuple(recruiter_id: int, data: Dict[str, Any]) -> tuple:
        salary_min = data.get("salary_min")
        salary_max = data.get("salary_max")
        salary_range = None if salary_min is None and salary_max is None else f"{salary_min or ''}-{salary_max or ''}"

        extra_details = json.dumps({
            "preferredSkills": data.get("preferred_skills", []),
            "responsibilities": data.get("responsibilities"),
            "education": data.get("education"),
        })

        required_skills_str = ", ".join(data.get("required_skills", []))

        return (
            recruiter_id, data["title"], data.get("department"), data.get("type"),
            data.get("location"), salary_range, required_skills_str, extra_details, 
            data.get("experience"), data["description"], data["deadline"], 
            data["vacancies"], data["status"]
        )

    @staticmethod
    def _row_to_dict(row: Any) -> Dict[str, Any]:
        if row is None: return {}
        result = dict(row)

        result["id"] = result.pop("job_id")
        result["title"] = result.pop("job_title")
        result["type"] = result.pop("employment_type")
        result["deadline"] = result.pop("application_deadline")
        result["description"] = result.pop("job_description")

        salary_range = result.pop("salary_range") or ""
        salary_parts = salary_range.split("-", 1)
        result["salaryMin"] = salary_parts[0] or None
        result["salaryMax"] = salary_parts[1] if len(salary_parts) == 2 and salary_parts[1] else None

        raw_skills = result.pop("required_skills") or ""
        result["requiredSkills"] = [skill.strip() for skill in raw_skills.split(",") if skill.strip()]

        raw_qualifications = result.pop("qualifications") or "{}"
        try:
            extra = json.loads(raw_qualifications)
        except:
            extra = {}

        result["preferredSkills"] = extra.get("preferredSkills", [])
        result["responsibilities"] = extra.get("responsibilities")
        result["education"] = extra.get("education")
        result["experience"] = result.pop("experience_required")

        for date_field in ("deadline", "created_at", "updated_at"):
            if result.get(date_field) is not None and hasattr(result[date_field], "isoformat"):
                result[date_field] = result[date_field].isoformat()

        return result

    def get_all_jobs_for_admin(self) -> list:
        """Fetch all jobs for the admin monitoring dashboard."""
        query = """
            SELECT 
                j.job_id,
                j.job_title,
                j.department,
                j.status,
                j.created_at,
                r.full_name AS recruiter_name,
                (SELECT COUNT(*) FROM candidate_selection c WHERE c.job_id = j.job_id) as candidates_count
            FROM job_descriptions j
            LEFT JOIN recruiters r ON j.recruiter_id = r.recruiter_id
            ORDER BY j.created_at DESC
        """
        rows = self._run_query(query, fetch="all")
        
        result = []
        for row in (rows or []):
            result.append({
                "id": row.get("job_id"),
                "title": row.get("job_title"),
                "company": row.get("department") or "Internal",
                "recruiter": row.get("recruiter_name") or "Unknown",
                "status": row.get("status"),
                "created": str(row.get("created_at").date()) if row.get("created_at") else "N/A",
                "candidates": row.get("candidates_count", 0)
            })
        return result

    def get_job_for_admin(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get a single job details for the admin, including recruiter info."""
        query = """
            SELECT 
                j.*, 
                r.full_name as recruiter_name,
                (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id) as uploaded_resumes,
                (SELECT COUNT(*) FROM candidate_selection c WHERE c.job_id = j.job_id AND c.status = 'Shortlisted') as shortlisted_count,
                (SELECT COUNT(*) FROM candidate_selection c WHERE c.job_id = j.job_id AND c.status = 'Waitlisted') as waitlisted_count,
                (SELECT COUNT(*) FROM candidate_selection c WHERE c.job_id = j.job_id) as candidates_ranked
            FROM job_descriptions j
            LEFT JOIN recruiters r ON j.recruiter_id = r.recruiter_id
            WHERE j.job_id = %s
        """
        row = self._run_query(query, (job_id,), fetch="one")
        if not row:
            return None
            
        result = dict(row)
        
        # Parse JSON fields if they are strings
        for field in ['required_skills', 'preferred_skills', 'qualifications']:
            if isinstance(result.get(field), str):
                try:
                    import json
                    result[field] = json.loads(result[field])
                except:
                    pass
                    
        return result
