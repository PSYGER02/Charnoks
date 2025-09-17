-- Fix user_profiles table population
-- Run this in Supabase SQL Editor

-- First, check if any users exist in auth.users but not in user_profiles
INSERT INTO public.user_profiles (id, email, display_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'display_name',
        au.raw_user_meta_data->>'full_name', 
        split_part(au.email, '@', 1)
    ) as display_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'owner') = 0 THEN 'owner'
        ELSE COALESCE(au.raw_user_meta_data->>'role', 'worker')
    END as role
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Update existing profiles with proper display names if missing
UPDATE public.user_profiles 
SET display_name = COALESCE(
    (SELECT au.raw_user_meta_data->>'display_name' FROM auth.users au WHERE au.id = user_profiles.id),
    (SELECT au.raw_user_meta_data->>'full_name' FROM auth.users au WHERE au.id = user_profiles.id),
    (SELECT split_part(au.email, '@', 1) FROM auth.users au WHERE au.id = user_profiles.id),
    'User'
)
WHERE display_name IS NULL OR display_name = '';