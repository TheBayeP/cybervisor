#!/bin/bash
# CyberVisor — Deployment Script
# Run on your Linux VPS (Ubuntu 22.04 / Debian 12)
# Usage: bash deploy.sh

set -e

DOMAIN="cybervisor.prixy-mc.fr"
APP_DIR="/opt/cybervisor"
NODE_VERSION="20"

echo "=== CyberVisor Deployment ==="
echo "Domain: $DOMAIN"
echo ""

# ---------------------------------------------------------------------------
# 1. Install Node.js (if not present)
# ---------------------------------------------------------------------------
if ! command -v node &> /dev/null; then
  echo "[1/6] Installing Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/6] Node.js already installed ($(node -v))"
fi

# ---------------------------------------------------------------------------
# 2. Install PM2 (if not present)
# ---------------------------------------------------------------------------
if ! command -v pm2 &> /dev/null; then
  echo "[2/6] Installing PM2..."
  sudo npm install -g pm2
else
  echo "[2/6] PM2 already installed ($(pm2 -v))"
fi

# ---------------------------------------------------------------------------
# 3. Install Caddy (if not present)
# ---------------------------------------------------------------------------
if ! command -v caddy &> /dev/null; then
  echo "[3/6] Installing Caddy..."
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install -y caddy
else
  echo "[3/6] Caddy already installed ($(caddy version))"
fi

# ---------------------------------------------------------------------------
# 4. Deploy application
# ---------------------------------------------------------------------------
echo "[4/6] Deploying application to $APP_DIR..."
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$APP_DIR/data"

# Copy files (assumes you are in repo root)
sudo rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' \
  --exclude='data' . "$APP_DIR/"

cd "$APP_DIR"
sudo npm ci --production=false
sudo npm run build

# ---------------------------------------------------------------------------
# 5. Configure Caddy
# ---------------------------------------------------------------------------
echo "[5/6] Configuring Caddy..."
sudo mkdir -p /var/log/caddy
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl restart caddy

echo "   Waiting for Caddy to obtain Let's Encrypt certificate..."
sleep 5
echo "   Caddy status: $(sudo systemctl is-active caddy)"

# ---------------------------------------------------------------------------
# 6. Start/Restart application with PM2
# ---------------------------------------------------------------------------
echo "[6/6] Starting CyberVisor with PM2..."
cd "$APP_DIR"

# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cybervisor',
    script: 'npm',
    args: 'start',
    cwd: '/opt/cybervisor',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '512M',   // Auto-restart if RAM > 512MB
    exp_backoff_restart_delay: 100,
    watch: false,
    error_file: '/var/log/cybervisor/error.log',
    out_file: '/var/log/cybervisor/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
EOF

sudo mkdir -p /var/log/cybervisor
pm2 delete cybervisor 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash

echo ""
echo "=== Deployment Complete ==="
echo "  App:    https://$DOMAIN"
echo "  Health: https://$DOMAIN/api/health"
echo "  Logs:   pm2 logs cybervisor"
echo "  Status: pm2 status"
echo ""
echo "IMPORTANT: Make sure your .env.local is in $APP_DIR/ with ANTHROPIC_API_KEY set"
