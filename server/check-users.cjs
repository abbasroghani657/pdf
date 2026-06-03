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
    const result = await client.query('SELECT id, email, created_at FROM public.users');
    console.log('Users in DB:');
    console.table(result.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
main();
