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

  await client.connect();

  // Show all payments
  const payments = await client.query('SELECT id, user_email, amount, plan, status, created_at FROM public.payments ORDER BY created_at');
  console.log('\n💰 Payments in DB:');
  console.table(payments.rows);
  console.log(`Total rows: ${payments.rows.length}`);

  await client.end();
}
main().catch(e => console.error(e));
