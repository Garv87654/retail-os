import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, Base, engine
from app.models.models import (
    Role, User, Category, Product, Supplier, 
    Warehouse, WarehouseInventory, PurchaseOrder, PurchaseOrderItem,
    SalesOrder, SalesOrderItem, InventoryTransaction
)
from app.auth.security import get_password_hash

def seed_database(drop_tables: bool = False):
    db = SessionLocal()
    
    if drop_tables:
        print("Dropping and recreating database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database tables created.")
    else:
        try:
            # Recreate tables if they don't exist
            Base.metadata.create_all(bind=engine)
        except Exception:
            db.rollback()

    # 1. Seed Roles
    role_names = ["Admin", "Warehouse Manager", "Procurement Manager", "Warehouse Staff", "Viewer"]
    db_roles = {}
    for name in role_names:
        role = db.query(Role).filter(Role.name == name).first()
        if not role:
            role = Role(name=name, description=f"{name} Access Role")
            db.add(role)
            db.commit()
            db.refresh(role)
        db_roles[name] = role

    # 2. Seed Users
    users_data = [
        {"username": "admin", "email": "admin@retailos.com", "role": "Admin", "pass": "admin123"},
        {"username": "w_manager", "email": "wmanager@retailos.com", "role": "Warehouse Manager", "pass": "manager123"},
        {"username": "p_manager", "email": "pmanager@retailos.com", "role": "Procurement Manager", "pass": "procure123"},
        {"username": "staff", "email": "staff@retailos.com", "role": "Warehouse Staff", "pass": "staff123"},
        {"username": "viewer", "email": "viewer@retailos.com", "role": "Viewer", "pass": "viewer123"},
    ]
    for u in users_data:
        user = db.query(User).filter(User.username == u["username"]).first()
        if not user:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["pass"]),
                role_id=db_roles[u["role"]].id,
                is_active=True
            )
            db.add(user)
    db.commit()

    # 3. Check if we need to seed the clean demo inventory dataset (if empty)
    product_count = db.query(Product).count()
    if product_count == 0:
        print("Inventory tables are empty. Seeding clean demo dataset (10 products, 2 warehouses)...")
        
        # A. Seed Categories
        categories = ["Electronics", "Office Supplies", "Home & Kitchen", "Apparel", "Sports & Outdoors"]
        db_categories = {}
        for cname in categories:
            cat = db.query(Category).filter(Category.name == cname).first()
            if not cat:
                cat = Category(name=cname, description=f"Standard retail {cname.lower()} category")
                db.add(cat)
                db.commit()
                db.refresh(cat)
            db_categories[cname] = cat

        # B. Seed 1 Supplier
        supplier = db.query(Supplier).filter(Supplier.name == "Global Trade Linkers").first()
        if not supplier:
            supplier = Supplier(
                name="Global Trade Linkers",
                contact_name="Rohan Sharma",
                email="sales@globaltrade.com",
                phone="98765-43210",
                address="Sector 17, Chandigarh",
                rating=4.5
            )
            db.add(supplier)
            db.commit()
            db.refresh(supplier)

        # C. Seed 2 Warehouses
        warehouses_data = [
            {"name": "Chandigarh Logistics Hub", "city": "Chandigarh", "capacity": 5000},
            {"name": "Mohali Sourcing Depot", "city": "Mohali", "capacity": 3000}
        ]
        db_warehouses = []
        for w in warehouses_data:
            wh = db.query(Warehouse).filter(Warehouse.name == w["name"]).first()
            if not wh:
                wh = Warehouse(
                    name=w["name"],
                    address=f"Plot 45, Industrial Area, {w['city']}",
                    city=w["city"],
                    state="Punjab",
                    country="India",
                    capacity=w["capacity"],
                    manager_name="Manpreet Singh",
                    phone="98123-45678",
                    email=f"{w['city'].lower()}@retailos.com"
                )
                db.add(wh)
                db.commit()
                db.refresh(wh)
            db_warehouses.append(wh)

        # D. Seed 10 Clean Products
        products_data = [
            # Electronics
            {"name": "Logitech Wireless Mouse", "cat": "Electronics", "buy": 1200, "sell": 1999, "stock": 3, "min": 5},
            {"name": "VoltTech USB-C Multi-Hub", "cat": "Electronics", "buy": 1500, "sell": 2499, "stock": 15, "min": 5},
            # Office Supplies
            {"name": "DeskPro Bamboo Organizer", "cat": "Office Supplies", "buy": 800, "sell": 1499, "stock": 12, "min": 4},
            {"name": "Premium Notebook Set (3-Pack)", "cat": "Office Supplies", "buy": 350, "sell": 699, "stock": 20, "min": 5},
            # Home & Kitchen
            {"name": "KitchMaster Digital Air Fryer", "cat": "Home & Kitchen", "buy": 4500, "sell": 7499, "stock": 2, "min": 5},
            {"name": "Stainless Steel Electric Kettle", "cat": "Home & Kitchen", "buy": 1100, "sell": 1899, "stock": 14, "min": 6},
            # Apparel
            {"name": "UrbanFit Classic Denim Jacket", "cat": "Apparel", "buy": 1800, "sell": 2999, "stock": 8, "min": 3},
            {"name": "Cotton Fleece Hoodie", "cat": "Apparel", "buy": 950, "sell": 1699, "stock": 1, "min": 4},
            # Sports & Outdoors
            {"name": "TrekPeak Eco Yoga Mat", "cat": "Sports & Outdoors", "buy": 700, "sell": 1299, "stock": 25, "min": 5},
            {"name": "Insulated Water Bottle (32oz)", "cat": "Sports & Outdoors", "buy": 500, "sell": 999, "stock": 30, "min": 8}
        ]

        db_products = []
        for i, p in enumerate(products_data):
            sku = f"SKU-{p['cat'][:3].upper()}-{i+1:04d}"
            barcode = f"999{i+1:09d}"
            prod = Product(
                sku=sku,
                name=p["name"],
                category_id=db_categories[p["cat"]].id,
                brand="RetailOS Choice",
                description=f"High-quality retail grade {p['name']} for business operations.",
                buying_price=p["buy"],
                selling_price=p["sell"],
                current_stock=p["stock"],
                minimum_stock=p["min"],
                maximum_stock=p["stock"] * 4,
                supplier_id=supplier.id,
                barcode=barcode
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
            db_products.append(prod)

        print("10 Products seeded successfully.")

        # E. Associate products with warehouses (WarehouseInventory)
        # Split products equally between the two warehouses
        for idx, prod in enumerate(db_products):
            target_wh = db_warehouses[idx % 2]
            wh_inv = WarehouseInventory(
                warehouse_id=target_wh.id,
                product_id=prod.id,
                current_stock=prod.current_stock
            )
            db.add(wh_inv)
            
            # Add transaction log
            tx = InventoryTransaction(
                product_id=prod.id,
                warehouse_id=target_wh.id,
                transaction_type="ADD",
                quantity=prod.current_stock,
                reference_id="INITIAL_SEED",
                timestamp=datetime.utcnow()
            )
            db.add(tx)
        
        db.commit()
        print("Inventory transactions logged.")

    db.close()
    print("Database verification/seeding completed.")

if __name__ == "__main__":
    seed_database()
