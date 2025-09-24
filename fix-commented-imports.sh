#!/bin/bash

# Quick Fix Script for Commented-Out Imports
# This script helps restore disabled functionality in your React app

set -e

echo "🔧 Fixing Commented-Out Imports in Charnoks App"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# 1. Safe immediate fixes
echo "🟢 Step 1: Uncommenting safe imports..."

# Uncomment PromptSuggestions (file exists)
if grep -q "//import PromptSuggestions" pages/owner/AIAssistantPage.tsx; then
    sed -i 's|//import PromptSuggestions|import PromptSuggestions|' pages/owner/AIAssistantPage.tsx
    echo "✅ Uncommented PromptSuggestions import"
else
    echo "ℹ️  PromptSuggestions import already active or not found"
fi

# 2. Copy missing services from MCP server
echo ""
echo "🟡 Step 2: Copying missing services from MCP server..."

# Check if MCP server services exist
if [ -d "mcp-server/src/services" ]; then
    # Copy aiObserver
    if [ -f "mcp-server/src/services/aiObserver.ts" ] && [ ! -f "services/aiObserver.ts" ]; then
        cp mcp-server/src/services/aiObserver.ts services/
        echo "✅ Copied aiObserver.ts"
    fi
    
    # Copy aiStoreAdvisor  
    if [ -f "mcp-server/src/services/aiStoreAdvisor.ts" ] && [ ! -f "services/aiStoreAdvisor.ts" ]; then
        cp mcp-server/src/services/aiStoreAdvisor.ts services/
        echo "✅ Copied aiStoreAdvisor.ts"
    fi
    
    # Copy geminiAPIManager
    if [ -f "mcp-server/src/services/geminiAPIManager.ts" ] && [ ! -f "services/geminiAPIManager.ts" ]; then
        cp mcp-server/src/services/geminiAPIManager.ts services/
        echo "✅ Copied geminiAPIManager.ts"
    fi
else
    echo "⚠️  MCP server directory not found - skipping service copy"
fi

# 3. Check for aiAssistant (might already exist)
echo ""
echo "🔍 Step 3: Checking existing services..."

if [ -f "services/aiAssistant.ts" ]; then
    echo "✅ aiAssistant.ts already exists"
else
    echo "⚠️  aiAssistant.ts missing - you may need to create it"
fi

# 4. Install dependencies if needed
echo ""
echo "📦 Step 4: Checking dependencies..."

if npm list @modelcontextprotocol/sdk > /dev/null 2>&1; then
    echo "✅ MCP SDK already installed"
else
    echo "⚠️  MCP SDK not installed"
    read -p "📥 Install @modelcontextprotocol/sdk? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install @modelcontextprotocol/sdk
        echo "✅ MCP SDK installed"
    else
        echo "⏭️  Skipped MCP SDK installation"
    fi
fi

# 5. Manual steps reminder
echo ""
echo "📋 Manual Steps Required:"
echo "========================"
echo "1. Review copied services in /services/ directory"
echo "2. Update import paths if needed"
echo "3. Uncomment these imports manually:"
echo "   - pages/AIDashboard.tsx (lines 8-10)"
echo "   - pages/owner/AIAssistantPage.tsx (line 5)" 
echo "   - pages/AIStoreAdvisorDashboard.tsx (line 18)"
echo "   - services/chickenBusinessAI.ts (line 13)"
echo "   - services/chickenMemoryService.ts (lines 8-10)"
echo ""
echo "4. Test the application:"
echo "   npm run dev"
echo ""
echo "✅ Quick fix script completed!"
echo "📄 See COMMENTED_IMPORTS_ANALYSIS.md for detailed guidance"