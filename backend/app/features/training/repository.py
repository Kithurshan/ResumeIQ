import uuid
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.core.database import get_database_connection
from datetime import datetime

class TrainingRepository:
    """Repository for AI Model Training History."""

    def create_training_record(self) -> str:
        """Creates a new pending training record and returns its ID."""
        training_id = f"TR-{uuid.uuid4().hex[:6].upper()}"
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
            
        try:
            with connection.cursor() as cursor:
                query = """
                    INSERT INTO model_training_history (id, started_at, status) 
                    VALUES (%s, %s, 'Training')
                """
                cursor.execute(query, (training_id, datetime.now()))
                connection.commit()
                return training_id
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def update_training_status(
        self, 
        training_id: str, 
        status: str, 
        duration: str = None, 
        accuracy: float = None, 
        samples_trained: int = None, 
        error_message: str = None
    ):
        """Updates an existing training record upon completion or failure."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
            
        try:
            with connection.cursor() as cursor:
                query = """
                    UPDATE model_training_history 
                    SET status = %s, ended_at = %s, duration = %s, accuracy = %s, samples_trained = %s, error_message = %s
                    WHERE id = %s
                """
                cursor.execute(query, (status, datetime.now(), duration, accuracy, samples_trained, error_message, training_id))
                connection.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def get_latest_training_status(self) -> Optional[Dict[str, Any]]:
        """Gets the most recent training run to check if it's currently active."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
            
        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT id, started_at, ended_at, duration, status, accuracy, samples_trained, error_message
                    FROM model_training_history 
                    ORDER BY started_at DESC LIMIT 1
                """
                cursor.execute(query)
                row = cursor.fetchone()
                if row:
                    return dict(row)
                return None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()

    def get_all_history(self) -> List[Dict[str, Any]]:
        """Gets the full training history ordered by most recent."""
        connection = get_database_connection()
        if connection is None:
            raise HTTPException(status_code=503, detail="Database is not available.")
            
        try:
            with connection.cursor() as cursor:
                query = """
                    SELECT id, started_at, ended_at, duration, status, accuracy, samples_trained 
                    FROM model_training_history 
                    ORDER BY started_at DESC
                """
                cursor.execute(query)
                rows = cursor.fetchall()
                
                # Format for the frontend UI table
                formatted_history = []
                for row in rows:
                    date_str = row['started_at'].strftime("%d %b %Y") if row['started_at'] else "Unknown"
                    dur_str = row['duration'] or "-"
                    
                    formatted_history.append({
                        "id": row['id'],
                        "date": date_str,
                        "duration": dur_str,
                        "status": row['status'],
                        "accuracy": row['accuracy'],
                        "samples_trained": row['samples_trained']
                    })
                return formatted_history
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")
        finally:
            connection.close()
