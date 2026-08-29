import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, Base, engine
from app.models.models import (
    Role, Permission, User, Category, Product, Supplier, 
    Warehouse, WarehouseInventory, PurchaseOrder, PurchaseOrderItem,
    SalesOrder, SalesOrderItem, InventoryTransaction, Customer
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
            role_count = db.query(Role).count()
            if role_count > 0:
                print("Database is already seeded. Skipping seed.")
                db.close()
                return
        except Exception:
            db.rollback()
            Base.metadata.create_all(bind=engine)
    
    # 1. Seed Roles & Permissions
    roles = [
        {"name": "Admin", "desc": "Full administrative access"},
        {"name": "Warehouse Manager", "desc": "Manage warehouse capacity and stock levels"},
        {"name": "Procurement Manager", "desc": "Manage suppliers and purchase orders"},
        {"name": "Warehouse Staff", "desc": "Track stock movements, receive and ship stock"},
        {"name": "Viewer", "desc": "Read-only dashboard visibility"}
    ]
    
    db_roles = {}
    for r in roles:
        role = Role(name=r["name"], description=r["desc"])
        db.add(role)
        db.commit()
        db.refresh(role)
        db_roles[r["name"]] = role
        
    print("Roles seeded.")
    
    # 2. Seed Users
    users_data = [
        {"username": "admin", "email": "admin@retailos.com", "role": "Admin", "pass": "admin123"},
        {"username": "w_manager", "email": "wmanager@retailos.com", "role": "Warehouse Manager", "pass": "manager123"},
        {"username": "p_manager", "email": "pmanager@retailos.com", "role": "Procurement Manager", "pass": "procure123"},
        {"username": "staff", "email": "staff@retailos.com", "role": "Warehouse Staff", "pass": "staff123"},
        {"username": "viewer", "email": "viewer@retailos.com", "role": "Viewer", "pass": "viewer123"},
    ]
    
    for u in users_data:
        new_user = User(
            username=u["username"],
            email=u["email"],
            hashed_password=get_password_hash(u["pass"]),
            role_id=db_roles[u["role"]].id,
            is_active=True
        )
        db.add(new_user)
    db.commit()
    print("Users seeded.")
    
    # 3. Seed Warehouses
    warehouses_data = [
        {"name": "Austin Fulfillment Center", "city": "Austin", "state": "TX", "capacity": 10000, "manager": "John Doe", "phone": "512-555-0199", "email": "austin@retailos.com"},
        {"name": "Chicago Logistics Hub", "city": "Chicago", "state": "IL", "capacity": 15000, "manager": "Jane Smith", "phone": "312-555-0144", "email": "chicago@retailos.com"},
        {"name": "Seattle Bay Warehouse", "city": "Seattle", "state": "WA", "capacity": 8000, "manager": "Bob Johnson", "phone": "206-555-0188", "email": "seattle@retailos.com"},
        {"name": "Atlanta Distribution Depot", "city": "Atlanta", "state": "GA", "capacity": 12000, "manager": "Sarah Davis", "phone": "404-555-0177", "email": "atlanta@retailos.com"},
        {"name": "New York Urban Center", "city": "New York", "state": "NY", "capacity": 6000, "manager": "Mike Wilson", "phone": "212-555-0122", "email": "nyc@retailos.com"}
    ]
    
    db_warehouses = []
    for w in warehouses_data:
        wh = Warehouse(
            name=w["name"],
            address=f"100 {w['name']} St",
            city=w["city"],
            state=w["state"],
            country="USA",
            capacity=w["capacity"],
            manager_name=w["manager"],
            phone=w["phone"],
            email=w["email"]
        )
        db.add(wh)
        db.commit()
        db.refresh(wh)
        db_warehouses.append(wh)
        
    print("5 Warehouses seeded.")
    
    # 4. Seed Suppliers skipped for clean custom data entry
    db_suppliers = []
    
    # 5. Seed Categories
    categories = ["Electronics", "Office Supplies", "Home & Kitchen", "Apparel", "Sports & Outdoors"]
    db_categories = []
    for cname in categories:
        cat = Category(name=cname, description=f"Standard retail {cname.lower()} category")
        db.add(cat)
        db.commit()
        db.refresh(cat)
        db_categories.append(cat)
        
    print("Essential metadata seeded. Skipping products/orders for clean database canvas.")
    db.close()
    return
        
    # 6. Seed Products (100 Products)
    brands = {
        "Electronics": ["VoltTech", "ApexAudio", "PixelLink", "Synapse"],
        "Office Supplies": ["WriteRite", "FlexiFile", "DeskPro", "MemoPad"],
        "Home & Kitchen": ["KitchMaster", "BakeEase", "PureDwell", "CleanMax"],
        "Apparel": ["UrbanFit", "AeroStyle", "CozyWear", "ActiveStep"],
        "Sports & Outdoors": ["TrekPeak", "FitGear", "AquaWave", "CampReady"]
    }
    product_names = {
        "Electronics": [
            "Noise-Canceling Headphones", "Wireless Charging Pad", "Mechanical Keyboard", 
            "Ultra-Wide Monitor", "Bluetooth Soundbar", "Portable Power Bank", 
            "Smart Fitness Watch", "HD Webcam 1080p", "USB-C Multi-Port Hub", 
            "Ergonomic Gaming Mouse", "Dual-Band Wi-Fi Router", "Studio Condenser Mic", 
            "LED Ring Light", "External SSD 1TB", "Wireless Presenter Remote", 
            "Smart Home Security Camera", "VR Headset Controller", "Compact Document Scanner", 
            "Digital Voice Recorder", "Drawing Graphics Tablet"
        ],
        "Office Supplies": [
            "Ergonomic Mesh Chair", "Bamboo Desk Organizer", "Gel Ink Pens (12 Pack)", 
            "Dry Erase Whiteboard", "Heavy-Duty Paper Shredder", "Rechargeable Desk Lamp", 
            "Laminating Machine", "Electric Pencil Sharpener", "Leather Writing Pad", 
            "Adjustable Footrest", "Thermal Label Printer", "Self-Inking Date Stamp", 
            "Cork Bulletin Board", "Premium Notebook Set", "Heavy-Duty Stapler", 
            "Ergonomic Wrist Rest", "Desktop Document Holder", "Mini Paper Cutter", 
            "Filing Cabinet Dividers", "Sticky Notes Value Pack"
        ],
        "Home & Kitchen": [
            "Stainless Steel Kettle", "Digital Kitchen Scale", "Air Fryer XL 5.5L", 
            "Cold Brew Coffee Maker", "Immersion Hand Blender", "Automatic Salt & Pepper Mill", 
            "Silicone Cooking Utensils", "Glass Food Containers Set", "Non-Stick Frying Pan", 
            "Knife Block Set (15pc)", "French Press Coffee Maker", "Electric Milk Frother", 
            "Over-the-Sink Colander", "Herb Keeper & Saver", "Digital Food Thermometer", 
            "Stove Gap Covers", "Reusable Storage Bags", "Silicone Baking Mats", 
            "Stainless Steel Mixing Bowls", "Rotary Cheese Grater"
        ],
        "Apparel": [
            "Classic Denim Jacket", "Slim-Fit Chino Pants", "Lightweight Running Sneakers", 
            "Cotton Fleece Hoodie", "Puffer Winter Coat", "Canvas Backpack", 
            "Polarized Sunglasses", "Leather Dress Belt", "Athletic Crew Socks (6 Pack)", 
            "Waterproof Windbreaker", "Merino Wool Sweater", "Casual Slip-On Shoes", 
            "Sports Training Shorts", "Thermal Base Layer Set", "Structured Snapback Cap", 
            "Quick-Dry Swim Trunks", "Leather Chelsea Boots", "Knit Beanie Hat", 
            "Linen Button-Down Shirt", "Memory Foam Sandals"
        ],
        "Sports & Outdoors": [
            "Eco-Friendly Yoga Mat", "Insulated Water Bottle 32oz", "Telescopic Trekking Poles", 
            "Ultralight Sleeping Pad", "Double Camping Hammock", "Resistance Bands Set", 
            "Adjustable Hand Gripper", "Foam Roller 18-Inch", "Hydration Running Vest", 
            "Portable Camping Stove", "Microfiber Travel Towel", "Waterproof Dry Bag", 
            "Compact Binoculars 10x25", "LED Headlamp Rechargeable", "Pickleball Paddle Set", 
            "Pop-Up Beach Tent", "Self-Inflating Sleeping Mat", "Foldable Camping Chair", 
            "Inflatable Stand-Up Paddleboard", "Disc Golf Starter Set"
        ]
    }
    
    category_counts = {cname: 0 for cname in categories}
    db_products = []
    for i in range(1, 101):
        category = None
        for cat in db_categories:
            if category_counts[cat.name] < 20:
                category = cat
                break
        if not category:
            category = db_categories[-1]
            
        category_counts[category.name] += 1
        idx = category_counts[category.name] - 1
        
        brand = random.choice(brands[category.name])
        prod_name = f"{brand} {product_names[category.name][idx]}"
        
        buying = round(random.uniform(5.0, 150.0), 2)
        selling = round(buying * random.uniform(1.3, 1.8), 2)
        
        # stock distribution
        stock = random.randint(15, 200)
        min_stock = random.randint(10, 30)
        max_stock = random.randint(150, 400)
        
        sku = f"SKU-{category.name[:3].upper()}-{brand[:3].upper()}-{i:04d}"
        barcode = f"999{i:09d}"
        
        p = Product(
            sku=sku,
            name=prod_name,
            category_id=category.id,
            brand=brand,
            description=f"High-quality commercial grade {category.name.lower()} product manufactured by {brand}.",
            buying_price=buying,
            selling_price=selling,
            current_stock=stock,
            minimum_stock=min_stock,
            maximum_stock=max_stock,
            supplier_id=random.choice(db_suppliers).id,
            expiry_date=datetime.utcnow() + timedelta(days=random.randint(180, 720)) if category.name in ["Home & Kitchen", "Office Supplies"] else None,
            barcode=barcode,
            status="In Stock"
        )
        if stock <= min_stock:
            p.status = "Low Stock"
            
        db.add(p)
        db.commit()
        db.refresh(p)
        db_products.append(p)
        
        # Distribute product stock into warehouses
        allocated = 0
        for idx, wh in enumerate(db_warehouses):
            if idx == len(db_warehouses) - 1:
                wh_stock = stock - allocated
            else:
                wh_stock = random.randint(0, stock - allocated)
                
            allocated += wh_stock
            
            if wh_stock > 0:
                winv = WarehouseInventory(warehouse_id=wh.id, product_id=p.id, current_stock=wh_stock)
                db.add(winv)
                
    db.commit()
    print("100 Products seeded and distributed to warehouses.")
    
    # 7. Seed Customers
    customers = []
    for i in range(1, 30):
        c = Customer(
            name=f"Customer Client {i}",
            email=f"client{i}@gmail.com",
            phone=f"555-010-{i:02d}",
            address=f"{i * 10} Main street Road"
        )
        db.add(c)
        db.commit()
        db.refresh(c)
        customers.append(c)
        
    # 8. Seed 1000 Sales Records (Sales Orders & Items)
    print("Generating 1000 Sales Records...")
    for s_idx in range(1, 1001):
        invoice = f"INV-SEED-{2026}{s_idx:04d}"
        cust = random.choice(customers)
        so_date = datetime.utcnow() - timedelta(days=random.randint(0, 360))
        
        so = SalesOrder(
            customer_name=cust.name,
            invoice_number=invoice,
            payment_status="Paid" if random.random() > 0.05 else "Unpaid",
            shipment_status="Delivered" if random.random() > 0.1 else "Shipped",
            tax=round(random.uniform(5.0, 30.0), 2),
            discount=round(random.uniform(0.0, 15.0), 2),
            grand_total=0.0,
            created_at=so_date
        )
        db.add(so)
        db.commit()
        db.refresh(so)
        
        # Create 1-3 line items
        subtotal = 0.0
        for _ in range(random.randint(1, 3)):
            p = random.choice(db_products)
            qty = random.randint(1, 5)
            subtotal += qty * p.selling_price
            
            item = SalesOrderItem(
                sales_order_id=so.id,
                product_id=p.id,
                quantity=qty,
                selling_price=p.selling_price
            )
            db.add(item)
            
        so.grand_total = round(subtotal + so.tax - so.discount, 2)
        db.commit()
        
    print("1000 Sales orders created.")
    
    # 9. Seed 200 Purchase Orders (PO & Items)
    print("Generating 200 Purchase Records...")
    for po_idx in range(1, 201):
        po_num = f"PO-SEED-{2026}{po_idx:04d}"
        sup = random.choice(db_suppliers)
        po_date = datetime.utcnow() - timedelta(days=random.randint(0, 300))
        
        po = PurchaseOrder(
            supplier_id=sup.id,
            order_number=po_num,
            status=random.choice(["Delivered", "Delivered", "Ordered", "Approved", "Draft"]),
            tax=round(random.uniform(10.0, 50.0), 2),
            discount=0.0,
            shipping=15.0,
            expected_delivery=po_date + timedelta(days=5),
            grand_total=0.0,
            created_at=po_date,
            updated_at=po_date + timedelta(days=random.randint(3, 7))
        )
        db.add(po)
        db.commit()
        db.refresh(po)
        
        subtotal = 0.0
        for _ in range(random.randint(1, 4)):
            # Pick products from this supplier or search
            p = random.choice(db_products)
            qty = random.randint(10, 50)
            subtotal += qty * p.buying_price
            
            item = PurchaseOrderItem(
                purchase_order_id=po.id,
                product_id=p.id,
                quantity=qty,
                buying_price=p.buying_price
            )
            db.add(item)
            
        po.grand_total = round(subtotal + po.tax + po.shipping, 2)
        db.commit()
        
    print("200 Purchase orders seeded.")
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database(drop_tables=False)
