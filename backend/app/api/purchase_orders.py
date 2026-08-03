from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import PurchaseOrder, PurchaseOrderItem, Product, Supplier, Warehouse, WarehouseInventory, InventoryTransaction, User
from app.schemas.schemas import PurchaseOrderCreate, PurchaseOrderResponse
from app.auth.security import RoleChecker, get_current_user
from app.utils.audit import log_event

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])

write_roles = RoleChecker(["Admin", "Procurement Manager"])
approve_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager"])
read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff", "Viewer"])

@router.get("/", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()
    
    res = []
    for po in pos:
        res.append(
            PurchaseOrderResponse(
                id=po.id,
                supplier_id=po.supplier_id,
                supplier_name=po.supplier.name if po.supplier else None,
                order_number=po.order_number,
                status=po.status,
                tax=po.tax,
                discount=po.discount,
                shipping=po.shipping,
                expected_delivery=po.expected_delivery,
                grand_total=po.grand_total,
                created_at=po.created_at,
                updated_at=po.updated_at,
                items=[{
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else "Deleted Product",
                    "quantity": item.quantity,
                    "buying_price": item.buying_price
                } for item in po.items]
            )
        )
    return res

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    return PurchaseOrderResponse(
        id=po.id,
        supplier_id=po.supplier_id,
        supplier_name=po.supplier.name if po.supplier else None,
        order_number=po.order_number,
        status=po.status,
        tax=po.tax,
        discount=po.discount,
        shipping=po.shipping,
        expected_delivery=po.expected_delivery,
        grand_total=po.grand_total,
        created_at=po.created_at,
        updated_at=po.updated_at,
        items=[{
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else None,
            "quantity": item.quantity,
            "buying_price": item.buying_price
        } for item in po.items]
    )

@router.post("/", response_model=PurchaseOrderResponse)
def create_purchase_order(po_in: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    sup = db.query(Supplier).filter(Supplier.id == po_in.supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    order_num = f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{db.query(PurchaseOrder).count() + 1}"
    
    # Calculate subtotal and grand total
    subtotal = 0.0
    for item in po_in.items:
        subtotal += item.quantity * item.buying_price
        
    grand_total = subtotal + po_in.tax + po_in.shipping - po_in.discount
    
    po = PurchaseOrder(
        supplier_id=po_in.supplier_id,
        order_number=order_num,
        status="Draft",
        tax=po_in.tax,
        discount=po_in.discount,
        shipping=po_in.shipping,
        expected_delivery=po_in.expected_delivery,
        grand_total=grand_total
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    
    # Create items
    for item in po_in.items:
        po_item = PurchaseOrderItem(
            purchase_order_id=po.id,
            product_id=item.product_id,
            quantity=item.quantity,
            buying_price=item.buying_price
        )
        db.add(po_item)
        
    db.commit()
    db.refresh(po)
    
    log_event(db, "CREATE_PO", f"Created purchase order {po.order_number} for supplier {sup.name}", current_user.id, current_user.username)
    return po

@router.post("/{po_id}/status")
def update_po_status(po_id: int, new_status: str, db: Session = Depends(get_db), current_user: User = Depends(approve_roles)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    valid_statuses = ["Draft", "Pending", "Approved", "Rejected", "Ordered", "Delivered", "Cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid PO status")
        
    # Prevent transition if already Delivered or Cancelled
    if po.status in ["Delivered", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot change status of a {po.status} purchase order")
        
    old_status = po.status
    po.status = new_status
    po.updated_at = datetime.utcnow()
    
    # Automatically increase stock after delivery
    if new_status == "Delivered":
        # Find a warehouse to receive stock (default to first warehouse, or assign evenly)
        wh = db.query(Warehouse).first()
        if not wh:
            raise HTTPException(status_code=400, detail="No warehouses exist to receive stock")
            
        for item in po.items:
            # Update product global current stock
            p = db.query(Product).filter(Product.id == item.product_id).first()
            if p:
                p.current_stock += item.quantity
                if p.current_stock <= 0:
                    p.status = "Out of Stock"
                elif p.current_stock <= p.minimum_stock:
                    p.status = "Low Stock"
                else:
                    p.status = "In Stock"
                    
                # Update warehouse specific stock
                winv = db.query(WarehouseInventory).filter(
                    WarehouseInventory.warehouse_id == wh.id,
                    WarehouseInventory.product_id == p.id
                ).first()
                if not winv:
                    winv = WarehouseInventory(warehouse_id=wh.id, product_id=p.id, current_stock=0)
                    db.add(winv)
                winv.current_stock += item.quantity
                
                # Log transaction
                tx = InventoryTransaction(
                    product_id=p.id,
                    warehouse_id=wh.id,
                    transaction_type="PO_RECEIVE",
                    quantity=item.quantity,
                    reference_id=po.order_number,
                    user_id=current_user.id,
                    notes=f"Received via Purchase Order {po.order_number}"
                )
                db.add(tx)
                
    db.commit()
    log_event(db, "UPDATE_PO_STATUS", f"Updated purchase order {po.order_number} status from {old_status} to {new_status}", current_user.id, current_user.username)
    return {"detail": f"Status updated to {new_status}", "po_status": po.status}

@router.delete("/{po_id}")
def delete_purchase_order(po_id: int, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    log_event(db, "DELETE_PO", f"Deleted purchase order {po.order_number}", current_user.id, current_user.username)
    db.delete(po)
    db.commit()
    return {"detail": "Purchase Order deleted successfully"}
