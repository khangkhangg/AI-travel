#!/bin/bash

echo "🚀 AI Travel Planner - Auto Setup"
echo "=================================="

# Check if OrbStack/Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker/OrbStack not found. Install with: brew install orbstack"
    exit 1
fi

# Stop any existing container
docker stop ai-travel-db 2>/dev/null
docker rm ai-travel-db 2>/dev/null

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker run -d \
  --name ai-travel-db \
  -e POSTGRES_USER=ai_travel_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=ai_travel \
  -p 5432:5432 \
  postgres:14

echo "⏳ Waiting for PostgreSQL to start..."
sleep 8

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Install Playwright
echo "🎭 Installing Playwright..."
npx playwright install chromium --with-deps

# Setup database
echo "🗄️  Setting up database..."
PGPASSWORD=dev_password psql -h localhost -U ai_travel_user -d ai_travel -f lib/db/schema.sql

# Create .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database (already configured)
DATABASE_URL=postgresql://ai_travel_user:dev_password@localhost:5432/ai_travel

# Supabase - GET FREE KEYS AT: https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI - GET KEY AT: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-key-here

# Optional: Other AI providers
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# App Config (already set)
NEXT_PUBLIC_APP_URL=http://localhost:2002
NODE_ENV=development
PORT=2002
EOF
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next: Edit .env file with your API keys"
echo ""
echo "   Required:"
echo "   1. Get Supabase keys (FREE): https://supabase.com"
echo "   2. Get OpenAI key: https://platform.openai.com"
echo ""
echo "   Run: nano .env"
echo ""
echo "🚀 Then start app: ./start.sh"
echo ""
echo "   App will run on: http://localhost:2002"
