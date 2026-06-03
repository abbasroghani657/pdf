const { Client } = require('pg');
const PROJECT_REF = 'ouclxqbqoepubcudclop';
const DB_PASSWORD = 'Billionaire@123@#657';

const regions = [
  'us-east-1', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'sa-east-1', 'ca-central-1'
];

async function findRegion() {
  console.log('Searching for correct pooler region...\n');
  
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    process.stdout.write(`Trying ${region}... `);
    
    const client = new Client({
      host,
      port: 6543,
      user: `postgres.${PROJECT_REF}`,
      password: DB_PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log('✅ Found!');
      await client.end();
      return host;
    } catch (e) {
      if (e.message.includes('Tenant or user not found') || e.code === 'ENOTFOUND') {
        console.log('❌ ' + e.message);
      } else {
        console.log('⚠️ ' + e.message); // This might be a password error, which means we found the tenant!
        if (e.message.includes('password')) {
            console.log('>>> FOUND TENANT BUT WRONG PASSWORD <<<');
            return host;
        }
      }
    }
  }
  return null;
}

findRegion();
