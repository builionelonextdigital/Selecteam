# 📦 Advanced Setup Guide

Hướng dẫn nâng cao cho các tùy chọn triển khai khác nhau.

## 🐳 Setup với Docker

### 1. Build Docker Image
```bash
docker build -t selecteam:latest .
```

### 2. Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  selecteam:latest
```

### 3. Docker Compose (All-in-one)
```bash
docker-compose up -d
```

Truy cập: `http://localhost:3000`

---

## ☁️ Deploy lên Heroku

### 1. Install Heroku CLI
```bash
curl https://cli.heroku.com/install.sh | sh
```

### 2. Login Heroku
```bash
heroku login
```

### 3. Create App
```bash
heroku create your-app-name
```

### 4. Set Environment Variables
```bash
heroku config:set DATABASE_URL="postgresql://..."
```

### 5. Deploy
```bash
git push heroku main
```

### 6. View Logs
```bash
heroku logs --tail
```

---

## 🚀 Deploy lên AWS

### Với EC2
```bash
# SSH vào server
ssh -i key.pem ec2-user@your-instance

# Clone repo
git clone https://github.com/your/repo.git
cd Selecteam

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install dependencies
npm install

# Start app
pm2 start server.js --name "selecteam"
pm2 startup
pm2 save
```

### Với Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Create app
eb init -p node.js selecteam
eb create selecteam-env
eb deploy
```

---

## 🔵 Deploy lên Azure

### Với App Service
```bash
# Install Azure CLI
curl https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name selecteam-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name selecteam-plan \
  --resource-group selecteam-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group selecteam-rg \
  --plan selecteam-plan \
  --name selecteam-app \
  --runtime "NODE|18.0"

# Deploy
az webapp deployment source config-zip \
  --resource-group selecteam-rg \
  --name selecteam-app \
  --src app.zip
```

---

## 🐧 Deploy lên DigitalOcean

### Với Droplet + PM2
```bash
# Create Droplet (Ubuntu 22.04)
# SSH vào droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Clone & setup
cd /var/www
git clone https://github.com/your/repo.git selecteam
cd selecteam
npm install

# Start app
pm2 start server.js --name selecteam
pm2 startup
pm2 save

# Setup Nginx
sudo nano /etc/nginx/sites-available/default
```

**Nginx config**:
```nginx
upstream selecteam {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://selecteam;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
# Test nginx
nginx -t

# Restart nginx
systemctl restart nginx

# Install SSL (Let's Encrypt)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 🌐 Deploy lên Google Cloud

### Với Cloud Run
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash

# Login
gcloud auth login

# Set project
gcloud config set project your-project-id

# Build & Deploy
gcloud run deploy selecteam \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Với Compute Engine
```bash
# Create instance
gcloud compute instances create selecteam-instance \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --machine-type=e2-micro \
  --zone=us-central1-a

# SSH to instance
gcloud compute ssh selecteam-instance --zone=us-central1-a

# Tương tự như DigitalOcean setup
```

---

## 📋 Production Checklist

- [ ] `.env` file configured
- [ ] Database URL set correctly
- [ ] Node.js version >= 14
- [ ] PORT environment variable set
- [ ] PM2/systemd configured for auto-restart
- [ ] Nginx/reverse proxy configured
- [ ] SSL certificate installed
- [ ] Database backups configured
- [ ] Monitoring/logging setup
- [ ] Rate limiting configured
- [ ] CORS configured if needed
- [ ] Error handling tested

---

## 🔒 Security

### Environment Variables
```bash
# Never commit .env
echo ".env" >> .gitignore

# Use strong database passwords
# Use environment-specific configs
```

### Database
```sql
-- Create user with limited permissions
CREATE ROLE selecteam_user WITH LOGIN PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE neondb TO selecteam_user;
GRANT USAGE ON SCHEMA public TO selecteam_user;
GRANT CREATE ON SCHEMA public TO selecteam_user;
```

### Nginx Security
```nginx
# Add headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 web              # Start web dashboard
pm2 monit            # Terminal monitoring
```

### Logs
```bash
pm2 logs selecteam              # View logs
pm2 logs selecteam --tail 50    # Last 50 lines
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔄 Backup & Restore

### Database Backup
```bash
# Backup
pg_dump postgresql://... > backup.sql

# Restore
psql postgresql://... < backup.sql
```

### Automated Backup (Cron)
```bash
# Add to crontab
0 2 * * * pg_dump $DATABASE_URL > /backups/selecteam-$(date +\%Y\%m\%d).sql
```

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Test connection
psql "postgresql://..."

# Check DNS
nslookup your-host.com
```

### PM2 Not Starting
```bash
pm2 delete all
pm2 start server.js
pm2 status
```

### Nginx Issues
```bash
nginx -t              # Test config
systemctl status nginx
journalctl -xe        # System logs
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs
2. Kiểm tra database connection
3. Kiểm tra environment variables
4. Kiểm tra firewall rules
5. Kiểm tra resource usage (CPU, memory)
