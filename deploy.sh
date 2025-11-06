#!/bin/bash

# AI Travel Planner - Deployment Script
# This script automates the deployment process to a fresh server

set -e  # Exit on any error

echo "🚀 AI Travel Planner Deployment Script"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
else
    echo "Node.js already installed"
fi

echo -e "${GREEN}Step 3: Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "PostgreSQL already installed"
fi

echo -e "${GREEN}Step 4: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "Nginx already installed"
fi

echo -e "${GREEN}Step 5: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2 already installed"
fi

echo -e "${GREEN}Step 6: Setting up PostgreSQL database...${NC}"
read -p "Enter database name (default: ai_travel): " DB_NAME
DB_NAME=${DB_NAME:-ai_travel}

read -p "Enter database user (default: ai_travel_user): " DB_USER
DB_USER=${DB_USER:-ai_travel_user}

read -sp "Enter database password: " DB_PASSWORD
echo ""

sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF

echo -e "${GREEN}Database created successfully!${NC}"

echo -e "${GREEN}Step 7: Setting up application directory...${NC}"
APP_DIR="/var/www/ai-travel"
mkdir -p ${APP_DIR}
cd ${APP_DIR}

echo -e "${GREEN}Step 8: Cloning repository...${NC}"
read -p "Enter Git repository URL: " REPO_URL
if [ -d ".git" ]; then
    echo "Repository already cloned, pulling latest changes..."
    git pull
else
    git clone ${REPO_URL} .
fi

echo -e "${GREEN}Step 9: Installing dependencies...${NC}"
npm install

echo -e "${GREEN}Step 10: Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your configuration:${NC}"
    echo "nano .env"
    read -p "Press enter after you've configured .env..."
fi

echo -e "${GREEN}Step 11: Setting up database schema...${NC}"
PGPASSWORD=${DB_PASSWORD} psql -h localhost -U ${DB_USER} -d ${DB_NAME} < lib/db/schema.sql

echo -e "${GREEN}Step 12: Building application...${NC}"
npm run build

echo -e "${GREEN}Step 13: Setting up PM2...${NC}"
pm2 delete ai-travel 2>/dev/null || true
pm2 start npm --name "ai-travel" -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}Step 14: Configuring Nginx...${NC}"
read -p "Enter your domain name: " DOMAIN

cat > /etc/nginx/sites-available/ai-travel <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ai-travel /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo -e "${GREEN}Step 15: Setting up SSL with Let's Encrypt...${NC}"
read -p "Do you want to set up SSL now? (y/n): " SETUP_SSL
if [ "$SETUP_SSL" = "y" ]; then
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}
fi

echo -e "${GREEN}Step 16: Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your application is now running at:"
echo "  http://${DOMAIN}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check app status"
echo "  pm2 logs ai-travel      - View logs"
echo "  pm2 restart ai-travel   - Restart app"
echo "  pm2 monit               - Monitor resources"
echo ""
echo "Admin dashboard: http://${DOMAIN}/admin"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  1. Configure Supabase with your production URL"
echo "  2. Add your AI API keys to .env"
echo "  3. Set up Stripe webhooks if using payments"
echo "  4. Configure your DNS records"
echo ""
