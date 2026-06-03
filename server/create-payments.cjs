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
    
    // Create payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        plan TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        payment_method TEXT DEFAULT 'stripe',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON public.payments TO service_role;
    `);

    // Seed mock payments for existing pro users
    const users = await client.query(`SELECT id, email, created_at, plan FROM public.users WHERE is_pro = true`);
    for (const user of users.rows) {
        // Generate some payments for them
        const planName = user.plan || 'Pro Monthly';
        const amount = planName.includes('Annual') ? 44.99 : planName.includes('Business') ? 69.99 : 4.99;
        
        await client.query(`
          INSERT INTO public.payments (user_id, user_email, amount, plan, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [user.id, user.email, amount, planName, user.created_at]);
    }
    
    // Also create some past payments to show history (MRR graph)
    const pastMonths = [1, 2, 3, 4, 5];
    for(const m of pastMonths) {
        // simulate a random user
        const date = new Date();
        date.setMonth(date.getMonth() - m);
        const randAmount = [4.99, 44.99, 69.99][Math.floor(Math.random() * 3)];
        const plan = randAmount === 4.99 ? 'Pro Monthly' : randAmount === 44.99 ? 'Pro Annual' : 'Business';
        
        await client.query(`
          INSERT INTO public.payments (user_email, amount, plan, created_at)
          VALUES ($1, $2, $3, $4)
        `, [`historic_user${m}@test.com`, randAmount, plan, date.toISOString()]);
    }

    console.log('✅ Payments table created and seeded');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
main();
