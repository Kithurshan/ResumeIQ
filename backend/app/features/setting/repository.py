import json
from typing import Dict, Any, Optional
from fastapi import HTTPException
from app.core.database import get_database_connection
from datetime import datetime

class SettingsRepository:
    """Repository for global system settings (beginner-friendly)."""

    def get_setting(self, setting_name: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific setting by name from the database."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
            
        try:
            with connection.cursor() as cursor:
                query = "SELECT setting_value FROM system_settings WHERE setting_name = %s"
                cursor.execute(query, (setting_name,))
                row = cursor.fetchone()
                
                if row and row['setting_value']:
                    # Setting values are stored as JSON strings
                    return json.loads(row['setting_value'])
                return None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_setting(self, setting_name: str, setting_value: Dict[str, Any]) -> None:
        """Update or insert a setting."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
            
        try:
            with connection.cursor() as cursor:
                # Check if it already exists
                cursor.execute("SELECT setting_id FROM system_settings WHERE setting_name = %s", (setting_name,))
                row = cursor.fetchone()
                
                value_json = json.dumps(setting_value)
                now = datetime.now()
                
                if row:
                    # Update
                    query = """
                        UPDATE system_settings 
                        SET setting_value = %s, updated_at = %s 
                        WHERE setting_name = %s
                    """
                    cursor.execute(query, (value_json, now, setting_name))
                else:
                    # Insert
                    query = """
                        INSERT INTO system_settings (setting_name, setting_value, updated_at) 
                        VALUES (%s, %s, %s)
                    """
                    cursor.execute(query, (setting_name, value_json, now))
                    
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error updating setting: {str(exc)}")
        finally:
            connection.close()
