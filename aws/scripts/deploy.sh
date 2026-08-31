#!/usr/bin/env bash
# ==============================================================================
# Customer Report System - One-Command Deployment Script for AWS EC2
# ==============================================================================

set -e

APP_DIR="/home/ubuntu/Customer-Report-System-AWS"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="$(pwd)"
fi

echo "=========================================================="
echo "🚀 Deploying Customer Report System in: $APP_DIR"
echo "=========================================================="

cd "$APP_DIR"

# 1. Check & Setup .env file
if [ ! -f "$APP_DIR/.env" ]; then
    echo "📝 Creating .env from .env.production template..."
    cp "$APP_DIR/.env.production" "$APP_DIR/.env"
fi

# 2. Install Backend Dependencies
echo "📦 Installing Backend Dependencies..."
npm install --production=false

# 3. Install Frontend Dependencies & Build React App
echo "⚛️ Building Frontend (React Production Bundle)..."
cd "$APP_DIR/client"
# Set memory flag for low-RAM instances
export NODE_OPTIONS="--max-old-space-size=1536"
npm install --legacy-peer-deps
npm run build
cd "$APP_DIR"

# 4. Seed Initial Database (if needed)
echo "🍃 Seeding Initial Database Records..."
node seed.js || true

# 5. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx Site..."
sudo cp "$APP_DIR/aws/nginx/customer-report.conf" /etc/nginx/sites-available/customer-report
sudo ln -sf /etc/nginx/sites-available/customer-report /etc/nginx/sites-enabled/
# Remove default Nginx welcome page if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx Config
sudo nginx -t
sudo systemctl reload nginx
echo "✅ Nginx reloaded successfully."

# 6. Start / Reload Backend using PM2
echo "⚡ Starting/Reloading PM2 Process Manager..."
mkdir -p "$APP_DIR/logs"
pm2 startOrReload "$APP_DIR/aws/pm2/ecosystem.config.js" --env production
pm2 save

echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📡 Check application status with: pm2 status"
echo "📋 View logs with: pm2 logs customer-report-api"
echo "🌍 Open your browser and navigate to: http://<YOUR_EC2_PUBLIC_IP>"
echo "🩺 Health Check: http://<YOUR_EC2_PUBLIC_IP>/api/health"
echo "=========================================================="
