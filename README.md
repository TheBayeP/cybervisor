# CyberVisor

Real-time cybersecurity monitoring platform for CISOs and security administrators.

## Features

- **220+ Sources** - RSS feeds from CERTs, security blogs, vendors, and threat intelligence worldwide
- **CVE Tracking** - Automatic NVD integration with CVSS scoring and critical alerts (9.0+)
- **AI Synthesis** - Daily RSSI briefs at 8:00 and 14:00 powered by Claude AI
- **Dashboard** - Visual charts, severity distribution, CVSS histogram, timeline
- **Multilingual** - Full French and English support
- **Dark/Light Theme** - Modern SOC-style interface
- **Email Alerts** - Notifications for critical CVEs and major attacks
- **Export** - CSV export for articles, CVEs, and alerts

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, SQLite (sql.js)
- **AI**: Claude Haiku (Anthropic API) - under 3€/month
- **Data**: 220+ RSS sources, NVD API 2.0

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000

## VPS Deployment

### Prerequisites
- Ubuntu 22.04 / Debian 12
- 2 GB RAM, 2 vCPU, 20 GB storage
- Node.js 20 LTS, nginx, PM2, certbot

### Deploy
```bash
git clone https://github.com/thebayep/cybervisor.git
cd cybervisor
npm install
npm run build
pm2 start npm --name cybervisor -- start
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configuration

Settings are managed via the web interface at `/settings`:
- Claude API key
- SMTP email configuration
- Language (FR/EN)
- Theme (Dark/Light)

## License

Private - All rights reserved
