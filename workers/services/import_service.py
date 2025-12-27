import pandas as pd
from io import BytesIO
from typing import List, Dict, Any, Tuple

class ImportService:
    @staticmethod
    def parse_csv(file_content: bytes) -> pd.DataFrame:
        return pd.read_csv(BytesIO(file_content))
        
    @staticmethod
    def parse_excel(file_content: bytes, sheet_name: str = 0) -> pd.DataFrame:
        return pd.read_excel(BytesIO(file_content), sheet_name=sheet_name)
        
    @staticmethod
    def validate_product_row(row: pd.Series) -> Tuple[bool, str]:
        required_fields = ['Title']
        
        for field in required_fields:
            if field not in row or pd.isna(row[field]) or row[field] == '':
                return False, f"Missing required field: {field}"
                
        return True, ""
        
    @staticmethod
    def row_to_product(row: pd.Series) -> Dict[str, Any]:
        product_data = {
            'title': str(row.get('Title', '')),
            'body_html': str(row.get('Body HTML', '')) if pd.notna(row.get('Body HTML')) else '',
            'vendor': str(row.get('Vendor', '')) if pd.notna(row.get('Vendor')) else '',
            'product_type': str(row.get('Product Type', '')) if pd.notna(row.get('Product Type')) else '',
            'tags': str(row.get('Tags', '')) if pd.notna(row.get('Tags')) else '',
        }
        
        variant = {
            'sku': str(row.get('SKU', '')) if pd.notna(row.get('SKU')) else '',
            'price': str(row.get('Price', '0')) if pd.notna(row.get('Price')) else '0',
            'inventory_quantity': int(row.get('Inventory Quantity', 0)) if pd.notna(row.get('Inventory Quantity')) else 0,
        }
        
        if pd.notna(row.get('Compare At Price')):
            variant['compare_at_price'] = str(row['Compare At Price'])
            
        if pd.notna(row.get('Barcode')):
            variant['barcode'] = str(row['Barcode'])
            
        product_data['variants'] = [variant]
        
        return product_data
        
    @staticmethod
    def validate_customer_row(row: pd.Series) -> Tuple[bool, str]:
        if 'Email' not in row or pd.isna(row['Email']) or row['Email'] == '':
            return False, "Missing required field: Email"
            
        return True, ""
        
    @staticmethod
    def row_to_customer(row: pd.Series) -> Dict[str, Any]:
        customer_data = {
            'email': str(row.get('Email', '')),
            'first_name': str(row.get('First Name', '')) if pd.notna(row.get('First Name')) else '',
            'last_name': str(row.get('Last Name', '')) if pd.notna(row.get('Last Name')) else '',
            'phone': str(row.get('Phone', '')) if pd.notna(row.get('Phone')) else '',
        }
        
        has_address = any([
            pd.notna(row.get('Address 1')),
            pd.notna(row.get('City')),
            pd.notna(row.get('Country'))
        ])
        
        if has_address:
            address = {
                'address1': str(row.get('Address 1', '')) if pd.notna(row.get('Address 1')) else '',
                'address2': str(row.get('Address 2', '')) if pd.notna(row.get('Address 2')) else '',
                'city': str(row.get('City', '')) if pd.notna(row.get('City')) else '',
                'province': str(row.get('Province', '')) if pd.notna(row.get('Province')) else '',
                'zip': str(row.get('Zip', '')) if pd.notna(row.get('Zip')) else '',
                'country': str(row.get('Country', '')) if pd.notna(row.get('Country')) else '',
            }
            customer_data['addresses'] = [address]
            
        return customer_data
