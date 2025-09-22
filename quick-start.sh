#!/bin/bash

# 🚀 Charnoks V3 - Quick Developer Setup Script
# This script helps new developers get started with the Charnoks V3 codebase

echo "🚀 Welcome to Charnoks V3 Development Setup!"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found package.json - we're in the right place!"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm not found. Please install Node.js and npm."
    exit 1
fi

echo "✅ npm is available"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully!"
    else
        echo "❌ Error installing dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "🔧 Creating development .env file..."
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
# Charnoks V3 - Development Configuration
NODE_ENV=development
VITE_SUPABASE_URL=undefined
VITE_SUPABASE_ANON_KEY=undefined
VITE_GEMINI_API_KEY=development_mode_placeholder
ENABLE_DEBUG_MODE=true
ENABLE_MOCK_RESPONSES=true
EOF
    echo "✅ Development .env file created!"
else
    echo "✅ .env file already exists"
fi

# Check if dev server is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Development server is already running on port 5173"
    echo "🌐 Access it at: http://localhost:5173"
else
    echo "🚀 Starting development server..."
    echo "📍 Server will be available at: http://localhost:5173"
    echo ""
    echo "🎯 Quick Navigation:"
    echo "   Login Page:      http://localhost:5173/#/login"
    echo "   Signup Page:     http://localhost:5173/#/signup"
    echo "   Owner Dashboard: http://localhost:5173/#/owner/dashboard"
    echo "   Worker Dashboard: http://localhost:5173/#/worker/dashboard"
    echo ""
    echo "📚 Documentation:"
    echo "   Setup Guide:     ./CODESPACE_ACCESS_GUIDE.md"
    echo "   Core Files:      ./Core-Files.md"
    echo "   Workspace Info:  ./WORKSPACE_ANALYSIS_REPORT.md"
    echo ""
    echo "🔧 Development Tips:"
    echo "   - App runs in demo mode by default"
    echo "   - All features work with mock data"
    echo "   - Check console for debug logs"
    echo "   - Use browser DevTools for debugging"
    echo ""
    echo "▶️  Starting server in 3 seconds... (Press Ctrl+C to cancel)"
    sleep 3
    
    # Start the development server
    npm run dev
fi