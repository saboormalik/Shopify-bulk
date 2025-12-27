from celery_app import app
from config import mongodb, s3_client, S3_BUCKET
from services.entity_service import EntityService
from services.file_processor import FileProcessor
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

ENTITY_METHODS = {
    'products': 'get_products',
    'variants': 'get_variants',
    'custom_collections': 'get_custom_collections',
    'smart_collections': 'get_smart_collections',
    'customers': 'get_customers',
    'orders': 'get_orders',
    'draft_orders': 'get_draft_orders',
    'discounts': 'get_discounts',
    'pages': 'get_pages',
    'blog_posts': 'get_blog_posts',
    'redirects': 'get_redirects',
    'files': 'get_files',
    'metaobjects': 'get_metaobjects',
    'menus': 'get_menus',
    'shop': 'get_shop_info',
    'locations': 'get_locations',
    'inventory': 'get_inventory_levels'
}

@app.task(bind=True, name='tasks.export_entity')
def export_entity(self, job_id: str, shop: str, access_token: str, entity: str, params: dict, filters: dict, format_type: str = 'csv'):
    """Universal export task for all entities"""
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        if entity not in ENTITY_METHODS:
            raise ValueError(f"Unsupported entity: {entity}")
        
        with EntityService(shop, access_token) as entity_service:
            self.update_state(state='PROGRESS', meta={'status': f'Fetching {entity} from Shopify'})
            
            method_name = ENTITY_METHODS[entity]
            method = getattr(entity_service, method_name)
            
            if method_name in ['get_products', 'get_customers', 'get_orders', 'get_custom_collections', 'get_smart_collections']:
                data = method(filters)
            else:
                data = method()
            
            self.update_state(state='PROGRESS', meta={'status': f'Processing {len(data)} {entity}'})
            
            if entity == 'products' and params.get('include_metafields'):
                for product in data:
                    metafields = entity_service.get_metafields('products', product['id'])
                    for mf in metafields:
                        product[f"Metafield:{mf['namespace']}[{mf['key']}]"] = mf['value']
            
            if entity == 'customers' and params.get('include_metafields'):
                for customer in data:
                    metafields = entity_service.get_metafields('customers', customer['id'])
                    for mf in metafields:
                        customer[f"Metafield:{mf['namespace']}[{mf['key']}]"] = mf['value']
            
            self.update_state(state='PROGRESS', meta={'status': f'Generating {format_type.upper()} file'})
            
            if format_type == 'xlsx':
                file_content = FileProcessor.write_excel(data)
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                file_ext = 'xlsx'
            else:
                file_content = FileProcessor.write_csv(data)
                content_type = 'text/csv'
                file_ext = 'csv'
            
            filename = f"{entity}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_ext}"
            s3_key = f"exports/{shop}/{filename}"
            
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type
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
                        'total_records': len(data),
                        'progress': 100
                    }
                }
            )
            
        return {'status': 'completed', 'file_url': file_url, 'total_records': len(data)}
        
    except Exception as e:
        logger.error(f"Export {entity} failed: {str(e)}", exc_info=True)
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

@app.task(bind=True, name='tasks.import_entity')
def import_entity(self, job_id: str, shop: str, access_token: str, entity: str, file_key: str, params: dict, command_mode: str = 'UPDATE'):
    """Universal import task for all entities"""
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        self.update_state(state='PROGRESS', meta={'status': 'Downloading file'})
        
        file_obj = s3_client.get_object(Bucket=S3_BUCKET, Key=file_key)
        file_content = file_obj['Body'].read()
        
        file_ext = file_key.split('.')[-1].lower()
        if file_ext not in ['csv', 'xlsx', 'xls']:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        self.update_state(state='PROGRESS', meta={'status': 'Processing file'})
        
        if file_ext in ['xlsx', 'xls']:
            df = FileProcessor.read_file(file_content, f'.{file_ext}')
        else:
            df = FileProcessor.read_file(file_content, '.csv')
        
        if df.empty:
            raise ValueError("File is empty")
        
        df = df.fillna('')
        
        with EntityService(shop, access_token) as entity_service:
            total_rows = len(df)
            success_count = 0
            error_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    row_data = row.to_dict()
                    
                    command = row_data.get('Command', command_mode).upper()
                    if command not in ['NEW', 'UPDATE', 'DELETE', 'REPLACE']:
                        command = 'UPDATE'
                    
                    metafields = FileProcessor.extract_metafields(row_data)
                    
                    clean_data = {k: v for k, v in row_data.items() if not k.startswith('Metafield:') and k != 'Command'}
                    
                    result = entity_service.create_or_update(entity, clean_data, command)
                    
                    if metafields and result.get('id'):
                        for mf in metafields:
                            try:
                                entity_service.set_metafield(
                                    entity,
                                    result['id'],
                                    mf['namespace'],
                                    mf['key'],
                                    mf['value'],
                                    mf['type']
                                )
                            except Exception as mf_error:
                                logger.warning(f"Metafield error on row {index + 2}: {str(mf_error)}")
                    
                    success_count += 1
                    
                    if (index + 1) % 10 == 0:
                        progress = int(((index + 1) / total_rows) * 100)
                        self.update_state(state='PROGRESS', meta={
                            'status': f'Processing row {index + 1}/{total_rows}',
                            'progress': progress,
                            'success': success_count,
                            'errors': error_count
                        })
                        
                        mongodb.jobs.update_one(
                            {'_id': ObjectId(job_id)},
                            {
                                '$set': {
                                    'progress': progress,
                                    'processed_records': index + 1,
                                    'success_count': success_count,
                                    'error_count': error_count
                                }
                            }
                        )
                    
                except Exception as row_error:
                    error_count += 1
                    error_msg = f"Row {index + 2}: {str(row_error)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
                    
                    if len(errors) <= 100:
                        mongodb.jobs.update_one(
                            {'_id': ObjectId(job_id)},
                            {'$push': {'errors': error_msg}}
                        )
        
        status = 'completed' if error_count == 0 else 'completed_with_errors'
        
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': status,
                    'completed_at': datetime.utcnow(),
                    'total_records': total_rows,
                    'success_count': success_count,
                    'error_count': error_count,
                    'progress': 100
                }
            }
        )
        
        return {
            'status': status,
            'total': total_rows,
            'success': success_count,
            'errors': error_count,
            'error_messages': errors[:100]
        }
        
    except Exception as e:
        logger.error(f"Import {entity} failed: {str(e)}", exc_info=True)
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

@app.task(bind=True, name='tasks.generate_template')
def generate_template(self, job_id: str, shop: str, access_token: str, entity: str, format_type: str = 'csv'):
    """Generate empty template for entity"""
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        templates = {
            'products': [
                {'Handle': '', 'Title': '', 'Body (HTML)': '', 'Vendor': '', 'Product Type': '', 
                 'Tags': '', 'Published': 'TRUE', 'Variant SKU': '', 'Variant Price': '', 
                 'Variant Inventory Qty': '0', 'Image Src': '', 'Command': 'NEW'}
            ],
            'customers': [
                {'First Name': '', 'Last Name': '', 'Email': '', 'Company': '', 'Address1': '', 
                 'City': '', 'Province': '', 'Country': '', 'Zip': '', 'Phone': '', 
                 'Accepts Marketing': 'FALSE', 'Tags': '', 'Command': 'NEW'}
            ],
            'custom_collections': [
                {'Handle': '', 'Title': '', 'Body (HTML)': '', 'Published': 'TRUE', 
                 'Image Src': '', 'Command': 'NEW'}
            ],
            'smart_collections': [
                {'Handle': '', 'Title': '', 'Body (HTML)': '', 'Published': 'TRUE', 
                 'Rules': '', 'Image Src': '', 'Command': 'NEW'}
            ],
            'pages': [
                {'Title': '', 'Body (HTML)': '', 'Handle': '', 'Published': 'TRUE', 
                 'Template Suffix': '', 'Command': 'NEW'}
            ],
            'blog_posts': [
                {'Blog': '', 'Title': '', 'Body (HTML)': '', 'Author': '', 'Tags': '', 
                 'Published': 'TRUE', 'Published At': '', 'Command': 'NEW'}
            ],
            'redirects': [
                {'Path': '', 'Target': '', 'Command': 'NEW'}
            ],
            'draft_orders': [
                {'Email': '', 'Line Item Title': '', 'Line Item Quantity': '', 
                 'Line Item Price': '', 'Billing Address1': '', 'Billing City': '', 
                 'Billing Province': '', 'Billing Country': '', 'Billing Zip': '', 'Command': 'NEW'}
            ]
        }
        
        template_data = templates.get(entity, [{'Command': 'NEW'}])
        
        if format_type == 'xlsx':
            file_content = FileProcessor.write_excel(template_data)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            file_ext = 'xlsx'
        else:
            file_content = FileProcessor.write_csv(template_data)
            content_type = 'text/csv'
            file_ext = 'csv'
        
        filename = f"{entity}_template.{file_ext}"
        s3_key = f"templates/{shop}/{filename}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type
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
                    'filename': filename
                }
            }
        )
        
        return {'status': 'completed', 'file_url': file_url}
        
    except Exception as e:
        logger.error(f"Template generation failed: {str(e)}")
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

@app.task(bind=True, name='tasks.export_multi_entity')
def export_multi_entity(self, job_id: str, shop: str, access_token: str, entities: list, params: dict, format_type: str = 'xlsx'):
    """Export multiple entities to single Excel file with multiple sheets"""
    try:
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {'$set': {'status': 'processing', 'started_at': datetime.utcnow()}}
        )
        
        if format_type != 'xlsx':
            raise ValueError("Multi-entity export only supports Excel format")
        
        sheets_data = {}
        
        with EntityService(shop, access_token) as entity_service:
            for entity in entities:
                if entity not in ENTITY_METHODS:
                    continue
                
                self.update_state(state='PROGRESS', meta={'status': f'Fetching {entity}'})
                
                method_name = ENTITY_METHODS[entity]
                method = getattr(entity_service, method_name)
                data = method()
                
                sheets_data[entity] = data
        
        self.update_state(state='PROGRESS', meta={'status': 'Generating Excel file'})
        
        file_content = FileProcessor.write_multi_sheet_excel(sheets_data)
        
        filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        s3_key = f"exports/{shop}/{filename}"
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_content,
            ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
        file_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': s3_key},
            ExpiresIn=86400
        )
        
        total_records = sum(len(data) for data in sheets_data.values())
        
        mongodb.jobs.update_one(
            {'_id': ObjectId(job_id)},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow(),
                    'file_key': s3_key,
                    'file_url': file_url,
                    'filename': filename,
                    'total_records': total_records
                }
            }
        )
        
        return {'status': 'completed', 'file_url': file_url}
        
    except Exception as e:
        logger.error(f"Multi-entity export failed: {str(e)}")
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
