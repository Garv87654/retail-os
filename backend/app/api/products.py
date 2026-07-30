import csv
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import Product, Category, Supplier, InventoryTransaction, WarehouseInventory, Warehouse, User
from app.schemas.schemas import ProductCreate, ProductResponse, StockAdjustmentRequest
from app.auth.security import RoleChecker, get_current_user
from app.utils.audit import log_event

router = APIRouter(prefix="/products", tags=["products"])

# Permissions roles
write_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager"])
staff_or_write_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff"])
read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff", "Viewer"])

@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_dir: Optional[str] = "asc",
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(read_roles)
):
    query = db.query(Product)
    
    # Filter
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%"),
                Product.barcode.ilike(f"%{search}%")
            )
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)
    if status_filter:
        query = query.filter(Product.status == status_filter)
        
    # Sort
    sort_col = getattr(Product, sort_by, Product.id)
    if sort_dir == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))
        
    # Paginate
    offset = (page - 1) * limit
    products = query.offset(offset).limit(limit).all()
    
    # Map relation fields
    res = []
    for p in products:
        res.append(
            ProductResponse(
                id=p.id,
                sku=p.sku,
                name=p.name,
                category_id=p.category_id,
                category_name=p.category.name if p.category else None,
                brand=p.brand,
                description=p.description,
                buying_price=p.buying_price,
                selling_price=p.selling_price,
                current_stock=p.current_stock,
                minimum_stock=p.minimum_stock,
                maximum_stock=p.maximum_stock,
                supplier_id=p.supplier_id,
                supplier_name=p.supplier.name if p.supplier else None,
                expiry_date=p.expiry_date,
                barcode=p.barcode,
                status=p.status
            )
        )
    return res

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(
        id=p.id,
        sku=p.sku,
        name=p.name,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        brand=p.brand,
        description=p.description,
        buying_price=p.buying_price,
        selling_price=p.selling_price,
        current_stock=p.current_stock,
        minimum_stock=p.minimum_stock,
        maximum_stock=p.maximum_stock,
        supplier_id=p.supplier_id,
        supplier_name=p.supplier.name if p.supplier else None,
        expiry_date=p.expiry_date,
        barcode=p.barcode,
        status=p.status
    )

@router.post("/", response_model=ProductResponse)
def create_product(prod: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    # Check duplicate SKU
    exists = db.query(Product).filter(Product.sku == prod.sku).first()
    if exists:
        raise HTTPException(status_code=400, detail="Product SKU already exists")
        
    p = Product(**prod.model_dump())
    # Determine status
    if p.current_stock <= 0:
        p.status = "Out of Stock"
    elif p.current_stock <= p.minimum_stock:
        p.status = "Low Stock"
    else:
        p.status = "In Stock"
        
    db.add(p)
    db.commit()
    db.refresh(p)
    
    log_event(db, "CREATE_PRODUCT", f"Created product {p.name} (SKU: {p.sku})", current_user.id, current_user.username)
    return p

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, prod: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check duplicate SKU if changed
    if prod.sku != p.sku:
        exists = db.query(Product).filter(Product.sku == prod.sku).first()
        if exists:
            raise HTTPException(status_code=400, detail="SKU already used by another product")
            
    for k, v in prod.model_dump().items():
        setattr(p, k, v)
        
    if p.current_stock <= 0:
        p.status = "Out of Stock"
    elif p.current_stock <= p.minimum_stock:
        p.status = "Low Stock"
    else:
        p.status = "In Stock"
        
    db.commit()
    db.refresh(p)
    
    log_event(db, "UPDATE_PRODUCT", f"Updated product {p.name} (SKU: {p.sku})", current_user.id, current_user.username)
    return p

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
        
    log_event(db, "DELETE_PRODUCT", f"Deleted product {p.name} (SKU: {p.sku})", current_user.id, current_user.username)
    db.delete(p)
    db.commit()
    return {"detail": "Product deleted successfully"}

@router.post("/adjust-stock")
def adjust_stock(adj: StockAdjustmentRequest, db: Session = Depends(get_db), current_user: User = Depends(staff_or_write_roles)):
    p = db.query(Product).filter(Product.id == adj.product_id).first()
    w = db.query(Warehouse).filter(Warehouse.id == adj.warehouse_id).first()
    if not p or not w:
        raise HTTPException(status_code=404, detail="Product or Warehouse not found")
        
    # Find or create warehouse inventory record
    winv = db.query(WarehouseInventory).filter(
        WarehouseInventory.warehouse_id == adj.warehouse_id,
        WarehouseInventory.product_id == adj.product_id
    ).first()
    
    if not winv:
        winv = WarehouseInventory(warehouse_id=adj.warehouse_id, product_id=adj.product_id, current_stock=0)
        db.add(winv)
        
    if winv.current_stock + adj.quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock in the selected warehouse")
        
    winv.current_stock += adj.quantity
    p.current_stock += adj.quantity
    
    # Update status
    if p.current_stock <= 0:
        p.status = "Out of Stock"
    elif p.current_stock <= p.minimum_stock:
        p.status = "Low Stock"
    else:
        p.status = "In Stock"
        
    # Write Transaction
    tx = InventoryTransaction(
        product_id=p.id,
        warehouse_id=w.id,
        transaction_type="ADJUSTMENT",
        quantity=adj.quantity,
        reference_id=f"ADJ-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        user_id=current_user.id,
        notes=adj.reason
    )
    db.add(tx)
    
    db.commit()
    
    log_event(db, "ADJUST_STOCK", f"Adjusted stock of {p.name} in {w.name} by {adj.quantity:+} units. Reason: {adj.reason}", current_user.id, current_user.username)
    return {"detail": "Stock adjusted successfully", "new_warehouse_stock": winv.current_stock, "new_total_stock": p.current_stock}

@router.get("/export/csv")
def export_products_csv(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    products = db.query(Product).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Product ID", "SKU", "Name", "Category", "Brand", 
        "Buying Price", "Selling Price", "Current Stock", "Min Stock", 
        "Max Stock", "Supplier", "Barcode", "Status"
    ])
    
    for p in products:
        writer.writerow([
            p.id, p.sku, p.name, 
            p.category.name if p.category else "", 
            p.brand or "", p.buying_price, p.selling_price, 
            p.current_stock, p.minimum_stock, p.maximum_stock,
            p.supplier.name if p.supplier else "", 
            p.barcode or "", p.status
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv", 
        headers={"Content-Disposition": "attachment; filename=products.csv"}
    )

@router.post("/import/csv")
async def import_products_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(write_roles)):
    contents = await file.read()
    buffer = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(buffer)
    
    imported_count = 0
    errors = []
    
    for row in reader:
        try:
            sku = row.get("SKU") or row.get("sku")
            name = row.get("Name") or row.get("name")
            if not sku or not name:
                errors.append(f"Missing SKU or Name in row {reader.line_num}")
                continue
                
            # Check duplicate
            exists = db.query(Product).filter(Product.sku == sku).first()
            if exists:
                errors.append(f"SKU {sku} already exists. Skipping.")
                continue
                
            # Category
            cat_name = row.get("Category") or row.get("category") or "General"
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name, description="Automatically created category")
                db.add(cat)
                db.commit()
                db.refresh(cat)
                
            # Supplier
            sup_name = row.get("Supplier") or row.get("supplier")
            sup = None
            if sup_name:
                sup = db.query(Supplier).filter(Supplier.name == sup_name).first()
            if not sup:
                # Default supplier if not found
                sup = db.query(Supplier).first()
                if not sup:
                    sup = Supplier(name="Default Supplier", email="default@supplier.com", status="Active")
                    db.add(sup)
                    db.commit()
                    db.refresh(sup)
                    
            buying_price = float(row.get("Buying Price") or row.get("buying_price") or 0.0)
            selling_price = float(row.get("Selling Price") or row.get("selling_price") or 0.0)
            current_stock = int(row.get("Current Stock") or row.get("current_stock") or 0)
            min_stock = int(row.get("Min Stock") or row.get("minimum_stock") or 10)
            max_stock = int(row.get("Max Stock") or row.get("maximum_stock") or 100)
            brand = row.get("Brand") or row.get("brand") or ""
            barcode = row.get("Barcode") or row.get("barcode") or f"BAR-{sku}"
            
            p = Product(
                sku=sku,
                name=name,
                category_id=cat.id,
                brand=brand,
                buying_price=buying_price,
                selling_price=selling_price,
                current_stock=current_stock,
                minimum_stock=min_stock,
                maximum_stock=max_stock,
                supplier_id=sup.id,
                barcode=barcode
            )
            
            # Update status
            if p.current_stock <= 0:
                p.status = "Out of Stock"
            elif p.current_stock <= p.minimum_stock:
                p.status = "Low Stock"
            else:
                p.status = "In Stock"
                
            db.add(p)
            imported_count += 1
        except Exception as ex:
            errors.append(f"Error processing row {reader.line_num}: {str(ex)}")
            
    db.commit()
    log_event(db, "IMPORT_PRODUCTS", f"Imported {imported_count} products from CSV. Errors: {len(errors)}", current_user.id, current_user.username)
    return {"detail": f"Successfully imported {imported_count} products", "errors": errors}

@router.get("/history/transactions")
def get_inventory_history(
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(read_roles)
):
    query = db.query(InventoryTransaction)
    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)
    if warehouse_id:
        query = query.filter(InventoryTransaction.warehouse_id == warehouse_id)
        
    txs = query.order_by(desc(InventoryTransaction.timestamp)).limit(100).all()
    
    res = []
    for tx in txs:
        res.append({
            "id": tx.id,
            "product_name": tx.product.name if tx.product else "Deleted Product",
            "sku": tx.product.sku if tx.product else "",
            "warehouse_name": tx.warehouse.name if tx.warehouse else "Deleted Warehouse",
            "transaction_type": tx.transaction_type,
            "quantity": tx.quantity,
            "reference_id": tx.reference_id,
            "timestamp": tx.timestamp,
            "notes": tx.notes
        })
    return res
