#!/bin/bash

echo "🧪 Running Tests..."

# Ensure database is running
if ! docker ps | grep -q ai-travel-db; then
    echo "📦 Starting PostgreSQL..."
    docker start ai-travel-db 2>/dev/null
    sleep 3
fi

# Run tests
npm test

echo ""
echo "📊 View full report: npm run test:report"
