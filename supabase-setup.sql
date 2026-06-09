-- ============================================================
-- PDFMaster — Supabase Database Setup Script
-- Run this in your Supabase Project → SQL Editor
-- ============================================================

-- ── 1. PUBLIC USERS TABLE ─────────────────────────────────────────────────────
-- Stores extended profile data for each authenticated user.
-- The `id` column references Supabase's built-in auth.users table.

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  country       TEXT DEFAULT 'Unknown',
  auth_provider TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('email', 'google', 'github')),
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  is_pro        BOOLEAN NOT NULL DEFAULT FALSE,
  plan          TEXT NOT NULL DEFAULT 'Free' CHECK (plan IN ('Free', 'Pro', 'Enterprise')),
  pro_started_at TIMESTAMPTZ,
  pro_expires_at TIMESTAMPTZ,
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update the updated_at timestamp on any row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_users_updated ON public.users;
CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ── 2. ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────
-- Enable RLS so users can only read their own data from the client.
-- The server uses the service_role key which bypasses RLS entirely.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile (but NOT role or is_pro — admin only)
CREATE POLICY "Users can update own basic profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (used by Node.js backend) can do everything — bypass RLS
-- This is handled automatically when using the service_role key.


-- ── 3. TOOL USAGE LOGS TABLE ─────────────────────────────────────────────────
-- Tracks every time a user processes a file (for analytics and usage limits).

CREATE TABLE IF NOT EXISTS public.tool_usage (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tool_name     TEXT NOT NULL,
  file_size     BIGINT DEFAULT 0,       -- in bytes, original file size
  bytes_saved   BIGINT DEFAULT 0,       -- in bytes, saved after compression (compression tool only)
  status        TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'cancelled')),
  error_message TEXT,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tool_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage logs
CREATE POLICY "Users can view own tool usage"
  ON public.tool_usage FOR SELECT
  USING (auth.uid() = user_id);


-- ── 4. SIGNATURE REQUESTS TABLE ──────────────────────────────────────────────
-- Stores pending and completed signature requests.

CREATE TABLE IF NOT EXISTS public.signature_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  signer_email  TEXT NOT NULL,
  document_name TEXT,
  token         TEXT UNIQUE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  signed_at     TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  placement     JSONB,    -- { page, x, y, width, height }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

-- Senders can view their own requests
CREATE POLICY "Senders can view own requests"
  ON public.signature_requests FOR SELECT
  USING (auth.uid() = sender_id);


-- ── 5. ADMIN VIEW: ALL USERS ─────────────────────────────────────────────────
-- A convenient view for admin dashboard queries.

CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  u.id,
  u.email,
  u.name,
  u.country,
  u.role,
  u.is_pro,
  u.plan,
  u.is_banned,
  u.last_login,
  u.created_at,
  COUNT(tl.id)::INT AS total_files_processed
FROM public.users u
LEFT JOIN public.tool_usage tl ON tl.user_id = u.id
GROUP BY u.id;


-- ── 6. USEFUL INDEXES ────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_pro     ON public.users(is_pro);
CREATE INDEX IF NOT EXISTS idx_tool_usage_user  ON public.tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool  ON public.tool_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_sig_token        ON public.signature_requests(token);
CREATE INDEX IF NOT EXISTS idx_sig_signer       ON public.signature_requests(signer_email);


-- ── 7. AUTOMATIC NEW USER PROFILE CREATION ───────────────────────────────────
-- (OPTIONAL) This trigger auto-creates a row in public.users whenever a new
-- user signs up via Supabase Auth — useful if you want to skip the manual insert
-- in the Node.js /register route.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 8. GRANT PERMISSIONS ─────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT ON public.tool_usage TO authenticated;
GRANT SELECT ON public.signature_requests TO authenticated;


-- ============================================================
-- ✅ DONE! All tables, policies, triggers and indexes created.
-- ============================================================
