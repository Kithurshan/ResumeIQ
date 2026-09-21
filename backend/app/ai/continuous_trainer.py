import os
import pandas as pd
import joblib
from sqlalchemy import text
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
import time
import warnings
from sklearn.metrics import accuracy_score
from app.core.database import get_database_connection
from app.features.training.repository import TrainingRepository
from app.features.notification.repository import NotificationRepository

# The path where the model is stored
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "resumeiq_xgboost_model.pkl")

def trigger_retraining(training_id: str, admin_id: int = 1):
    
    # Track the start time
    start_time = time.time()
    repo = TrainingRepository()
    notif_repo = NotificationRepository()
    
    try:
        # Pulls fresh labeled data from PostgreSQL and retrains the XGBoost model incrementally.
        # Only pulls data that was decided upon AFTER the last retrain timestamp.
    
        connection = get_database_connection()
    
        # 1. Pull Only NEW Data using SQL JOIN and system_settings timestamp
        query = """
        SELECT 
            cs.skill_score, 
            cs.experience_score, 
            cs.education_score, 
            cs.certification_score, 
            cs.semantic_score, 
            cs.portfolio_score, 
            cs.linkedin_score,
            sel.status as human_final_label,
            sel.decision_date
        FROM candidate_scores cs
        JOIN candidate_selection sel ON cs.candidate_id = sel.candidate_id AND cs.job_id = sel.job_id
        WHERE sel.status IN ('Shortlisted', 'Rejected')
        AND sel.decision_date > (
            SELECT COALESCE(
                (SELECT setting_value::timestamp FROM system_settings WHERE setting_name = 'last_ml_retrain_time'), 
                '1970-01-01 00:00:00'::timestamp
            )
        );
        """
    
        try:
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', UserWarning)
                df = pd.read_sql(query, connection)
        except Exception as e:
            error_msg = f"Database query failed: {str(e)}"
            repo.update_training_status(training_id, "Failed", error_message=error_msg)
            return {"status": "error", "message": error_msg}
    
        if df.empty or len(df) < 5:  # Require at least 5 new records to justify a retrain
            msg = "Not enough new labeled data to retrain. Wait for more recruiter decisions."
            repo.update_training_status(training_id, "Cancelled", error_message=msg)
            
            notif_repo.create_admin_notification(
                admin_id=admin_id,
                title="Training Cancelled",
                message=msg
            )
            return {"status": "info", "message": msg}
    
        # Track the maximum decision date in this batch so we can save it later
        max_decision_date = df['decision_date'].max()
    
        # 2. Preprocess Data
        # Convert 'Shortlisted' to 1, 'Rejected' to 0
        df['human_final_label'] = df['human_final_label'].map({'Shortlisted': 1, 'Rejected': 0})
    
        # Fill missing values
        df.fillna(0, inplace=True)
    
        # 3. Features and Target
        X = df.drop(columns=['human_final_label', 'decision_date'])
        y = df['human_final_label']
    
        # If we have enough data, split for testing. If not, just train on everything.
        if len(df) >= 20:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        else:
            X_train, y_train = X, y
            X_test, y_test = X, y
    
        # 4. Handle Class Imbalance (Balancing)
        num_neg = (y_train == 0).sum()
        num_pos = (y_train == 1).sum()
        scale_pos = num_neg / num_pos if num_pos > 0 else 1.0

        print(f"Class Balance for new data: Rejected={num_neg}, Shortlisted={num_pos}, scale_pos_weight={scale_pos:.2f}")

        # 5. Continuous Learning (Incremental Training)
        # Check if old model exists
        if os.path.exists(MODEL_PATH):
            print(f"Loading existing model from {MODEL_PATH}")
            # Load the previously saved model
            old_model = joblib.load(MODEL_PATH)
        
            # Note: In XGBoost, to truly train incrementally on NEW data only (and keep the old trees),
            # we load the old model, and pass it to the `fit` function via `xgb_model`.
            # However, because scikit-learn's XGBClassifier wrapper handles this slightly differently, 
            # the safest robust way for the sklearn wrapper is:
            model = XGBClassifier(
                n_estimators=100, 
                learning_rate=0.1, 
                max_depth=5, 
                scale_pos_weight=scale_pos,
                random_state=42
            )
            model.fit(X_train, y_train, xgb_model=MODEL_PATH)
        else:
            print("No existing model found. Training from scratch.")
            model = XGBClassifier(
                n_estimators=100, 
                learning_rate=0.1, 
                max_depth=5, 
                scale_pos_weight=scale_pos,
                random_state=42
            )
            model.fit(X_train, y_train)
    
        # 6. Evaluate New Model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
    
        # 7. Save the newly updated model
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
    
        # 8. Update the timestamp in system_settings
        update_timestamp_query = text("""
            INSERT INTO system_settings (setting_name, setting_value, updated_at) 
            VALUES ('last_ml_retrain_time', :max_date, NOW())
            ON CONFLICT (setting_name) DO UPDATE 
            SET setting_value = :max_date, updated_at = NOW();
        """)
    
        try:
            with connection.begin() as conn:
                # Format timestamp as string for setting_value
                conn.execute(update_timestamp_query, {"max_date": max_decision_date.strftime('%Y-%m-%d %H:%M:%S')})
        except Exception as e:
            print(f"Warning: Model trained but failed to update timestamp: {e}")
            # We don't fail the whole request just because timestamp update failed, 
            # but it will cause duplicate training next time.
    
        # Calculate duration
        end_time = time.time()
        duration_secs = int(end_time - start_time)
        duration_str = f"{duration_secs // 60}m {duration_secs % 60}s" if duration_secs >= 60 else f"{duration_secs}s"
    
        # Update history table
        repo.update_training_status(
            training_id=training_id,
            status="Completed",
            accuracy=round(accuracy * 100, 2),
            samples_trained=len(X_train),
            duration=duration_str
        )

        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Training Complete",
            message=f"Model successfully retrained with {len(X_train)} new records. Accuracy: {accuracy*100:.1f}%"
        )
    
        return {
            "status": "success", 
            "message": "Model retrained successfully with new data.", 
            "new_accuracy": round(accuracy * 100, 2),
            "new_samples_trained": len(X_train),
            "last_trained_date": max_decision_date.strftime('%Y-%m-%d %H:%M:%S')
        }

    except Exception as general_exc:
        import traceback
        tb = traceback.format_exc()
        repo.update_training_status(training_id, "Failed", error_message=str(general_exc))
        
        notif_repo.create_admin_notification(
            admin_id=admin_id,
            title="Training Failed",
            message=f"Model retraining encountered an error: {str(general_exc)}"
        )
        
        print(f"Background training failed: {tb}")
        return {"status": "error", "message": str(general_exc)}
