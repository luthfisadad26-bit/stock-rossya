-- ============================================================
-- Migration 010: Fix Cash Entries Insert Policy for Kasir
-- Kasir harus bisa memasukkan data (INSERT) ke catatan keuangan
-- setiap kali terjadi penjualan, meskipun mereka tidak boleh
-- melihat (SELECT) halaman keuangan.
-- ============================================================

-- Tambahkan policy khusus agar role apapun (Kasir/Owner) di toko tersebut bisa INSERT
CREATE POLICY "cash_entries_insert_all" ON cash_entries FOR INSERT TO authenticated 
WITH CHECK (store_id = get_auth_store_id());
