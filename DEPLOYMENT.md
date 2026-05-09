# Deployment Guide

This guide covers deployment options for the AI-Powered Stock Intelligence Platform (ASIP).

---

## 🏠 Local Development

Already covered in [README.md](README.md). Quick start:

```bash
./run.sh
```

---

## ☁️ Cloud Deployment Options

### 1. Heroku (Recommended for Quick Deploy)

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Setup Files

**`Procfile`** (create in root):
```
web: sh -c 'cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT & cd frontend && streamlit run app.py --server.port 8501'
```

**`runtime.txt`**:
```
python-3.12.0
```

#### Deployment Steps

```bash
# Login to Heroku
heroku login

# Create app
heroku create asip-stock-intelligence

# Set environment variables
heroku config:set GEMINI_API_KEY=your_api_key_here

# Deploy
git push heroku main

# Open app
heroku open
```

#### Configuration
```bash
# Scale dynos
heroku ps:scale web=1

# View logs
heroku logs --tail

# Set custom domain (optional)
heroku domains:add www.yourdomain.com
```

---

### 2. AWS (Production-Grade)

#### Architecture
```
┌─────────────────────────────────────────┐
│         Application Load Balancer        │
│         (with SSL certificate)          │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼────┐
│  EC2   │      │   EC2   │
│Backend │      │Frontend │
│(FastAPI│      │(Streamlit│
└────────┘      └─────────┘
```

#### EC2 Deployment

**1. Launch EC2 Instance**
- AMI: Ubuntu 22.04 LTS
- Instance Type: t2.medium (or larger)
- Security Group: Allow ports 8000, 8501, 80, 443

**2. SSH and Setup**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.12
sudo apt install python3.12 python3.12-venv -y

# Clone repo
git clone https://github.com/yourusername/asip-stock-intelligence.git
cd asip-stock-intelligence

# Setup environment
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
echo "GEMINI_API_KEY=your_key" > .env
```

**3. Run with systemd**

Create `/etc/systemd/system/asip-backend.service`:
```ini
[Unit]
Description=ASIP Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/asip-stock-intelligence/backend
Environment="PATH=/home/ubuntu/asip-stock-intelligence/venv/bin"
ExecStart=/home/ubuntu/asip-stock-intelligence/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/asip-frontend.service`:
```ini
[Unit]
Description=ASIP Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/asip-stock-intelligence/frontend
Environment="PATH=/home/ubuntu/asip-stock-intelligence/venv/bin"
ExecStart=/home/ubuntu/asip-stock-intelligence/venv/bin/streamlit run app.py --server.port 8501 --server.address 0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
```

**4. Enable and Start**
```bash
sudo systemctl daemon-reload
sudo systemctl enable asip-backend asip-frontend
sudo systemctl start asip-backend asip-frontend
sudo systemctl status asip-backend asip-frontend
```

**5. Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 3. Docker Deployment

#### Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY frontend/ .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.port", "8501", "--server.address", "0.0.0.0"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: always

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "8501:8501"
    depends_on:
      - backend
    restart: always
```

#### Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

### 4. Google Cloud Platform (GCP)

#### Cloud Run Deployment

**1. Build and Push Images**
```bash
# Build
gcloud builds submit --tag gcr.io/your-project/asip-backend backend/
gcloud builds submit --tag gcr.io/your-project/asip-frontend frontend/

# Deploy
gcloud run deploy asip-backend \
  --image gcr.io/your-project/asip-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_key

gcloud run deploy asip-frontend \
  --image gcr.io/your-project/asip-frontend \
  --platform managed \
  --region us-central1
```

---

### 5. Azure

#### Azure App Service

```bash
# Login
az login

# Create resource group
az group create --name asip-rg --location eastus

# Create app service plan
az appservice plan create --name asip-plan --resource-group asip-rg --sku B1 --is-linux

# Create web apps
az webapp create --resource-group asip-rg --plan asip-plan --name asip-backend --runtime "PYTHON:3.12"
az webapp create --resource-group asip-rg --plan asip-plan --name asip-frontend --runtime "PYTHON:3.12"

# Configure
az webapp config appsettings set --resource-group asip-rg --name asip-backend --settings GEMINI_API_KEY=your_key

# Deploy
az webapp up --resource-group asip-rg --name asip-backend --src-path ./backend
az webapp up --resource-group asip-rg --name asip-frontend --src-path ./frontend
```

---

## 🔒 Production Checklist

### Security
- [ ] Use HTTPS (SSL certificate)
- [ ] Set strong environment variables
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Set up authentication (if needed)
- [ ] Configure firewall rules
- [ ] Regular security updates

### Performance
- [ ] Enable caching (Redis)
- [ ] Use CDN for static assets
- [ ] Optimize database queries
- [ ] Set up load balancing
- [ ] Monitor resource usage

### Monitoring
- [ ] Set up logging (CloudWatch, Datadog)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Uptime monitoring (Pingdom)
- [ ] Set up alerts

### Backup & Recovery
- [ ] Database backups
- [ ] Code repository backups
- [ ] Environment variables backup
- [ ] Disaster recovery plan
- [ ] Regular testing

---

## 📊 Cost Estimates

### Heroku
- **Free Tier**: $0/month (limited hours)
- **Hobby**: $7-14/month
- **Professional**: $25-50/month

### AWS EC2
- **t2.micro**: ~$8-10/month (free tier eligible)
- **t2.medium**: ~$35-40/month
- **Load Balancer**: ~$20/month

### GCP Cloud Run
- **Pay-per-use**: ~$5-20/month (depending on traffic)

### Docker + VPS (DigitalOcean)
- **Basic Droplet**: $6-12/month
- **Production**: $24-48/month

---

## 🚀 CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run tests
        run: pytest tests/
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "asip-stock-intelligence"
          heroku_email: ${{secrets.HEROKU_EMAIL}}
```

---

## 🔧 Environment Variables

Required for all deployments:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
BACKEND_URL=http://localhost:8000  # Update for production
ENVIRONMENT=production
LOG_LEVEL=INFO
```

Optional:
```bash
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@host:5432/db
SENTRY_DSN=your_sentry_dsn
```

---

## 📈 Scaling Strategies

### Horizontal Scaling
- Load balancer + multiple instances
- Database replication
- Caching layer (Redis)

### Vertical Scaling
- Increase CPU/RAM
- Optimize code
- Database indexing

### Auto-scaling
- AWS Auto Scaling Groups
- GCP Managed Instance Groups
- Kubernetes HPA

---

## 🆘 Troubleshooting

### Common Issues

**1. Port conflicts**
```bash
# Check what's using ports
lsof -i :8000
lsof -i :8501

# Kill process
kill -9 PID
```

**2. Environment variables not loading**
```bash
# Check if .env exists
ls -la .env

# Manually export
export GEMINI_API_KEY=your_key
```

**3. Memory issues**
```bash
# Check memory usage
free -h

# Increase swap (Linux)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📚 Additional Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Streamlit Deployment](https://docs.streamlit.io/streamlit-community-cloud/get-started/deploy-an-app)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

*Last updated: 2024*
