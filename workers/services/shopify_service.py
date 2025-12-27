import shopify
from typing import List, Dict, Any, Optional
from config import SHOPIFY_API_VERSION

class ShopifyService:
    def __init__(self, shop: str, access_token: str):
        self.shop = shop
        self.access_token = access_token
        self.session = None
        
    def __enter__(self):
        self.session = shopify.Session(self.shop, SHOPIFY_API_VERSION, self.access_token)
        shopify.ShopifyResource.activate_session(self.session)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        shopify.ShopifyResource.clear_session()
        
    def get_products(self, limit: int = 250) -> List[Dict[str, Any]]:
        products = []
        page_info = None
        
        while True:
            if page_info:
                batch = shopify.Product.find(limit=limit, page_info=page_info)
            else:
                batch = shopify.Product.find(limit=limit)
                
            if not batch:
                break
                
            for product in batch:
                products.append(product.to_dict())
                
            if not hasattr(shopify.Product, 'next_page_info') or not shopify.Product.next_page_info:
                break
                
            page_info = shopify.Product.next_page_info
            
        return products
        
    def get_customers(self, limit: int = 250) -> List[Dict[str, Any]]:
        customers = []
        page_info = None
        
        while True:
            if page_info:
                batch = shopify.Customer.find(limit=limit, page_info=page_info)
            else:
                batch = shopify.Customer.find(limit=limit)
                
            if not batch:
                break
                
            for customer in batch:
                customers.append(customer.to_dict())
                
            if not hasattr(shopify.Customer, 'next_page_info') or not shopify.Customer.next_page_info:
                break
                
            page_info = shopify.Customer.next_page_info
            
        return customers
        
    def get_orders(self, limit: int = 250, status: str = 'any') -> List[Dict[str, Any]]:
        orders = []
        page_info = None
        
        while True:
            if page_info:
                batch = shopify.Order.find(limit=limit, status=status, page_info=page_info)
            else:
                batch = shopify.Order.find(limit=limit, status=status)
                
            if not batch:
                break
                
            for order in batch:
                orders.append(order.to_dict())
                
            if not hasattr(shopify.Order, 'next_page_info') or not shopify.Order.next_page_info:
                break
                
            page_info = shopify.Order.next_page_info
            
        return orders
        
    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        product = shopify.Product(product_data)
        product.save()
        return product.to_dict()
        
    def update_product(self, product_id: int, product_data: Dict[str, Any]) -> Dict[str, Any]:
        product = shopify.Product.find(product_id)
        for key, value in product_data.items():
            setattr(product, key, value)
        product.save()
        return product.to_dict()
        
    def create_customer(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        customer = shopify.Customer(customer_data)
        customer.save()
        return customer.to_dict()
        
    def update_customer(self, customer_id: int, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        customer = shopify.Customer.find(customer_id)
        for key, value in customer_data.items():
            setattr(customer, key, value)
        customer.save()
        return customer.to_dict()
