-- Update existing users with display names
-- Run this in Supabase SQL Editor

-- Update auth.users metadata for existing users who don't have display_name
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('display_name', split_part(email, '@', 1))
WHERE raw_user_meta_data->>'display_name' IS NULL;

-- Also populate user_profiles table
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
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email;