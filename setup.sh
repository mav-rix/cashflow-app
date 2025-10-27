#!/bin/bash

# CashFlow Setup Script
# This script helps set up the CashFlow budgeting app

echo "🚀 CashFlow Setup Script"
echo "========================"
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Warning: Node.js 20 or higher is required"
    echo "   Current version: $(node --version)"
    echo "   Please upgrade Node.js. See NODE_UPGRADE.md for instructions."
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Node.js version OK: $(node --version)"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
else
    echo "✅ Dependencies already installed"
fi

# Check if database exists
if [ ! -f "prisma/dev.db" ]; then
    echo ""
    echo "🗄️  Setting up database..."
    npx prisma db push
    echo ""
    echo "🌱 Seeding database..."
    npm run db:seed
else
    echo "✅ Database already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. If you haven't already, upgrade to Node.js 20+ (see NODE_UPGRADE.md)"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Create an account and start managing your finances!"
echo ""
echo "📚 Documentation:"
echo "   - README.md          - Project overview and features"
echo "   - DEVELOPMENT.md     - Development documentation"
echo "   - NODE_UPGRADE.md    - Node.js upgrade instructions"
echo ""
