import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

app = Celery(
    'shopify_workers',
    broker=os.getenv('CELERY_BROKER', 'redis://localhost:6379/1'),
    backend=os.getenv('CELERY_BACKEND', 'redis://localhost:6379/2'),
    include=['tasks.export_tasks', 'tasks.import_tasks']
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3300,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

if __name__ == '__main__':
    app.start()
