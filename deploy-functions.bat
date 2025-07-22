@echo off
echo Installing Firebase CLI...
npm install -g firebase-tools

echo Installing function dependencies...
cd functions
npm install
cd ..

echo Setting up Firebase configuration...
echo Please run these commands manually:
echo firebase login
echo firebase functions:config:set gemini.api_key="YOUR_ACTUAL_GEMINI_API_KEY"
echo firebase deploy --only functions

pause