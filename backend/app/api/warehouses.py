from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Warehouse, WarehouseInventory, Product, InventoryTransaction, User
from app.schemas.schemas import WarehouseCreate, WarehouseResponse, StockTransferRequest
from app.auth.security import RoleChecker, get_current_user
from app.utils.audit import log_event

router = APIRouter(prefix="/warehouses", tags=["warehouses"])

# Roles definitions
write_roles = RoleChecker(["Admin", "Warehouse Manager"])
read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff", "Viewer"])

@router.get("/", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    warehouses = db.query(Warehouse).all()
    
    # Calculate utilization
    res = []
    for w in warehouses:
        # Sum current stock in warehouse
        total_items = db.query(func.sum(WarehouseInventory.current_stock)).filter(WarehouseInventory.warehouse_id == w.id).scalar() or 0
        util_pct = (total_items / w.capacity) * 100 if w.capacity > 0 else 0
        res.append(
            WarehouseResponse(
                id=w.id,
                name=w.name,
                address=w.address,
                city=w.city,
                state=w.state,
                country=w.country,
                capacity=w.capacity,
                manager_name=w.manager_name,
                phone=w.phone,
                email=w.email,
                utilization_pct=round(min(util_pct, 100.0), 2)
            )
        )
    return res

@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    total_items = db.query(func.sum(WarehouseInventory.current_stock)).filter(WarehouseInventory.warehouse_id == w.id).scalar() or 0
    util_pct = (total_items / w.capacity) * 100 if w.capacity > 0 else 0
    
    return WarehouseResponse(
        id=w.id,
        name=w.name,
        address=w.address,
        city=w.city,
        state=w.state,
        country=w.country,
        capacity=w.capacity,
        manager_name=w.manager_name,
        phone=w.phone,
        email=w.email,
        utilization_pct=round(min(util_pct, 100.0), 2)
    )

@router.post("/", response_model=WarehouseResponse)
def create_warehouse(wh: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    exists = db.query(Warehouse).filter(Warehouse.name == wh.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Warehouse name already exists")
        
    w = Warehouse(**wh.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    
    log_event(db, "CREATE_WAREHOUSE", f"Created warehouse {w.name} (Capacity: {w.capacity})", current_user.id, current_user.username)
    return WarehouseResponse(
        id=w.id,
        name=w.name,
        address=w.address,
        city=w.city,
        state=w.state,
        country=w.country,
        capacity=w.capacity,
        manager_name=w.manager_name,
        phone=w.phone,
        email=w.email,
        utilization_pct=0.0
    )

@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: int, wh: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    for k, v in wh.model_dump().items():
        setattr(w, k, v)
    db.commit()
    db.refresh(w)
    
    total_items = db.query(func.sum(WarehouseInventory.current_stock)).filter(WarehouseInventory.warehouse_id == w.id).scalar() or 0
    util_pct = (total_items / w.capacity) * 100 if w.capacity > 0 else 0
    
    log_event(db, "UPDATE_WAREHOUSE", f"Updated warehouse {w.name}", current_user.id, current_user.username)
    return WarehouseResponse(
        id=w.id,
        name=w.name,
        address=w.address,
        city=w.city,
        state=w.state,
        country=w.country,
        capacity=w.capacity,
        manager_name=w.manager_name,
        phone=w.phone,
        email=w.email,
        utilization_pct=round(min(util_pct, 100.0), 2)
    )

@router.delete("/{warehouse_id}")
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    # Check if stock exists in warehouse
    has_stock = db.query(WarehouseInventory).filter(
        WarehouseInventory.warehouse_id == warehouse_id,
        WarehouseInventory.current_stock > 0
    ).first()
    
    if has_stock:
        raise HTTPException(status_code=400, detail="Cannot delete warehouse with active stock. Transfer inventory first.")
        
    log_event(db, "DELETE_WAREHOUSE", f"Deleted warehouse {w.name}", current_user.id, current_user.username)
    db.delete(w)
    db.commit()
    return {"detail": "Warehouse deleted successfully"}

@router.get("/{warehouse_id}/inventory")
def get_warehouse_inventory(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
        
    inv = db.query(WarehouseInventory).filter(WarehouseInventory.warehouse_id == warehouse_id).all()
    
    res = []
    for item in inv:
        if item.current_stock > 0:
            res.append({
                "product_id": item.product.id,
                "product_name": item.product.name,
                "sku": item.product.sku,
                "current_stock": item.current_stock,
                "buying_price": item.product.buying_price,
                "selling_price": item.product.selling_price
            })
    return res

@router.post("/transfer")
def transfer_stock(req: StockTransferRequest, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    if req.from_warehouse_id == req.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouses cannot be the same")
        
    from_wh = db.query(Warehouse).filter(Warehouse.id == req.from_warehouse_id).first()
    to_wh = db.query(Warehouse).filter(Warehouse.id == req.to_warehouse_id).first()
    p = db.query(Product).filter(Product.id == req.product_id).first()
    
    if not from_wh or not to_wh or not p:
        raise HTTPException(status_code=404, detail="Source/Destination Warehouse or Product not found")
        
    # Check source inventory
    from_inv = db.query(WarehouseInventory).filter(
        WarehouseInventory.warehouse_id == req.from_warehouse_id,
        WarehouseInventory.product_id == req.product_id
    ).first()
    
    if not from_inv or from_inv.current_stock < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source warehouse")
        
    # Check capacity in target warehouse
    target_stock = db.query(func.sum(WarehouseInventory.current_stock)).filter(WarehouseInventory.warehouse_id == req.to_warehouse_id).scalar() or 0
    if target_stock + req.quantity > to_wh.capacity:
        raise HTTPException(status_code=400, detail="Target warehouse has insufficient capacity")
        
    # Perform Transfer
    from_inv.current_stock -= req.quantity
    
    to_inv = db.query(WarehouseInventory).filter(
        WarehouseInventory.warehouse_id == req.to_warehouse_id,
        WarehouseInventory.product_id == req.product_id
    ).first()
    
    if not to_inv:
        to_inv = WarehouseInventory(warehouse_id=req.to_warehouse_id, product_id=req.product_id, current_stock=0)
        db.add(to_inv)
        
    to_inv.current_stock += req.quantity
    
    # Write Transaction Logs
    ref_id = f"TRF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    tx_out = InventoryTransaction(
        product_id=p.id,
        warehouse_id=from_wh.id,
        transaction_type="TRANSFER_OUT",
        quantity=-req.quantity,
        reference_id=ref_id,
        user_id=current_user.id,
        notes=f"Transferred to {to_wh.name}"
    )
    tx_in = InventoryTransaction(
        product_id=p.id,
        warehouse_id=to_wh.id,
        transaction_type="TRANSFER_IN",
        quantity=req.quantity,
        reference_id=ref_id,
        user_id=current_user.id,
        notes=f"Transferred from {from_wh.name}"
    )
    db.add(tx_out)
    db.add(tx_in)
    
    db.commit()
    
    log_event(
        db, 
        "STOCK_TRANSFER", 
        f"Transferred {req.quantity} units of {p.name} from {from_wh.name} to {to_wh.name}", 
        current_user.id, 
        current_user.username
    )
    return {"detail": "Stock transferred successfully"}

@router.get("/transfer/history")
def get_transfer_history(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    # Fetch TRANSFER_IN and TRANSFER_OUT transactions
    txs = db.query(InventoryTransaction).filter(
        InventoryTransaction.transaction_type.in_(["TRANSFER_IN", "TRANSFER_OUT"])
    ).order_by(InventoryTransaction.timestamp.desc()).limit(100).all()
    
    # Group pairs of transfers by reference_id
    transfers = {}
    for tx in txs:
        ref = tx.reference_id
        if ref not in transfers:
            transfers[ref] = {
                "reference_id": ref,
                "product_name": tx.product.name if tx.product else "Deleted Product",
                "sku": tx.product.sku if tx.product else "",
                "quantity": abs(tx.quantity),
                "timestamp": tx.timestamp,
                "from_warehouse": "",
                "to_warehouse": ""
            }
        if tx.transaction_type == "TRANSFER_OUT":
            transfers[ref]["from_warehouse"] = tx.warehouse.name if tx.warehouse else "Unknown"
        elif tx.transaction_type == "TRANSFER_IN":
            transfers[ref]["to_warehouse"] = tx.warehouse.name if tx.warehouse else "Unknown"
            
    return list(transfers.values())
