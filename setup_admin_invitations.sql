-- Drop table if it exists to ensure a clean state
DROP TABLE IF EXISTS public.admin_invitations;

-- Create the admin_invitations table
CREATE TABLE public.admin_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    invited_email TEXT NOT NULL,
    invited_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
    invited_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invited_by_name TEXT,
    site_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS) - completely secure but allows backend Service Role to bypass
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Manually refresh the PostgREST schema cache so the backend API detects the new table immediately
NOTIFY pgrst, 'reload schema';
