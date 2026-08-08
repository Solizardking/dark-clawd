#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# VibeBot Setup Script
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🎵 VibeBot Setup                                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is required but not installed."
        exit 1
    fi
    echo "✅ $1 found"
}

echo "Checking prerequisites..."
check_tool node
check_tool pnpm

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required (found v$NODE_VERSION)"
    exit 1
fi
echo "✅ Node.js version OK"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔧 Building packages..."

# Build core first
echo "  → Building @vibebot/core..."
pnpm --filter @vibebot/core build

# Build other packages
echo "  → Building @vibebot/telegram..."
pnpm --filter @vibebot/telegram build

echo "  → Building @vibebot/cli..."
pnpm --filter @vibebot/cli build

echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup complete!                                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run 'pnpm --filter @vibebot/telegram dev' to start Telegram bot"
echo "  3. Run 'pnpm --filter @vibebot/cli dev' to start CLI"
echo "  4. Run 'pnpm --filter @vibebot/mobile start' to start mobile app"
echo ""
echo "Happy vibing! 🎵"
