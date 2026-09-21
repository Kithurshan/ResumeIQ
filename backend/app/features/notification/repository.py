from app.core.database import get_database_connection

class NotificationRepository:
    def _run_query(self, query, params=None, fetch=None):
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

    def get_notifications(self, recruiter_id: int):
        return self._run_query(
            "SELECT * FROM notifications WHERE recruiter_id = %s ORDER BY created_at DESC",
            (recruiter_id,),
            fetch="all"
        )

    def create_notification(self, recruiter_id: int, title: str, message: str):
        self._run_query(
            "INSERT INTO notifications (recruiter_id, title, message, is_read) VALUES (%s, %s, %s, false)",
            (recruiter_id, title, message)
        )

    def mark_as_read(self, notification_id: int, recruiter_id: int):
        self._run_query(
            "UPDATE notifications SET is_read = true WHERE notification_id = %s AND recruiter_id = %s",
            (notification_id, recruiter_id)
        )

    def mark_all_as_read(self, recruiter_id: int):
        self._run_query(
            "UPDATE notifications SET is_read = true WHERE recruiter_id = %s",
            (recruiter_id,)
        )

    def delete_notification(self, notification_id: int, recruiter_id: int):
        self._run_query(
            "DELETE FROM notifications WHERE notification_id = %s AND recruiter_id = %s",
            (notification_id, recruiter_id)
        )

    # ==========================
    # ADMIN NOTIFICATIONS
    # ==========================

    def get_admin_notifications(self, admin_id: int):
        return self._run_query(
            "SELECT * FROM notifications WHERE admin_id = %s ORDER BY created_at DESC",
            (admin_id,),
            fetch="all"
        )

    def create_admin_notification(self, admin_id: int, title: str, message: str):
        self._run_query(
            "INSERT INTO notifications (admin_id, title, message, is_read) VALUES (%s, %s, %s, false)",
            (admin_id, title, message)
        )

    def mark_admin_as_read(self, notification_id: int, admin_id: int):
        self._run_query(
            "UPDATE notifications SET is_read = true WHERE notification_id = %s AND admin_id = %s",
            (notification_id, admin_id)
        )

    def mark_all_admin_as_read(self, admin_id: int):
        self._run_query(
            "UPDATE notifications SET is_read = true WHERE admin_id = %s",
            (admin_id,)
        )

    def delete_admin_notification(self, notification_id: int, admin_id: int):
        self._run_query(
            "DELETE FROM notifications WHERE notification_id = %s AND admin_id = %s",
            (notification_id, admin_id)
        )

    def get_settings(self, recruiter_id: int):
        import json
        setting_name = f"recruiter_{recruiter_id}_notifications"
        row = self._run_query(
            "SELECT setting_value FROM system_settings WHERE setting_name = %s",
            (setting_name,),
            fetch="one"
        )
        if not row:
            default_settings = {
                "upload_notifs": True,
                "analysis_completed": True,
                "analysis_failed": True,
                "ai_ready": True,
                "shortlist_updates": True,
                "deadline_reminder": True,
                "system_announcements": True
            }
            self._run_query(
                "INSERT INTO system_settings (setting_name, setting_value) VALUES (%s, %s)",
                (setting_name, json.dumps(default_settings))
            )
            return default_settings
        
        try:
            return json.loads(row["setting_value"])
        except:
            return {}

    def update_settings(self, recruiter_id: int, settings: dict):
        import json
        setting_name = f"recruiter_{recruiter_id}_notifications"
        setting_value = json.dumps(settings)
        
        # Try update first
        conn = get_database_connection()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE system_settings SET setting_value = %s, updated_at = CURRENT_TIMESTAMP WHERE setting_name = %s", (setting_value, setting_name))
            if cur.rowcount == 0:
                cur.execute("INSERT INTO system_settings (setting_name, setting_value) VALUES (%s, %s)", (setting_name, setting_value))
            conn.commit()
        finally:
            conn.close()
