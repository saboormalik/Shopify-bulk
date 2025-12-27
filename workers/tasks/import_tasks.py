from celery_app import app
from config import mongodb, s3_client, S3_BUCKET
from services.shopify_service import ShopifyService
from services.import_service import ImportService
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@app.task(bind=True, name='tasks.import_products')
def import_products(self, job_id: str, shop: str, access_token: str, file_key: str, params: dict):
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        self.update_state(state='PROGRESS', meta={'status': 'Downloading import file'})
        
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content = response['Body'].read()
        
        self.update_state(state='PROGRESS', meta={'status': 'Parsing CSV file'})
        
        df = ImportService.parse_csv(file_content)
        
        total_rows = len(df)
        success_count = 0
        error_count = 0
        errors = []
        
        with ShopifyService(shop, access_token) as shopify_service:
            for index, row in df.iterrows():
                try:
                    valid, error_msg = ImportService.validate_product_row(row)
                    if not valid:
                        errors.append(f"Row {index + 2}: {error_msg}")
                        error_count += 1
                        continue
                        
                    product_data = ImportService.row_to_product(row)
                    
                    shopify_service.create_product(product_data)
                    success_count += 1
                    
                    progress = int((index + 1) / total_rows * 100)
                    self.update_state(
                        state='PROGRESS',
                        meta={'status': f'Processing row {index + 1}/{total_rows}', 'progress': progress}
                    )
                    
                except Exception as e:
                    logger.error(f"Error importing product row {index + 2}: {str(e)}")
                    errors.append(f"Row {index + 2}: {str(e)}")
                    error_count += 1
                    
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow(),
                    'total_records': total_rows,
                    'success_count': success_count,
                    'error_count': error_count,
                    'errors': errors[:100]
                }
            }
        )
        
        return {
            'status': 'completed',
            'total': total_rows,
            'success': success_count,
            'errors': error_count
        }
        
    except Exception as e:
        logger.error(f"Import products failed: {str(e)}")
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

@app.task(bind=True, name='tasks.import_customers')
def import_customers(self, job_id: str, shop: str, access_token: str, file_key: str, params: dict):
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        self.update_state(state='PROGRESS', meta={'status': 'Downloading import file'})
        
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content = response['Body'].read()
        
        self.update_state(state='PROGRESS', meta={'status': 'Parsing CSV file'})
        
        df = ImportService.parse_csv(file_content)
        
        total_rows = len(df)
        success_count = 0
        error_count = 0
        errors = []
        
        with ShopifyService(shop, access_token) as shopify_service:
            for index, row in df.iterrows():
                try:
                    valid, error_msg = ImportService.validate_customer_row(row)
                    if not valid:
                        errors.append(f"Row {index + 2}: {error_msg}")
                        error_count += 1
                        continue
                        
                    customer_data = ImportService.row_to_customer(row)
                    
                    shopify_service.create_customer(customer_data)
                    success_count += 1
                    
                    progress = int((index + 1) / total_rows * 100)
                    self.update_state(
                        state='PROGRESS',
                        meta={'status': f'Processing row {index + 1}/{total_rows}', 'progress': progress}
                    )
                    
                except Exception as e:
                    logger.error(f"Error importing customer row {index + 2}: {str(e)}")
                    errors.append(f"Row {index + 2}: {str(e)}")
                    error_count += 1
                    
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow(),
                    'total_records': total_rows,
                    'success_count': success_count,
                    'error_count': error_count,
                    'errors': errors[:100]
                }
            }
        )
        
        return {
            'status': 'completed',
            'total': total_rows,
            'success': success_count,
            'errors': error_count
        }
        
    except Exception as e:
        logger.error(f"Import customers failed: {str(e)}")
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
