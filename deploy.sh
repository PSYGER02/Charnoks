#!/bin/bash

echo "🚀 Deploying Charnoks POS System..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Install function dependencies
echo "📦 Installing function dependencies..."
cd functions
npm install
cd ..

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy Firebase rules and functions
echo "☁️ Deploying Firebase backend..."
firebase deploy --only firestore:rules,storage:rules,functions

# Deploy to Vercel (if vercel CLI is available)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
else
    echo "⚠️ Vercel CLI not found. Please deploy manually via Vercel dashboard."
fi

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Ensure environment variables are set in Vercel dashboard"
echo "2. Test the application at your Vercel URL"
echo "3. Create your first owner account"
echo ""
echo "Environment variables needed in Vercel:"
echo "- VITE_FIREBASE_API_KEY"
echo "- VITE_FIREBASE_AUTH_DOMAIN"
echo "- VITE_FIREBASE_PROJECT_ID"
echo "- VITE_FIREBASE_STORAGE_BUCKET"
echo "- VITE_FIREBASE_MESSAGING_SENDER_ID"
echo "- VITE_FIREBASE_APP_ID"
echo "- GEMINI_API_KEY"