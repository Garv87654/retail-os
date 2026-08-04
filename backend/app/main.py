import os
import time
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import engine, Base, SessionLocal, get_db
from app.api import (
    auth, products, warehouses, suppliers, 
    purchase_orders, sales_orders, forecast, 
    ai, reports, logs
)
from app.models.models import Role, User, Product, Warehouse
from app.utils.seed import seed_database

app = FastAPI(
    title="RetailOS API",
    description="Production-grade API for AI-Powered Retail Supply Chain Management",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # React Vite local dev server
    "http://127.0.0.1:5173",
    "*"  # Allow all for docker / environments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(warehouses.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(purchase_orders.router, prefix="/api")
app.include_router(sales_orders.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(logs.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database schema verified.")
    except Exception as e:
        print(f"Startup schema check failed: {e}")


@app.get("/")
def read_root():
    return {"message": "Welcome to RetailOS AI Supply Chain API. Access docs at /docs"}

@app.get("/api/db-check")
def db_check(db: Session = Depends(get_db)):
    try:
        bind_url = str(db.bind.url)
        safe_url = bind_url.split("@")[-1] if "@" in bind_url else bind_url
        return {
            "database_type": db.bind.name,
            "connected_to": safe_url,
            "products_count": db.query(Product).count(),
            "warehouses_count": db.query(Warehouse).count()
        }
    except Exception as e:
        return {"error": str(e)}
