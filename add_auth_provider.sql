-- Run this in Supabase SQL Editor if your DB is already live
-- Adds the auth_provider column to existing users table
 
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email' 
CHECK (auth_provider IN ('email', 'google', 'github'));
 
-- Update any existing OAuth users who have country='Unknown' and came via Google
-- (Optional: manually set provider for any users you know signed up via Google)
UPDATE public.users SET auth_provider = 'google' WHERE country = 'Unknown';
