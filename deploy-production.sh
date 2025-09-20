#!/bin/bash

# =============================================================================
# CHARNOKS V3 - PRODUCTION DEPLOYMENT SCRIPT
# =============================================================================
# Deploys the complete system to production environment

set -e  # Exit on any error

echo "🚀 Starting Charnoks V3 Production Deployment..."

# =============================================================================
# ENVIRONMENT VALIDATION
# =============================================================================

echo "📋 Validating environment..."

# Check required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required"; exit 1; }

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required (current: $(node --version))"
    exit 1
fi

echo "✅ Environment validation passed"

# =============================================================================
# CONFIGURATION SETUP
# =============================================================================

echo "⚙️  Setting up configuration..."

# Copy environment template if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual configuration values"
    echo "🔑 Required: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
fi

# Validate critical environment variables
source .env 2>/dev/null || true

if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "❌ GEMINI_API_KEY not configured in .env"
    exit 1
fi

if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "your_supabase_url_here" ]; then
    echo "❌ SUPABASE_URL not configured in .env"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_supabase_service_role_key_here" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not configured in .env"
    exit 1
fi

echo "✅ Configuration validation passed"

# =============================================================================
# FRONTEND BUILD
# =============================================================================

echo "🏗️  Building frontend..."

# Install dependencies
npm install

# Build frontend for production
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    exit 1
fi

echo "✅ Frontend build completed"

# =============================================================================
# MCP SERVER BUILD
# =============================================================================

echo "🤖 Building MCP server..."

cd mcp-server

# Install MCP server dependencies
npm install

# Build MCP server
npm run build

if [ ! -d "dist" ]; then
    echo "❌ MCP server build failed - dist directory not found"
    exit 1
fi

cd ..

echo "✅ MCP server build completed"

# =============================================================================
# HEALTH CHECKS
# =============================================================================

echo "🏥 Running health checks..."

# Start MCP server in background for testing
cd mcp-server
npm run start > ../mcp-server-test.log 2>&1 &
MCP_PID=$!
cd ..

# Wait for server to start
sleep 5

# Test MCP server health
HEALTH_RESPONSE=$(curl -s http://localhost:3002/health || echo "failed")

if [[ "$HEALTH_RESPONSE" == *"status"* ]]; then
    echo "✅ MCP server health check passed"
else
    echo "❌ MCP server health check failed"
    echo "📋 Server log:"
    cat mcp-server-test.log | tail -10
    kill $MCP_PID 2>/dev/null || true
    exit 1
fi

# Stop test server
kill $MCP_PID 2>/dev/null || true
sleep 2

# Cleanup test log
rm -f mcp-server-test.log

echo "✅ All health checks passed"

# =============================================================================
# DEPLOYMENT SUMMARY
# =============================================================================

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📦 Built Components:"
echo "   ✅ Frontend: $(du -sh dist 2>/dev/null | cut -f1 || echo 'N/A')"
echo "   ✅ MCP Server: $(du -sh mcp-server/dist 2>/dev/null | cut -f1 || echo 'N/A')"
echo ""
echo "🚀 Next Steps:"
echo "   1. Deploy frontend 'dist' folder to your hosting platform (Vercel, Netlify, etc.)"
echo "   2. Deploy MCP server to Railway, Fly.io, or similar Node.js hosting"
echo "   3. Update production environment variables in your hosting platforms"
echo "   4. Point frontend MCP_SERVER_URL to your deployed MCP server"
echo ""
echo "📖 Documentation:"
echo "   - Frontend: Vite + React PWA ready for static hosting"
echo "   - MCP Server: Express + MCP SDK ready for Node.js hosting"
echo "   - Database: Supabase with vector embeddings and Edge Functions"
echo ""
echo "🔧 Deployment Commands:"
echo "   Frontend: npm run build && deploy dist/"
echo "   MCP Server: cd mcp-server && npm run build && npm run start"
echo ""

exit 0