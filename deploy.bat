@echo off
echo 🚀 Deploying Charnoks POS System...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo Installing Firebase CLI...
    npm install -g firebase-tools
)

REM Install function dependencies
echo 📦 Installing function dependencies...
cd functions
npm install
cd ..

REM Build the project
echo 🔨 Building project...
npm run build

REM Deploy Firebase rules and functions
echo ☁️ Deploying Firebase backend...
firebase deploy --only firestore:rules,storage:rules,functions

REM Deploy to Vercel (if vercel CLI is available)
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Vercel CLI not found. Please deploy manually via Vercel dashboard.
) else (
    echo 🌐 Deploying to Vercel...
    vercel --prod
)

echo ✅ Deployment complete!
echo.
echo 🔧 Next steps:
echo 1. Ensure environment variables are set in Vercel dashboard
echo 2. Test the application at your Vercel URL
echo 3. Create your first owner account
echo.
echo Environment variables needed in Vercel:
echo - VITE_FIREBASE_API_KEY
echo - VITE_FIREBASE_AUTH_DOMAIN
echo - VITE_FIREBASE_PROJECT_ID
echo - VITE_FIREBASE_STORAGE_BUCKET
echo - VITE_FIREBASE_MESSAGING_SENDER_ID
echo - VITE_FIREBASE_APP_ID
echo - GEMINI_API_KEY

pause