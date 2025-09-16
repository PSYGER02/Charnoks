# Disable Email Verification in Supabase

To allow workers to login immediately without email verification:

## Go to Supabase Dashboard:
1. Open https://supabase.com/dashboard
2. Select your project: `zkuhrvsqslnwvtbgzcii`
3. Go to **Authentication** → **Settings**
4. Find **"Enable email confirmations"**
5. **Turn it OFF**
6. Save changes

This allows all new worker accounts to login immediately without email verification.

## Alternative: Manual Confirmation
If you want to keep email verification enabled, you can manually confirm users:
1. Go to **Authentication** → **Users**
2. Find the worker account
3. Click the user
4. Click **"Confirm user"**