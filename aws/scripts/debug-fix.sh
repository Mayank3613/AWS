#!/usr/bin/env bash
# ==============================================================================
# Definitive One-Shot Fix for Nginx and Backend
# ==============================================================================

set -e

APP_DIR="/home/ubuntu/Customer-Report-System-AWS"
if [ ! -d "$APP_DIR" ]; then
    APP_DIR="$(pwd)"
fi

echo "=========================================================="
echo "🚀 Applying Definitive Nginx & PM2 Fix..."
echo "=========================================================="

cd "$APP_DIR"

# 1. Ensure Frontend Build Exists
if [ ! -d "$APP_DIR/client/build" ]; then
    echo "⚛️ Building Frontend..."
    cd "$APP_DIR/client"
    export NODE_OPTIONS="--max-old-space-size=1536"
    npm run build
    cd "$APP_DIR"
fi

# 2. Overwrite Nginx Configuration Cleanly in conf.d
echo "🌐 Resetting Nginx..."
sudo rm -rf /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*

sudo tee /etc/nginx/conf.d/customer_report.conf > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

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

sudo nginx -t
sudo systemctl restart nginx
echo "✅ Nginx is active on port 80."

# 3. Clean Restart PM2 Backend
echo "⚡ Starting backend with PM2..."
pm2 delete all || true
pm2 start server.js --name "customer-report-api" --update-env
pm2 save

sleep 3

# 4. Test Health Check
echo -e "\n=========================================================="
echo "🩺 Testing Backend API on Port 5000:"
curl -s http://127.0.0.1:5000/api/health || echo "Direct 5000 check failed."

echo -e "\n\n🌐 Testing Through Nginx Reverse Proxy on Port 80:"
curl -s http://127.0.0.1:80/api/health || echo "Nginx port 80 check failed."

echo -e "\n=========================================================="
echo "🎉 SUCCESS! Check PM2 Status:"
pm2 status
echo "=========================================================="
