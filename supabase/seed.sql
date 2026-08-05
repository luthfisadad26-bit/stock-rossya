-- ============================================================
-- Seed Data: Rossya Busana - Toko Seragam Sekolah
-- Data ini sinkron dengan dummy data di frontend (mock-data.ts)
-- ============================================================
-- CATATAN: Jalankan seed ini SETELAH Anda membuat 1 user owner
-- di Supabase Auth. Profil owner akan dibuat otomatis oleh trigger.
-- ============================================================

-- ============================================================
-- 1. ITEMS (17 Barang Seragam)
-- ============================================================
INSERT INTO items (id, name, category, size, price, cost_price, stock, min_stock, sku) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Baju Kurung Putih Lengan Panjang',   'Baju Putih', 'M',        65000,  48000, 35, 10, 'BP-KLP-M'),
  ('a0000001-0001-4000-8000-000000000002', 'Baju Putih Lengan Pendek',           'Baju Putih', 'L',        58000,  42000,  8, 15, 'BP-LPD-L'),
  ('a0000001-0001-4000-8000-000000000003', 'Baju Putih Lengan Panjang XL',       'Baju Putih', 'XL',       75000,  54000,  3, 12, 'BP-LPJ-XL'),
  ('a0000001-0001-4000-8000-000000000004', 'Celana Merah Panjang SD',            'Celana',     'L',        75000,  55000, 42, 15, 'CL-MRP-L'),
  ('a0000001-0001-4000-8000-000000000005', 'Celana Biru Panjang SMP',            'Celana',     'XL',       85000,  62000, 18, 10, 'CL-BRP-XL'),
  ('a0000001-0001-4000-8000-000000000006', 'Celana Abu Panjang SMA',             'Celana',     'L',        90000,  68000,  0, 10, 'CL-ABP-L'),
  ('a0000001-0001-4000-8000-000000000007', 'Rok Merah Rempel SD',                'Celana',     'M',        78000,  58000,  5, 10, 'CL-RMR-M'),
  ('a0000001-0001-4000-8000-000000000008', 'Baju Pramuka Penggalang Putra',      'Pramuka',    'M',        80000,  58000, 15, 10, 'PRM-BPP-M'),
  ('a0000001-0001-4000-8000-000000000009', 'Rok Pramuka Rempel Cokelat',         'Pramuka',    'L',        85000,  62000,  2,  8, 'PRM-RRC-L'),
  ('a0000001-0001-4000-8000-000000000010', 'Celana Pramuka Panjang',             'Pramuka',    'L',        82000,  60000, 24, 10, 'PRM-CPJ-L'),
  ('a0000001-0001-4000-8000-000000000011', 'Dasi Merah SD',                      'Aksesoris',  'All Size', 15000,   8000, 60, 20, 'AKS-DSD-AS'),
  ('a0000001-0001-4000-8000-000000000012', 'Kaos Kaki Putih Polos',              'Aksesoris',  'M',        12000,   6000, 45, 15, 'AKS-KKP-M'),
  ('a0000001-0001-4000-8000-000000000013', 'Sabuk Logo Sekolah',                 'Aksesoris',  'All Size', 20000,  11000,  4, 10, 'AKS-SLS-AS'),
  ('a0000001-0001-4000-8000-000000000014', 'Jilbab Putih Instant Kaos',          'Aksesoris',  'L',        35000,  22000, 22, 10, 'AKS-JPI-L'),
  ('a0000001-0001-4000-8000-000000000015', 'Batik Lengan Pendek Motif Sekolah',  'Batik',      'M',        95000,  70000, 20, 10, 'BTK-LPM-M'),
  ('a0000001-0001-4000-8000-000000000016', 'Batik Lengan Panjang Motif Parang',  'Batik',      'L',       110000,  82000,  7, 10, 'BTK-LPP-L'),
  ('a0000001-0001-4000-8000-000000000017', 'Batik Lengan Pendek Motif Kawung',   'Batik',      'XL',      105000,  78000, 12,  8, 'BTK-LPK-XL');

-- ============================================================
-- 2. TRANSACTIONS (4 Transaksi Hari Ini)
-- ============================================================
INSERT INTO transactions (id, invoice_no, customer_name, payment_method, status, total, cash_received, change_amount, created_at) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'TRX-20231024-001', 'Ibu Fatimah', 'Tunai',    'Lunas', 205000, 250000, 45000,  '2023-10-24 14:22:00+07'),
  ('b0000001-0001-4000-8000-000000000002', 'TRX-20231024-002', 'Pak Budi',    'QRIS',     'Lunas',  69000,  NULL,   NULL,   '2023-10-24 13:05:00+07'),
  ('b0000001-0001-4000-8000-000000000003', 'TRX-20231024-003', 'Ibu Rahma',   'Transfer', 'Lunas', 258000,  NULL,   NULL,   '2023-10-24 11:40:00+07'),
  ('b0000001-0001-4000-8000-000000000004', 'TRX-20231024-004',  NULL,         'Tunai',    'Lunas',  80000, 100000, 20000,  '2023-10-24 10:15:00+07');

-- ============================================================
-- 3. TRANSACTION_ITEMS (Detail Barang per Transaksi)
-- ============================================================
INSERT INTO transaction_items (transaction_id, item_id, product_name, size, quantity, price, subtotal, created_at) VALUES
  -- TRX-001: Baju Kurung Putih (2x) + Celana Merah (1x)
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000001', 'Baju Kurung Putih Lengan Panjang', 'M',  2, 65000, 130000, '2023-10-24 14:22:00+07'),
  ('b0000001-0001-4000-8000-000000000001', 'a0000001-0001-4000-8000-000000000004', 'Celana Merah Panjang SD',          'L',  1, 75000,  75000, '2023-10-24 14:22:00+07'),
  -- TRX-002: Dasi (3x) + Kaos Kaki (2x)
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000011', 'Dasi Merah SD',                    'All Size', 3, 15000, 45000, '2023-10-24 13:05:00+07'),
  ('b0000001-0001-4000-8000-000000000002', 'a0000001-0001-4000-8000-000000000012', 'Kaos Kaki Putih Polos',            'M',        2, 12000, 24000, '2023-10-24 13:05:00+07'),
  -- TRX-003: Celana Biru SMP (2x) + Rok Merah SD (1x)
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000005', 'Celana Biru Panjang SMP',          'XL', 2, 85000, 170000, '2023-10-24 11:40:00+07'),
  ('b0000001-0001-4000-8000-000000000003', 'a0000001-0001-4000-8000-000000000007', 'Rok Merah Rempel SD',              'M',  1, 78000,  78000, '2023-10-24 11:40:00+07'),
  -- TRX-004: Baju Pramuka (1x)
  ('b0000001-0001-4000-8000-000000000004', 'a0000001-0001-4000-8000-000000000008', 'Baju Pramuka Penggalang Putra',    'M',  1, 80000,  80000, '2023-10-24 10:15:00+07');

-- ============================================================
-- 4. CASH_ENTRIES (5 Catatan Kas Harian)
-- ============================================================
INSERT INTO cash_entries (type, category, amount, description, ref_transaction_id, created_at) VALUES
  ('Masuk',  'Penjualan Kasir',  205000, 'Penjualan TRX-20231024-001', 'b0000001-0001-4000-8000-000000000001', '2023-10-24 14:22:00+07'),
  ('Masuk',  'Penjualan Kasir',   69000, 'Penjualan TRX-20231024-002', 'b0000001-0001-4000-8000-000000000002', '2023-10-24 13:05:00+07'),
  ('Keluar', 'Biaya Operasional',150000, 'Beli plastik packing & konsumsi',            NULL,                   '2023-10-24 12:00:00+07'),
  ('Masuk',  'Penjualan Kasir',  258000, 'Penjualan TRX-20231024-003', 'b0000001-0001-4000-8000-000000000003', '2023-10-24 11:40:00+07'),
  ('Keluar', 'Restok Barang',    850000, 'Restok kain pramuka supplier',               NULL,                   '2023-10-24 09:30:00+07');

-- ============================================================
-- 5. RECEIVABLES (3 Piutang Pelanggan)
-- ============================================================
INSERT INTO receivables (customer_name, phone, amount, due_date, status, notes, created_at) VALUES
  ('Ibu Nurul (Grosir SD 1)', '0812-3456-7890',  750000, '2023-10-30', 'Belum Lunas', 'DP 50% untuk 15 stel seragam SD',      '2023-10-20 10:00:00+07'),
  ('Pak Hendra (Koperasi SMP)','0857-1122-3344', 1200000, '2023-11-05', 'Belum Lunas', 'Pesanan 20 stel celana biru SMP',      '2023-10-18 09:00:00+07'),
  ('Ibu Dewi',                 '0813-9988-7766',  230000, '2023-10-22', 'Belum Lunas', 'Janjikan pelunasan akhir minggu',      '2023-10-15 14:30:00+07');

-- ============================================================
-- 6. STOCK_MOVEMENTS (Contoh riwayat mutasi stok)
-- ============================================================
INSERT INTO stock_movements (item_id, type, quantity, note, created_at) VALUES
  -- Penjualan hari ini (keluar)
  ('a0000001-0001-4000-8000-000000000001', 'keluar', 2, 'Penjualan TRX-20231024-001', '2023-10-24 14:22:00+07'),
  ('a0000001-0001-4000-8000-000000000004', 'keluar', 1, 'Penjualan TRX-20231024-001', '2023-10-24 14:22:00+07'),
  ('a0000001-0001-4000-8000-000000000011', 'keluar', 3, 'Penjualan TRX-20231024-002', '2023-10-24 13:05:00+07'),
  ('a0000001-0001-4000-8000-000000000012', 'keluar', 2, 'Penjualan TRX-20231024-002', '2023-10-24 13:05:00+07'),
  ('a0000001-0001-4000-8000-000000000005', 'keluar', 2, 'Penjualan TRX-20231024-003', '2023-10-24 11:40:00+07'),
  ('a0000001-0001-4000-8000-000000000007', 'keluar', 1, 'Penjualan TRX-20231024-003', '2023-10-24 11:40:00+07'),
  ('a0000001-0001-4000-8000-000000000008', 'keluar', 1, 'Penjualan TRX-20231024-004', '2023-10-24 10:15:00+07'),
  -- Contoh restok (masuk)
  ('a0000001-0001-4000-8000-000000000001', 'masuk', 50, 'Restok dari supplier CV Jaya Tekstil', '2023-10-22 08:00:00+07'),
  ('a0000001-0001-4000-8000-000000000015', 'masuk', 25, 'Restok batik dari Pekalongan',         '2023-10-21 09:00:00+07');
