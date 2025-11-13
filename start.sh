#!/bin/bash

echo "🚀 Starting AI Travel Planner..."

# Check if database is running
if ! docker ps | grep -q ai-travel-db; then
    echo "📦 Starting PostgreSQL..."
    docker start ai-travel-db 2>/dev/null || docker run -d \
      --name ai-travel-db \
      -e POSTGRES_USER=ai_travel_user \
      -e POSTGRES_PASSWORD=dev_password \
      -e POSTGRES_DB=ai_travel \
      -p 5432:5432 \
      postgres:14
    sleep 5
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Run: nano .env and add your API keys"
    exit 1
fi

# Check if keys are configured
if grep -q "your-key-here" .env || grep -q "your-project.supabase.co" .env; then
    echo "⚠️  Warning: .env still has placeholder values"
    echo "Edit .env with: nano .env"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Database running"
echo "🌐 Starting dev server on port 2002..."
echo ""
echo "🎉 App will be available at: http://localhost:2002"
echo ""
PORT=2002 npm run dev
