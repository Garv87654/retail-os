from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

# Junction table for roles and permissions if needed, but a direct relationship is simpler.
class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200))
    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    action = Column(String(50), nullable=False)  # read, write, delete, approve, etc.
    resource = Column(String(50), nullable=False)  # products, suppliers, warehouses, etc.
    role = relationship("Role", back_populates="permissions")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    role = relationship("Role", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand = Column(String(100))
    description = Column(Text)
    buying_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    current_stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=10)
    maximum_stock = Column(Integer, default=100)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    expiry_date = Column(DateTime, nullable=True)
    barcode = Column(String(100), unique=True, index=True)
    status = Column(String(50), default="In Stock")  # In Stock, Out of Stock, Low Stock
    
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    warehouse_inventory = relationship("WarehouseInventory", back_populates="product", cascade="all, delete-orphan")
    po_items = relationship("PurchaseOrderItem", back_populates="product", cascade="all, delete-orphan")
    sales_items = relationship("SalesOrderItem", back_populates="product", cascade="all, delete-orphan")
    transactions = relationship("InventoryTransaction", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("ForecastResult", back_populates="product", cascade="all, delete-orphan")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(50))
    address = Column(Text)
    gst_number = Column(String(50))
    payment_terms = Column(String(100))
    rating = Column(Float, default=5.0)
    delivery_time = Column(Integer, default=5) # average in days
    status = Column(String(50), default="Active")
    products = relationship("Product", back_populates="supplier", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier", cascade="all, delete-orphan")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    capacity = Column(Integer, nullable=False) # e.g. total cubic meters or pallet count
    manager_name = Column(String(150))
    phone = Column(String(50))
    email = Column(String(100))
    inventory = relationship("WarehouseInventory", back_populates="warehouse", cascade="all, delete-orphan")
    transactions = relationship("InventoryTransaction", back_populates="warehouse", cascade="all, delete-orphan")
    forecasts = relationship("ForecastResult", back_populates="warehouse", cascade="all, delete-orphan")

class WarehouseInventory(Base):
    __tablename__ = "warehouse_inventory"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    current_stock = Column(Integer, default=0)
    warehouse = relationship("Warehouse", back_populates="inventory")
    product = relationship("Product", back_populates="warehouse_inventory")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(50), default="Draft") # Draft, Pending, Approved, Rejected, Ordered, Delivered, Cancelled
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    shipping = Column(Float, default=0.0)
    expected_delivery = Column(DateTime)
    grand_total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    buying_price = Column(Float, nullable=False)
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="po_items")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(100))
    phone = Column(String(50))
    address = Column(Text)

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(150), nullable=False) # simple customer field or link to customer
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    payment_status = Column(String(50), default="Unpaid") # Unpaid, Paid, Partial
    shipment_status = Column(String(50), default="Pending") # Pending, Shipped, Delivered, Cancelled
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"
    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    selling_price = Column(Float, nullable=False)
    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", back_populates="sales_items")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False) # PO_RECEIVE, SALE_SHIP, ADJUSTMENT, TRANSFER_OUT, TRANSFER_IN
    quantity = Column(Integer, nullable=False) # positive or negative
    reference_id = Column(String(100)) # e.g. PO number, invoice number, or adjustment reason
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    product = relationship("Product", back_populates="transactions")
    warehouse = relationship("Warehouse", back_populates="transactions")

class ForecastResult(Base):
    __tablename__ = "forecast_results"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    forecast_date = Column(DateTime, default=datetime.utcnow)
    predicted_demand = Column(Float, nullable=False)
    confidence = Column(Float, default=0.95)
    recommendation = Column(Text)
    horizon = Column(String(50), nullable=False) # week, month, quarter
    product = relationship("Product", back_populates="forecasts")
    warehouse = relationship("Warehouse", back_populates="forecasts")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False) # LOW_STOCK, DELAYED_SHIPMENT, NEW_PO, SUPPLIER_DELAY, EXPIRED_PRODUCTS
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(100))
    action = Column(String(150), nullable=False) # LOGIN, CREATE_PRODUCT, DELETE_SUPPLIER, ADJUST_STOCK, etc.
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="audit_logs")
