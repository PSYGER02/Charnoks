# Firebase Deployment Guide

## Quick Fix for CORS Issue

The CORS error you're seeing is because your Firebase Functions aren't properly deployed or configured. Here's how to fix it:

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Set Environment Variables
```bash
# Set your Gemini API key in Firebase
firebase functions:config:set gemini.api_key="your_actual_gemini_api_key_here"

# Verify the config
firebase functions:config:get
```

### 3. Deploy Functions
```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

### 4. Verify Deployment
After deployment, your functions should be available at:
`https://us-central1-charnoks-209bf.cloudfunctions.net/`

### 5. Update Frontend Configuration
Make sure your frontend is calling the correct function URLs.

## Environment Variables Needed

### For Firebase Functions (Backend):
- `GEMINI_API_KEY` - Your Google AI Studio API key

### For Vercel Frontend:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Troubleshooting

1. **Functions not deploying**: Check Node.js version (should be 18 or 20)
2. **CORS errors**: Ensure functions are deployed and accessible
3. **Environment variables**: Use `firebase functions:config:get` to verify
4. **Authentication**: Make sure you're logged into Firebase CLI

## Commands Reference
```bash
# Login to Firebase
firebase login

# List current functions
firebase functions:list

# View function logs
firebase functions:log

# Test locally
firebase emulators:start
```