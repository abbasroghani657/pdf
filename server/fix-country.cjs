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

  await client.query("UPDATE public.users SET country = 'Pakistan'");
  console.log('Fixed DB entries');

  const res = await client.query('SELECT id, email, country FROM public.users');
  console.table(res.rows);

  await client.end();
}
main().catch(e => console.error(e));
