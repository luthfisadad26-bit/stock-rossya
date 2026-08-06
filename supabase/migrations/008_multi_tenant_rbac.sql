-- ============================================================
-- Migration 008: Multi-Tenant (Stores) & RBAC (Role-Based Access)
-- ============================================================

-- 1. Buat tabel stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Modifikasi tabel profiles
ALTER TABLE profiles ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
-- Jika sebelumnya ada data dummy, kita perlu menanganinya
-- Buat 1 toko default untuk data yang sudah ada
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  INSERT INTO stores (name) VALUES ('Rossya Busana') RETURNING id INTO v_store_id;
  
  -- Assign semua profile yang sudah ada ke toko ini
  UPDATE profiles SET store_id = v_store_id WHERE store_id IS NULL;
  
  -- Set kolom store_id menjadi NOT NULL setelah diisi
  -- (Namun jika Supabase auto-create user, mungkin lebih baik biarkan NULL dulu sampai diassign owner)
  -- Untuk keamanan, kita biarkan nullable untuk proses registrasi awal, tapi default ke v_store_id jika memungkinkan.
END $$;

-- 3. Tambahkan store_id ke semua tabel data
ALTER TABLE items ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE stock_movements ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE transaction_items ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE cash_entries ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE receivables ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- 4. Update data eksisting agar masuk ke toko pertama
DO $$
DECLARE
  v_store_id UUID;
BEGIN
  SELECT id INTO v_store_id FROM stores ORDER BY created_at ASC LIMIT 1;
  
  UPDATE items SET store_id = v_store_id WHERE store_id IS NULL;
  UPDATE stock_movements SET store_id = v_store_id WHERE store_id IS NULL;
  UPDATE transactions SET store_id = v_store_id WHERE store_id IS NULL;
  UPDATE transaction_items SET store_id = v_store_id WHERE store_id IS NULL;
  UPDATE cash_entries SET store_id = v_store_id WHERE store_id IS NULL;
  UPDATE receivables SET store_id = v_store_id WHERE store_id IS NULL;
END $$;

-- Buat index untuk pencarian cepat
CREATE INDEX idx_profiles_store ON profiles(store_id);
CREATE INDEX idx_items_store ON items(store_id);
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_cash_entries_store ON cash_entries(store_id);

-- 5. Fungsi Helper untuk RLS (agar tidak recursive / lambat)
CREATE OR REPLACE FUNCTION get_auth_store_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT store_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 6. Terapkan RLS yang Ketat
-- Hapus policy anon lama (dari migration 004/005)
-- (Ini akan menggagalkan akses tanpa login!)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;

-- Aktifkan RLS di semua tabel
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;

-- POLICIES (HANYA BISA DIAKSES OLEH USER YANG LOGIN / AUTHENTICATED)

-- Profiles: User bisa lihat profil sesama toko, tapi hanya bisa edit profil sendiri
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (store_id = get_auth_store_id());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Items: Semua orang di toko bisa akses penuh
CREATE POLICY "items_all" ON items TO authenticated USING (store_id = get_auth_store_id()) WITH CHECK (store_id = get_auth_store_id());

-- Stock Movements: Semua orang di toko bisa akses
CREATE POLICY "stock_movements_all" ON stock_movements TO authenticated USING (store_id = get_auth_store_id()) WITH CHECK (store_id = get_auth_store_id());

-- Transactions & Items: Semua orang di toko bisa akses (Kasir perlu untuk buat nota)
CREATE POLICY "transactions_all" ON transactions TO authenticated USING (store_id = get_auth_store_id()) WITH CHECK (store_id = get_auth_store_id());
CREATE POLICY "transaction_items_all" ON transaction_items TO authenticated USING (store_id = get_auth_store_id()) WITH CHECK (store_id = get_auth_store_id());

-- Cash Entries & Receivables (KEUANGAN): HANYA OWNER
CREATE POLICY "keuangan_owner_only" ON cash_entries TO authenticated 
USING (store_id = get_auth_store_id() AND get_auth_role() = 'owner') 
WITH CHECK (store_id = get_auth_store_id() AND get_auth_role() = 'owner');

CREATE POLICY "piutang_owner_only" ON receivables TO authenticated 
USING (store_id = get_auth_store_id() AND get_auth_role() = 'owner') 
WITH CHECK (store_id = get_auth_store_id() AND get_auth_role() = 'owner');
