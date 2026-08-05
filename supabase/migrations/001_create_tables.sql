-- ============================================================
-- Migration 001: Buat semua tabel utama untuk Rossya Busana
-- Toko Seragam Sekolah - Sistem POS & Manajemen Stok
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (untuk multi-role: owner + kasir nanti)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'owner'
              CHECK (role IN ('owner', 'kasir')),
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  profiles IS 'Profil pengguna toko (owner / kasir)';
COMMENT ON COLUMN profiles.role IS 'Role pengguna: owner = pemilik toko, kasir = pegawai kasir';

-- ============================================================
-- 2. ITEMS (Katalog Barang Seragam)
-- ============================================================
CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL
              CHECK (category IN ('Baju Putih', 'Celana', 'Pramuka', 'Aksesoris', 'Batik')),
  size        TEXT NOT NULL DEFAULT 'All Size',
  price       INTEGER NOT NULL CHECK (price >= 0),
  cost_price  INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock   INTEGER NOT NULL DEFAULT 10 CHECK (min_stock >= 0),
  sku         TEXT UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_sku ON items(sku);

COMMENT ON TABLE  items IS 'Katalog barang seragam sekolah';
COMMENT ON COLUMN items.stock IS 'Stok saat ini (pcs). Tidak boleh negatif.';
COMMENT ON COLUMN items.min_stock IS 'Batas minimum stok sebelum peringatan "menipis".';
COMMENT ON COLUMN items.price IS 'Harga jual ke pelanggan (Rupiah).';
COMMENT ON COLUMN items.cost_price IS 'Harga beli / modal (Rupiah).';

-- ============================================================
-- 3. STOCK_MOVEMENTS (Riwayat Mutasi Stok)
-- ============================================================
CREATE TABLE stock_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('masuk', 'keluar')),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  note        TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

COMMENT ON TABLE  stock_movements IS 'Log setiap perubahan stok barang (masuk dari supplier / keluar dari penjualan)';
COMMENT ON COLUMN stock_movements.type IS 'masuk = restok/tambah, keluar = penjualan/retur/rusak';

-- ============================================================
-- 4. TRANSACTIONS (Header Transaksi Penjualan)
-- ============================================================
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_no      TEXT NOT NULL UNIQUE,
  customer_name   TEXT,
  payment_method  TEXT NOT NULL DEFAULT 'Tunai'
                  CHECK (payment_method IN ('Tunai', 'Transfer', 'QRIS')),
  status          TEXT NOT NULL DEFAULT 'Lunas'
                  CHECK (status IN ('Lunas', 'Piutang')),
  total           INTEGER NOT NULL CHECK (total >= 0),
  cash_received   INTEGER CHECK (cash_received >= 0),
  change_amount   INTEGER DEFAULT 0 CHECK (change_amount >= 0),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_invoice ON transactions(invoice_no);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);

COMMENT ON TABLE  transactions IS 'Header nota transaksi penjualan kasir';
COMMENT ON COLUMN transactions.cash_received IS 'Uang tunai yang diterima (hanya untuk metode Tunai)';
COMMENT ON COLUMN transactions.change_amount IS 'Kembalian (hanya untuk metode Tunai)';

-- ============================================================
-- 5. TRANSACTION_ITEMS (Detail Item per Transaksi)
-- ============================================================
CREATE TABLE transaction_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES items(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  size            TEXT NOT NULL DEFAULT '',
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  price           INTEGER NOT NULL CHECK (price >= 0),
  subtotal        INTEGER NOT NULL CHECK (subtotal >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transaction_items_tx ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_item ON transaction_items(item_id);

COMMENT ON TABLE  transaction_items IS 'Baris item dalam setiap nota transaksi';
COMMENT ON COLUMN transaction_items.product_name IS 'Snapshot nama barang saat transaksi (tidak berubah jika nama item diedit)';
COMMENT ON COLUMN transaction_items.price IS 'Snapshot harga satuan saat transaksi';

-- ============================================================
-- 6. CASH_ENTRIES (Catatan Kas Masuk / Keluar)
-- ============================================================
CREATE TABLE cash_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL CHECK (type IN ('Masuk', 'Keluar')),
  category    TEXT NOT NULL DEFAULT 'Lain-lain',
  amount      INTEGER NOT NULL CHECK (amount > 0),
  description TEXT,
  ref_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_entries_type ON cash_entries(type);
CREATE INDEX idx_cash_entries_created ON cash_entries(created_at DESC);

COMMENT ON TABLE  cash_entries IS 'Buku kas harian toko: catatan setiap uang masuk dan keluar';
COMMENT ON COLUMN cash_entries.category IS 'Kategori: Penjualan Kasir, Biaya Operasional, Restok Barang, Gaji Karyawan, Lain-lain';
COMMENT ON COLUMN cash_entries.ref_transaction_id IS 'Link ke transaksi penjualan (jika kas masuk dari kasir)';

-- ============================================================
-- 7. RECEIVABLES (Piutang Pelanggan)
-- ============================================================
CREATE TABLE receivables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name   TEXT NOT NULL,
  phone           TEXT,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'Belum Lunas'
                  CHECK (status IN ('Belum Lunas', 'Lunas')),
  notes           TEXT,
  ref_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receivables_status ON receivables(status);
CREATE INDEX idx_receivables_due ON receivables(due_date);

COMMENT ON TABLE  receivables IS 'Daftar piutang / bon pelanggan yang belum lunas';

-- ============================================================
-- 8. TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_receivables_updated_at
  BEFORE UPDATE ON receivables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. TRIGGER: auto-create profile on auth signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
