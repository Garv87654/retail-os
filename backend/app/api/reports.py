import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fpdf import FPDF

from app.database.session import get_db
from app.models.models import Product, Supplier, Warehouse, PurchaseOrder, SalesOrder, User
from app.auth.security import RoleChecker, get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

read_roles = RoleChecker(["Admin", "Warehouse Manager", "Procurement Manager", "Viewer"])

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    # Inventory Summary
    total_products = db.query(Product).count()
    low_stock = db.query(Product).filter(Product.status == "Low Stock").count()
    out_of_stock = db.query(Product).filter(Product.status == "Out of Stock").count()
    total_stock_value = sum(p.current_stock * p.buying_price for p in db.query(Product).all())
    
    # Sales/Revenue Summary
    sales = db.query(SalesOrder).all()
    total_sales_value = sum(s.grand_total for s in sales)
    total_sales_count = len(sales)
    
    # Purchases Summary
    pos = db.query(PurchaseOrder).all()
    total_purchases_value = sum(p.grand_total for p in pos)
    
    # Supplier performance rating average
    suppliers = db.query(Supplier).all()
    avg_rating = round(sum(s.rating for s in suppliers) / len(suppliers), 2) if suppliers else 0.0
    
    return {
        "inventory": {
            "total_products": total_products,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
            "total_stock_value": round(total_stock_value, 2)
        },
        "sales": {
            "total_revenue": round(total_sales_value, 2),
            "orders_count": total_sales_count
        },
        "purchases": {
            "total_expenditure": round(total_purchases_value, 2),
            "orders_count": len(pos)
        },
        "suppliers": {
            "total_suppliers": len(suppliers),
            "average_rating": avg_rating
        }
    }

class PDFReport(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 16)
        self.cell(0, 10, 'RetailOS - Business Performance Report', 0, 1, 'C')
        self.set_font('Helvetica', 'I', 10)
        self.cell(0, 10, f'Generated on: {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

@router.get("/export/pdf")
def export_pdf_report(report_type: str, db: Session = Depends(get_db), current_user: User = Depends(read_roles)):
    pdf = PDFReport()
    pdf.add_page()
    pdf.set_font("Helvetica", size=12)
    
    if report_type == "inventory":
        pdf.set_font("Helvetica", 'B', 14)
        pdf.cell(0, 10, "Inventory Level Report", 0, 1)
        pdf.set_font("Helvetica", size=10)
        pdf.ln(5)
        products = db.query(Product).limit(50).all()
        # Draw table headers
        pdf.cell(40, 8, "SKU", 1)
        pdf.cell(80, 8, "Name", 1)
        pdf.cell(30, 8, "Current Stock", 1)
        pdf.cell(30, 8, "Buying Price", 1)
        pdf.ln()
        for p in products:
            pdf.cell(40, 8, str(p.sku), 1)
            pdf.cell(80, 8, str(p.name[:35]), 1)
            pdf.cell(30, 8, str(p.current_stock), 1)
            pdf.cell(30, 8, f"${p.buying_price:.2f}", 1)
            pdf.ln()
            
    elif report_type == "sales":
        pdf.set_font("Helvetica", 'B', 14)
        pdf.cell(0, 10, "Sales & Revenue Report", 0, 1)
        pdf.set_font("Helvetica", size=10)
        pdf.ln(5)
        sales = db.query(SalesOrder).limit(50).all()
        pdf.cell(50, 8, "Invoice Number", 1)
        pdf.cell(70, 8, "Customer Name", 1)
        pdf.cell(30, 8, "Grand Total", 1)
        pdf.cell(40, 8, "Shipment Status", 1)
        pdf.ln()
        for s in sales:
            pdf.cell(50, 8, str(s.invoice_number), 1)
            pdf.cell(70, 8, str(s.customer_name), 1)
            pdf.cell(30, 8, f"${s.grand_total:.2f}", 1)
            pdf.cell(40, 8, str(s.shipment_status), 1)
            pdf.ln()
            
    elif report_type == "supplier":
        pdf.set_font("Helvetica", 'B', 14)
        pdf.cell(0, 10, "Supplier Performance Report", 0, 1)
        pdf.set_font("Helvetica", size=10)
        pdf.ln(5)
        suppliers = db.query(Supplier).all()
        pdf.cell(60, 8, "Supplier Name", 1)
        pdf.cell(60, 8, "Email", 1)
        pdf.cell(30, 8, "Rating", 1)
        pdf.cell(30, 8, "Status", 1)
        pdf.ln()
        for s in suppliers:
            pdf.cell(60, 8, str(s.name[:25]), 1)
            pdf.cell(60, 8, str(s.email[:25]), 1)
            pdf.cell(30, 8, f"{s.rating:.1f}/5.0", 1)
            pdf.cell(30, 8, str(s.status), 1)
            pdf.ln()
    else:
        # Default Summary Page
        pdf.set_font("Helvetica", 'B', 14)
        pdf.cell(0, 10, "Executive Performance Overview", 0, 1)
        pdf.ln(5)
        pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 10, "This business report outlines supply chain metrics, stock statuses, supplier ratings, and recent financial transactions across all locations.")
        pdf.ln(10)
        
        # Add basic counts
        total_p = db.query(Product).count()
        total_s = db.query(Supplier).count()
        total_w = db.query(Warehouse).count()
        
        pdf.cell(60, 10, f"Total Products: {total_p}", 1)
        pdf.cell(60, 10, f"Total Suppliers: {total_s}", 1)
        pdf.cell(60, 10, f"Total Warehouses: {total_w}", 1)
        pdf.ln()

    # Get output bytes
    pdf_bytes = pdf.output(dest='S')
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.pdf"}
    )
