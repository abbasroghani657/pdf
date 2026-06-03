const { Client } = require('pg');

const PROJECT_REF = 'ouclxqbqoepubcudclop';
const DB_PASSWORD = 'Billionaire@123@#657';

async function fixTable(client, table, policies) {
  try {
    for (const p of policies) {
      await client.query(`DROP POLICY IF EXISTS "${p.name}" ON public.${table}`);
      await client.query(`CREATE POLICY "${p.name}" ON public.${table} FOR ${p.for} ${p.clause}`);
    }
    await client.query(`GRANT ALL ON public.${table} TO service_role`);
    await client.query(`GRANT ALL ON public.${table} TO authenticated`);
    await client.query(`GRANT ALL ON public.${table} TO anon`);
    console.log(`✅ Fixed: ${table}`);
  } catch (e) {
    console.error(`❌ Error on ${table}:`, e.message);
  }
}

async function main() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected ✅\n');

  await fixTable(client, 'platform_settings', [
    { name: 'allow_all_platform_settings', for: 'ALL', clause: 'USING (true) WITH CHECK (true)' },
  ]);

  await fixTable(client, 'tools_config', [
    { name: 'allow_select_tools', for: 'SELECT', clause: 'USING (true)' },
    { name: 'allow_insert_tools', for: 'INSERT', clause: 'WITH CHECK (true)' },
    { name: 'allow_update_tools', for: 'UPDATE', clause: 'USING (true)' },
  ]);

  // Also add is_banned column to users table if it doesn't exist
  try {
    await client.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE`);
    console.log('✅ is_banned column ensured on users table');
  } catch(e) {
    console.log('ℹ️  is_banned column already exists or error:', e.message);
  }

  // Add updated_at to support_tickets if not exists
  try {
    await client.query(`ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    console.log('✅ updated_at column ensured on support_tickets table');
  } catch(e) {
    console.log('ℹ️  updated_at column:', e.message);
  }

  const r = await client.query('SELECT COUNT(*) FROM public.users');
  console.log(`\n📊 Total users in DB: ${r.rows[0].count}`);

  await client.end();
  console.log('\n🎉 All remaining RLS policies fixed!');
}

main().catch(e => { console.error(e); process.exit(1); });
