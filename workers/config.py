import os
from pymongo import MongoClient
import boto3
import redis

mongodb_client = MongoClient(os.getenv('MONGODB_URI'))
mongodb = mongodb_client[os.getenv('MONGODB_DATABASE', 'shopify_bulk_manager')]

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_S3_REGION', 'us-east-1')
)

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD', None),
    db=0,
    decode_responses=True
)

S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'shopify-bulk-manager')
SHOPIFY_API_VERSION = os.getenv('SHOPIFY_API_VERSION', '2025-10')
