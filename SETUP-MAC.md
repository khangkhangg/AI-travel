# 🚀 Quick Setup for Mac (3 Steps)

## Prerequisites (One-Time Install)

```bash
brew install orbstack node
```

---

## 3-Step Setup

### **Step 1: Run Auto-Setup**

```bash
./setup.sh
```

This installs everything and creates the database.

### **Step 2: Add API Keys**

```bash
nano .env
```

**Required keys:**

1. **Supabase** (FREE):
   - Go to https://supabase.com
   - Create new project
   - Copy URL and anon key to `.env`

2. **OpenAI**:
   - Go to https://platform.openai.com/api-keys
   - Create API key
   - Copy to `.env`

**Save and exit:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **Step 3: Start App**

```bash
./start.sh
```

Visit: **http://localhost:3000** 🎉

---

## Quick Commands

| Command | What it does |
|---------|-------------|
| `./setup.sh` | First-time setup |
| `./start.sh` | Start the app |
| `./test.sh` | Run all tests |
| `./stop.sh` | Stop everything |

---

## Testing

```bash
# Run all tests
./test.sh

# Or run specific tests
npm run test:api      # API tests only
npm run test:e2e      # UI tests only
npm run test:ui       # Interactive mode
```

---

## Troubleshooting

### Can't connect to database

```bash
# Restart everything
./stop.sh
./start.sh
```

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or port 5432
lsof -ti:5432 | xargs kill -9
```

### Reset database

```bash
docker stop ai-travel-db
docker rm ai-travel-db
./setup.sh
```

---

## Getting API Keys

### Supabase (FREE - Required)

1. Go to https://supabase.com and sign up
2. Click **"New Project"**
3. Choose name and password
4. Wait for project to be created
5. Go to **Settings** → **API**
6. Copy these to `.env`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### OpenAI (Paid - Required)

1. Go to https://platform.openai.com
2. Sign up and add payment method
3. Go to **API Keys**
4. Click **"Create new secret key"**
5. Copy key to `.env` as `OPENAI_API_KEY`

### Optional: Other AI Providers

- **Anthropic Claude**: https://console.anthropic.com
- **Google Gemini**: https://makersuite.google.com/app/apikey

---

## Example .env File

```bash
# Database (already set by setup.sh)
DATABASE_URL=postgresql://ai_travel_user:dev_password@localhost:5432/ai_travel

# Supabase (get from supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY=sk-proj-abc123xyz...

# Optional
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# App config (already set)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Full Setup Example

```bash
# 1. First time setup
./setup.sh

# 2. Edit API keys
nano .env
# Add your Supabase and OpenAI keys
# Save: Ctrl+O, Enter, Ctrl+X

# 3. Start app
./start.sh

# Visit http://localhost:3000

# 4. In another terminal, run tests
./test.sh
```

---

## What Each Script Does

### `setup.sh`
- Starts PostgreSQL in Docker
- Installs npm dependencies
- Installs Playwright for testing
- Creates database and tables
- Creates `.env` template

### `start.sh`
- Checks if database is running
- Starts database if needed
- Checks if API keys are configured
- Starts Next.js dev server

### `test.sh`
- Ensures database is running
- Runs all Playwright tests
- Shows test results

### `stop.sh`
- Stops PostgreSQL database
- Keeps data intact

---

## Video Tutorial

### Terminal Recording

```bash
# Complete setup in 3 commands:

# 1. Setup (takes 2-3 minutes)
./setup.sh

# 2. Add keys (takes 5 minutes to get keys)
nano .env

# 3. Start
./start.sh
```

---

## Need Help?

Check the full documentation:
- **README.md** - Complete guide
- **TESTING.md** - Testing details
- **QUICKSTART.md** - Detailed setup

Or open an issue on GitHub!

---

## Summary

✅ **3 simple scripts**
✅ **All automation included**
✅ **Just add API keys and go**
✅ **Takes ~10 minutes total**

Enjoy! 🎉
