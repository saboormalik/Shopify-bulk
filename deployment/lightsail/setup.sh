#!/bin/bash

echo "===================================="
echo "Shopify Bulk Manager - Server Setup"
echo "===================================="

sudo apt update && sudo apt upgrade -y

echo "Installing PHP 8.2 and extensions..."
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
    php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath \
    php8.2-mongodb php8.2-redis

echo "Installing Nginx..."
sudo apt install -y nginx

echo "Installing Redis..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

echo "Installing Python 3.11 and pip..."
sudo apt install -y python3.11 python3.11-venv python3-pip

echo "Installing Supervisor..."
sudo apt install -y supervisor

echo "Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

echo "Creating application directory..."
sudo mkdir -p /var/www/shopify-bulk-manager
sudo chown -R $USER:www-data /var/www/shopify-bulk-manager

echo "Creating log directories..."
sudo mkdir -p /var/log/celery
sudo chown -R www-data:www-data /var/log/celery

echo "===================================="
echo "Server setup complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Upload your application code to /var/www/shopify-bulk-manager"
echo "2. Configure environment variables"
echo "3. Install dependencies (composer install, npm install)"
echo "4. Configure Nginx and Supervisor"
echo "5. Obtain SSL certificates"
