from fastapi import APIRouter, HTTPException, BackgroundTasks, Header
from typing import Optional
from app.features.activity.service import ActivityLogService
from app.features.training.repository import TrainingRepository
from app.features.notification.repository import NotificationRepository

router = APIRouter()
activity_logger = ActivityLogService()
repo = TrainingRepository()
notif_repo = NotificationRepository()

@router.post("/retrain/start")
async def retrain_model(background_tasks: BackgroundTasks, x_admin_id: Optional[str] = Header(None)):
    """
    Endpoint triggered by the 'Retrain' button in the admin dashboard.
    Spawns background task to retrain model.
    """
    admin_id = int(x_admin_id) if x_admin_id else 1
    try:
        # Check if already running
        latest = repo.get_latest_training_status()
        if latest and latest.get("status") == "Training":
            raise HTTPException(status_code=400, detail="A training session is already in progress.")

        # Create record and get ID
        training_id = repo.create_training_record()
        
        # Log training start
        activity_logger.log_admin_action(
            admin_id=admin_id,
            action="MODEL_RETRAIN_STARTED",
            module="Machine Learning",
        )
        
        # Create a notification for the admin
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Model Retraining Started",
            message="The AI model retraining process has been initiated."
        )

        # Trigger background process
        from app.ai.continuous_trainer import trigger_retraining
        background_tasks.add_task(trigger_retraining, training_id, admin_id)

        return {"status": "success", "message": "Training started", "training_id": training_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start retraining: {str(e)}")

@router.get("/retrain/status")
async def get_retrain_status():
    """Returns the current or most recent training status."""
    try:
        latest = repo.get_latest_training_status()
        if not latest:
            return {"status": "ready"}
        return {"status": "success", "data": latest}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retrain/history")
async def get_retrain_history():
    """Returns the history of all trainings."""
    try:
        history = repo.get_all_history()
        return {"status": "success", "data": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
