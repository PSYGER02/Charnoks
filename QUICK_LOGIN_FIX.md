# 🚨 Quick Login Fix Guide

## 🎯 **Why You're Stuck at Login**

The most common reasons you can't get past the login page:

### **1. No User Account Exists** ❌
- You haven't created any user accounts yet
- The demo accounts don't exist
- Database is empty

### **2. Database Not Set Up** ❌  
- `user_profiles` table doesn't exist
- Database migration failed
- RLS policies blocking access

### **3. Authentication Working But Profile Lookup Fails** ❌
- User exists in `auth.users` but not in `user_profiles`
- Profile creation trigger not working
- Role assignment issues

## 🔍 **Debug Steps**

### **Step 1: Use the Debug Panel**
I've added a debug panel to your login page. You should see it in the top-left corner when you run the app.

1. **Run the app**: `npm run dev`
2. **Go to login page**: You'll see a debug panel
3. **Click "Run Diagnostics"**: This will test everything
4. **Click "Test Demo Login"**: This will try the demo login

### **Step 2: Check What the Debug Panel Shows**

#### **If Supabase Connection Fails:**
```
❌ Supabase Connection: Failed
```
**Fix**: Check your `.env` file has correct values

#### **If User Profiles Table Missing:**
```
❌ User Profiles Table: relation "user_profiles" does not exist
```
**Fix**: Run the database setup SQL

#### **If No Users Exist:**
```
⚠️ Test Demo Login: Demo user does not exist
```
**Fix**: Create your first user account

## 🚀 **Quick Fixes**

### **Fix 1: Create Your First Account**
Instead of trying to login, **create an account first**:

1. Go to `/signup` (or click "Sign Up" link)
2. Create an owner account with:
   - Name: Your Name
   - Email: your@email.com  
   - Password: your_password
3. This should create both the auth user AND the profile

### **Fix 2: Run Simple Database Setup**
If the debug shows table issues, run this simple SQL in Supabase:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Basic policy
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **Fix 3: Manual User Creation**
If signup isn't working, create a user manually in Supabase:

1. **Go to Supabase Dashboard**
2. **Authentication → Users**  
3. **Click "Add User"**
4. **Fill in**:
   - Email: `owner@charnoks.com`
   - Password: `password`
   - Confirm: `password`
5. **Click "Create User"**

Then add the profile manually:
```sql
INSERT INTO public.user_profiles (id, email, display_name, role)
VALUES (
  'user-id-from-auth-users',
  'owner@charnoks.com', 
  'Owner',
  'owner'
);
```

## 🎯 **Expected Flow**

### **Working Login Flow:**
```
1. User enters credentials
2. Supabase auth validates
3. App gets user profile from user_profiles table  
4. User redirected to dashboard based on role
```

### **What's Probably Happening:**
```
1. User enters credentials ✅
2. Supabase auth validates ✅  
3. App tries to get profile ❌ (fails here)
4. Login appears to "hang" or fail
```

## 🔧 **Most Likely Solution**

**99% of the time, the issue is**: You need to create your first user account through signup, not login.

### **Try This:**
1. **Don't use login yet**
2. **Go to signup page** (`/signup`)
3. **Create an owner account**
4. **Then try logging in**

The debug panel will tell you exactly what's wrong! 🎯