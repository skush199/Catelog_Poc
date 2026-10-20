#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/catalogai"

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx ca-certificates curl git build-essential

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

if ! command -v chromium-browser >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1; then
  sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "Server packages installed."
echo "Next steps:"
echo "1. Copy the project into $APP_DIR"
echo "2. Create $APP_DIR/.env"
echo "3. Run: cd $APP_DIR && npm install && npm run build"
echo "4. Run: pm2 start deploy/ecosystem.config.cjs && pm2 save"
echo "5. Copy deploy/catalogai.nginx.conf into /etc/nginx/sites-available/catalogai"
