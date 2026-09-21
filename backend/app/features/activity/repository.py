from typing import Optional
from app.core.database import get_database_connection


class ActivityLogRepository:
    """Handles all database operations for the activity_logs table."""

    def create_log(
        self,
        action: str,
        module: str,
        status: str = "SUCCESS",
        recruiter_id: Optional[int] = None,
        admin_id: Optional[int] = None,
    ) -> None:
        """
        Insert a new activity log record into the database.

        Args:
            action:       What happened (e.g. LOGIN, CREATE_JOB, RESUME_UPLOAD)
            module:       Which part of the system (e.g. Auth, Jobs, Resumes)
            status:       SUCCESS or FAILED
            recruiter_id: Set when a recruiter performed the action (admin_id is NULL)
            admin_id:     Set when an admin performed the action (recruiter_id is NULL)
        """
        connection = get_database_connection()
        if connection is None:
            print("[ACTIVITY LOG] Could not connect to the database. Log was skipped.")
            return

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO activity_logs
                        (recruiter_id, admin_id, action, module, status)
                    VALUES
                        (%s, %s, %s, %s, %s)
                    """,
                    (recruiter_id, admin_id, action, module, status),
                )
            connection.commit()
        except Exception as error:
            connection.rollback()
            # Never crash the main request just because logging failed
            print(f"[ACTIVITY LOG] Failed to save log: {error}")
        finally:
            connection.close()

    def get_all_activity_logs(self) -> dict:
        """
        Fetch all activity logs with recruiter details for the admin activity logs page.
        """
        connection = get_database_connection()
        if not connection:
            return {"logs": [], "stats": {}}

        try:
            with connection.cursor(cursor_factory=__import__('psycopg2').extras.RealDictCursor) as cursor:
                # Get the logs with recruiter names
                cursor.execute("""
                    SELECT 
                        al.log_id,
                        al.action,
                        al.module,
                        al.status,
                        al.action_time,
                        r.full_name as recruiter_name
                    FROM activity_logs al
                    INNER JOIN recruiters r ON al.recruiter_id = r.recruiter_id
                    WHERE al.recruiter_id IS NOT NULL
                    ORDER BY al.action_time DESC
                """)
                logs = cursor.fetchall()
                
                # Format logs for frontend
                formatted_logs = []
                for row in logs:
                    formatted_logs.append({
                        "id": row["log_id"],
                        "date": row["action_time"].strftime("%d %b %Y, %I:%M %p") if row["action_time"] else "Unknown",
                        "recruiter": row["recruiter_name"],
                        "module": row["module"],
                        "activity": row["action"],
                        "status": "Success" if row["status"] == "SUCCESS" else ("Failed" if row["status"] == "FAILED" else "Warning"),
                        "action": row["action"]
                    })
                
                # Calculate stats (only for recruiter logs)
                cursor.execute("SELECT COUNT(*) as c FROM activity_logs WHERE recruiter_id IS NOT NULL")
                total_activities = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM activity_logs WHERE recruiter_id IS NOT NULL AND DATE(action_time) = CURRENT_DATE")
                today_activities = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM activity_logs WHERE recruiter_id IS NOT NULL AND action = 'LOGIN'")
                login_events = cursor.fetchone()["c"]
                
                cursor.execute("SELECT COUNT(*) as c FROM activity_logs WHERE recruiter_id IS NOT NULL AND (module = 'Auth' OR action LIKE '%PASSWORD%')")
                security_events = cursor.fetchone()["c"]
                
                return {
                    "logs": formatted_logs,
                    "stats": {
                        "totalActivities": total_activities,
                        "todayActivities": today_activities,
                        "loginEvents": login_events,
                        "securityEvents": security_events
                    }
                }
        except Exception as error:
            print(f"[ACTIVITY LOG] Error fetching logs: {error}")
            return {"logs": [], "stats": {}}
        finally:
            connection.close()

    def get_activity_log_by_id(self, log_id: int) -> dict:
        """
        Fetch a specific activity log by ID with recruiter details.
        """
        connection = get_database_connection()
        if not connection:
            return None

        try:
            with connection.cursor(cursor_factory=__import__('psycopg2').extras.RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT 
                        al.log_id,
                        al.action,
                        al.module,
                        al.status,
                        al.action_time,
                        r.full_name as recruiter_name,
                        r.email as recruiter_email
                    FROM activity_logs al
                    INNER JOIN recruiters r ON al.recruiter_id = r.recruiter_id
                    WHERE al.log_id = %s AND al.recruiter_id IS NOT NULL
                """, (log_id,))
                
                row = cursor.fetchone()
                if not row:
                    return None
                    
                # Format for frontend
                formatted_log = {
                    "id": row["log_id"],
                    "recruiter": row["recruiter_name"],
                    "role": "Recruiter",
                    "email": row["recruiter_email"] or "N/A",
                    "date": row["action_time"].strftime("%d %b %Y, %I:%M %p") if row["action_time"] else "Unknown",
                    "status": "Success" if row["status"] == "SUCCESS" else ("Failed" if row["status"] == "FAILED" else "Warning"),
                    "module": row["module"],
                    "activity": row["action"],
                    "description": f"User performed {row['action']} in {row['module']}",
                    "related": {
                        "type": "generic",
                        "info": f"Log reference: {row['log_id']}"
                    }
                }
                
                # Try to add more specific related info based on module/action
                if row["module"].lower() == "auth":
                    formatted_log["related"] = {
                        "type": "auth",
                        "device": "Web Browser",
                        "location": "System IP"
                    }
                elif "job" in row["action"].lower() or "job" in row["module"].lower():
                    formatted_log["related"] = {
                        "type": "job",
                        "jobTitle": "See Job ID details",
                        "company": "ResumeIQ",
                        "requiredSkills": "N/A"
                    }
                
                return formatted_log
        except Exception as error:
            print(f"[ACTIVITY LOG] Error fetching log {log_id}: {error}")
            return None
        finally:
            connection.close()
