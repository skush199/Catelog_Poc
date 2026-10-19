# DigitalOcean Deployment

This folder contains a simple production deployment setup for `catalogai.indosakura.com`.

## Target shape

- Ubuntu droplet
- Nginx as reverse proxy
- Node app served by PM2
- App listens on `127.0.0.1:3001`
- Public site served at `https://catalogai.indosakura.com`

## One-time server prep

1. Copy the project to the server.
2. Install system packages and Node dependencies.
3. Build the frontend.
4. Start the app with PM2.
5. Enable the Nginx site.
6. Add TLS with Certbot.

## Required environment

Create `/var/www/catalogai/.env` with at least:

```env
OPENAI_API_KEY=your_key_here
PORT=3001
```

Optional:

```env
PDF_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium-browser
KANNADA_FONT_PATH=/var/www/catalogai/apps/api/assets/fonts/NotoSansKannada-Regular.ttf
HINDI_FONT_PATH=/var/www/catalogai/apps/api/assets/fonts/NotoSansDevanagari-Regular.ttf
```

## Server commands

From the server:

```bash
cd /var/www/catalogai
npm install
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
sudo cp deploy/catalogai.nginx.conf /etc/nginx/sites-available/catalogai
sudo ln -sf /etc/nginx/sites-available/catalogai /etc/nginx/sites-enabled/catalogai
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d catalogai.indosakura.com
```

## Notes

- The backend serves the built frontend from `apps/web/dist`.
- The app stores runtime files under `apps/api/data` and export files under `output/exports`.
- For translated PDF stability, the app now prefers the browser snapshot export path for translated catalogs.
