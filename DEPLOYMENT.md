# Deployment Guide for CalendarInbox Pro

## Quick Start

### Development Environment

1. **Install Dependencies**
```bash
npm install
# or
bun install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Development Server**
```bash
npm run dev
# This starts both frontend (port 3002) and backend (port 3001)
```

## Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### Prerequisites
- Node.js >= 18.0.0
- Nginx (recommended as reverse proxy)
- SSL certificate (Let's Encrypt recommended)
- Systemd (for process management)

#### Steps

1. **Clone and Build**
```bash
git clone <your-repo>
cd calendarinbox
npm install
npm run build
npm run build:backend
```

2. **Configure Production Environment**
```bash
# Create production .env
cat > .env << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PATH=/var/lib/calendarinbox/calendar.db
FRONTEND_URL=https://yourdomain.com
EOF
```

3. **Create Systemd Service**
```bash
sudo nano /etc/systemd/system/calendarinbox.service
```

```ini
[Unit]
Description=CalendarInbox Pro
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/calendarinbox
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

4. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Serve static files
    location / {
        root /path/to/calendarinbox/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
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
```

5. **Start Services**
```bash
sudo systemctl enable calendarinbox
sudo systemctl start calendarinbox
sudo systemctl reload nginx
```

### Option 2: Docker Deployment

**Dockerfile** (already created):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build && npm run build:backend

EXPOSE 3001

CMD ["node", "dist/server/index.js"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_PATH=/data/calendar.db
    volumes:
      - ./data:/data
    restart: unless-stopped
```

**Deploy**:
```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Vercel (Frontend + Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables in Vercel dashboard

#### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

#### Heroku
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
git push heroku main
```

## Database Backups

### Automated Backup Script
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/calendarinbox"
DB_PATH="/var/lib/calendarinbox/calendar.db"

mkdir -p $BACKUP_DIR

# Create backup
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/calendar_$DATE.db'"

# Compress
gzip "$BACKUP_DIR/calendar_$DATE.db"

# Delete backups older than 30 days
find $BACKUP_DIR -name "calendar_*.db.gz" -mtime +30 -delete

echo "Backup completed: calendar_$DATE.db.gz"
```

**Schedule with Cron**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-db.sh
```

## Monitoring

### Health Check Endpoint
```bash
# Check if service is running
curl http://localhost:3001/health
```

### PM2 Process Manager (Alternative to Systemd)
```bash
npm install -g pm2

# Start
pm2 start dist/server/index.js --name calendarinbox

# Monitor
pm2 monit

# Logs
pm2 logs calendarinbox

# Restart
pm2 restart calendarinbox

# Save process list
pm2 save

# Startup script
pm2 startup
```

## Performance Optimization

### 1. Enable Compression
```javascript
// In server/index.ts
import compression from 'compression';
app.use(compression());
```

### 2. Add Redis for Caching
```bash
npm install redis

# In your service
import { createClient } from 'redis';
const redis = createClient();
```

### 3. Database Optimization
```sql
-- Run periodically
VACUUM;
ANALYZE;
```

### 4. CDN for Static Assets
- Use Cloudflare, AWS CloudFront, or similar
- Serve static files from CDN
- Cache API responses where appropriate

## Security Hardening

### 1. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban
```bash
sudo apt install fail2ban

# Configure /etc/fail2ban/jail.local
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

### 3. Regular Updates
```bash
# System
sudo apt update && sudo apt upgrade

# Dependencies
npm audit fix
npm outdated
```

### 4. SSL/TLS Configuration
- Use TLS 1.2+
- Strong cipher suites
- HSTS headers
- Certificate renewal automation

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
journalctl -u calendarinbox -n 50 -f

# Check port
lsof -i :3001

# Check database permissions
ls -la data/
```

### Database Locked
```bash
# Check for zombie processes
ps aux | grep node

# If necessary, backup and recreate
sqlite3 calendar.db ".backup backup.db"
```

### High Memory Usage
```bash
# Monitor
top -p $(pgrep -f "node.*calendarinbox")

# Restart service
sudo systemctl restart calendarinbox
```

## Scaling

### Horizontal Scaling
1. **Load Balancer**: Nginx, HAProxy, or cloud LB
2. **Database**: Consider PostgreSQL for multi-instance
3. **Session Storage**: Use Redis for shared sessions
4. **File Storage**: S3 or similar for attachments

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add database indexes
- Enable caching

## Maintenance Windows

Schedule regular maintenance:
1. **Weekly**: Review logs, check disk space
2. **Monthly**: Update dependencies, review security advisories
3. **Quarterly**: Database optimization, backup testing
4. **Yearly**: Security audit, performance review

## Contact & Support

- **Issues**: https://github.com/zodiesel21011-cmd/calendarinbox/issues
- **Email**: support@calendarinbox.pro
- **Documentation**: See README.md

---

Last updated: 2024-10-17
