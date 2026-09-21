# ============================================================
# dashboard/repository.py
# Simple database queries for the recruiter dashboard.
# Each method runs ONE SQL query and returns the raw results.
# ============================================================

from app.core.database import get_database_connection


class DashboardRepository:
    """Handles all database queries for the dashboard page."""

    def _run_query(self, query, params=None):
        """Helper: runs a query and returns all rows as dictionaries."""
        conn = get_database_connection()
        try:
            cur = conn.cursor()
            cur.execute(query, params or ())
            rows = cur.fetchall()
            conn.commit()
            return rows
        finally:
            conn.close()

    # ── 1. Summary stats (top 4 cards) ─────────────────────
    def get_stats(self, recruiter_id: int) -> dict:
        """Returns counts for the 4 statistic cards at the top."""
        rows = self._run_query("""
            SELECT
                -- Total jobs this recruiter created
                (SELECT COUNT(*) FROM job_descriptions WHERE recruiter_id = %s) AS total_jobs,

                -- Active jobs (status = 'Active')
                (SELECT COUNT(*) FROM job_descriptions WHERE recruiter_id = %s AND status = 'Active') AS active_jobs,

                -- Total shortlisted candidates across all their jobs
                (SELECT COUNT(*) FROM candidate_selection cs
                 JOIN job_descriptions jd ON cs.job_id = jd.job_id
                 WHERE jd.recruiter_id = %s AND cs.status = 'Shortlisted') AS shortlisted_count,

                -- Pending reviews (candidates waiting for a decision)
                (SELECT COUNT(*) FROM candidate_selection cs
                 JOIN job_descriptions jd ON cs.job_id = jd.job_id
                 WHERE jd.recruiter_id = %s AND cs.status = 'Pending') AS pending_reviews
        """, (recruiter_id, recruiter_id, recruiter_id, recruiter_id))

        if rows:
            return dict(rows[0])
        return {"total_jobs": 0, "active_jobs": 0, "shortlisted_count": 0, "pending_reviews": 0}

    # ── 2. Candidate Status breakdown (doughnut chart) ─────
    def get_status_breakdown(self, recruiter_id: int) -> list:
        """Returns how many candidates are in each status (Shortlisted, Rejected, Pending, etc.)."""
        return self._run_query("""
            SELECT cs.status, COUNT(*) AS count
            FROM candidate_selection cs
            JOIN job_descriptions jd ON cs.job_id = jd.job_id
            WHERE jd.recruiter_id = %s
            GROUP BY cs.status
            ORDER BY count DESC
        """, (recruiter_id,))

    # ── 3. Monthly applications trend (line chart) ─────────
    def get_monthly_trend(self, recruiter_id: int) -> list:
        """Returns the number of resumes uploaded per month (last 6 months)."""
        return self._run_query("""
            SELECT TO_CHAR(r.upload_date, 'Mon YYYY') AS month, COUNT(*) AS count
            FROM resumes r
            JOIN job_descriptions jd ON r.job_id = jd.job_id
            WHERE jd.recruiter_id = %s
              AND r.upload_date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(r.upload_date, 'Mon YYYY'), DATE_TRUNC('month', r.upload_date)
            ORDER BY DATE_TRUNC('month', r.upload_date)
        """, (recruiter_id,))

    # ── 4. Applications per job (bar chart) ────────────────
    def get_apps_per_job(self, recruiter_id: int) -> list:
        """Returns how many resumes/applications each job has received."""
        return self._run_query("""
            SELECT jd.job_title, COUNT(r.resume_id) AS count
            FROM job_descriptions jd
            LEFT JOIN resumes r ON jd.job_id = r.job_id
            WHERE jd.recruiter_id = %s
            GROUP BY jd.job_title
            ORDER BY count DESC
            LIMIT 10
        """, (recruiter_id,))

    # ── 5. Recent AI rankings (table) ──────────────────────
    def get_recent_rankings(self, recruiter_id: int) -> list:
        """Returns the top 5 most recently ranked candidates across all recruiter's jobs."""
        return self._run_query("""
            SELECT
                c.candidate_id,
                c.full_name AS candidate_name,
                jd.job_title,
                rk.rank_position,
                rk.overall_score,
                COALESCE(csel.status, 'Pending') AS status
            FROM rankings rk
            JOIN candidates c ON rk.candidate_id = c.candidate_id
            JOIN job_descriptions jd ON rk.job_id = jd.job_id
            LEFT JOIN candidate_selection csel ON rk.candidate_id = csel.candidate_id AND rk.job_id = csel.job_id
            WHERE jd.recruiter_id = %s
            ORDER BY rk.created_at DESC, rk.rank_position ASC
            LIMIT 5
        """, (recruiter_id,))

    # ── 6. Active job listings (table) ─────────────────────
    def get_active_jobs(self, recruiter_id: int) -> list:
        """Returns all active jobs with their applicant counts."""
        return self._run_query("""
            SELECT
                jd.job_id,
                jd.job_title,
                COUNT(r.resume_id) AS applicant_count,
                TO_CHAR(jd.application_deadline, 'YYYY-MM-DD') AS application_deadline,
                jd.status
            FROM job_descriptions jd
            LEFT JOIN resumes r ON jd.job_id = r.job_id
            WHERE jd.recruiter_id = %s AND jd.status = 'Active'
            GROUP BY jd.job_id, jd.job_title, jd.application_deadline, jd.status
            ORDER BY jd.application_deadline ASC
        """, (recruiter_id,))
