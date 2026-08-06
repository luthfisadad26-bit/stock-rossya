-- ============================================================
-- SQL Script untuk Menghapus Semua Data Transaksi & Keuangan
-- CATATAN: Ini akan me-reset semua omzet, kasir, buku kas, dan 
-- pergerakan stok menjadi 0.
-- Data Master (Katalog Barang/Stok) TIDAK akan dihapus.
-- ============================================================

-- Hapus semua detail transaksi (anak dari transactions)
DELETE FROM transaction_items;

-- Hapus semua riwayat pergerakan stok
DELETE FROM stock_movements;

-- Hapus semua data transaksi kasir utama
DELETE FROM transactions;

-- Hapus semua catatan buku kas (uang masuk/keluar)
DELETE FROM cash_entries;

-- Hapus semua catatan piutang (kasbon)
DELETE FROM receivables;

-- Opsional: Kembalikan ID otomatis ke 1 lagi jika diperlukan
-- (Supabase menggunakan UUID, jadi sequence ID tidak perlu direset)
