from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.session import get_db
from app.models.models import Product, Warehouse, ForecastResult, User
from app.schemas.schemas import ForecastRequest, ForecastResponse
from app.ml.forecast_model import predict_demand
from app.auth.security import RoleChecker, get_current_user
from app.utils.audit import log_event

router = APIRouter(prefix="/forecast", tags=["forecast"])

read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Viewer"])

@router.post("/", response_model=ForecastResponse)
def get_forecast(req: ForecastRequest, horizon: str = "week", db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    p = db.query(Product).filter(Product.id == req.product_id).first()
    w = db.query(Warehouse).filter(Warehouse.id == req.warehouse_id).first()
    
    if not p or not w:
        raise HTTPException(status_code=404, detail="Product or Warehouse not found")
        
    # Generate prediction using XGBoost helper
    pred = predict_demand(req.product_id, req.warehouse_id, horizon)
    
    # Store result in DB
    result = ForecastResult(
        product_id=req.product_id,
        warehouse_id=req.warehouse_id,
        predicted_demand=pred["predicted_demand"],
        confidence=pred["confidence"],
        recommendation=pred["recommendation"],
        horizon=horizon,
        forecast_date=datetime.utcnow()
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    
    log_event(
        db, 
        "FORECAST_DEMAND", 
        f"Generated demand forecast for {p.name} at {w.name} over {horizon}. Prediction: {pred['predicted_demand']} units", 
        current_user.id, 
        current_user.username
    )
    
    return ForecastResponse(
        product_id=result.product_id,
        warehouse_id=result.warehouse_id,
        predicted_demand=result.predicted_demand,
        confidence=result.confidence,
        recommendation=result.recommendation,
        horizon=result.horizon,
        forecast_date=result.forecast_date
    )
