# Quick Start Guide

Get your AI Travel Planner running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed locally
- Supabase account (free)
- At least one AI API key (OpenAI recommended)

## Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd ai-travel
npm install
```

## Step 2: Set Up Database

```bash
# Create database
createdb ai_travel

# Run schema
psql ai_travel < lib/db/schema.sql
```

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your keys
nano .env
```

**Minimum required variables:**
```env
DATABASE_URL=postgresql://localhost/ai_travel
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
```

## Step 4: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In your Supabase dashboard:
   - Go to Settings → API
   - Copy "Project URL" and "anon public" key to `.env`
   - Go to Authentication → Providers
   - Enable "Email" provider
3. Optional: Enable Google/GitHub OAuth

## Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Create Your First Trip

1. Click "Login" and create an account
2. Fill out the trip form:
   - Dates: Choose your travel dates
   - People: Number of travelers
   - Destination: Enter a city (optional)
   - Travel Type: Select one or more types
   - Description: Add any preferences
3. Click "Generate My Itinerary"
4. Wait 10-30 seconds for AI to create your trip!

## Admin Dashboard

Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin)

Here you can:
- Enable/disable AI models
- Set the default model
- View statistics and analytics
- See recent trip generations
- Compare model performance

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Verify database exists
psql -l | grep ai_travel
```

### Supabase Auth Not Working
1. Check your Supabase URL and anon key in `.env`
2. Verify email provider is enabled in Supabase dashboard
3. Check browser console for errors

### AI Generation Failing
1. Verify your API key is correct
2. Check you have credits/quota in your AI provider account
3. Try a different model from admin dashboard
4. Check server logs for detailed error messages

### "Trip generation limit reached"
- Free users get 1 trip, then 1 per month
- For testing, manually reset in database:
```sql
UPDATE users SET trips_generated_count = 0, last_trip_generated_at = NULL WHERE email = 'your-email';
```

## Next Steps

### Add More AI Models

Edit `.env` and add API keys for:
- Anthropic Claude: `ANTHROPIC_API_KEY`
- Google Gemini: `GOOGLE_API_KEY`
- Chinese models: `DEEPSEEK_API_KEY`, `ALIBABA_API_KEY`, etc.

Then enable them in the admin dashboard.

### Enable Google Maps

1. Get a Google Maps API key
2. Enable Places API and Maps JavaScript API
3. Add to `.env`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Set Up Stripe (Premium Subscriptions)

1. Create Stripe account
2. Get API keys from Stripe dashboard
3. Add to `.env`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Implement payment flow (coming soon)

## Development Tips

### Database Reset
```bash
psql ai_travel < lib/db/schema.sql
```

### View Logs
```bash
npm run dev  # Console will show all logs
```

### Test Different AI Models
Go to `/admin` → AI Models → Set different model as default

### Reset User Limits
```sql
-- Reset all users
UPDATE users SET trips_generated_count = 0, last_trip_generated_at = NULL;

-- Reset specific user
UPDATE users SET trips_generated_count = 0 WHERE email = 'user@example.com';
```

## Ready to Deploy?

See [README.md](README.md) for full deployment instructions to Hetzner VPS or other hosting providers.

## Need Help?

- Check [README.md](README.md) for full documentation
- Open an issue on GitHub
- Check the codebase - it's well-commented!

## What's Included

✅ Core trip generation with AI
✅ User authentication (Supabase)
✅ Beautiful, responsive UI
✅ Admin dashboard
✅ 10+ AI models support
✅ User limits (free/premium)
✅ Voting system
✅ PWA support
✅ PostgreSQL database
✅ Production-ready architecture

## What's Not Included (Yet)

The following features are designed but not yet implemented:
- Social features (discover, follow, public trips)
- Threaded discussions
- Real-time collaboration
- Google Maps integration
- Export to PDF/Calendar
- Stripe payment integration
- Mobile app

These can be added based on your needs!

Happy coding! 🚀
