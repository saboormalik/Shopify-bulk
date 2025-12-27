#!/bin/bash

echo "===================================="
echo "Deploying Shopify Bulk Manager"
echo "===================================="

APP_DIR="/var/www/shopify-bulk-manager"

cd $APP_DIR || exit

echo "Pulling latest code..."
git pull origin main

echo "Installing PHP dependencies..."
cd backend
composer install --no-dev --optimize-autoloader
cd ..

echo "Installing Python dependencies..."
cd workers
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd ..

echo "Building shopify-app frontend..."
cd shopify-app
npm install
npm run build
cd ..

echo "Building admin-portal frontend..."
cd admin-portal
npm install
npm run build
cd ..

echo "Setting permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

echo "Restarting services..."
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
sudo supervisorctl restart celery-worker
sudo supervisorctl restart celery-beat

echo "===================================="
echo "Deployment complete!"
echo "===================================="
