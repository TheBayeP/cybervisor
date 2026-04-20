# CyberVisor

Plateforme de veille cybersécurité en temps réel pour les RSSI.

## Fonctionnalités

- **220+ Sources** — Flux RSS CERTs, blogs, vendeurs, threat intelligence mondial
- **CVE Tracking** — Intégration NVD avec CVSS, alertes sur exploitations actives
- **Brief RSSI IA** — Briefs exécutifs quotidiens à 8h et 14h via Claude AI
- **GRC & Conformité** — Veille réglementaire NIS2, RGPD, ISO 27001, TISAX, DORA
- **Alertes contextualisées** — Uniquement les alertes à impact réel (exploitations actives, CVE critiques grands éditeurs)
- **Interface bilingue** — Français et Anglais

## Tech Stack

- **Frontend** : Next.js 14, React, Tailwind CSS, Recharts
- **Backend** : Next.js API Routes, SQLite (better-sqlite3, mode WAL)
- **AI** : Claude Haiku (Anthropic API) — ~3€/mois
- **Data** : 220+ flux RSS, API NVD 2.0
- **Reverse proxy** : Caddy (HTTPS automatique via Let's Encrypt)

## Démarrage rapide (développement)

```bash
npm install
cp .env.example .env.local
# Éditer .env.local avec votre ANTHROPIC_API_KEY
npm run dev
```

Ouvrir http://localhost:3000

## Déploiement VPS (production HTTPS)

### Prérequis
- Ubuntu 22.04 / Debian 12
- 2 Go RAM, 2 vCPU, 20 Go stockage
- Node.js 20 LTS, PM2, Caddy

### Déploiement automatique

```bash
git clone https://github.com/thebayep/cybervisor.git
cd cybervisor
cp .env.example .env.local
# Ajouter ANTHROPIC_API_KEY dans .env.local
bash deploy.sh
```

Le script `deploy.sh` :
1. Installe Node.js 20, PM2, Caddy
2. Build l'application
3. Configure Caddy avec HTTPS automatique (Let's Encrypt)
4. Démarre l'application avec PM2 (restart auto si RAM > 512 Mo)
5. Configure PM2 au démarrage système

### Configuration Caddy (Caddyfile)

```caddy
cybervisor.prixy-mc.fr {
    reverse_proxy localhost:3000
    encode gzip
    header Strict-Transport-Security "max-age=31536000; includeSubDomains"
}
```

Caddy obtient et renouvelle automatiquement le certificat Let's Encrypt pour le domaine.

### Surveillance

```bash
# Statut de l'application
pm2 status

# Logs en temps réel
pm2 logs cybervisor

# Santé de l'application
curl https://cybervisor.prixy-mc.fr/api/health

# Restart manuel
pm2 restart cybervisor
```

### Endpoint de santé `/api/health`

Retourne l'état de la base de données, de la mémoire, du WAL SQLite et du scheduler :

```json
{
  "status": "ok",
  "uptime": 86400,
  "checks": {
    "database": { "ok": true, "detail": "45231 articles" },
    "wal": { "ok": true, "detail": "2.3MB" },
    "memory": { "ok": true, "detail": "RSS 180MB, Heap 120MB" },
    "scheduler": { "ok": true, "detail": "running" }
  }
}
```

## Configuration

Configurable via `.env.local` :

```env
ANTHROPIC_API_KEY=sk-ant-...
SMTP_HOST=smtp.example.com   # optionnel
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=cybervisor@example.com
```

## Licence

Privé — Tous droits réservés
