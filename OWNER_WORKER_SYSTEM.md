# 👑 Owner-Worker System Guide

## 🎯 **How the System Works**

### **Owner Account (Business Owner)**
- **Created**: Through signup page (`/signup`)
- **Role**: `'owner'` in database
- **Access**: Full system access - can see ALL data
- **Capabilities**:
  - Create worker accounts
  - View all sales from all workers
  - View all expenses from all workers
  - Manage products and inventory
  - Access analytics and reports
  - Manage business settings

### **Worker Account (Employee)**
- **Created**: By owner through settings page (`/owner/settings`)
- **Role**: `'worker'` in database
- **Access**: Limited access - can only see their own data
- **Capabilities**:
  - Record sales transactions
  - Record their own expenses
  - View products (read-only)
  - Access their personal dashboard

---

## 🔄 **Data Flow: Worker → Owner**

### **Sales Data Flow**:
```
1. Worker logs in → Worker Dashboard
2. Worker records sale → Data saved with worker_id
3. Owner logs in → Owner Dashboard
4. Owner sees ALL sales (including worker's sales)
```

### **Expense Data Flow**:
```
1. Worker records expense → Data saved with worker_id
2. Owner views expenses → Sees all worker expenses
3. Owner can track business costs by worker
```

### **Product Management**:
```
1. Owner manages products → All workers see updated inventory
2. Worker makes sale → Stock automatically decremented
3. Owner sees real-time inventory changes
```

---

## 🏗️ **Database Structure**

### **User Profiles Table**:
```sql
user_profiles:
- id (UUID) - Links to auth.users
- email (TEXT)
- display_name (TEXT)
- role ('owner' | 'worker')
- created_at, updated_at
```

### **Sales Table**:
```sql
sales:
- id (UUID)
- items (JSONB) - Products sold
- total (DECIMAL)
- worker_id (UUID) - Links to user who made sale
- worker_name (TEXT) - For easy display
- created_at
```

### **Row Level Security (RLS)**:
- **Owners**: Can see ALL data across all tables
- **Workers**: Can only see their own sales/expenses
- **Products**: Readable by all, manageable by owners only

---

## 🚀 **Step-by-Step Setup**

### **1. Create Owner Account**
```
1. Go to /signup
2. Fill in owner details
3. Account created with role: 'owner'
4. Redirected to /owner/dashboard
```

### **2. Create Worker Accounts**
```
1. Owner goes to /owner/settings
2. Scroll to "Create Worker Account" section
3. Fill in worker details
4. Worker account created with role: 'worker'
5. Worker can now log in with provided credentials
```

### **3. Worker Daily Operations**
```
1. Worker logs in → /worker/dashboard
2. Worker records sales → Data linked to their ID
3. Worker records expenses → Data linked to their ID
4. All data flows to owner's dashboard
```

### **4. Owner Monitoring**
```
1. Owner logs in → /owner/dashboard
2. Owner sees aggregated data from ALL workers
3. Owner can view individual worker performance
4. Owner manages business operations
```

---

## 🔧 **Current Issues & Fixes**

### **Issue 1: Login Redirect** ✅ FIXED
**Problem**: After login, users weren't redirected to dashboard
**Solution**: Updated LoginPage.tsx to redirect based on user role

### **Issue 2: Worker Creation** ✅ FIXED
**Problem**: SettingsPage had wrong function name
**Solution**: Changed `createWorker` to `createWorkerAccount`

### **Issue 3: API Endpoint** ✅ READY
**Problem**: Worker creation needs admin privileges
**Solution**: Created `/api/createWorkerAccount` endpoint

---

## 📋 **Testing Checklist**

### **Owner Account Testing**:
- [ ] Can sign up as owner
- [ ] Redirected to `/owner/dashboard` after login
- [ ] Can access all owner pages
- [ ] Can create worker accounts in settings
- [ ] Can see all sales and expenses

### **Worker Account Testing**:
- [ ] Owner can create worker account
- [ ] Worker can log in with provided credentials
- [ ] Worker redirected to `/worker/dashboard`
- [ ] Worker can record sales
- [ ] Worker can record expenses
- [ ] Worker data appears in owner dashboard

### **Data Flow Testing**:
- [ ] Worker sales appear in owner analytics
- [ ] Worker expenses appear in owner reports
- [ ] Real-time updates work correctly
- [ ] Role-based permissions enforced

---

## 🎯 **Business Logic**

### **Why This Structure?**
1. **Centralized Control**: Owner has oversight of entire business
2. **Employee Accountability**: Each transaction linked to specific worker
3. **Real-time Monitoring**: Owner sees business performance instantly
4. **Scalable**: Can add unlimited workers under one owner
5. **Secure**: Workers can't see other workers' data

### **Real-World Usage**:
```
Restaurant Example:
- Owner: Restaurant manager/owner
- Workers: Cashiers, waiters, kitchen staff
- Data Flow: Staff records orders → Owner sees daily revenue
- Analytics: Owner tracks performance by employee
```

---

## 🔐 **Security Features**

### **Authentication**:
- JWT tokens for session management
- Role-based access control
- Automatic session refresh

### **Authorization**:
- Row Level Security (RLS) in database
- API endpoints verify user permissions
- Client-side route protection

### **Data Isolation**:
- Workers can only access their own data
- Owners can access all business data
- No cross-worker data visibility

---

## 🚨 **Important Notes**

### **Environment Variables Required**:
```bash
# For Vercel deployment
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For worker creation
GEMINI_API_KEY=your_gemini_key  # For AI features
```

### **Database Setup**:
1. Run `supabase-setup.sql` in Supabase SQL Editor
2. Verify all tables and policies are created
3. Test RLS policies work correctly

### **Production Deployment**:
1. Set all environment variables in Vercel
2. Deploy updated code
3. Test authentication flow
4. Create test owner and worker accounts

---

## 🎉 **Expected User Experience**

### **Owner Experience**:
1. **Sign up** → Create business account
2. **Dashboard** → See business overview
3. **Settings** → Create worker accounts
4. **Analytics** → Monitor all business data
5. **Management** → Control products, view reports

### **Worker Experience**:
1. **Login** → Use credentials provided by owner
2. **Dashboard** → See personal performance
3. **Sales** → Record transactions quickly
4. **Expenses** → Track business expenses
5. **Limited Access** → Focus on daily tasks

---

*This system creates a perfect hierarchy where workers handle daily operations and owners monitor the entire business! 🏢*