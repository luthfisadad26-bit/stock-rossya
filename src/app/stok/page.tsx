'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/common/Badge';
import { Product, formatRupiah, getStockStatus } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getCustomCategories, saveCustomCategories } from '@/lib/categories';
import {
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Filter,
  X,
  Package,
  Check,
  LayoutGrid,
  List,
  History,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Settings,
} from 'lucide-react';

interface StockMovementRecord {
  id: string;
  type: 'masuk' | 'keluar';
  quantity: number;
  note: string | null;
  created_at: string;
}

export default function StokPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Dynamic Category Management State
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stock History Modal State
  const [historyModalItem, setHistoryModalItem] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovementRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Baju Putih',
    size: 'M',
    price: '',
    costPrice: '',
    stock: '',
    minStock: '10',
    sku: '',
  });

  // Load custom categories on mount & sync listener
  const syncCategories = () => {
    setCategoryList(getCustomCategories());
  };

  useEffect(() => {
    syncCategories();
    window.addEventListener('categories-updated', syncCategories);
    return () => window.removeEventListener('categories-updated', syncCategories);
  }, []);

  const categories = useMemo(() => ['Semua', ...categoryList], [categoryList]);
  const statuses = ['Semua', 'Aman', 'Menipis', 'Habis'];

  // Add new custom category
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categoryList.includes(trimmed)) {
      alert('Kategori sudah ada!');
      return;
    }
    const updated = [...categoryList, trimmed];
    setCategoryList(updated);
    saveCustomCategories(updated);
    setNewCategoryInput('');
  };

  // Delete category
  const handleDeleteCategory = (catToDelete: string) => {
    if (categoryList.length <= 1) {
      alert('Minimal harus ada 1 kategori!');
      return;
    }
    if (!confirm(`Hapus kategori "${catToDelete}"?`)) return;
    const updated = categoryList.filter((c) => c !== catToDelete);
    setCategoryList(updated);
    saveCustomCategories(updated);
    if (selectedCategory === catToDelete) {
      setSelectedCategory('Semua');
    }
  };

  // Fetch Products from Supabase on mount
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Gagal mengambil barang dari Supabase:', error);
      } else if (data) {
        const mapped: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category as Product['category'],
          size: item.size,
          price: item.price,
          costPrice: item.cost_price,
          stock: item.stock,
          minStock: item.min_stock,
          sku: item.sku || '',
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error('Exception fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search, category, and status
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const searchWords = searchTerm.toLowerCase().split(' ').filter(Boolean);
      const matchesSearch = searchWords.length === 0 || searchWords.every(word => 
        item.name.toLowerCase().includes(word) || item.sku.toLowerCase().includes(word)
      );

      const matchesCategory =
        selectedCategory === 'Semua' || item.category === selectedCategory;

      const status = getStockStatus(item.stock, item.minStock);
      const matchesStatus =
        selectedStatus === 'Semua' ||
        (selectedStatus === 'Aman' && status === 'aman') ||
        (selectedStatus === 'Menipis' && status === 'menipis') ||
        (selectedStatus === 'Habis' && status === 'habis');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const cat = selectedCategory !== 'Semua' ? selectedCategory : (categoryList[0] || 'Baju Putih');
    const prefix = cat.slice(0, 3).toUpperCase();

    setFormData({
      name: '',
      category: cat,
      size: 'M',
      price: '',
      costPrice: '',
      stock: '',
      minStock: '10',
      sku: `${prefix}-${Math.floor(100 + Math.random() * 900)}`,
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      size: product.size,
      price: String(product.price),
      costPrice: String(product.costPrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      sku: product.sku,
    });
    setIsModalOpen(true);
  };

  // Quick adjust stock count (+ / -) directly
  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    if (newStock === product.stock) return;

    try {
      // 1. Direct UPDATE stock (Requires Migration 005)
      const { error: updErr } = await supabase
        .from('items')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (updErr) {
        alert('Gagal mengupdate stok: ' + updErr.message);
        return;
      }

      // 3. Record stock movement
      await supabase.from('stock_movements').insert({
        item_id: product.id,
        type: delta > 0 ? 'masuk' : 'keluar',
        quantity: Math.abs(delta),
        note: delta > 0 ? 'Restok cepat (+)' : 'Pengurangan stok cepat (-)',
      });

      await fetchProducts();
    } catch (err) {
      console.error('Exception quick adjusting stock:', err);
    }
  };

  // View Stock Movement History for a specific item
  const handleOpenHistoryModal = async (product: Product) => {
    setHistoryModalItem(product);
    setLoadingHistory(true);
    setStockHistory([]);

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('id, type, quantity, note, created_at')
        .eq('item_id', product.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock movements:', error);
      } else if (data) {
        setStockHistory(data as StockMovementRecord[]);
      }
    } catch (err) {
      console.error('Exception fetching stock movements:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Save (Add or Update) in Supabase
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) return;
    setIsSaving(true);

    const newPrice = Number(formData.price);
    const newCostPrice = Number(formData.costPrice || 0);
    const newStock = Number(formData.stock);
    const newMinStock = Number(formData.minStock || 10);

    try {
      if (editingProduct) {
        // 1. Update item row (Requires Migration 005)
        const { error: updErr } = await supabase
          .from('items')
          .update({
            name: formData.name,
            category: formData.category,
            size: formData.size,
            price: newPrice,
            cost_price: newCostPrice,
            stock: newStock,
            min_stock: newMinStock,
            sku: formData.sku,
          })
          .eq('id', editingProduct.id);

        if (updErr) {
          alert('Gagal mengupdate barang: ' + updErr.message);
          setIsSaving(false);
          return;
        }

        // 3. Record stock movement if stock count was changed
        const stockDiff = newStock - editingProduct.stock;
        if (stockDiff !== 0) {
          await supabase.from('stock_movements').insert({
            item_id: editingProduct.id,
            type: stockDiff > 0 ? 'masuk' : 'keluar',
            quantity: Math.abs(stockDiff),
            note: `Penyesuaian stok (Edit barang ${formData.name})`,
          });
        }
      } else {
        // 1. INSERT new item into items table
        const { data: newItems, error: insertErr } = await supabase
          .from('items')
          .insert({
            name: formData.name,
            category: formData.category,
            size: formData.size,
            price: newPrice,
            cost_price: newCostPrice,
            stock: newStock,
            min_stock: newMinStock,
            sku: formData.sku,
          })
          .select();

        if (insertErr || !newItems || newItems.length === 0) {
          alert('Gagal menambah barang baru: ' + (insertErr?.message || 'Error'));
          setIsSaving(false);
          return;
        }

        const createdItem = newItems[0];

        // 2. RECORD initial stock movement in stock_movements table
        if (newStock > 0) {
          await supabase.from('stock_movements').insert({
            item_id: createdItem.id,
            type: 'masuk',
            quantity: newStock,
            note: 'Stok awal barang baru',
          });
        }
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      console.error('Exception saving product:', err);
      alert('Terjadi kesalahan saat menyimpan barang.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product from Supabase
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}" dari database?`)) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', id);

      if (error) {
        alert('Gagal menghapus barang: ' + error.message);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      console.error('Exception deleting product:', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* HEADER & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-navy">
                Stok &amp; Katalog Seragam
              </h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                Terhubung Supabase
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Total {products.length} varian barang tersimpan di database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-offwhite hover:bg-khaki-100 text-navy font-medium text-xs sm:text-sm rounded-xl border border-card-border transition-all active:scale-95"
              title="Kelola Kategori Barang"
            >
              <Tag className="w-4 h-4 text-khaki-700" />
              <span>Kelola Kategori</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-maroon hover:bg-maroon-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Barang Baru</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white p-4 rounded-card border border-card-border shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama barang atau kode SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-offwhite border border-card-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-navy text-navy placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle (Card vs Table) */}
            <div className="flex items-center gap-1 bg-offwhite p-1 border border-card-border rounded-xl self-end sm:self-auto">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'card'
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-gray-600 hover:text-navy'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>

          {/* Category Chips Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Kategori:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-offwhite text-navy border border-card-border hover:bg-khaki-100'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-2 py-1 text-[11px] text-maroon hover:underline font-semibold shrink-0"
            >
              + Edit Kategori
            </button>
          </div>

          {/* Status Chips Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-card-border/60">
            <span className="text-xs text-gray-500 font-medium shrink-0 mr-1">
              Status Stok:
            </span>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
                  selectedStatus === st
                    ? 'bg-khaki-700 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-card-border hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCTS DISPLAY AREA */}
        {loading ? (
          <div className="bg-white p-12 rounded-card border border-card-border text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-navy animate-spin mb-3" />
            <p className="text-xs text-gray-500">Memuat stok barang dari database...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-12 rounded-card border border-card-border text-center space-y-2">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-heading font-bold text-navy text-base">
              {products.length === 0
                ? 'Belum ada barang di katalog'
                : 'Tidak ada barang ditemukan'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {products.length === 0
                ? 'Katalog masih kosong. Klik tombol "Tambah Barang Baru" di atas untuk memasukkan barang pertama.'
                : 'Coba ubah kata kunci pencarian atau sesuaikan filter kategori.'}
            </p>
            {products.length === 0 && (
              <button
                onClick={handleOpenAddModal}
                className="mt-3 px-4 py-2 bg-maroon text-white text-xs font-semibold rounded-xl"
              >
                + Tambah Barang Pertama
              </button>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* CARD GRID VIEW (Mobile First) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white p-4 rounded-card border border-card-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-khaki-100 border border-khaki-300 text-[11px] font-semibold text-khaki-700">
                        {product.category}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{product.sku}</span>
                    </div>
                    <Badge stock={product.stock} minStock={product.minStock} />
                  </div>

                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Ukuran: <span className="font-semibold text-navy">{product.size}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-card-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Harga Jual</p>
                      <p className="font-number text-base font-bold text-navy">
                        {formatRupiah(product.price)}
                      </p>
                    </div>

                    {/* Quick Restok Stepper */}
                    <div className="flex items-center gap-1 bg-offwhite p-1 rounded-xl border border-card-border">
                      <button
                        onClick={() => handleQuickAdjustStock(product, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-card-border flex items-center justify-center text-navy font-bold hover:bg-gray-100 text-xs"
                        title="Kurangi 1 Stok"
                      >
                        -
                      </button>
                      <span className="font-number text-xs font-bold text-navy px-1.5 min-w-[2.5rem] text-center">
                        {product.stock} pcs
                      </span>
                      <button
                        onClick={() => handleQuickAdjustStock(product, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-card-border flex items-center justify-center text-navy font-bold hover:bg-gray-100 text-xs"
                        title="Tambah 1 Stok (Restok Cepat)"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenHistoryModal(product)}
                      className="px-2.5 py-1.5 rounded-lg bg-offwhite border border-card-border text-navy hover:bg-khaki-100 transition-colors text-xs font-medium flex items-center gap-1"
                      title="Riwayat Mutasi Stok"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Riwayat</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="px-2.5 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-800 transition-colors text-xs font-medium flex items-center gap-1"
                      title="Edit Barang & Stok"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* TABLE VIEW (Desktop Optimized) */
          <div className="bg-white rounded-card border border-card-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-navy text-white font-heading">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">SKU</th>
                    <th className="py-3.5 px-4 font-semibold">Nama Barang</th>
                    <th className="py-3.5 px-4 font-semibold">Kategori</th>
                    <th className="py-3.5 px-4 font-semibold">Ukuran</th>
                    <th className="py-3.5 px-4 font-semibold">Harga Beli</th>
                    <th className="py-3.5 px-4 font-semibold">Harga Jual</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Stok</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-offwhite/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-500 text-xs">
                        {product.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy">
                        {product.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-khaki-100 border border-khaki-300 text-xs font-medium text-khaki-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-navy">{product.size}</td>
                      <td className="py-3 px-4 font-number text-gray-500">
                        {formatRupiah(product.costPrice)}
                      </td>
                      <td className="py-3 px-4 font-number font-bold text-navy">
                        {formatRupiah(product.price)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1 bg-offwhite px-2 py-1 rounded-lg border border-card-border">
                          <button
                            onClick={() => handleQuickAdjustStock(product, -1)}
                            className="w-5 h-5 bg-white rounded border border-card-border text-navy font-bold hover:bg-gray-100 text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-number font-bold text-navy px-1">
                            {product.stock}
                          </span>
                          <button
                            onClick={() => handleQuickAdjustStock(product, 1)}
                            className="w-5 h-5 bg-white rounded border border-card-border text-navy font-bold hover:bg-gray-100 text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge stock={product.stock} minStock={product.minStock} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenHistoryModal(product)}
                            className="p-1.5 rounded-lg bg-offwhite border border-card-border text-navy hover:bg-khaki-100 transition-colors"
                            title="Riwayat Mutasi Stok"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg bg-navy text-white hover:bg-navy-800 transition-colors"
                            title="Edit Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL KELOLA KATEGORI BARANG */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-card shadow-2xl border border-card-border overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-khaki" />
                  <h3 className="font-heading font-bold text-base">Kelola Kategori Barang</h3>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Form Tambah Kategori Baru */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama kategori baru (contoh: Kaos Olahraga)..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 px-3 py-2 bg-offwhite border border-card-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-navy text-navy"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-maroon text-white font-semibold text-xs rounded-xl hover:bg-maroon-700 flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>

                {/* List Kategori Terdaftar */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-navy mb-1">Daftar Kategori Aktif:</p>
                  {categoryList.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 bg-offwhite rounded-xl border border-card-border text-xs"
                    >
                      <span className="font-medium text-navy">{cat}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-card-border bg-gray-50 text-right">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2 bg-navy text-white text-xs font-semibold rounded-xl"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORM (TAMBAH / EDIT BARANG) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-card shadow-2xl border border-card-border overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
              <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
                <h3 className="font-heading font-bold text-base sm:text-lg">
                  {editingProduct ? 'Edit Barang & Stok' : 'Tambah Barang Baru'}
                </h3>
                <button
                  onClick={() => !isSaving && setIsModalOpen(false)}
                  className="p-1 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Nama Barang Seragam *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Baju Kurung Lengan Panjang"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm focus:outline-none focus:border-navy"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as Product['category'],
                        })
                      }
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm focus:outline-none focus:border-navy"
                    >
                      {categoryList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Ukuran *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="S / M / L / XL / Semua Ukuran"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm focus:outline-none focus:border-navy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Harga Beli (Modal) Rp
                    </label>
                    <input
                      type="number"
                      placeholder="45000"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm font-number focus:outline-none focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Harga Jual Rp *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="65000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm font-number focus:outline-none focus:border-navy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Jumlah Stok (pcs) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="25"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm font-number focus:outline-none focus:border-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Kode SKU / Barcode
                    </label>
                    <input
                      type="text"
                      placeholder="BP-KLP-M"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm font-mono focus:outline-none focus:border-navy"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-card-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-maroon hover:bg-maroon-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan ke Database</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL RIWAYAT MUTASI STOK */}
        {historyModalItem && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-card shadow-2xl border border-card-border overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base">Riwayat Mutasi Stok</h3>
                  <p className="text-xs text-khaki font-medium">{historyModalItem.name}</p>
                </div>
                <button
                  onClick={() => setHistoryModalItem(null)}
                  className="p-1 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-80 overflow-y-auto space-y-3">
                {loadingHistory ? (
                  <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-xs">Memuat mutasi dari database...</span>
                  </div>
                ) : stockHistory.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-xs">Belum ada riwayat mutasi stok untuk barang ini.</p>
                  </div>
                ) : (
                  stockHistory.map((mov) => (
                    <div
                      key={mov.id}
                      className="p-3 rounded-xl bg-offwhite border border-card-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            mov.type === 'masuk'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {mov.type === 'masuk' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-navy">
                            {mov.type === 'masuk' ? 'Stok Masuk' : 'Stok Keluar'} ({mov.quantity} pcs)
                          </p>
                          <p className="text-[11px] text-gray-500">{mov.note || '-'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(mov.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-card-border bg-gray-50 text-right">
                <button
                  onClick={() => setHistoryModalItem(null)}
                  className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
