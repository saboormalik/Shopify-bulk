import pandas as pd
from io import BytesIO
from typing import List, Dict, Any
from datetime import datetime

class ExportService:
    @staticmethod
    def products_to_csv(products: List[Dict[str, Any]]) -> bytes:
        rows = []
        
        for product in products:
            base_row = {
                'Product ID': product.get('id', ''),
                'Title': product.get('title', ''),
                'Handle': product.get('handle', ''),
                'Body HTML': product.get('body_html', ''),
                'Vendor': product.get('vendor', ''),
                'Product Type': product.get('product_type', ''),
                'Tags': product.get('tags', ''),
                'Published': product.get('published_at', '') is not None,
                'Status': product.get('status', ''),
            }
            
            variants = product.get('variants', [])
            for variant in variants:
                row = base_row.copy()
                row.update({
                    'Variant ID': variant.get('id', ''),
                    'SKU': variant.get('sku', ''),
                    'Price': variant.get('price', ''),
                    'Compare At Price': variant.get('compare_at_price', ''),
                    'Barcode': variant.get('barcode', ''),
                    'Inventory Quantity': variant.get('inventory_quantity', 0),
                    'Weight': variant.get('weight', ''),
                    'Weight Unit': variant.get('weight_unit', ''),
                })
                rows.append(row)
                
        df = pd.DataFrame(rows)
        
        buffer = BytesIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        return buffer.getvalue()
        
    @staticmethod
    def customers_to_csv(customers: List[Dict[str, Any]]) -> bytes:
        rows = []
        
        for customer in customers:
            default_address = customer.get('default_address', {}) or {}
            
            row = {
                'Customer ID': customer.get('id', ''),
                'Email': customer.get('email', ''),
                'First Name': customer.get('first_name', ''),
                'Last Name': customer.get('last_name', ''),
                'Phone': customer.get('phone', ''),
                'Address 1': default_address.get('address1', ''),
                'Address 2': default_address.get('address2', ''),
                'City': default_address.get('city', ''),
                'Province': default_address.get('province', ''),
                'Zip': default_address.get('zip', ''),
                'Country': default_address.get('country', ''),
                'Total Spent': customer.get('total_spent', 0),
                'Orders Count': customer.get('orders_count', 0),
                'State': customer.get('state', ''),
                'Tags': customer.get('tags', ''),
                'Created At': customer.get('created_at', ''),
            }
            rows.append(row)
            
        df = pd.DataFrame(rows)
        
        buffer = BytesIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        return buffer.getvalue()
        
    @staticmethod
    def orders_to_csv(orders: List[Dict[str, Any]]) -> bytes:
        rows = []
        
        for order in orders:
            shipping_address = order.get('shipping_address', {}) or {}
            
            row = {
                'Order ID': order.get('id', ''),
                'Order Number': order.get('order_number', ''),
                'Email': order.get('email', ''),
                'Created At': order.get('created_at', ''),
                'Total Price': order.get('total_price', 0),
                'Subtotal Price': order.get('subtotal_price', 0),
                'Total Tax': order.get('total_tax', 0),
                'Currency': order.get('currency', ''),
                'Financial Status': order.get('financial_status', ''),
                'Fulfillment Status': order.get('fulfillment_status', ''),
                'Customer Name': f"{order.get('customer', {}).get('first_name', '')} {order.get('customer', {}).get('last_name', '')}",
                'Shipping Address 1': shipping_address.get('address1', ''),
                'Shipping City': shipping_address.get('city', ''),
                'Shipping Province': shipping_address.get('province', ''),
                'Shipping Country': shipping_address.get('country', ''),
                'Shipping Zip': shipping_address.get('zip', ''),
            }
            rows.append(row)
            
        df = pd.DataFrame(rows)
        
        buffer = BytesIO()
        df.to_csv(buffer, index=False, encoding='utf-8')
        buffer.seek(0)
        
        return buffer.getvalue()
        
    @staticmethod
    def to_excel(data: Dict[str, List[Dict[str, Any]]]) -> bytes:
        buffer = BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            for sheet_name, rows in data.items():
                df = pd.DataFrame(rows)
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
        buffer.seek(0)
        return buffer.getvalue()
