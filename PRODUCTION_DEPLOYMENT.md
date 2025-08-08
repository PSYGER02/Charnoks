# 🚀 Production Deployment Guide

## Prerequisites

1. **Firebase Project**: Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Step 1: Firebase Setup

### 1.1 Enable Services
In your Firebase console:
- Enable **Authentication** (Email/Password)
- Enable **Firestore Database**
- Enable **Storage**
- Enable **Functions**

### 1.2 Get Configuration
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Copy the Firebase config values

## Step 2: Deploy Firebase Backend

### 2.1 Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2.2 Initialize Firebase (if not done)
```bash
firebase init
# Select: Functions, Firestore, Storage
```

### 2.3 Deploy Backend
```bash
# Option 1: Use our deployment script
./deploy.sh  # Linux/Mac
deploy.bat   # Windows

# Option 2: Manual deployment
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,storage:rules,functions
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Connect Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select "Vite" as framework preset

### 3.2 Set Environment Variables
In Vercel dashboard, add these environment variables:

**Firebase Configuration:**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**AI Configuration:**
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3.3 Deploy
```bash
# If you have Vercel CLI
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

## Step 4: Initial Setup

### 4.1 Create Owner Account
1. Visit your deployed application
2. Click "Sign Up" 
3. Create your owner account
4. This will be your main admin account

### 4.2 Test Core Features
1. **Products**: Add a test product with image
2. **Sales**: Record a test sale
3. **Dashboard**: Verify data appears correctly
4. **Worker Account**: Create a test worker account

## Step 5: Production Configuration

### 5.1 Security Rules
The system includes production-ready security rules:
- Owners have full access
- Workers can only create their own sales/expenses
- Proper role-based access control

### 5.2 Performance Optimization
- Images are optimized and cached
- Data loading uses intelligent caching
- Error handling with retry logic
- Responsive design for all devices

## Step 6: Monitoring & Maintenance

### 6.1 Firebase Console
Monitor your app at:
- **Authentication**: User management
- **Firestore**: Database usage
- **Functions**: Backend performance
- **Storage**: File uploads

### 6.2 Vercel Dashboard
Monitor deployment at:
- **Analytics**: Usage statistics
- **Functions**: API performance
- **Logs**: Error tracking

## Troubleshooting

### Common Issues

**1. "Firebase configuration missing"**
- Ensure all VITE_FIREBASE_* variables are set in Vercel
- Check that values don't contain placeholder text

**2. "Permission denied" errors**
- Verify Firebase rules are deployed
- Check user roles in Firestore console

**3. "AI features not working"**
- Ensure GEMINI_API_KEY is set in Vercel
- Check API quota in Google AI Studio

**4. "Images not uploading"**
- Verify Storage rules are deployed
- Check Firebase Storage is enabled

### Getting Help

1. **Check browser console** for detailed error messages
2. **Check Firebase console** for backend errors
3. **Check Vercel logs** for deployment issues
4. **Verify environment variables** are correctly set

## Success Checklist

- [ ] Firebase project created and configured
- [ ] Firebase Functions deployed successfully
- [ ] Firestore and Storage rules deployed
- [ ] Vercel environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] Owner account created successfully
- [ ] Products can be added with images
- [ ] Sales can be recorded
- [ ] Dashboard shows real data
- [ ] Worker accounts can be created
- [ ] AI assistant responds to queries

## Next Steps

Once deployed successfully:

1. **Add Real Data**: Replace test data with your actual products
2. **Train Staff**: Show workers how to use the system
3. **Backup Strategy**: Set up regular data backups
4. **Monitor Usage**: Keep an eye on Firebase quotas
5. **Scale Up**: Upgrade Firebase plan as needed

Your Charnoks POS system is now production-ready! 🎉