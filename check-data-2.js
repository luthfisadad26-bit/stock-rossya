const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function checkData() {
  const { data: tx } = await supabase.from('transactions').select('id, invoice_no, total, created_at').order('created_at', { ascending: false });
  console.log('--- TRANSACTIONS ---');
  if (tx) tx.forEach(t => console.log(`${t.invoice_no} | Rp ${t.total} | ${t.created_at}`));
  
  const { data: cash } = await supabase.from('cash_entries').select('id, type, amount, created_at').order('created_at', { ascending: false });
  console.log('\n--- CASH ENTRIES ---');
  if (cash) cash.forEach(c => console.log(`${c.type} | Rp ${c.amount} | ${c.created_at}`));
}

checkData().catch(console.error);
