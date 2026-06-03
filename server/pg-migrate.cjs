const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '..', 'admin-tables-setup.sql');
const PROJECT_REF = 'ouclxqbqoepubcudclop';
const DB_PASSWORD = 'Billionaire@123@#657';

async function main() {
  console.log('\n🚀 PDFMaster — PostgreSQL Migration (eu-west-1)');
  console.log('=================================================\n');

  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    process.stdout.write('Connecting to Supabase... ');
    await client.connect();
    console.log('✅ Connected!');

    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('\n📦 Running SQL migration...');
    await client.query(sql);
    console.log('✅ Migration completed!\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tools_config','support_tickets','audit_logs','email_logs','platform_settings')
      ORDER BY table_name;
    `);

    console.log('📋 Tables created:');
    result.rows.forEach(r => console.log(`   ✅ ${r.table_name}`));

    // Count tools seeded
    const toolsCount = await client.query('SELECT COUNT(*) FROM public.tools_config');
    console.log(`\n   🛠️  Tools seeded: ${toolsCount.rows[0].count}`);

    const ticketsCount = await client.query('SELECT COUNT(*) FROM public.support_tickets');
    console.log(`   🎫  Sample tickets: ${ticketsCount.rows[0].count}`);

    const settingsCount = await client.query('SELECT COUNT(*) FROM public.platform_settings');
    console.log(`   ⚙️   Settings entries: ${settingsCount.rows[0].count}`);

    await client.end();

    console.log('\n🎉 ALL DONE! Admin panel is 100% real-time ready.');
    console.log('   Go check your Admin Panel now!');
    
  } catch (err) {
    await client.end().catch(() => {});
    console.error('\n❌ Migration error:', err.message);
  }
}

main();
