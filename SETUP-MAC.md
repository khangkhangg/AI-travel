# 🚀 Quick Setup for Mac (1-3 Steps)

## ⚡ One-Line Install (Easiest!)

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash
```

**Replace `YOUR_USERNAME` with your GitHub username!**

Then just:
```bash
cd ai-travel
nano .env          # Add API keys
./start.sh         # Start app
```

Visit: **http://localhost:2002** 🎉

---

## 🔧 Manual Setup (3 Steps)

### Prerequisites (One-Time Install)

```bash
brew install orbstack node
```

---

### **Step 1: Clone & Run Setup**

```bash
git clone https://github.com/YOUR_USERNAME/AI-travel.git
cd ai-travel
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

Visit: **http://localhost:2002** 🎉

---

## 📱 Quick Commands

| Command | What it does |
|---------|-------------|
| `./setup.sh` | First-time setup |
| `./start.sh` | Start the app on port 2002 |
| `./test.sh` | Run all tests |
| `./stop.sh` | Stop everything |

---

## 🧪 Testing

```bash
# Run all tests
./test.sh

# Or run specific tests
npm run test:api      # API tests only
npm run test:e2e      # UI tests only
npm run test:ui       # Interactive mode
```

---

## 🔧 Troubleshooting

### Can't connect to database

```bash
# Restart everything
./stop.sh
./start.sh
```

### Port already in use

```bash
# Kill process on port 2002
lsof -ti:2002 | xargs kill -9

# Or port 5432 (PostgreSQL)
lsof -ti:5432 | xargs kill -9
```

### Reset database

```bash
docker stop ai-travel-db
docker rm ai-travel-db
./setup.sh
```

---

## 🔑 Getting API Keys

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

## 📝 Example .env File

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
NEXT_PUBLIC_APP_URL=http://localhost:2002
NODE_ENV=development
PORT=2002
```

---

## 🎬 Full Setup Example

### Using One-Liner:

```bash
# 1. Install everything
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash

# 2. Navigate and configure
cd ai-travel
nano .env
# Add your Supabase and OpenAI keys
# Save: Ctrl+O, Enter, Ctrl+X

# 3. Start
./start.sh

# Visit http://localhost:2002

# 4. In another terminal, run tests
cd ai-travel
./test.sh
```

### Using Manual Setup:

```bash
# 1. Clone and setup
git clone https://github.com/YOUR_USERNAME/AI-travel.git
cd ai-travel
./setup.sh

# 2. Edit API keys
nano .env
# Add your Supabase and OpenAI keys
# Save: Ctrl+O, Enter, Ctrl+X

# 3. Start app
./start.sh

# Visit http://localhost:2002

# 4. In another terminal, run tests
./test.sh
```

---

## 📚 What Each Script Does

### `install.sh` (One-Line Installer)
- Checks prerequisites (Docker, Node, Git)
- Clones repository
- Runs full setup
- Provides next steps

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
- Starts Next.js dev server on port 2002

### `test.sh`
- Ensures database is running
- Runs all Playwright tests
- Shows test results

### `stop.sh`
- Stops PostgreSQL database
- Keeps data intact

---

## 🌐 Accessing the App

After starting with `./start.sh`, visit:

- **Main App**: http://localhost:2002
- **Discover**: http://localhost:2002/discover
- **Admin**: http://localhost:2002/admin

---

## 🎯 Quick Reference

### Installation
```bash
# One-liner (easiest)
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash

# Manual
git clone https://github.com/YOUR_USERNAME/AI-travel.git
cd ai-travel
./setup.sh
```

### Daily Use
```bash
./start.sh         # Start app (port 2002)
./test.sh          # Run tests
./stop.sh          # Stop services
```

### Troubleshooting
```bash
./stop.sh && ./start.sh     # Restart
docker rm ai-travel-db      # Delete database
lsof -ti:2002 | xargs kill  # Kill port 2002
```

---

## 📊 What You Get

✅ PostgreSQL running in Docker
✅ All dependencies installed
✅ Database with all tables
✅ Test suite ready (40+ tests)
✅ App running on **port 2002**

**Total time: ~10 minutes** (including getting API keys)

---

## 🎓 Full Documentation

See these files for more details:
- **README.md** - Complete guide
- **TESTING.md** - Testing details
- **QUICKSTART.md** - Detailed setup
- **FEATURES.md** - All features

---

## 💡 Tips

### Change Port (if needed)

Edit `.env`:
```bash
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run on Different Port (one-time)

```bash
PORT=3000 ./start.sh
```

### Use with VS Code

```bash
code .
```

Then use integrated terminal to run scripts.

---

## 🎉 Summary

**One-liner install:**
```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash
cd ai-travel && nano .env && ./start.sh
```

**Manual install:**
```bash
./setup.sh && nano .env && ./start.sh
```

**That's it! Just 3 commands to get running on port 2002.** 🚀

---

## ❓ Need Help?

1. Check troubleshooting section above
2. Check full documentation in `README.md`
3. Check test documentation in `TESTING.md`
4. Open an issue on GitHub

**Enjoy building!** 🎉
