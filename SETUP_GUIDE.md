# POS System Setup Guide

This guide will help you fix the configuration issues and get your POS system running properly.

## Current Issues Identified

Based on the screenshots and code analysis, the following issues have been identified:

1. **Configuration Issues**: Environment variables contain placeholder values
2. **Firebase Connection**: Backend functions are not properly deployed or configured
3. **Missing Data**: No real data is being loaded from Firebase
4. **User Management**: Worker account creation is not implemented
5. **Error Handling**: Components don't handle errors gracefully

## Step-by-Step Fix Instructions

### Phase 1: Fix Environment Configuration

#### 1.1 Update Firebase Configuration

1. **Get your Firebase project credentials:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the configuration values

2. **Update `.env.local` file:**
   ```bash
   # Replace these placeholder values with your actual Firebase config
   VITE_FIREBASE_API_KEY=your_actual_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_actual_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
   ```

3. **For Vercel deployment:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add all the VITE_FIREBASE_* variables with your actual values

#### 1.2 Setup Gemini AI (Optional but recommended)

1. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key (starts with "AI...")

2. **Add to environment:**
   ```bash
   # Add to .env.local
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **For Vercel:**
   - Add GEMINI_API_KEY in Vercel environment variables

### Phase 2: Deploy Firebase Functions

#### 2.1 Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### 2.2 Initialize Firebase (if not done)
```bash
firebase init
# Select:
# - Functions
# - Firestore
# - Storage
# - Hosting (optional)
```

#### 2.3 Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:getOwnerDashboard,functions:getProducts
```

#### 2.4 Set Environment Variables for Functions
```bash
# Set Gemini API key for cloud functions
firebase functions:config:set gemini.api_key="your_gemini_api_key"

# Deploy functions again to use the new config
firebase deploy --only functions
```

### Phase 3: Fix Firestore Security Rules

Update your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products - owners can write, authenticated users can read
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    // Sales - authenticated users can read/write
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
    
    // Expenses - authenticated users can read/write
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null;
    }
    
    // Notes - only owners can access
    match /notes/{noteId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

### Phase 4: Test the System

#### 4.1 Check Configuration Status
1. Start your development server: `npm run dev`
2. Navigate to the dashboard
3. Click "System Status" button
4. Verify all services show as "Valid" and "Connected"

#### 4.2 Test Data Loading
1. Go to Products page
2. Try adding a product
3. Verify it appears in the list
4. Check the dashboard for updated data

#### 4.3 Test Error Handling
1. Temporarily break your Firebase config
2. Verify error messages appear with retry buttons
3. Fix the config and test retry functionality

### Phase 5: Add Sample Data (Optional)

If you want to populate your system with sample data for testing:

1. **Create sample products:**
   - Go to Products page
   - Add a few test products with images

2. **Create sample sales:**
   - Go to Sales page
   - Record a few test sales

3. **Check dashboard:**
   - Verify data appears on the dashboard
   - Check that charts and KPIs are populated

## Troubleshooting Common Issues

### Issue: "Failed to load products"
**Cause:** Firebase functions not deployed or configuration issues
**Solution:**
1. Check Firebase console for function deployment status
2. Verify environment variables are set correctly
3. Check browser console for detailed error messages
4. Ensure Firestore rules allow read access

### Issue: "No workers found"
**Cause:** User management functions not implemented
**Solution:**
1. Deploy the user management cloud functions
2. Ensure proper authentication is set up
3. Check Firestore rules for user collection access

### Issue: Dashboard shows no data
**Cause:** No sales data or Firebase connection issues
**Solution:**
1. Add some sample sales data
2. Check Firebase connection status
3. Verify cloud functions are working
4. Check browser network tab for failed requests

### Issue: AI features not working
**Cause:** Gemini API key not configured
**Solution:**
1. Get a valid Gemini API key
2. Add it to environment variables
3. Redeploy cloud functions
4. Test AI functionality

## Verification Checklist

- [ ] Firebase configuration updated with real values
- [ ] Environment variables set in Vercel (for production)
- [ ] Firebase functions deployed successfully
- [ ] Firestore security rules updated and deployed
- [ ] Gemini API key configured (optional)
- [ ] Products page loads without errors
- [ ] Dashboard displays data correctly
- [ ] Error handling works (retry buttons, error messages)
- [ ] System status shows all green

## Getting Help

If you continue to experience issues:

1. **Check the browser console** for detailed error messages
2. **Check Firebase console** for function logs and errors
3. **Use the System Status** button to diagnose configuration issues
4. **Check network tab** in browser dev tools for failed API calls

## Next Steps

Once the basic system is working:

1. **Add real product data** to replace any mock data
2. **Set up user management** for worker accounts
3. **Configure backup systems** for data protection
4. **Set up monitoring** for production use
5. **Customize the UI** to match your business needs

The enhanced error handling system will now provide better feedback when issues occur, making it easier to diagnose and fix problems in the future.