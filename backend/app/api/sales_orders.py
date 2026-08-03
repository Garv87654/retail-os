from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import SalesOrder, SalesOrderItem, Product, Warehouse, WarehouseInventory, InventoryTransaction, User
from app.schemas.schemas import SalesOrderCreate, SalesOrderResponse
from app.auth.security import RoleChecker, get_current_user
from app.utils.audit import log_event

router = APIRouter(prefix="/sales-orders", tags=["sales-orders"])

write_roles = RoleChecker(["Admin", "Warehouse Manager", "Warehouse Staff"])
read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff", "Viewer"])

@router.get("/", response_model=List[SalesOrderResponse])
def get_sales_orders(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    orders = db.query(SalesOrder).order_by(SalesOrder.created_at.desc()).all()
    res = []
    for order in orders:
        res.append(
            SalesOrderResponse(
                id=order.id,
                customer_name=order.customer_name,
                invoice_number=order.invoice_number,
                payment_status=order.payment_status,
                shipment_status=order.shipment_status,
                tax=order.tax,
                discount=order.discount,
                grand_total=order.grand_total,
                created_at=order.created_at,
                items=[{
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else "Deleted Product",
                    "quantity": item.quantity,
                    "selling_price": item.selling_price
                } for item in order.items]
            )
        )
    return res

@router.get("/{order_id}", response_model=SalesOrderResponse)
def get_sales_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")
        
    return SalesOrderResponse(
        id=order.id,
        customer_name=order.customer_name,
        invoice_number=order.invoice_number,
        payment_status=order.payment_status,
        shipment_status=order.shipment_status,
        tax=order.tax,
        discount=order.discount,
        grand_total=order.grand_total,
        created_at=order.created_at,
        items=[{
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else None,
            "quantity": item.quantity,
            "selling_price": item.selling_price
        } for item in order.items]
    )

@router.post("/", response_model=SalesOrderResponse)
def create_sales_order(order_in: SalesOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    # Check if stock exists before selling
    # We will pick from the warehouse with the most stock of each item
    invoice_num = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{db.query(SalesOrder).count() + 1}"
    
    # Pre-validate stock
    for item in order_in.items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if not p:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        if p.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {p.name}. Available: {p.current_stock}")
            
    subtotal = 0.0
    for item in order_in.items:
        subtotal += item.quantity * item.selling_price
        
    grand_total = subtotal + order_in.tax - order_in.discount
    
    order = SalesOrder(
        customer_name=order_in.customer_name,
        invoice_number=invoice_num,
        payment_status="Paid",
        shipment_status="Shipped", # Auto ship for this workflow
        tax=order_in.tax,
        discount=order_in.discount,
        grand_total=grand_total
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Process items and reduce stock
    for item in order_in.items:
        sales_item = SalesOrderItem(
            sales_order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            selling_price=item.selling_price
        )
        db.add(sales_item)
        
        # Deduct global product stock
        p = db.query(Product).filter(Product.id == item.product_id).first()
        p.current_stock -= item.quantity
        if p.current_stock <= 0:
            p.status = "Out of Stock"
        elif p.current_stock <= p.minimum_stock:
            p.status = "Low Stock"
        else:
            p.status = "In Stock"
            
        # Find warehouse that has this product, and deduct from it
        winv = db.query(WarehouseInventory).filter(
            WarehouseInventory.product_id == p.id,
            WarehouseInventory.current_stock >= item.quantity
        ).first()
        
        if not winv:
            # Fallback to any warehouse
            winv = db.query(WarehouseInventory).filter(WarehouseInventory.product_id == p.id).first()
            if not winv:
                # Create warehouse inventory entry if none exists (shouldn't happen with proper seeds)
                wh = db.query(Warehouse).first()
                winv = WarehouseInventory(warehouse_id=wh.id, product_id=p.id, current_stock=0)
                db.add(winv)
                
        winv.current_stock -= item.quantity
        
        # Create inventory transaction
        tx = InventoryTransaction(
            product_id=p.id,
            warehouse_id=winv.warehouse_id,
            transaction_type="SALE_SHIP",
            quantity=-item.quantity,
            reference_id=order.invoice_number,
            user_id=current_user.id,
            notes=f"Sold to {order.customer_name} via Sales Order {order.invoice_number}"
        )
        db.add(tx)
        
    db.commit()
    db.refresh(order)
    
    log_event(db, "CREATE_SALES_ORDER", f"Created invoice {order.invoice_number} for customer {order.customer_name}", current_user.id, current_user.username)
    return order

@router.delete("/{order_id}")
def delete_sales_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")
        
    log_event(db, "DELETE_SALES_ORDER", f"Deleted invoice {order.invoice_number}", current_user.id, current_user.username)
    db.delete(order)
    db.commit()
    return {"detail": "Sales Order deleted successfully"}
