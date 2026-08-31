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

# 1. Clean up duplicate Nginx configs
echo "🌐 Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf
sudo cp "$APP_DIR/aws/nginx/customer-report.conf" /etc/nginx/sites-available/customer-report
sudo ln -sf /etc/nginx/sites-available/customer-report /etc/nginx/sites-enabled/customer-report
sudo nginx -t
sudo systemctl restart nginx
echo "✅ Nginx restarted."

# 2. Clean restart PM2 backend
echo "⚡ Restarting PM2 backend..."
mkdir -p "$APP_DIR/logs"
pm2 delete all || true
pm2 start "$APP_DIR/aws/pm2/ecosystem.config.js" --env production --update-env
pm2 save
sleep 2

# 3. Test Local Backend
echo -e "\n🩺 Testing Local Backend on Port 5000..."
curl -s http://127.0.0.1:5000/api/health || echo "⚠️ Backend on port 5000 did not respond."

echo -e "\n=========================================================="
echo "🎉 REPAIR COMPLETE!"
echo "📡 PM2 Status:"
pm2 status
echo "=========================================================="
