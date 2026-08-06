-- ============================================================
-- Migration 006: Drop check constraint & update categories
-- 1. Mengizinkan user untuk menambah/mengedit kategori custom secara dinamis
-- 2. Memperbarui kategori barang yang sudah ada sesuai permintaan:
--    - Barang bernama mengandung 'rok' -> kategori 'Rok'
--    - Barang bernama mengandung 'katarina' -> kategori 'Pramuka'
-- ============================================================

-- Drop check constraint agar bisa input kategori bebas
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_category_check;

-- Update barang-barang lama ke kategori yang benar
UPDATE items 
SET category = 'Rok' 
WHERE name ILIKE '%rok%';

UPDATE items 
SET category = 'Pramuka' 
WHERE name ILIKE '%katarina%';
