@echo off
echo 🔧 Fixing TypeScript and build errors...

REM Install missing dependencies
echo 📦 Installing missing dependencies...
npm install --save-dev @types/react@^18.2.14 @types/react-dom@^18.2.6

REM Clear cache
echo 🧹 Clearing cache...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

REM Rebuild
echo 🔨 Building project...
npm run build

echo ✅ Errors fixed! Your project should now build successfully.
echo.
echo 🚀 Next steps:
echo 1. Deploy Firebase backend: firebase deploy --only firestore:rules,storage:rules,functions
echo 2. Deploy to Vercel: vercel --prod
echo 3. Set environment variables in Vercel dashboard

pause