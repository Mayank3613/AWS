#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 Automated Provisioning Script (Ubuntu 24.04 / 22.04 LTS)
# Configured for Amazon AWS RDS (PostgreSQL / MySQL) & EC2
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 Starting AWS EC2 Setup for Customer Report System"
echo "🗄️ Database Backend: Amazon AWS RDS"
echo "=========================================================="

# 1. Update and Upgrade System Packages
echo "🔄 Updating package lists..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git gnupg lsb-release ufw build-essential postgresql-client mysql-client

# 2. Configure 2GB Swap Memory (CRITICAL for t2.micro / t3.micro 1GB RAM)
# Prevents 'JavaScript heap out of memory' crashes during React production build
echo "💾 Configuring 2GB Swap Memory..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap memory enabled: 2GB"
else
    echo "ℹ️ Swapfile already exists."
fi

# 3. Install Node.js (v20 LTS) & NPM
echo "📦 Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "✅ Node.js Version: $(node -v)"
echo "✅ NPM Version: $(npm -v)"

# 4. Install PM2 Globally
echo "⚡ Installing PM2 Process Manager..."
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

# 5. Install & Configure Nginx Web Server
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 6. Configure Host Firewall (UFW)
echo "🛡️ Configuring UFW Security Rules..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo "y" | sudo ufw enable
sudo ufw status

echo "=========================================================="
echo "🎉 EC2 Server Provisioning Completed Successfully!"
echo "Next Steps:"
echo "1. Configure your Amazon RDS Endpoint credentials in .env"
echo "2. Run ./aws/scripts/deploy.sh to deploy the application"
echo "=========================================================="
