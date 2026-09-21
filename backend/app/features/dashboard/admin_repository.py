from app.core.database import get_database_connection

class AdminDashboardRepository:
    def _run_query(self, query, params=None, fetch="all"):
        conn = get_database_connection()
        try:
            cur = conn.cursor()
            cur.execute(query, params or ())
            if fetch == "all":
                result = cur.fetchall()
            elif fetch == "one":
                result = cur.fetchone()
            else:
                result = None
            conn.commit()
            return result
        finally:
            conn.close()

    def get_dashboard_stats(self):
        # 1. Total Recruiters
        total_recruiters = self._run_query("SELECT COUNT(*) as count FROM recruiters", fetch="one")["count"]
        
        # 2. Active Jobs
        active_jobs = self._run_query("SELECT COUNT(*) as count FROM job_descriptions WHERE status = 'Active'", fetch="one")["count"]
        
        # 3. Uploaded Resumes
        uploaded_resumes = self._run_query("SELECT COUNT(*) as count FROM resumes", fetch="one")["count"]
        
        # 4. AI Processed
        ai_processed = self._run_query("SELECT COUNT(*) as count FROM resumes WHERE processing_status = 'Completed'", fetch="one")["count"]
        
        # 5. Shortlisted Candidates
        shortlisted = self._run_query("SELECT COUNT(*) as count FROM candidate_selection WHERE status = 'Shortlisted'", fetch="one")["count"]
        
        # 6. Processing Queue
        queue = self._run_query("SELECT COUNT(*) as count FROM resumes WHERE processing_status IN ('Pending', 'Processing')", fetch="one")["count"]
        
        return {
            "total_recruiters": total_recruiters,
            "active_jobs": active_jobs,
            "uploaded_resumes": uploaded_resumes,
            "ai_processed": ai_processed,
            "shortlisted_candidates": shortlisted,
            "processing_queue": queue
        }

    def get_ai_status_data(self):
        # Returns counts grouped by processing status for the Doughnut chart
        rows = self._run_query("SELECT processing_status, COUNT(*) as count FROM resumes GROUP BY processing_status")
        return [{"status": row["processing_status"], "count": row["count"]} for row in rows]

    def get_candidate_decisions_data(self):
        # Returns counts grouped by selection status for the Pie chart
        rows = self._run_query("SELECT status, COUNT(*) as count FROM candidate_selection GROUP BY status")
        return [{"status": row["status"], "count": row["count"]} for row in rows]

    def get_recent_activity(self):
        # Returns latest 5 activity logs
        rows = self._run_query("""
            SELECT l.log_id, l.action, l.module, l.action_time as created_at, 
                   COALESCE(r.full_name, 'Admin') as user_name 
            FROM activity_logs l
            LEFT JOIN recruiters r ON l.recruiter_id = r.recruiter_id
            ORDER BY l.action_time DESC 
            LIMIT 5
        """)
        return rows

    def get_processing_trend(self):
        # Count resumes uploaded by month
        rows = self._run_query("""
            SELECT TO_CHAR(upload_date, 'Mon') as month, COUNT(*) as count 
            FROM resumes 
            GROUP BY TO_CHAR(upload_date, 'Mon'), EXTRACT(MONTH FROM upload_date)
            ORDER BY EXTRACT(MONTH FROM upload_date)
        """)
        return [{"month": row["month"], "count": row["count"]} for row in rows]

    def get_recruiter_activity_chart(self):
        # Activity count per recruiter
        rows = self._run_query("""
            SELECT COALESCE(r.full_name, 'Admin') as name, COUNT(*) as count 
            FROM activity_logs l
            LEFT JOIN recruiters r ON l.recruiter_id = r.recruiter_id
            GROUP BY COALESCE(r.full_name, 'Admin')
            LIMIT 5
        """)
        return [{"name": row["name"], "count": row["count"]} for row in rows]

    def get_recently_added_recruiters(self):
        # Latest 5 recruiters added
        rows = self._run_query("""
            SELECT full_name as recruiter, department as company, 
                   created_at as joined_date, status
            FROM recruiters 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        return rows

    def get_latest_ai_processing(self):
        # Latest 5 resumes processed
        rows = self._run_query("""
            SELECT r.file_name as resume, COALESCE(rec.full_name, 'Unknown') as recruiter, 
                   r.processing_status as status, 
                   COALESCE(cs.overall_score, 0) as ai_score
            FROM resumes r
            LEFT JOIN recruiters rec ON r.recruiter_id = rec.recruiter_id
            LEFT JOIN candidate_scores cs ON r.resume_id = cs.resume_id
            ORDER BY r.upload_date DESC 
            LIMIT 5
        """)
        return rows
