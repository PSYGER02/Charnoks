# ⚡ Quick Start Guide

## 🚀 Get Your POS System Running in 10 Minutes

### Step 1: Set Environment Variables in Vercel (2 minutes)

In your Vercel dashboard, add these environment variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
GEMINI_API_KEY=your_gemini_api_key
```

### Step 2: Deploy Firebase Backend (3 minutes)

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Deploy backend
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,storage:rules,functions
```

### Step 3: Deploy to Vercel (2 minutes)

```bash
# Build and deploy
npm run build
# Push to main branch or use Vercel CLI
```

### Step 4: Create Your Account (1 minute)

1. Visit your Vercel URL
2. Click "Sign Up"
3. Create your owner account

### Step 5: Test the System (2 minutes)

1. **Add a Product**: Go to Products → Add product with image
2. **Record a Sale**: Go to Sales → Record a test transaction
3. **Check Dashboard**: Verify data appears correctly
4. **Create Worker**: Use "Create Worker Account" button

## ✅ You're Done!

Your POS system is now fully functional with:
- ✅ User authentication (Owner/Worker roles)
- ✅ Product management with images
- ✅ Sales recording and tracking
- ✅ Expense management
- ✅ Real-time dashboard with analytics
- ✅ AI-powered business assistant
- ✅ Secure data storage
- ✅ Mobile-responsive design

## 🎯 What's Working Now

### For Owners:
- Complete dashboard with sales analytics
- Product management (add, edit, view)
- Sales and expense tracking
- Worker account creation
- AI business assistant
- Internal notes and logs
- Advanced analytics and reports

### For Workers:
- Simplified dashboard
- Record sales transactions
- Record expenses
- View their own activity

### Technical Features:
- Role-based security
- Real-time data sync
- Image upload and storage
- Error handling with retry logic
- Responsive design
- Production-ready architecture

## 🔧 Need Help?

Check `PRODUCTION_DEPLOYMENT.md` for detailed troubleshooting and configuration options.

**Common Issues:**
- **"Configuration missing"**: Check Vercel environment variables
- **"Permission denied"**: Ensure Firebase rules are deployed
- **"Images not uploading"**: Verify Storage rules are deployed

Your Charnoks POS system is production-ready! 🎉