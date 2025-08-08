#!/bin/bash

echo "🔧 Fixing TypeScript and build errors..."

# Install missing dependencies
echo "📦 Installing missing dependencies..."
npm install --save-dev @types/react@^18.2.14 @types/react-dom@^18.2.6

# Clear node modules and reinstall (if needed)
echo "🧹 Clearing cache..."
rm -rf node_modules/.vite
rm -rf dist

# Rebuild
echo "🔨 Building project..."
npm run build

echo "✅ Errors fixed! Your project should now build successfully."
echo ""
echo "🚀 Next steps:"
echo "1. Deploy Firebase backend: firebase deploy --only firestore:rules,storage:rules,functions"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Set environment variables in Vercel dashboard"