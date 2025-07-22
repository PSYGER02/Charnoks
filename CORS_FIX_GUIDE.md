# CORS Issue Fix Guide

## The Problem
Your Vercel frontend is getting CORS errors when trying to call Firebase Functions. This happens because:
1. Firebase Functions aren't properly deployed
2. Environment variables aren't set correctly
3. Functions configuration might be outdated

## Quick Fix Steps

### Step 1: Install Firebase CLI (if not already done)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Set Environment Variables
```bash
# Set your Gemini API key
firebase functions:config:set gemini.api_key="YOUR_ACTUAL_GEMINI_API_KEY"

# Verify it's set
firebase functions:config:get
```

### Step 4: Install Function Dependencies
```bash
cd functions
npm install
cd ..
```

### Step 5: Deploy Functions
```bash
firebase deploy --only functions
```

### Step 6: Update Vercel Environment Variables
Make sure these are set in your Vercel dashboard:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Alternative: Use Environment Variables Instead of Firebase Config

If the above doesn't work, you can use a simpler approach with environment variables:

### 1. Create functions/.env file:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Update functions/index.ts to use process.env:
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
```

### 3. Deploy again:
```bash
firebase deploy --only functions
```

## Verification

After deployment, your functions should be accessible at:
`https://us-central1-charnoks-209bf.cloudfunctions.net/`

You can test a function by visiting:
`https://us-central1-charnoks-209bf.cloudfunctions.net/setUserRole`

## Common Issues

1. **Node.js Version**: Make sure you're using Node.js 18 or 20
2. **Firebase Project**: Verify you're deploying to the correct project with `firebase use`
3. **Billing**: Ensure your Firebase project has billing enabled for Cloud Functions
4. **Region**: Functions are deployed to us-central1 by default

## If Still Having Issues

1. Check function logs: `firebase functions:log`
2. Test locally: `firebase emulators:start`
3. Verify project: `firebase projects:list`
4. Check function status: `firebase functions:list`