# 🚀 **COMPLETE SUPABASE MIGRATION GUIDE**

## ✅ **WHY SUPABASE IS BETTER FOR YOUR POS SYSTEM:**

- **No complex security rules** - SQL-based permissions
- **Built-in file storage** with automatic CORS handling
- **Real-time subscriptions** out of the box
- **PostgreSQL database** - more powerful than Firestore
- **Easier authentication** setup
- **Better error handling** and debugging

---

## 📋 **STEP 1: CREATE SUPABASE PROJECT**

1. Go to [supabase.com](https://supabase.com)
2. **Sign up** and create a new project
3. Choose a **region** (closest to your users)
4. **Wait 2-3 minutes** for project setup

---

## 🔧 **STEP 2: GET SUPABASE CREDENTIALS**

From your Supabase Dashboard → **Settings** → **API**:

```
Project URL: https://your-project-id.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 **STEP 3: CREATE DATABASE TABLES**

Go to **SQL Editor** in Supabase and run this:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT CHECK (role IN ('owner', 'worker')) DEFAULT 'owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment DECIMAL(10,2) NOT NULL,
  change DECIMAL(10,2) NOT NULL,
  worker_id UUID REFERENCES auth.users(id),
  worker_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  worker_id UUID REFERENCES auth.users(id),
  worker_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table (owner only)
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read/write their own profile
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Products: authenticated users can read, owners can write
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Sales: workers can create their own, owners can see all
CREATE POLICY "Workers can create own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Owners can see all sales" ON public.sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Expenses: workers can create their own, owners can see all
CREATE POLICY "Workers can create own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Owners can see all expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Notes: only owners can access
CREATE POLICY "Only owners can manage notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policy for product images
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

---

## 🔧 **STEP 4: INSTALL SUPABASE CLIENT**

```bash
npm install @supabase/supabase-js
```

---

## 📝 **STEP 5: UPDATE ENVIRONMENT VARIABLES**

Replace your Firebase variables in Vercel with:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key (optional)
```

---

## 🎯 **BENEFITS OF SWITCHING:**

✅ **No more CORS issues** - Supabase handles this automatically  
✅ **No more permission errors** - Clear SQL-based security  
✅ **Better file uploads** - Built-in storage with CDN  
✅ **Real-time updates** - Automatic subscriptions  
✅ **Easier debugging** - Clear error messages  
✅ **PostgreSQL power** - Complex queries, joins, etc.  
✅ **Built-in auth** - No complex user management  

---

## ⚠️ **MIGRATION EFFORT:**

- **Authentication**: Need to update auth hooks (~2 hours)
- **Database calls**: Replace Firestore with Supabase (~3 hours)  
- **File uploads**: Update storage logic (~1 hour)
- **Real-time**: Update subscriptions (~1 hour)

**Total effort: ~1 day of work for a much more reliable system**

Would you like me to start the migration? I can create all the new Supabase service files for you!