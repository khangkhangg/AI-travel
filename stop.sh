#!/bin/bash

echo "🛑 Stopping AI Travel Planner..."

# Stop database
docker stop ai-travel-db 2>/dev/null

echo "✅ Stopped"
echo ""
echo "To remove database (delete all data): docker rm ai-travel-db"
