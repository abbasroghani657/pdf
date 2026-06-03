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

  // Delete all fake/test payments (historic_user*)
  const del = await client.query(`
    DELETE FROM public.payments 
    WHERE user_email LIKE '%@test.com'
    OR user_email LIKE 'historic_%'
  `);
  console.log(`✅ Deleted ${del.rowCount} fake test payments`);

  // Also delete fake support tickets from test.com emails
  const delTickets = await client.query(`
    DELETE FROM public.support_tickets
    WHERE user_email LIKE '%@example.com'
    OR user_email LIKE '%@test.com'
  `);
  console.log(`✅ Deleted ${delTickets.rowCount} fake test support tickets`);

  // Show what remains
  const payments = await client.query('SELECT user_email, amount, plan, status FROM public.payments ORDER BY created_at');
  console.log('\n💰 Real Payments remaining:');
  console.table(payments.rows);

  const tickets = await client.query('SELECT user_email, subject, status FROM public.support_tickets');
  console.log('\n🎫 Real Support Tickets remaining:');
  console.table(tickets.rows);

  await client.end();
  console.log('\n🎉 Cleanup done! All fake data removed.');
}
main().catch(e => console.error(e));
