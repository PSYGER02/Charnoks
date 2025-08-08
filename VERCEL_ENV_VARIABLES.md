# 🔧 **EXACT VERCEL ENVIRONMENT VARIABLES**

## 📋 **Copy these EXACT values to your Vercel Dashboard:**

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these **EXACT** variables:

```
VITE_FIREBASE_API_KEY=AIzaSyCI4b0PFl2nYFGCP-uhZXNbNiXyevPjIuQ
VITE_FIREBASE_AUTH_DOMAIN=charnoks-209bf.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=charnoks-209bf
VITE_FIREBASE_STORAGE_BUCKET=charnoks-209bf.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1070382903865
VITE_FIREBASE_APP_ID=1:1070382903865:web:e8c72ba1b1d047f50a13e8
VITE_FIREBASE_MEASUREMENT_ID=G-EC89DEYBQR
```

**Optional (for AI features):**
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## ⚠️ **IMPORTANT NOTES:**

1. **NO quotes** around the values in Vercel
2. **NO commas** at the end
3. **Copy exactly** as shown above
4. Your storage bucket `charnoks-209bf.firebasestorage.app` is the **new Firebase format** - this is correct!

## 🚀 **After Adding Variables:**

1. **Redeploy** your app (Vercel will auto-redeploy)
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Test adding a product** with image upload

## 🎯 **Expected Results:**

- ✅ No more CORS errors
- ✅ Product images upload successfully
- ✅ Data saves to Firestore
- ✅ Dashboard shows real data
- ✅ Collections appear in Firebase Console

Your Firebase config is **correct** - the issue was just missing environment variables in Vercel! 🎉