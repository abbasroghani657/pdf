-- ============================================================
-- PDFMaster — Admin Panel Database Tables
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ============================================================
-- 1. TOOLS CONFIG TABLE
-- Controls which tools are active, pro-only, or in maintenance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tools_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  category        TEXT NOT NULL DEFAULT 'General',
  description     TEXT,
  icon            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  requires_pro    BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  free_daily_limit INT DEFAULT 5,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.handle_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_tools_config_updated ON public.tools_config;
CREATE TRIGGER on_tools_config_updated
  BEFORE UPDATE ON public.tools_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_tools_updated_at();

ALTER TABLE public.tools_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tool config"
  ON public.tools_config FOR SELECT
  USING (true);

-- Seed all PDFMaster tools
INSERT INTO public.tools_config (name, slug, category, is_active, requires_pro, free_daily_limit)
VALUES
  ('Compress PDF',        'compress-pdf',       'Optimize',          TRUE, FALSE, 10),
  ('Merge PDF',           'merge-pdf',          'Organize',          TRUE, FALSE, 5),
  ('Split PDF',           'split-pdf',          'Organize',          TRUE, FALSE, 5),
  ('Rotate PDF',          'rotate-pdf',         'Organize',          TRUE, FALSE, 5),
  ('Reorder Pages',       'reorder-pages',      'Organize',          TRUE, FALSE, 5),
  ('Delete Pages',        'delete-pages',       'Organize',          TRUE, FALSE, 5),
  ('PDF to Word',         'pdf-to-word',        'Convert from PDF',  TRUE, TRUE,  3),
  ('PDF to Excel',        'pdf-to-excel',       'Convert from PDF',  TRUE, TRUE,  3),
  ('PDF to PowerPoint',   'pdf-to-powerpoint',  'Convert from PDF',  TRUE, TRUE,  3),
  ('PDF to JPG',          'pdf-to-jpg',         'Convert from PDF',  TRUE, FALSE, 5),
  ('PDF to PNG',          'pdf-to-png',         'Convert from PDF',  TRUE, FALSE, 5),
  ('Word to PDF',         'word-to-pdf',        'Convert to PDF',    TRUE, FALSE, 5),
  ('Excel to PDF',        'excel-to-pdf',       'Convert to PDF',    TRUE, FALSE, 5),
  ('JPG to PDF',          'jpg-to-pdf',         'Convert to PDF',    TRUE, FALSE, 5),
  ('HTML to PDF',         'html-to-pdf',        'Convert to PDF',    TRUE, FALSE, 5),
  ('OCR PDF',             'ocr-pdf',            'AI Tools',          TRUE, TRUE,  3),
  ('Chat with PDF',       'chat-with-pdf',      'AI Tools',          TRUE, TRUE,  3),
  ('Translate PDF',       'translate-pdf',      'AI Tools',          TRUE, TRUE,  3),
  ('Summarize PDF',       'summarize-pdf',      'AI Tools',          TRUE, TRUE,  3),
  ('Rewrite PDF',         'rewrite-pdf',        'AI Tools',          TRUE, TRUE,  3),
  ('Sign PDF',            'sign-pdf',           'Security',          TRUE, TRUE,  2),
  ('Request Signature',   'request-signature',  'Security',          TRUE, TRUE,  2),
  ('Protect PDF',         'protect-pdf',        'Security',          TRUE, TRUE,  3),
  ('Unlock PDF',          'unlock-pdf',         'Security',          TRUE, FALSE, 3),
  ('Watermark PDF',       'watermark-pdf',      'Security',          TRUE, FALSE, 5),
  ('Redact PDF',          'redact-pdf',         'Security',          TRUE, TRUE,  3),
  ('Edit PDF',            'edit-pdf',           'Edit',              TRUE, TRUE,  3),
  ('Annotate PDF',        'annotate-pdf',       'Edit',              TRUE, TRUE,  3),
  ('Flatten PDF',         'flatten-pdf',        'Edit',              TRUE, FALSE, 5),
  ('Crop PDF',            'crop-pdf',           'Edit',              TRUE, FALSE, 5),
  ('Add Page Numbers',    'add-page-numbers',   'Edit',              TRUE, FALSE, 5),
  ('Plagiarism Check',    'plagiarism-check',   'AI Tools',          TRUE, TRUE,  2),
  ('PDF Repair',          'pdf-repair',         'Optimize',          TRUE, TRUE,  3),
  ('Compare PDF',         'compare-pdf',        'Analyze',           TRUE, TRUE,  3),
  ('Extract Text',        'extract-text',       'Analyze',           TRUE, FALSE, 5),
  ('Extract Images',      'extract-images',     'Analyze',           TRUE, FALSE, 5),
  ('PDF Metadata',        'pdf-metadata',       'Analyze',           TRUE, FALSE, 5),
  ('PowerPoint to PDF',  'powerpoint-to-pdf',  'Convert',   TRUE, FALSE, 5),
  ('PDF to HTML',        'pdf-to-html',         'Convert',   TRUE, FALSE, 5),
  ('PDF to Text',        'pdf-to-text',         'Convert',   TRUE, FALSE, 5),
  ('Add blank page',     'add-blank-page',      'Organize',  TRUE, FALSE, 10),
  ('Repair PDF',         'repair-pdf',          'Optimize',  TRUE, FALSE, 5),
  ('Certificate sign',   'certificate-sign',    'Sign',      TRUE, TRUE,  3),
  ('PDF forms',          'pdf-forms',           'Edit',      TRUE, FALSE, 5),
  ('Extract data',       'extract-data',        'AI',        TRUE, TRUE,  3)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 2. SUPPORT TICKETS TABLE
-- Stores user-submitted support tickets and admin replies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email      TEXT NOT NULL,
  subject         TEXT NOT NULL,
  message         TEXT NOT NULL,
  category        TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'bug', 'feature', 'account')),
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed', 'resolved')),
  admin_reply     TEXT,
  replied_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_updated ON public.support_tickets;
CREATE TRIGGER on_ticket_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Insert sample tickets for testing
INSERT INTO public.support_tickets (user_email, subject, message, category, priority, status)
VALUES
  ('test@example.com', 'Payment not working on Stripe', 'Hi team, I am trying to upgrade to Pro but my card keeps getting declined on the Stripe checkout page. Can you please check?', 'billing', 'high', 'open'),
  ('user@example.com', 'OCR failed my Arabic PDF', 'The OCR tool is not recognizing Arabic text correctly. The output is garbled characters instead of proper Arabic.', 'bug', 'medium', 'open'),
  ('another@example.com', 'How to use Translate API?', 'Hi, I am on the Business plan and wanted to know if I can use your Translate feature via API for my app.', 'general', 'low', 'open')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. AUDIT LOGS TABLE
-- Tracks all admin actions for accountability
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email      TEXT,
  action          TEXT NOT NULL,
  resource        TEXT,
  resource_id     TEXT,
  ip_address      TEXT,
  status          TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Only service_role (backend) can write audit logs

-- Insert sample audit entries
INSERT INTO public.audit_logs (user_email, action, resource, status)
VALUES
  ('abbasroghani869@gmail.com', 'Logged into admin panel', 'auth', 'success'),
  ('abbasroghani869@gmail.com', 'Viewed all users list', 'users', 'success'),
  ('abbasroghani869@gmail.com', 'Updated tool config: Chat with PDF', 'tools_config', 'success')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. EMAIL LOGS TABLE
-- Tracks all emails sent from the platform
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id              BIGSERIAL PRIMARY KEY,
  recipient       TEXT NOT NULL,
  subject         TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'transactional',
  status          TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  opened          BOOLEAN DEFAULT FALSE,
  clicked         BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. PLATFORM SETTINGS TABLE
-- Key-value store for global platform configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key             TEXT PRIMARY KEY,
  value           TEXT NOT NULL,
  description     TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Seed default settings
INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('pro_monthly_price',  '4.99',   'Pro plan monthly price in USD'),
  ('pro_annual_price',   '44.99',  'Pro plan annual price in USD'),
  ('free_file_size_limit', '10',   'Free tier max file size in MB'),
  ('pro_file_size_limit',  '100',  'Pro tier max file size in MB'),
  ('site_name',          'PDFMaster', 'Platform name'),
  ('maintenance_mode',   'false',  'Global maintenance mode toggle'),
  ('allow_registrations', 'true',  'Allow new user registrations'),
  ('support_email',      'support@pdfmaster.com', 'Public support email')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tools_config_slug   ON public.tools_config(slug);
CREATE INDEX IF NOT EXISTS idx_tools_config_active ON public.tools_config(is_active);
CREATE INDEX IF NOT EXISTS idx_tickets_status      ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user        ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent     ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created    ON public.payments(created_at DESC);


-- ============================================================
-- 7. PAYMENTS TABLE
-- Tracks all Pro upgrade purchases (real & mock Stripe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email        TEXT,
  plan              TEXT NOT NULL DEFAULT 'Pro Monthly',
  amount            NUMERIC(10,2) NOT NULL DEFAULT 4.99,
  status            TEXT NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  stripe_session_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read all payments"
  ON public.payments FOR SELECT
  USING (true);


-- ============================================================
-- 8. GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON public.tools_config TO service_role;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.platform_settings TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.admin_invitations TO service_role;
GRANT SELECT ON public.tools_config TO authenticated, anon;
GRANT INSERT, SELECT ON public.support_tickets TO authenticated;


-- ============================================================
-- 9. ADMIN INVITATIONS TABLE
-- Token-based pending invitations for Admin/SuperAdmin roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token            TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_email    TEXT NOT NULL,
  invited_user_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL DEFAULT 'admin'
                   CHECK (role IN ('admin', 'superadmin')),
  invited_by_id    UUID,
  invited_by_name  TEXT,
  site_url         TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  accepted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage invitations"
  ON public.admin_invitations FOR ALL
  USING (true);

CREATE INDEX IF NOT EXISTS idx_invitations_token  ON public.admin_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email  ON public.admin_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.admin_invitations(status);


-- ============================================================
-- DONE! All admin tables created successfully.
-- ============================================================

