-- ============================================================
-- Migration 004: Kebijakan Akses Anon/Dev untuk Pengujian Frontend
-- Mengizinkan browser (anon key) melakukan CRUD pada semua tabel
-- sebelum sistem Login/Auth diintegrasikan penuh ke frontend.
-- ============================================================

-- Items (Barang)
CREATE POLICY "items_select_anon" ON items FOR SELECT TO anon USING (true);
CREATE POLICY "items_insert_anon" ON items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "items_update_anon" ON items FOR UPDATE TO anon WITH CHECK (true);
CREATE POLICY "items_delete_anon" ON items FOR DELETE TO anon USING (true);

-- Stock Movements (Mutasi Stok)
CREATE POLICY "stock_movements_select_anon" ON stock_movements FOR SELECT TO anon USING (true);
CREATE POLICY "stock_movements_insert_anon" ON stock_movements FOR INSERT TO anon WITH CHECK (true);

-- Transactions (Transaksi Penjualan)
CREATE POLICY "transactions_select_anon" ON transactions FOR SELECT TO anon USING (true);
CREATE POLICY "transactions_insert_anon" ON transactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "transactions_update_anon" ON transactions FOR UPDATE TO anon WITH CHECK (true);
CREATE POLICY "transactions_delete_anon" ON transactions FOR DELETE TO anon USING (true);

-- Transaction Items (Detail Transaksi)
CREATE POLICY "transaction_items_select_anon" ON transaction_items FOR SELECT TO anon USING (true);
CREATE POLICY "transaction_items_insert_anon" ON transaction_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "transaction_items_delete_anon" ON transaction_items FOR DELETE TO anon USING (true);

-- Cash Entries (Buku Kas)
CREATE POLICY "cash_entries_select_anon" ON cash_entries FOR SELECT TO anon USING (true);
CREATE POLICY "cash_entries_insert_anon" ON cash_entries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "cash_entries_update_anon" ON cash_entries FOR UPDATE TO anon WITH CHECK (true);
CREATE POLICY "cash_entries_delete_anon" ON cash_entries FOR DELETE TO anon USING (true);

-- Receivables (Piutang)
CREATE POLICY "receivables_select_anon" ON receivables FOR SELECT TO anon USING (true);
CREATE POLICY "receivables_insert_anon" ON receivables FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "receivables_update_anon" ON receivables FOR UPDATE TO anon WITH CHECK (true);
CREATE POLICY "receivables_delete_anon" ON receivables FOR DELETE TO anon USING (true);
