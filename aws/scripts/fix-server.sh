#!/usr/bin/env bash
# ==============================================================================
# Quick Diagnostic & Repair Script for EC2 Nginx & PM2 Backend
# ==============================================================================

set -e

APP_DIR="/home/ubuntu/Customer-Report-System-AWS"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="$(pwd)"
fi

echo "=========================================================="
echo "🔧 Running EC2 Nginx & Backend Diagnostic and Repair..."
echo "=========================================================="

cd "$APP_DIR"

# 1. Ensure Dependencies are installed
echo "📦 Checking dependencies..."
npm install --production=false

# 2. Build Frontend
echo "⚛️ Building Frontend..."
cd "$APP_DIR/client"
export NODE_OPTIONS="--max-old-space-size=1536"
npm install --legacy-peer-deps
npm run build
cd "$APP_DIR"

# 3. Remove default Nginx site and configure reverse proxy
echo "🌐 Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf
sudo cp "$APP_DIR/aws/nginx/customer-report.conf" /etc/nginx/sites-available/customer-report
sudo ln -sf /etc/nginx/sites-available/customer-report /etc/nginx/sites-enabled/customer-report
sudo cp "$APP_DIR/aws/nginx/customer-report.conf" /etc/nginx/conf.d/customer-report.conf
sudo nginx -t
sudo systemctl restart nginx
echo "✅ Nginx restarted."

# 4. Clean restart PM2 backend
echo "⚡ Restarting PM2 backend..."
mkdir -p "$APP_DIR/logs"
pm2 delete all || true
pm2 start "$APP_DIR/aws/pm2/ecosystem.config.js" --env production --update-env
pm2 save
sleep 2

# 5. Test Local Backend
echo -e "\n🩺 Testing Local Backend on Port 5000..."
curl -s http://127.0.0.1:5000/api/health || echo "⚠️ Backend on port 5000 did not respond."

echo -e "\n=========================================================="
echo "🎉 REPAIR COMPLETE!"
echo "📡 PM2 Status:"
pm2 status
echo -e "\n📋 Recent PM2 Logs:"
pm2 logs customer-report-api --lines 15 --nostream || true
echo "=========================================================="
