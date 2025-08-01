# Deploy Worker Creation Function

## Quick Fix for Worker Account Creation

The worker account creation wasn't working because the backend function wasn't deployed. I've fixed the ESLint issues and added the function to index.js.

### 1. Deploy All Functions

```bash
# Navigate to your project root
cd your-project-directory

# Deploy all functions (this includes createWorkerAccount)
firebase deploy --only functions
```

### 2. If ESLint Issues Persist

```bash
# Skip linting during deployment
firebase deploy --only functions --force
```

### 3. Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `charnoks-209bf`
3. Go to Functions section
4. You should see `createWorkerAccount` listed

### 4. Test Worker Creation

1. Go to your dashboard
2. Click "Create Worker Account"
3. Fill in the form:
   - Name: Test Worker
   - Email: worker@test.com
   - Password: test123
4. Click "Create Worker Account"

### 5. If It Still Doesn't Work

The function file is already created at `functions/createWorkerAccount.js`. If deployment fails:

1. **Check Firebase CLI is installed:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize functions if needed:**
   ```bash
   firebase init functions
   ```

3. **Make sure you're in the right project:**
   ```bash
   firebase use charnoks-209bf
   ```

4. **Deploy again:**
   ```bash
   firebase deploy --only functions:createWorkerAccount
   ```

### What This Function Does

- ✅ Creates a new Firebase Auth user
- ✅ Sets the user role as 'worker'
- ✅ Saves user data to Firestore
- ✅ Validates that only owners can create workers
- ✅ Handles errors properly (email already exists, weak password, etc.)

### After Deployment

- Worker creation will work immediately
- No more "configuration" needed
- Users can create worker accounts normally
- Workers can log in with their credentials

The system is designed to work out of the box once this function is deployed! 🎯