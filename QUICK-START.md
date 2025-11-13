# 🚀 AI Travel Planner - Super Quick Start

## ⚡ One Command Install (Mac)

```bash
curl -sSL https://raw.githubusercontent.com/khangkhangg/AI-travel/main/install.sh | bash
```

**That's it! Everything installs automatically.**

---

## Then Just 3 More Steps:

### 1. Navigate to directory
```bash
cd ai-travel
```

### 2. Add your API keys
```bash
nano .env
```

Get keys here:
- **Supabase** (FREE): https://supabase.com
- **OpenAI**: https://platform.openai.com

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3. Start the app
```bash
./start.sh
```

Visit: **http://localhost:2002** 🎉

---

## Run Tests

```bash
./test.sh
```

---

## That's It!

**Total commands: 4**
```bash
curl -sSL https://raw.githubusercontent.com/khangkhangg/AI-travel/main/install.sh | bash
cd ai-travel
nano .env
./start.sh
```

**Total time: ~10 minutes** (including getting API keys)

---

## Quick Commands Reference

```bash
./start.sh   # Start app (port 2002)
./test.sh    # Run all tests
./stop.sh    # Stop services
```

---

## What Port?

App runs on: **http://localhost:2002**

(Changed from 3000 to avoid conflicts)

---

## Need More Details?

- **INSTALL.md** - One-liner details
- **SETUP-MAC.md** - Full setup guide
- **README.md** - Complete documentation
- **TESTING.md** - Testing guide

---

## Troubleshooting

### Port already in use
```bash
lsof -ti:2002 | xargs kill -9
```

### Reset everything
```bash
./stop.sh
docker rm ai-travel-db
./setup.sh
```

---

**That's all you need!** 🎉
