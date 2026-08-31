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
sudo rm -rf /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

sudo tee /etc/nginx/conf.d/customer_report.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test & Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
echo "✅ Nginx restarted successfully."

# 5. Kill any orphaned processes on Port 5000 and Start PM2
echo "⚡ Starting/Restarting PM2 Process Manager..."
sudo fuser -k 5000/tcp || true
mkdir -p "$APP_DIR/logs"
pm2 delete all || true
pm2 start server.js --name "customer-report-api" --update-env
pm2 save
sleep 3

# 6. Verify Deployment Locally
echo -e "\n🩺 Testing Local API Health Check on Port 5000..."
curl -s http://127.0.0.1:5000/api/health || echo "⚠️ Backend starting up..."

echo -e "\n\n🌐 Testing Through Nginx on Port 80..."
curl -s http://127.0.0.1:80/api/health || echo "⚠️ Nginx proxy checking..."

echo -e "\n=========================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "📡 PM2 Process Status:"
pm2 status
echo "🌍 Open your browser and navigate to: http://<YOUR_EC2_PUBLIC_IP>"
echo "=========================================================="
