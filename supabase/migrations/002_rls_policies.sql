-- ============================================================
-- Migration 002: Row Level Security (RLS)
-- Desain: 1 owner sekarang, siap diperluas ke role kasir nanti
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Cek apakah user saat ini adalah owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'owner'
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Cek apakah user saat ini adalah staff (owner ATAU kasir aktif)
-- Gunakan fungsi ini untuk policy yang boleh diakses semua role
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('owner', 'kasir')
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- Owner bisa lihat semua profil, edit profil sendiri
-- Kasir hanya bisa lihat profil sendiri
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_all_for_owner"
  ON profiles FOR SELECT
  USING (is_owner());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Owner bisa insert/delete profil (untuk manage kasir nanti)
CREATE POLICY "profiles_insert_owner"
  ON profiles FOR INSERT
  WITH CHECK (is_owner() OR id = auth.uid());

CREATE POLICY "profiles_delete_owner"
  ON profiles FOR DELETE
  USING (is_owner());

-- ============================================================
-- ITEMS (Barang)
-- Semua staff bisa lihat barang
-- Hanya owner yang bisa tambah/edit/hapus
-- (Nanti kasir bisa diizinkan juga jika diperlukan)
-- ============================================================
CREATE POLICY "items_select_staff"
  ON items FOR SELECT
  USING (is_staff());

CREATE POLICY "items_insert_owner"
  ON items FOR INSERT
  WITH CHECK (is_owner());

CREATE POLICY "items_update_owner"
  ON items FOR UPDATE
  USING (is_owner())
  WITH CHECK (is_owner());

CREATE POLICY "items_delete_owner"
  ON items FOR DELETE
  USING (is_owner());

-- ============================================================
-- STOCK_MOVEMENTS (Mutasi Stok)
-- Semua staff bisa lihat riwayat stok
-- Hanya owner yang bisa tambah mutasi stok
-- ============================================================
CREATE POLICY "stock_movements_select_staff"
  ON stock_movements FOR SELECT
  USING (is_staff());

CREATE POLICY "stock_movements_insert_owner"
  ON stock_movements FOR INSERT
  WITH CHECK (is_owner());

-- ============================================================
-- TRANSACTIONS (Transaksi Penjualan)
-- Semua staff bisa lihat dan membuat transaksi (kasir bisa jual)
-- Hanya owner yang bisa hapus/edit transaksi
-- ============================================================
CREATE POLICY "transactions_select_staff"
  ON transactions FOR SELECT
  USING (is_staff());

CREATE POLICY "transactions_insert_staff"
  ON transactions FOR INSERT
  WITH CHECK (is_staff());

CREATE POLICY "transactions_update_owner"
  ON transactions FOR UPDATE
  USING (is_owner())
  WITH CHECK (is_owner());

CREATE POLICY "transactions_delete_owner"
  ON transactions FOR DELETE
  USING (is_owner());

-- ============================================================
-- TRANSACTION_ITEMS (Detail Transaksi)
-- Ikut policy parent transactions
-- ============================================================
CREATE POLICY "transaction_items_select_staff"
  ON transaction_items FOR SELECT
  USING (is_staff());

CREATE POLICY "transaction_items_insert_staff"
  ON transaction_items FOR INSERT
  WITH CHECK (is_staff());

CREATE POLICY "transaction_items_delete_owner"
  ON transaction_items FOR DELETE
  USING (is_owner());

-- ============================================================
-- CASH_ENTRIES (Buku Kas)
-- Semua staff bisa lihat kas
-- Staff bisa tambah catatan kas (dari penjualan)
-- Hanya owner yang bisa edit/hapus
-- ============================================================
CREATE POLICY "cash_entries_select_staff"
  ON cash_entries FOR SELECT
  USING (is_staff());

CREATE POLICY "cash_entries_insert_staff"
  ON cash_entries FOR INSERT
  WITH CHECK (is_staff());

CREATE POLICY "cash_entries_update_owner"
  ON cash_entries FOR UPDATE
  USING (is_owner())
  WITH CHECK (is_owner());

CREATE POLICY "cash_entries_delete_owner"
  ON cash_entries FOR DELETE
  USING (is_owner());

-- ============================================================
-- RECEIVABLES (Piutang)
-- Semua staff bisa lihat piutang
-- Staff bisa update status piutang (tandai lunas)
-- Hanya owner yang bisa tambah/hapus piutang
-- ============================================================
CREATE POLICY "receivables_select_staff"
  ON receivables FOR SELECT
  USING (is_staff());

CREATE POLICY "receivables_insert_owner"
  ON receivables FOR INSERT
  WITH CHECK (is_owner());

CREATE POLICY "receivables_update_staff"
  ON receivables FOR UPDATE
  USING (is_staff())
  WITH CHECK (is_staff());

CREATE POLICY "receivables_delete_owner"
  ON receivables FOR DELETE
  USING (is_owner());
