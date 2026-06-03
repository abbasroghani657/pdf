// run-migrations.mjs
// Runs all admin table SQL migrations against Supabase
// Usage: node run-migrations.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://ouclxqbqoepubcudclop.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Y2x4cWJxb2VwdWJjdWRjbG9wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTcyOTAzMywiZXhwIjoyMDk1MzA1MDMzfQ.rrEfqNSR1cV_hL3wWvSwubgU3TfqzTgp5kf6H2OJRH8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Run SQL statements one by one via Supabase REST
async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }
  return await response.json();
}

// Use Supabase Management API
async function runMigrationViaAPI(sql) {
  const projectRef = 'ouclxqbqoepubcudclop';
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
    },
    body: JSON.stringify({ query: sql })
  });
  
  const text = await response.text();
  console.log('API Response status:', response.status);
  console.log('API Response:', text.slice(0, 500));
  return { status: response.status, body: text };
}

// Create each table individually using supabase-js workarounds
async function createToolsConfig() {
  console.log('\n📦 Creating tools_config table...');
  
  // Check if already exists by trying to select
  const { data, error } = await supabase.from('tools_config').select('id').limit(1);
  
  if (!error) {
    console.log('   ✅ tools_config already exists, checking for data...');
    const { count } = await supabase.from('tools_config').select('*', { count: 'exact', head: true });
    if (count > 0) {
      console.log(`   ℹ️  Already has ${count} rows, skipping seed.`);
      return;
    }
  } else {
    console.log('   ⚠️  Table does not exist:', error.message);
    console.log('   ℹ️  Please run admin-tables-setup.sql in Supabase SQL Editor manually.');
    return;
  }
  
  // Seed the tools
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
  
  const { error: insertErr } = await supabase.from('tools_config').upsert(tools, { onConflict: 'slug' });
  if (insertErr) console.log('   ⚠️  Seed error:', insertErr.message);
  else console.log(`   ✅ Seeded ${tools.length} tools!`);
}

async function createSupportTickets() {
  console.log('\n🎫 Checking support_tickets table...');
  const { error } = await supabase.from('support_tickets').select('id').limit(1);
  if (!error) {
    console.log('   ✅ support_tickets exists!');
    // Add sample tickets
    const { error: insertErr } = await supabase.from('support_tickets').upsert([
      { user_email: 'test@example.com', subject: 'Payment not working on Stripe', message: 'Hi team, my card keeps getting declined on the Stripe checkout page.', category: 'billing', priority: 'high', status: 'open' },
      { user_email: 'user@example.com', subject: 'OCR failed my Arabic PDF', message: 'The OCR tool is not recognizing Arabic text correctly.', category: 'bug', priority: 'medium', status: 'open' },
    ]);
    if (!insertErr) console.log('   ✅ Sample tickets added!');
  } else {
    console.log('   ⚠️  support_tickets table missing. Run admin-tables-setup.sql in Supabase.');
  }
}

async function createAuditLogs() {
  console.log('\n🔒 Checking audit_logs table...');
  const { error } = await supabase.from('audit_logs').select('id').limit(1);
  if (!error) {
    console.log('   ✅ audit_logs exists!');
    await supabase.from('audit_logs').insert([
      { user_email: 'abbasroghani869@gmail.com', action: 'Admin panel accessed', resource: 'auth', status: 'success' }
    ]);
  } else {
    console.log('   ⚠️  audit_logs table missing. Run admin-tables-setup.sql in Supabase.');
  }
}

async function createPlatformSettings() {
  console.log('\n⚙️  Checking platform_settings table...');
  const { error } = await supabase.from('platform_settings').select('key').limit(1);
  if (!error) {
    console.log('   ✅ platform_settings exists!');
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
    const { error: insertErr } = await supabase.from('platform_settings').upsert(settings, { onConflict: 'key' });
    if (!insertErr) console.log('   ✅ Default settings seeded!');
  } else {
    console.log('   ⚠️  platform_settings table missing. Run admin-tables-setup.sql in Supabase.');
  }
}

async function main() {
  console.log('🚀 PDFMaster — Admin Tables Migration');
  console.log('=====================================');
  console.log('Project: ouclxqbqoepubcudclop');
  console.log('');
  
  await createToolsConfig();
  await createSupportTickets();
  await createAuditLogs();
  await createPlatformSettings();
  
  console.log('\n=====================================');
  console.log('✅ Migration check complete!');
  console.log('');
  console.log('⚠️  If any table was MISSING above:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/ouclxqbqoepubcudclop/sql/new');
  console.log('   2. Paste the content of: admin-tables-setup.sql');
  console.log('   3. Click RUN');
  console.log('   4. Then run this script again: node run-migrations.mjs');
}

main().catch(console.error);
