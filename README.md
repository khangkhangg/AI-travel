# AI Travel Planner

An intelligent, social travel planning platform powered by multiple AI models. Generate personalized travel itineraries, collaborate with friends, vote on activities, and discover amazing trips created by the community.

## Features

### Core Features
- **AI-Powered Itinerary Generation**: Use 10+ AI models including OpenAI GPT-4, Claude, Gemini, and Chinese models (DeepSeek, Qwen, ERNIE, GLM-4, Moonshot)
- **Smart Trip Planning**: Input dates, budget, preferences, and get detailed day-by-day itineraries
- **Beautiful UX**: Modern, responsive interface with smooth animations and intuitive navigation
- **Free & Premium Tiers**: Free users get 1 trip + 1/month; Premium users get unlimited trips

### Social Features
- **Collaboration**: Invite friends to plan trips together
- **Voting System**: Vote on activities and locations
- **Threaded Discussions**: Comment and discuss on specific activities
- **Public/Private Trips**: Share your trips publicly or keep them private
- **Discover**: Browse and clone popular trips from the community
- **Follow Users**: Follow travelers and see their adventures

### Admin Dashboard
- **AI Model Configuration**: Enable/disable models, set default model
- **A/B Testing**: Track which AI model performs best for different scenarios
- **Analytics**: User statistics, cost tracking, token usage
- **Performance Metrics**: Response time, success rates, user ratings per model
- **Recent Queries**: View last 10 trip generations with full details

### Additional Features
- **Export**: PDF, Google Calendar, iCal formats
- **Google Maps Integration**: View locations, read reviews, get directions
- **PWA Support**: Install on mobile devices as native app
- **Real-time Updates**: Powered by Supabase Realtime
- **Cost Tracking**: See estimated costs per activity and total trip cost

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (OAuth support)
- **Real-time**: Supabase Realtime
- **AI Models**: OpenAI, Anthropic, Google, DeepSeek, Alibaba Qwen, Baidu ERNIE, Zhipu GLM, Moonshot
- **Payment**: Stripe (for Premium subscriptions)
- **Maps**: Google Maps API
- **Hosting**: Hetzner VPS (recommended for cost efficiency)

## Quick Start

### ⚡ One-Line Install (Mac)

```bash
curl -sSL https://raw.githubusercontent.com/khangkhangg/AI-travel/main/install.sh | bash
cd ai-travel && nano .env && ./start.sh
```

Visit **http://localhost:2002** 🎉

See [INSTALL.md](INSTALL.md) for details.

---

### Manual Setup

#### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Supabase account (free tier works)
- At least one AI API key (OpenAI, Anthropic, or Google)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-travel.git
cd ai-travel
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_travel
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

4. **Set up the database**
```bash
# Create the database
createdb ai_travel

# Run the schema
psql ai_travel < lib/db/schema.sql
```

5. **Set up Supabase**
- Create a new project at [supabase.com](https://supabase.com)
- Go to Authentication > Providers and enable Email/Password
- Enable Google, GitHub OAuth (optional)
- Copy your Project URL and anon key to `.env`

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:2002](http://localhost:2002) in your browser.

## Deployment to Hetzner VPS

### Why Hetzner?
- **Cost-effective**: 50-60% cheaper than Digital Ocean/AWS
- **Great performance**: Fast European data centers
- **Simple pricing**: No surprise charges
- **Recommended plan**: CPX31 (4 vCPU, 8GB RAM) for ~$14/month

### Deployment Steps

#### 1. Create Hetzner VPS

```bash
# SSH into your VPS
ssh root@your-server-ip
```

#### 2. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

#### 3. Set up PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ai_travel;
CREATE USER ai_travel_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_travel TO ai_travel_user;
\q
```

#### 4. Clone and Configure App

```bash
# Create app directory
mkdir -p /var/www/ai-travel
cd /var/www/ai-travel

# Clone repository
git clone https://github.com/yourusername/ai-travel.git .

# Install dependencies
npm install

# Create .env file
nano .env
# (paste your production environment variables)

# Set up database
psql ai_travel < lib/db/schema.sql -U ai_travel_user

# Build the app
npm run build
```

#### 5. Configure PM2

```bash
# Start the app with PM2
pm2 start npm --name "ai-travel" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd
```

#### 6. Configure Nginx

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/ai-travel
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:2002;
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

Enable the site:
```bash
ln -s /etc/nginx/sites-available/ai-travel /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 7. Set up SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

#### 8. Set up Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Deployment Checklist

- [ ] VPS created and accessible via SSH
- [ ] Node.js, PostgreSQL, Nginx installed
- [ ] Database created and schema imported
- [ ] Environment variables configured
- [ ] App built and running via PM2
- [ ] Nginx configured and SSL certificate installed
- [ ] Firewall configured
- [ ] DNS records pointing to VPS IP
- [ ] Supabase project configured with production URL
- [ ] AI API keys added and tested
- [ ] Google Maps API configured
- [ ] Stripe webhooks configured (if using payments)

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- At least one AI API key (OpenAI, Anthropic, or Google)

### Optional

- `GOOGLE_API_KEY` - For Gemini AI model
- `DEEPSEEK_API_KEY` - For DeepSeek model
- `ALIBABA_API_KEY` - For Qwen model
- `BAIDU_API_KEY` - For ERNIE Bot
- `ZHIPU_API_KEY` - For GLM-4 model
- `MOONSHOT_API_KEY` - For Moonshot model
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For maps and place reviews
- `STRIPE_SECRET_KEY` - For premium subscriptions
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key

## AI Model Configuration

### Supported Models

1. **OpenAI**
   - GPT-4 Turbo (default)
   - GPT-4

2. **Anthropic**
   - Claude 3.5 Sonnet
   - Claude 3 Opus

3. **Google**
   - Gemini 1.5 Pro

4. **Chinese Models**
   - DeepSeek Chat
   - Alibaba Qwen Plus
   - Baidu ERNIE Bot
   - Zhipu GLM-4
   - Moonshot v1

### Managing Models

Access the admin dashboard at `/admin` to:
- Enable/disable models
- Set default model
- View performance metrics
- Compare model costs and quality

## Database Schema

The app uses PostgreSQL with the following main tables:

- `users` - User profiles and subscription info
- `ai_models` - AI model configuration
- `trips` - Generated trip itineraries
- `itinerary_items` - Individual activities/locations
- `trip_collaborators` - Group members
- `item_votes` - Votes on activities
- `discussions` - Comments and threads
- `followers` - Social following
- `model_performance` - AI model analytics

Full schema in `lib/db/schema.sql`

## API Routes

### Public
- `POST /api/generate` - Generate trip itinerary
- `GET /api/trips/[id]` - Get trip details
- `GET /api/discover` - Browse public trips

### Authenticated
- `GET /api/trips` - List user's trips
- `POST /api/trips/[id]/vote` - Vote on activity
- `POST /api/trips/[id]/comment` - Add comment
- `POST /api/trips/[id]/invite` - Invite collaborator

### Admin
- `GET /api/admin/models` - List AI models
- `PATCH /api/admin/models/[id]` - Update model
- `POST /api/admin/models/[id]/set-default` - Set default model
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/queries` - Recent queries
- `GET /api/admin/model-performance` - Model analytics

## Cost Estimation

### Monthly Costs (Production)

**Hetzner VPS (CPX31)**
- 4 vCPU, 8GB RAM: $14/month
- Object Storage (250GB): $5/month

**Supabase**
- Free tier: 50,000 MAU (monthly active users)
- Pro: $25/month (500,000 MAU)

**AI API Costs** (per 1000 trips)
- GPT-4 Turbo: ~$30-50
- Claude 3.5 Sonnet: ~$15-25
- Gemini Pro: ~$12-20
- Chinese models: ~$2-5

**Total for small app**: $20-30/month (excluding AI costs)
**Total for medium app**: $50-100/month (1000+ users)

## Monitoring

### PM2 Monitoring
```bash
pm2 status
pm2 logs ai-travel
pm2 monit
```

### PostgreSQL Monitoring
```bash
# Check connections
psql -U ai_travel_user -d ai_travel -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
psql -U ai_travel_user -d ai_travel -c "SELECT pg_size_pretty(pg_total_relation_size('trips'));"
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Email: support@yourapp.com

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Weather integration
- [ ] Flight and hotel booking integration
- [ ] Multi-language support
- [ ] AI-powered chat assistant
- [ ] Collaborative real-time editing
- [ ] Budget tracking with receipts
- [ ] Social feed and stories
- [ ] Travel journal with photos
- [ ] Offline mode for mobile

## Acknowledgments

- Next.js team for the amazing framework
- Supabase for auth and real-time infrastructure
- OpenAI, Anthropic, Google for AI APIs
- Tailwind CSS for the styling system
- Lucide for the beautiful icons
