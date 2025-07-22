# Get Your Firebase Configuration

## Step 1: Get Firebase Config Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **charnoks-209bf**
3. Click the gear icon ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. Click on your web app (or create one if you don't have it)
6. Copy the config values and update your `.env` file

## Step 2: Update .env File

Replace the placeholder values in your `.env` file with the actual values from Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSyC... (your actual API key)
VITE_FIREBASE_AUTH_DOMAIN=charnoks-209bf.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=charnoks-209bf
VITE_FIREBASE_STORAGE_BUCKET=charnoks-209bf.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 (your actual sender ID)
VITE_FIREBASE_APP_ID=1:123456789:web:abc123 (your actual app ID)
```

## Step 3: Update Vercel Environment Variables

In your Vercel dashboard, add these same environment variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Step 4: Restart Development Server

After updating the `.env` file:
```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Firebase Config Example

Your Firebase config object should look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "charnoks-209bf.firebaseapp.com",
  projectId: "charnoks-209bf",
  storageBucket: "charnoks-209bf.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Security Note

- The Firebase API key for web apps is safe to expose publicly
- It's different from server-side API keys
- Firebase security is handled by Firestore rules, not the API key