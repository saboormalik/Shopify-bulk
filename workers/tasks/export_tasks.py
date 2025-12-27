from celery_app import app
from config import mongodb, s3_client, S3_BUCKET
from services.shopify_service import ShopifyService
from services.export_service import ExportService
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@app.task(bind=True, name='tasks.export_products')
def export_products(self, job_id: str, shop: str, access_token: str, params: dict):
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        with ShopifyService(shop, access_token) as shopify_service:
            self.update_state(state='PROGRESS', meta={'status': 'Fetching products from Shopify'})
            
            products = shopify_service.get_products()
            
            self.update_state(state='PROGRESS', meta={'status': f'Exporting {len(products)} products'})
            
            csv_content = ExportService.products_to_csv(products)
            
            filename = f"products_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            s3_key = f"exports/{shop}/{filename}"
            
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=csv_content,
                ContentType='text/csv'
            )
            
            file_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=86400
            )
            
            mongodb.jobs.update_one(
                {'_id': ObjectId(job_id)},
                {
                    '$set': {
                        'status': 'completed',
                        'completed_at': datetime.utcnow(),
                        'file_key': s3_key,
                        'file_url': file_url,
                        'filename': filename,
                        'total_records': len(products)
                    }
                }
            )
            
        return {'status': 'completed', 'file_url': file_url}
        
    except Exception as e:
        logger.error(f"Export products failed: {str(e)}")
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': 'failed',
                    'error': str(e),
                    'failed_at': datetime.utcnow()
                }
            }
        )
        raise

@app.task(bind=True, name='tasks.export_customers')
def export_customers(self, job_id: str, shop: str, access_token: str, params: dict):
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        with ShopifyService(shop, access_token) as shopify_service:
            self.update_state(state='PROGRESS', meta={'status': 'Fetching customers from Shopify'})
            
            customers = shopify_service.get_customers()
            
            self.update_state(state='PROGRESS', meta={'status': f'Exporting {len(customers)} customers'})
            
            csv_content = ExportService.customers_to_csv(customers)
            
            filename = f"customers_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            s3_key = f"exports/{shop}/{filename}"
            
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=csv_content,
                ContentType='text/csv'
            )
            
            file_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=86400
            )
            
            mongodb.jobs.update_one(
                {'_id': ObjectId(job_id)},
                {
                    '$set': {
                        'status': 'completed',
                        'completed_at': datetime.utcnow(),
                        'file_key': s3_key,
                        'file_url': file_url,
                        'filename': filename,
                        'total_records': len(customers)
                    }
                }
            )
            
        return {'status': 'completed', 'file_url': file_url}
        
    except Exception as e:
        logger.error(f"Export customers failed: {str(e)}")
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': 'failed',
                    'error': str(e),
                    'failed_at': datetime.utcnow()
                }
            }
        )
        raise

@app.task(bind=True, name='tasks.export_orders')
def export_orders(self, job_id: str, shop: str, access_token: str, params: dict):
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        with ShopifyService(shop, access_token) as shopify_service:
            self.update_state(state='PROGRESS', meta={'status': 'Fetching orders from Shopify'})
            
            orders = shopify_service.get_orders(status=params.get('status', 'any'))
            
            self.update_state(state='PROGRESS', meta={'status': f'Exporting {len(orders)} orders'})
            
            csv_content = ExportService.orders_to_csv(orders)
            
            filename = f"orders_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            s3_key = f"exports/{shop}/{filename}"
            
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=csv_content,
                ContentType='text/csv'
            )
            
            file_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': s3_key},
                ExpiresIn=86400
            )
            
            mongodb.jobs.update_one(
                {'_id': ObjectId(job_id)},
                {
                    '$set': {
                        'status': 'completed',
                        'completed_at': datetime.utcnow(),
                        'file_key': s3_key,
                        'file_url': file_url,
                        'filename': filename,
                        'total_records': len(orders)
                    }
                }
            )
            
        return {'status': 'completed', 'file_url': file_url}
        
    except Exception as e:
        logger.error(f"Export orders failed: {str(e)}")
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': 'failed',
                    'error': str(e),
                    'failed_at': datetime.utcnow()
                }
            }
        )
        raise
