#!/bin/bash

# AI Travel Planner - One-Line Installer
# Usage: curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/AI-travel/main/install.sh | bash

set -e

echo "🚀 AI Travel Planner - Quick Installer"
echo "======================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker/OrbStack not found"
    echo ""
    echo "Install with:"
    echo "  brew install orbstack"
    echo ""
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    echo ""
    echo "Install with:"
    echo "  brew install node"
    echo ""
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git not found"
    echo ""
    echo "Install with:"
    echo "  brew install git"
    echo ""
    exit 1
fi

echo "✅ All prerequisites installed"
echo ""

# Ask for installation directory
read -p "📁 Install directory [./ai-travel]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-./ai-travel}

# Clone repository
echo ""
echo "📥 Cloning repository..."
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Directory $INSTALL_DIR already exists"
    read -p "Delete and reinstall? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "❌ Installation cancelled"
        exit 1
    fi
fi

git clone https://github.com/YOUR_USERNAME/AI-travel.git "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Run setup
echo ""
echo "⚙️  Running setup..."
./setup.sh

echo ""
echo "========================================="
echo "✅ Installation Complete!"
echo "========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Navigate to directory:"
echo "   cd $INSTALL_DIR"
echo ""
echo "2. Add your API keys:"
echo "   nano .env"
echo ""
echo "   Required:"
echo "   - Supabase URL and key (FREE): https://supabase.com"
echo "   - OpenAI API key: https://platform.openai.com"
echo ""
echo "3. Start the app:"
echo "   ./start.sh"
echo ""
echo "4. Visit: http://localhost:2002"
echo ""
echo "5. Run tests:"
echo "   ./test.sh"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Complete guide"
echo "   - SETUP-MAC.md - Quick setup"
echo "   - TESTING.md - Testing guide"
echo ""
echo "🎉 Happy coding!"
