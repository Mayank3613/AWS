#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 Automated Provisioning Script (Ubuntu 24.04 / 22.04 LTS)
# For Customer Report & Insight System
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

echo "=========================================================="
echo "🚀 Starting AWS EC2 Setup for Customer Report System"
echo "=========================================================="

# 1. Update and Upgrade System Packages
echo "🔄 Updating package lists..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git gnupg lsb-release ufw build-essential

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

# 5. Install MongoDB Community Edition (Self-hosted on EC2 - 100% Free)
echo "🍃 Installing MongoDB Community Edition..."
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor --yes

# Support Ubuntu Noble (24.04) and Jammy (22.04)
UBUNTU_CODENAME=$(lsb_release -cs)
if [ "$UBUNTU_CODENAME" = "noble" ]; then
    UBUNTU_CODENAME="jammy" # MongoDB 7.0 uses jammy repository
fi

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt-get update -y
sudo apt-get install -y mongodb-org || {
    echo "⚠️ Falling back to system default mongodb..."
    sudo apt-get install -y mongodb || true
}

# Start and Enable MongoDB
sudo systemctl daemon-reload
sudo systemctl enable mongod || sudo systemctl enable mongodb
sudo systemctl start mongod || sudo systemctl start mongodb
echo "✅ MongoDB service active and enabled."

# 6. Install & Configure Nginx Web Server
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 7. Configure Host Firewall (UFW)
echo "🛡️ Configuring UFW Security Rules..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
echo "y" | sudo ufw enable
sudo ufw status

echo "=========================================================="
echo "🎉 EC2 Server Setup Completed Successfully!"
echo "Next Step: Run ./aws/scripts/deploy.sh to deploy the application"
echo "=========================================================="
