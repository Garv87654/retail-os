from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.models import Supplier, PurchaseOrder, User
from app.schemas.schemas import SupplierCreate, SupplierResponse
from app.auth.security import RoleChecker, get_current_user
from app.utils.audit import log_event

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

write_roles = RoleChecker(["Admin", "Procurement Manager"])
read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff", "Viewer"])

@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    return db.query(Supplier).all()

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return s

@router.post("/", response_model=SupplierResponse)
def create_supplier(sup: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    exists = db.query(Supplier).filter(Supplier.name == sup.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Supplier name already exists")
        
    s = Supplier(**sup.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    
    log_event(db, "CREATE_SUPPLIER", f"Created supplier {s.name}", current_user.id, current_user.username)
    return s

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, sup: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    for k, v in sup.model_dump().items():
        setattr(s, k, v)
        
    db.commit()
    db.refresh(s)
    
    log_event(db, "UPDATE_SUPPLIER", f"Updated supplier {s.name}", current_user.id, current_user.username)
    return s

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    log_event(db, "DELETE_SUPPLIER", f"Deleted supplier {s.name}", current_user.id, current_user.username)
    db.delete(s)
    db.commit()
    return {"detail": "Supplier deleted successfully"}

@router.get("/{supplier_id}/performance")
def get_supplier_performance(supplier_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    # Get all purchase orders for this supplier
    pos = db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == supplier_id).all()
    
    total_pos = len(pos)
    delivered_pos = [po for po in pos if po.status == "Delivered"]
    delivered_count = len(delivered_pos)
    
    # Calculate late deliveries
    # In a real database, we would compare updated_at (date delivered) with expected_delivery
    # Let's mock a rating / delay logic based on dates or simple random/seed variables for robust UI.
    late_deliveries = 0
    total_lead_time = 0
    
    for po in delivered_pos:
        # If updated_at is later than expected delivery, count as late
        if po.updated_at and po.expected_delivery and po.updated_at > po.expected_delivery:
            late_deliveries += 1
            
        if po.updated_at and po.created_at:
            delta = (po.updated_at - po.created_at).days
            total_lead_time += max(delta, 1) # min 1 day
            
    avg_delivery_time = round(total_lead_time / delivered_count, 1) if delivered_count > 0 else s.delivery_time
    
    # Purchase history
    history = []
    for po in pos[:10]: # latest 10
        history.append({
            "id": po.id,
            "order_number": po.order_number,
            "status": po.status,
            "grand_total": po.grand_total,
            "created_at": po.created_at
        })
        
    return {
        "supplier_name": s.name,
        "rating": s.rating,
        "average_delivery_time": avg_delivery_time,
        "total_purchase_orders": total_pos,
        "delivered_orders": delivered_count,
        "late_deliveries": late_deliveries,
        "status": s.status,
        "purchase_history": history
    }
