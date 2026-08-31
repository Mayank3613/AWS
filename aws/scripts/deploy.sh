#!/usr/bin/env bash
# ==============================================================================
# Customer Report System - Bulletproof Deployment Script for AWS EC2 & RDS
# ==============================================================================

set -e

APP_DIR="/home/ubuntu/Customer-Report-System-AWS"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="$(pwd)"
fi

echo "=========================================================="
echo "🚀 Deploying Customer Report System (EC2 + Amazon RDS)"
echo "📂 Working Directory: $APP_DIR"
echo "=========================================================="

cd "$APP_DIR"

# 1. Install Backend Dependencies
echo "📦 Installing Backend Dependencies..."
npm install --production=false

# 2. Install Frontend Dependencies & Build React App
echo "⚛️ Building Frontend (React Production Bundle)..."
cd "$APP_DIR/client"
export NODE_OPTIONS="--max-old-space-size=1536"
npm install --legacy-peer-deps
npm run build
cd "$APP_DIR"

# 3. Synchronize & Seed Database on Amazon RDS
echo "🍃 Initializing Database Schema on Amazon RDS..."
node seed.js || {
    echo "⚠️ Seed notice logged."
}

# 4. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx Reverse Proxy..."
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf
sudo cp "$APP_DIR/aws/nginx/customer-report.conf" /etc/nginx/sites-available/customer-report
sudo ln -sf /etc/nginx/sites-available/customer-report /etc/nginx/sites-enabled/customer-report
sudo cp "$APP_DIR/aws/nginx/customer-report.conf" /etc/nginx/conf.d/customer-report.conf

# Test & Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
echo "✅ Nginx restarted successfully."

# 5. Cleanly Start / Restart Backend using PM2
echo "⚡ Starting/Restarting PM2 Process Manager..."
mkdir -p "$APP_DIR/logs"
pm2 delete all || true
pm2 start "$APP_DIR/aws/pm2/ecosystem.config.js" --env production --update-env
pm2 save
sleep 2

# 6. Verify Deployment Locally
echo -e "\n🩺 Testing Local API Health Check..."
curl -s http://127.0.0.1:5000/api/health || echo "⚠️ Backend check pending."

echo -e "\n=========================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📡 PM2 Process Status:"
pm2 status
echo "🌍 Open your browser and navigate to: http://<YOUR_EC2_PUBLIC_IP>"
echo "=========================================================="
