from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role_name: str

class UserResponse(UserBase):
    id: int
    role_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    category_id: int
    brand: Optional[str] = None
    description: Optional[str] = None
    buying_price: float
    selling_price: float
    current_stock: int
    minimum_stock: int
    maximum_stock: int
    supplier_id: int
    expiry_date: Optional[datetime] = None
    barcode: Optional[str] = None
    status: Optional[str] = "In Stock"

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None
    class Config:
        from_attributes = True

# Warehouse Schemas
class WarehouseBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    capacity: int
    manager_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    utilization_pct: Optional[float] = 0.0
    class Config:
        from_attributes = True

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    payment_terms: Optional[str] = None
    rating: Optional[float] = 5.0
    delivery_time: Optional[int] = 5
    status: Optional[str] = "Active"

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    class Config:
        from_attributes = True

# PO Item Schemas
class PurchaseOrderItemBase(BaseModel):
    product_id: int
    quantity: int
    buying_price: float

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderBase(BaseModel):
    supplier_id: int
    tax: float = 0.0
    discount: float = 0.0
    shipping: float = 0.0
    expected_delivery: datetime
    grand_total: float = 0.0

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    order_number: str
    status: str
    created_at: datetime
    updated_at: datetime
    supplier_name: Optional[str] = None
    items: List[PurchaseOrderItemResponse] = []
    class Config:
        from_attributes = True

# Sales Order Item
class SalesOrderItemBase(BaseModel):
    product_id: int
    quantity: int
    selling_price: float

class SalesOrderItemCreate(SalesOrderItemBase):
    pass

class SalesOrderItemResponse(SalesOrderItemBase):
    id: int
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

# Sales Order
class SalesOrderBase(BaseModel):
    customer_name: str
    tax: float = 0.0
    discount: float = 0.0
    grand_total: float = 0.0

class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate]

class SalesOrderResponse(SalesOrderBase):
    id: int
    invoice_number: str
    payment_status: str
    shipment_status: str
    created_at: datetime
    items: List[SalesOrderItemResponse] = []
    class Config:
        from_attributes = True

# Stock Transfer & Adjustments
class StockTransferRequest(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    product_id: int
    quantity: int

class StockAdjustmentRequest(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int # delta (+/-)
    reason: str

# Forecast Request/Response
class ForecastRequest(BaseModel):
    product_id: int
    warehouse_id: int

class ForecastResponse(BaseModel):
    product_id: int
    warehouse_id: int
    predicted_demand: float
    confidence: float
    recommendation: str
    horizon: str
    forecast_date: datetime

# Chat/AI Schemas
class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    response: str

# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    username: Optional[str] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

# Notification
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True
