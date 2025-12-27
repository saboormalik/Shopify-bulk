import shopify
from typing import List, Dict, Any, Optional
from config import SHOPIFY_API_VERSION
import logging

logger = logging.getLogger(__name__)

class EntityService:
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

    def fetch_paginated(self, resource_class, params: Dict = None, limit: int = 250) -> List[Dict[str, Any]]:
        """Generic paginated fetch for any Shopify resource"""
        items = []
        page_info = None
        params = params or {}
        
        while True:
            try:
                if page_info:
                    batch = resource_class.find(limit=limit, page_info=page_info, **params)
                else:
                    batch = resource_class.find(limit=limit, **params)
                    
                if not batch:
                    break
                    
                for item in batch:
                    items.append(item.to_dict())
                    
                if not hasattr(resource_class, 'next_page_info') or not resource_class.next_page_info:
                    break
                    
                page_info = resource_class.next_page_info
                
            except Exception as e:
                logger.error(f"Error fetching {resource_class.__name__}: {str(e)}")
                break
            
        return items

    def get_products(self, filters: Dict = None) -> List[Dict[str, Any]]:
        params = {}
        if filters:
            if filters.get('status'):
                params['status'] = filters['status']
            if filters.get('product_type'):
                params['product_type'] = filters['product_type']
            if filters.get('vendor'):
                params['vendor'] = filters['vendor']
            if filters.get('collection_id'):
                params['collection_id'] = filters['collection_id']
        
        return self.fetch_paginated(shopify.Product, params)

    def get_variants(self) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.Variant)

    def get_custom_collections(self, filters: Dict = None) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.CustomCollection, filters or {})

    def get_smart_collections(self, filters: Dict = None) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.SmartCollection, filters or {})

    def get_customers(self, filters: Dict = None) -> List[Dict[str, Any]]:
        params = {}
        if filters:
            if filters.get('created_at_min'):
                params['created_at_min'] = filters['created_at_min']
            if filters.get('updated_at_min'):
                params['updated_at_min'] = filters['updated_at_min']
        
        return self.fetch_paginated(shopify.Customer, params)

    def get_orders(self, filters: Dict = None) -> List[Dict[str, Any]]:
        params = {'status': 'any'}
        if filters:
            if filters.get('status'):
                params['status'] = filters['status']
            if filters.get('financial_status'):
                params['financial_status'] = filters['financial_status']
            if filters.get('fulfillment_status'):
                params['fulfillment_status'] = filters['fulfillment_status']
            if filters.get('created_at_min'):
                params['created_at_min'] = filters['created_at_min']
        
        return self.fetch_paginated(shopify.Order, params)

    def get_draft_orders(self, filters: Dict = None) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.DraftOrder, filters or {})

    def get_discounts(self) -> List[Dict[str, Any]]:
        discounts = []
        try:
            price_rules = self.fetch_paginated(shopify.PriceRule)
            for rule in price_rules:
                rule['discount_codes'] = []
                try:
                    codes = shopify.DiscountCode.find(price_rule_id=rule['id'])
                    rule['discount_codes'] = [c.to_dict() for c in codes]
                except:
                    pass
                discounts.append(rule)
        except Exception as e:
            logger.error(f"Error fetching discounts: {str(e)}")
        
        return discounts

    def get_pages(self, filters: Dict = None) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.Page, filters or {})

    def get_blog_posts(self, filters: Dict = None) -> List[Dict[str, Any]]:
        posts = []
        try:
            blogs = self.fetch_paginated(shopify.Blog)
            for blog in blogs:
                blog_posts = self.fetch_paginated(shopify.Article, {'blog_id': blog['id']})
                for post in blog_posts:
                    post['blog_handle'] = blog.get('handle', '')
                    post['blog_title'] = blog.get('title', '')
                    posts.append(post)
        except Exception as e:
            logger.error(f"Error fetching blog posts: {str(e)}")
        
        return posts

    def get_redirects(self, filters: Dict = None) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.Redirect, filters or {})

    def get_files(self) -> List[Dict[str, Any]]:
        files = []
        try:
            response = shopify.GraphQL().execute("""
                query {
                    files(first: 250) {
                        edges {
                            node {
                                ... on MediaImage {
                                    id
                                    alt
                                    image {
                                        url
                                        width
                                        height
                                    }
                                    createdAt
                                    updatedAt
                                }
                                ... on Video {
                                    id
                                    alt
                                    sources {
                                        url
                                    }
                                    createdAt
                                    updatedAt
                                }
                                ... on GenericFile {
                                    id
                                    alt
                                    url
                                    createdAt
                                    updatedAt
                                }
                            }
                        }
                    }
                }
            """)
            result = shopify.GraphQL.parse(response)
            if result and 'files' in result:
                files = [edge['node'] for edge in result['files']['edges']]
        except Exception as e:
            logger.error(f"Error fetching files: {str(e)}")
        
        return files

    def get_metaobjects(self, type_name: str = None) -> List[Dict[str, Any]]:
        metaobjects = []
        try:
            query = """
                query ($first: Int!, $after: String) {
                    metaobjects(first: $first, after: $after) {
                        edges {
                            node {
                                id
                                handle
                                type
                                fields {
                                    key
                                    value
                                    type
                                }
                                updatedAt
                            }
                            cursor
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            """
            
            has_next = True
            after = None
            
            while has_next:
                variables = {'first': 250, 'after': after}
                response = shopify.GraphQL().execute(query, variables=variables)
                result = shopify.GraphQL.parse(response)
                
                if result and 'metaobjects' in result:
                    for edge in result['metaobjects']['edges']:
                        metaobjects.append(edge['node'])
                        after = edge['cursor']
                    has_next = result['metaobjects']['pageInfo']['hasNextPage']
                else:
                    break
                    
        except Exception as e:
            logger.error(f"Error fetching metaobjects: {str(e)}")
        
        return metaobjects

    def get_menus(self) -> List[Dict[str, Any]]:
        menus = []
        try:
            response = shopify.GraphQL().execute("""
                query {
                    shop {
                        navigationMenus(first: 250) {
                            edges {
                                node {
                                    id
                                    handle
                                    title
                                    items {
                                        id
                                        title
                                        url
                                        type
                                    }
                                }
                            }
                        }
                    }
                }
            """)
            result = shopify.GraphQL.parse(response)
            if result and 'shop' in result and 'navigationMenus' in result['shop']:
                menus = [edge['node'] for edge in result['shop']['navigationMenus']['edges']]
        except Exception as e:
            logger.error(f"Error fetching menus: {str(e)}")
        
        return menus

    def get_shop_info(self) -> Dict[str, Any]:
        try:
            shop_data = shopify.Shop.current()
            return shop_data.to_dict() if shop_data else {}
        except Exception as e:
            logger.error(f"Error fetching shop info: {str(e)}")
            return {}

    def get_locations(self) -> List[Dict[str, Any]]:
        return self.fetch_paginated(shopify.Location)

    def get_inventory_levels(self, location_id: int = None) -> List[Dict[str, Any]]:
        items = []
        try:
            if location_id:
                levels = shopify.InventoryLevel.find(location_ids=location_id)
            else:
                levels = shopify.InventoryLevel.find()
            
            for level in levels:
                items.append(level.to_dict())
        except Exception as e:
            logger.error(f"Error fetching inventory levels: {str(e)}")
        
        return items

    def create_or_update(self, entity_type: str, data: Dict[str, Any], command: str = 'UPDATE') -> Dict[str, Any]:
        """Generic create/update method for entities"""
        resource_map = {
            'products': shopify.Product,
            'customers': shopify.Customer,
            'custom_collections': shopify.CustomCollection,
            'smart_collections': shopify.SmartCollection,
            'pages': shopify.Page,
            'redirects': shopify.Redirect,
            'draft_orders': shopify.DraftOrder,
        }
        
        if entity_type not in resource_map:
            raise ValueError(f"Unsupported entity type: {entity_type}")
        
        resource_class = resource_map[entity_type]
        
        try:
            if command == 'NEW' or not data.get('id'):
                resource = resource_class(data)
                resource.save()
                return resource.to_dict()
            elif command == 'UPDATE':
                if data.get('id'):
                    resource = resource_class.find(data['id'])
                    for key, value in data.items():
                        if key != 'id':
                            setattr(resource, key, value)
                    resource.save()
                    return resource.to_dict()
                else:
                    raise ValueError("ID required for UPDATE command")
            elif command == 'DELETE':
                if data.get('id'):
                    resource = resource_class.find(data['id'])
                    resource.destroy()
                    return {'deleted': True, 'id': data['id']}
                else:
                    raise ValueError("ID required for DELETE command")
            else:
                raise ValueError(f"Unsupported command: {command}")
                
        except Exception as e:
            logger.error(f"Error in create_or_update for {entity_type}: {str(e)}")
            raise

    def get_metafields(self, owner_resource: str, owner_id: int) -> List[Dict[str, Any]]:
        """Get metafields for any entity"""
        metafields = []
        try:
            mf = shopify.Metafield.find(
                resource=owner_resource,
                resource_id=owner_id
            )
            metafields = [m.to_dict() for m in mf]
        except Exception as e:
            logger.error(f"Error fetching metafields: {str(e)}")
        
        return metafields

    def set_metafield(self, owner_resource: str, owner_id: int, namespace: str, key: str, value: Any, value_type: str) -> Dict[str, Any]:
        """Set a metafield for any entity"""
        try:
            metafield = shopify.Metafield({
                'namespace': namespace,
                'key': key,
                'value': value,
                'type': value_type
            })
            metafield.save()
            return metafield.to_dict()
        except Exception as e:
            logger.error(f"Error setting metafield: {str(e)}")
            raise
