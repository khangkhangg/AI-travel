# 🚀 One-Line Installer for AI Travel Planner

## ⚡ Quick Install (Fastest!)

Replace `YOUR_USERNAME` with your GitHub username:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash
```

Or if using the main repo:

```bash
curl -sSL https://raw.githubusercontent.com/khangkhangg/AI-travel/main/install.sh | bash
```

---

## What This Does

1. ✅ Checks prerequisites (Docker, Node, Git)
2. ✅ Clones repository to `./ai-travel`
3. ✅ Starts PostgreSQL in Docker
4. ✅ Installs all dependencies
5. ✅ Sets up database and tables
6. ✅ Creates `.env` template

**Takes ~3 minutes**

---

## After Installation

```bash
cd ai-travel

# Add your API keys
nano .env

# Start the app
./start.sh

# Visit http://localhost:2002
```

---

## API Keys Needed

Get these for free (takes 5-10 minutes):

1. **Supabase** (FREE): https://supabase.com
2. **OpenAI**: https://platform.openai.com (requires payment)

Add them to `.env` file.

---

## Complete Command

```bash
# Install
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash

# Configure and start
cd ai-travel && nano .env && ./start.sh
```

---

## Prerequisites

Install these first:

```bash
brew install orbstack node
```

---

## Alternative: Manual Setup

If you prefer manual setup:

```bash
git clone https://github.com/YOUR_USERNAME/AI-travel.git
cd ai-travel
./setup.sh
nano .env
./start.sh
```

---

## What You Get

- ✅ Full AI Travel Planner app
- ✅ 10+ AI models support
- ✅ Admin dashboard
- ✅ 40+ automated tests
- ✅ Complete documentation
- ✅ Running on port 2002

---

## Quick Commands

```bash
./start.sh   # Start app (port 2002)
./test.sh    # Run all tests
./stop.sh    # Stop services
```

---

## Documentation

- **SETUP-MAC.md** - Detailed setup guide
- **README.md** - Complete documentation
- **TESTING.md** - Testing guide
- **FEATURES.md** - All features

---

## Troubleshooting

### Installation fails

```bash
# Make sure prerequisites are installed
brew install orbstack node git
```

### Port already in use

```bash
lsof -ti:2002 | xargs kill -9
```

### Database issues

```bash
docker stop ai-travel-db
docker rm ai-travel-db
cd ai-travel && ./setup.sh
```

---

## Support

Open an issue on GitHub or check the documentation!

**Happy coding!** 🎉
