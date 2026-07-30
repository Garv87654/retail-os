from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogResponse
from app.auth.security import RoleChecker, get_current_user

router = APIRouter(prefix="/logs", tags=["logs"])

admin_roles = RoleChecker(["Admin"])

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(admin_roles)):
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(200).all()
    return logs
