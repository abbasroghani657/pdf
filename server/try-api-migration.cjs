// Direct DB setup via Supabase Management API
const https = require('https');

const PROJECT_REF = 'ouclxqbqoepubcudclop';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Y2x4cWJxb2VwdWJjdWRjbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTcyOTAzMywiZXhwIjoyMDk1MzA1MDMzfQ.rrEfqNSR1cV_hL3wWvSwubgU3TfqzTgp5kf6H2OJRH8';

const SQL = `
CREATE TABLE IF NOT EXISTS public.tools_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'General',
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_pro BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  free_daily_limit INT DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tools_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "read_tools" ON public.tools_config FOR SELECT USING (true);

INSERT INTO public.tools_config (name, slug, category, is_active, requires_pro, free_daily_limit) VALUES
  ('Compress PDF','compress-pdf','Optimize',true,false,10),
  ('Merge PDF','merge-pdf','Organize',true,false,5),
  ('Split PDF','split-pdf','Organize',true,false,5),
  ('Rotate PDF','rotate-pdf','Organize',true,false,5),
  ('PDF to Word','pdf-to-word','Convert from PDF',true,true,3),
  ('PDF to Excel','pdf-to-excel','Convert from PDF',true,true,3),
  ('PDF to JPG','pdf-to-jpg','Convert from PDF',true,false,5),
  ('Word to PDF','word-to-pdf','Convert to PDF',true,false,5),
  ('JPG to PDF','jpg-to-pdf','Convert to PDF',true,false,5),
  ('HTML to PDF','html-to-pdf','Convert to PDF',true,false,5),
  ('OCR PDF','ocr-pdf','AI Tools',true,true,3),
  ('Chat with PDF','chat-with-pdf','AI Tools',true,true,3),
  ('Translate PDF','translate-pdf','AI Tools',true,true,3),
  ('Summarize PDF','summarize-pdf','AI Tools',true,true,3),
  ('Sign PDF','sign-pdf','Security',true,true,2),
  ('Request Signature','request-signature','Security',true,true,2),
  ('Protect PDF','protect-pdf','Security',true,true,3),
  ('Unlock PDF','unlock-pdf','Security',true,false,3),
  ('Watermark PDF','watermark-pdf','Security',true,false,5),
  ('Edit PDF','edit-pdf','Edit',true,true,3),
  ('Annotate PDF','annotate-pdf','Edit',true,true,3),
  ('Flatten PDF','flatten-pdf','Edit',true,false,5),
  ('Plagiarism Check','plagiarism-check','AI Tools',true,true,2),
  ('Extract Text','extract-text','Analyze',true,false,5),
  ('PDF Metadata','pdf-metadata','Analyze',true,false,5)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general','billing','bug','feature','account')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','pending','closed','resolved')),
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "create_tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "view_own_tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);

INSERT INTO public.support_tickets (user_email, subject, message, category, priority, status) VALUES
  ('test@example.com','Payment not working on Stripe','My card keeps getting declined on the Stripe checkout page.','billing','high','open'),
  ('user@example.com','OCR failed my Arabic PDF','The OCR tool is not recognizing Arabic text correctly.','bug','medium','open'),
  ('another@example.com','How to use Translate API?','I am on Business plan and want to use Translate via API.','general','low','open')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success','error')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

INSERT INTO public.audit_logs (user_email, action, resource, status) VALUES
  ('abbasroghani869@gmail.com','Admin panel accessed','auth','success'),
  ('abbasroghani869@gmail.com','Viewed all users','users','success')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.email_logs (
  id BIGSERIAL PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'transactional',
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','bounced')),
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('pro_monthly_price','4.99','Pro plan monthly price in USD'),
  ('pro_annual_price','44.99','Pro plan annual price in USD'),
  ('free_file_size_limit','10','Free tier max file size in MB'),
  ('pro_file_size_limit','100','Pro tier max file size in MB'),
  ('site_name','PDFMaster','Platform name'),
  ('maintenance_mode','false','Global maintenance mode'),
  ('allow_registrations','true','Allow new user signups'),
  ('support_email','support@pdfmaster.com','Public support email')
ON CONFLICT (key) DO NOTHING;

GRANT ALL ON public.tools_config TO service_role;
GRANT ALL ON public.support_tickets TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.platform_settings TO service_role;
GRANT SELECT ON public.tools_config TO authenticated, anon;
GRANT INSERT, SELECT ON public.support_tickets TO authenticated;
`;

function postRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: responseData }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🚀 Trying Supabase Management API...\n');

  // Try 1: Management API with service_role key
  try {
    const result = await postRequest(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      { query: 'SELECT 1 as test' }
    );
    console.log('Management API response:', result.status, result.body.slice(0, 200));
    
    if (result.status === 200) {
      console.log('\n✅ Management API works! Running full SQL migration...');
      const migResult = await postRequest(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        { query: SQL }
      );
      console.log('Migration result:', migResult.status, migResult.body.slice(0, 500));
    }
  } catch (e) {
    console.log('Management API error:', e.message);
  }

  // Try 2: Direct project REST API SQL endpoint
  try {
    const result = await postRequest(
      `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
      {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      { sql: 'SELECT 1 as test' }
    );
    console.log('\nDirect exec_sql response:', result.status, result.body.slice(0, 200));
  } catch (e) {
    console.log('Direct exec_sql error:', e.message);
  }

  console.log('\n📋 RESULT:');
  console.log('The Supabase Management API requires a PERSONAL ACCESS TOKEN (not service_role key).');
  console.log('You need to run admin-tables-setup.sql manually in the Supabase SQL Editor.\n');
  console.log('👉 Steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/ouclxqbqoepubcudclop/sql/new');
  console.log('2. Copy ALL content from: admin-tables-setup.sql');
  console.log('3. Paste in the SQL editor and click RUN');
  console.log('4. Then run: node server/run-db-setup.cjs');
}

main();
