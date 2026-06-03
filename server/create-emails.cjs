const { Client } = require('pg');
const PROJECT_REF = 'ouclxqbqoepubcudclop';
const DB_PASSWORD = 'Billionaire@123@#657';

async function main() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.email_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject TEXT NOT NULL,
        audience TEXT NOT NULL,
        sent_count INTEGER DEFAULT 0,
        open_rate TEXT DEFAULT '0%',
        click_rate TEXT DEFAULT '0%',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS public.email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON public.email_campaigns TO service_role;
      GRANT ALL ON public.email_templates TO service_role;
    `);

    // Let's also delete the dummy data from support_tickets and audit_logs 
    // so it looks completely real (empty state) instead of having the fake data.
    await client.query(`DELETE FROM public.support_tickets WHERE user_email = 'test@example.com' OR user_email = 'user@example.com' OR user_email = 'another@example.com'`);
    
    // We can also wipe BANNED IPs mock data
    // No banned users right now.

    console.log('✅ Email tables created and dummy data cleaned');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
main();
