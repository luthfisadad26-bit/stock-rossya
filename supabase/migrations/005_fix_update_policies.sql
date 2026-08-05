-- ============================================================
-- Migration 005: Perbaikan RLS Policy UPDATE untuk Akses Anon/Dev
-- Memastikan UPDATE pada items & tabel lain memiliki USING (true) & WITH CHECK (true)
-- ============================================================

-- Drop policy lama jika ada
DROP POLICY IF EXISTS "items_update_anon" ON items;
DROP POLICY IF EXISTS "transactions_update_anon" ON transactions;
DROP POLICY IF EXISTS "cash_entries_update_anon" ON cash_entries;

-- Re-create UPDATE policies dengan USING (true) & WITH CHECK (true)
CREATE POLICY "items_update_anon" ON items 
  FOR UPDATE TO anon 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "transactions_update_anon" ON transactions 
  FOR UPDATE TO anon 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "cash_entries_update_anon" ON cash_entries 
  FOR UPDATE TO anon 
  USING (true) 
  WITH CHECK (true);
