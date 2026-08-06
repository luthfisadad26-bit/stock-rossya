-- ============================================================
-- Migration 009: Set Default store_id pada saat INSERT
-- Agar RLS tidak error ("new row violates row-level security policy")
-- saat frontend melakukan insert tanpa mengirimkan store_id
-- ============================================================

ALTER TABLE items ALTER COLUMN store_id SET DEFAULT get_auth_store_id();
ALTER TABLE stock_movements ALTER COLUMN store_id SET DEFAULT get_auth_store_id();
ALTER TABLE transactions ALTER COLUMN store_id SET DEFAULT get_auth_store_id();
ALTER TABLE transaction_items ALTER COLUMN store_id SET DEFAULT get_auth_store_id();
ALTER TABLE cash_entries ALTER COLUMN store_id SET DEFAULT get_auth_store_id();
ALTER TABLE receivables ALTER COLUMN store_id SET DEFAULT get_auth_store_id();
