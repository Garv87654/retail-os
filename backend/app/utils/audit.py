from sqlalchemy.orm import Session
from app.models.models import AuditLog

def log_event(db: Session, action: str, details: str, user_id: int = None, username: str = None):
    try:
        log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            details=details
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to write audit log: {e}")
        db.rollback()
