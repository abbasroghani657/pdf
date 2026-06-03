const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ouclxqbqoepubcudclop.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Y2x4cWJxb2VwdWJjdWRjbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTcyOTAzMywiZXhwIjoyMDk1MzA1MDMzfQ.rrEfqNSR1cV_hL3wWvSwubgU3TfqzTgp5kf6H2OJRH8';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedTools() {
  const tools = [
    { name: 'Compress PDF', slug: 'compress-pdf', category: 'Optimize', is_active: true, requires_pro: false, free_daily_limit: 10 },
    { name: 'Merge PDF', slug: 'merge-pdf', category: 'Organize', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'Split PDF', slug: 'split-pdf', category: 'Organize', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'Rotate PDF', slug: 'rotate-pdf', category: 'Organize', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'PDF to Word', slug: 'pdf-to-word', category: 'Convert from PDF', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'PDF to Excel', slug: 'pdf-to-excel', category: 'Convert from PDF', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'PDF to JPG', slug: 'pdf-to-jpg', category: 'Convert from PDF', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'Word to PDF', slug: 'word-to-pdf', category: 'Convert to PDF', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'JPG to PDF', slug: 'jpg-to-pdf', category: 'Convert to PDF', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'HTML to PDF', slug: 'html-to-pdf', category: 'Convert to PDF', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'OCR PDF', slug: 'ocr-pdf', category: 'AI Tools', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Chat with PDF', slug: 'chat-with-pdf', category: 'AI Tools', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Translate PDF', slug: 'translate-pdf', category: 'AI Tools', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Summarize PDF', slug: 'summarize-pdf', category: 'AI Tools', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Rewrite PDF', slug: 'rewrite-pdf', category: 'AI Tools', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Sign PDF', slug: 'sign-pdf', category: 'Security', is_active: true, requires_pro: true, free_daily_limit: 2 },
    { name: 'Request Signature', slug: 'request-signature', category: 'Security', is_active: true, requires_pro: true, free_daily_limit: 2 },
    { name: 'Protect PDF', slug: 'protect-pdf', category: 'Security', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Unlock PDF', slug: 'unlock-pdf', category: 'Security', is_active: true, requires_pro: false, free_daily_limit: 3 },
    { name: 'Watermark PDF', slug: 'watermark-pdf', category: 'Security', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'Edit PDF', slug: 'edit-pdf', category: 'Edit', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Annotate PDF', slug: 'annotate-pdf', category: 'Edit', is_active: true, requires_pro: true, free_daily_limit: 3 },
    { name: 'Flatten PDF', slug: 'flatten-pdf', category: 'Edit', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'Plagiarism Check', slug: 'plagiarism-check', category: 'AI Tools', is_active: true, requires_pro: true, free_daily_limit: 2 },
    { name: 'Extract Text', slug: 'extract-text', category: 'Analyze', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'Extract Images', slug: 'extract-images', category: 'Analyze', is_active: true, requires_pro: false, free_daily_limit: 5 },
    { name: 'PDF Metadata', slug: 'pdf-metadata', category: 'Analyze', is_active: true, requires_pro: false, free_daily_limit: 5 },
  ];
  const { error } = await supabase.from('tools_config').upsert(tools, { onConflict: 'slug' });
  return error;
}

async function seedTickets() {
  const tickets = [
    { user_email: 'test@example.com', subject: 'Payment not working on Stripe', message: 'Hi team, my card keeps getting declined on the Stripe checkout page. Can you please check?', category: 'billing', priority: 'high', status: 'open' },
    { user_email: 'user@example.com', subject: 'OCR failed my Arabic PDF', message: 'The OCR tool is not recognizing Arabic text correctly. The output is garbled characters.', category: 'bug', priority: 'medium', status: 'open' },
    { user_email: 'another@example.com', subject: 'How to use Translate API?', message: 'I am on the Business plan and wanted to use the Translate feature via API for my app.', category: 'general', priority: 'low', status: 'open' },
  ];
  const { error } = await supabase.from('support_tickets').upsert(tickets);
  return error;
}

async function seedAuditLogs() {
  const logs = [
    { user_email: 'abbasroghani869@gmail.com', action: 'Admin panel accessed', resource: 'auth', status: 'success' },
    { user_email: 'abbasroghani869@gmail.com', action: 'Viewed all users list', resource: 'users', status: 'success' },
    { user_email: 'abbasroghani869@gmail.com', action: 'Updated tool config: Chat with PDF', resource: 'tools_config', status: 'success' },
  ];
  const { error } = await supabase.from('audit_logs').insert(logs);
  return error;
}

async function seedSettings() {
  const settings = [
    { key: 'pro_monthly_price', value: '4.99', description: 'Pro plan monthly price in USD' },
    { key: 'pro_annual_price', value: '44.99', description: 'Pro plan annual price in USD' },
    { key: 'free_file_size_limit', value: '10', description: 'Free tier max file size in MB' },
    { key: 'pro_file_size_limit', value: '100', description: 'Pro tier max file size in MB' },
    { key: 'site_name', value: 'PDFMaster', description: 'Platform name' },
    { key: 'maintenance_mode', value: 'false', description: 'Global maintenance mode toggle' },
    { key: 'allow_registrations', value: 'true', description: 'Allow new user registrations' },
    { key: 'support_email', value: 'support@pdfmaster.com', description: 'Public support email' },
  ];
  const { error } = await supabase.from('platform_settings').upsert(settings, { onConflict: 'key' });
  return error;
}

async function main() {
  console.log('\n🚀 PDFMaster — Admin Tables Migration Check');
  console.log('==========================================\n');

  const tables = [
    { name: 'tools_config', seed: seedTools },
    { name: 'support_tickets', seed: seedTickets },
    { name: 'audit_logs', seed: seedAuditLogs },
    { name: 'email_logs', seed: null },
    { name: 'platform_settings', seed: seedSettings },
  ];

  let allExist = true;
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table.name).select('*').limit(1);
    
    if (error && (error.code === 'PGRST116' || error.message.includes('does not exist') || error.code === '42P01')) {
      console.log(`❌ MISSING: ${table.name}`);
      allExist = false;
    } else if (error) {
      console.log(`⚠️  ${table.name}: ${error.message}`);
      allExist = false;
    } else {
      console.log(`✅ EXISTS: ${table.name}`);
      // Seed data if seeder exists
      if (table.seed) {
        const seedErr = await table.seed();
        if (seedErr) {
          if (seedErr.code !== '23505') { // ignore duplicate key errors
            console.log(`   ⚠️  Seed warning: ${seedErr.message}`);
          }
        } else {
          console.log(`   ✅ Data seeded OK`);
        }
      }
    }
  }

  console.log('\n==========================================');
  
  if (!allExist) {
    console.log('\n⚠️  SOME TABLES ARE MISSING!');
    console.log('\nTo create them, follow these steps:');
    console.log('1. Open: https://supabase.com/dashboard/project/ouclxqbqoepubcudclop/sql/new');
    console.log('2. Open file: admin-tables-setup.sql (in your project root)');
    console.log('3. Copy all the SQL content and paste it in the editor');
    console.log('4. Click the green RUN button');
    console.log('5. Run this script again: node server/run-db-setup.cjs');
  } else {
    console.log('\n🎉 ALL TABLES EXIST AND ARE SEEDED!');
    console.log('Your admin panel is 100% real-time ready.');
  }
}

main().catch(console.error);
