'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/common/Badge';
import { Product, formatRupiah } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getCustomCategories } from '@/lib/categories';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  X,
  Printer,
  Sparkles,
  Loader2,
  Package,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Dynamic Categories State
  const [categoryList, setCategoryList] = useState<string[]>([]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'QRIS'>('Tunai');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  // Mobile Bottom Sheet expanded state
  const [isMobileCartExpanded, setIsMobileCartExpanded] = useState(false);

  // Success Checkout Modal State
  const [completedTx, setCompletedTx] = useState<{
    invoiceNo: string;
    items: CartItem[];
    total: number;
    paymentMethod: string;
    customerName?: string;
    cashAmount?: number;
    change?: number;
  } | null>(null);

  // Sync Categories
  const syncCategories = () => {
    setCategoryList(getCustomCategories());
  };

  useEffect(() => {
    syncCategories();
    window.addEventListener('categories-updated', syncCategories);
    return () => window.removeEventListener('categories-updated', syncCategories);
  }, []);

  const categories = useMemo(() => ['Semua', ...categoryList], [categoryList]);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Gagal mengambil barang kasir:', error);
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock === 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Limit to stock
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove item
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculate Cart Total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Calculate Total Items
  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cash Change calculation
  const cashNum = Number(cashAmount) || 0;
  const changeAmount = cashNum >= cartTotal ? cashNum - cartTotal : 0;

  // Handle Checkout Submit to Supabase
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Tunai' && cashNum < cartTotal) {
      alert(`Uang tunai kurang! Minimal ${formatRupiah(cartTotal)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const invoiceNo = `TRX-${dateStr}-${randomCode}`;

      // 1. CREATE TRANSACTION HEADER
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          invoice_no: invoiceNo,
          customer_name: customerName.trim() || null,
          payment_method: paymentMethod,
          status: 'Lunas',
          total: cartTotal,
          cash_received: paymentMethod === 'Tunai' ? cashNum : null,
          change_amount: paymentMethod === 'Tunai' ? changeAmount : 0,
        })
        .select()
        .single();

      if (txError || !txData) {
        alert('Gagal memproses transaksi: ' + (txError?.message || 'Error'));
        setIsProcessing(false);
        return;
      }

      // 2. CREATE TRANSACTION ITEMS
      const txItems = cart.map((item) => ({
        transaction_id: txData.id,
        item_id: item.product.id,
        product_name: item.product.name,
        size: item.product.size,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase
        .from('transaction_items')
        .insert(txItems);

      if (itemsErr) {
        console.error('Error inserting transaction items:', itemsErr);
      }

      // 3. REDUCE ITEM STOCK & RECORD STOCK MOVEMENTS
      for (const item of cart) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        
        // Update stock in items table via Delete + Insert strategy
        await supabase.from('items').delete().eq('id', item.product.id);
        await supabase.from('items').insert({
          id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          size: item.product.size,
          price: item.product.price,
          cost_price: item.product.costPrice,
          stock: newStock,
          min_stock: item.product.minStock,
          sku: item.product.sku,
        });

        // Insert stock_movement (type: keluar)
        await supabase.from('stock_movements').insert({
          item_id: item.product.id,
          type: 'keluar',
          quantity: item.quantity,
          note: `Penjualan kasir (${invoiceNo})`,
        });
      }

      // 4. CREATE CASH ENTRY (KAS MASUK)
      const { error: cashErr } = await supabase.from('cash_entries').insert({
        type: 'Masuk',
        category: 'Penjualan Kasir',
        amount: cartTotal,
        description: `Penjualan ${invoiceNo}${customerName ? ` (${customerName})` : ''}`,
        ref_transaction_id: txData.id,
      });

      if (cashErr) {
        console.error('Error inserting cash entry:', cashErr);
      }

      // SET COMPLETED STATE & RESET CART
      setCompletedTx({
        invoiceNo,
        items: [...cart],
        total: cartTotal,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        cashAmount: paymentMethod === 'Tunai' ? cashNum : cartTotal,
        change: paymentMethod === 'Tunai' ? changeAmount : 0,
      });

      setCart([]);
      setCashAmount('');
      setCustomerName('');
      setIsMobileCartExpanded(false);

      // Refresh product list so POS stock numbers update immediately
      await fetchProducts();
    } catch (err) {
      console.error('Exception during checkout:', err);
      alert('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 relative">
        {/* CATALOG SECTION (Left 7 or 8 columns on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Header & Search */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-navy">
                    Kasir Penjualan (POS)
                  </h2>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Katalog Aktif
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Klik seragam di bawah untuk memasukkan ke keranjang belanja
                </p>
              </div>
              <span className="text-xs font-mono bg-khaki-100 border border-khaki-300 text-khaki-700 px-3 py-1 rounded-full font-medium shrink-0">
                {products.length} Varian
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari barang kasir berdasarkan nama atau SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-offwhite border border-card-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-navy text-navy placeholder:text-gray-400"
              />
            </div>

            {/* Category Chips Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="bg-white p-12 rounded-card border border-card-border text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-navy animate-spin mb-3" />
              <p className="text-xs text-gray-500">Memuat katalog barang dari database...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-card border border-card-border text-center space-y-2">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-heading text-navy font-bold">
                {products.length === 0
                  ? 'Belum ada barang di katalog'
                  : 'Barang tidak ditemukan'}
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                {products.length === 0
                  ? 'Katalog kasir masih kosong. Tambahkan barang terlebih dahulu di halaman Stok.'
                  : 'Coba sesuaikan kata kunci pencarian atau filter kategori di atas.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isOutOfStock = product.stock === 0;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`bg-white p-3.5 rounded-card border text-left flex flex-col justify-between transition-all relative group ${
                      isOutOfStock
                        ? 'opacity-50 border-gray-200 cursor-not-allowed'
                        : 'border-card-border hover:border-maroon hover:shadow-md active:scale-95'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 bg-maroon text-white font-number text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 animate-in zoom-in">
                        {inCart.quantity}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-gray-400">
                          {product.sku}
                        </span>
                        <Badge stock={product.stock} minStock={product.minStock} />
                      </div>

                      <h4 className="font-heading font-bold text-navy text-xs sm:text-sm line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Ukuran: <span className="font-semibold text-navy">{product.size}</span>
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-card-border flex items-center justify-between">
                      <span className="font-number font-bold text-xs sm:text-sm text-navy">
                        {formatRupiah(product.price)}
                      </span>
                      <span className="text-[10px] bg-offwhite px-2 py-0.5 rounded text-gray-600 border border-card-border">
                        Stok {product.stock}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CART & CHECKOUT PANEL (Right 5 or 4 columns Desktop - Sticky/Fixed) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-card border border-card-border shadow-sm p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-navy" />
                <h3 className="font-heading font-bold text-base text-navy">
                  Keranjang Belanja
                </h3>
              </div>
              <span className="text-xs bg-navy text-white font-number font-bold px-2.5 py-0.5 rounded-full">
                {totalItemCount} item
              </span>
            </div>

            {/* Customer Name Optional */}
            <div>
              <label className="block text-[11px] font-semibold text-navy mb-1">
                Nama Pembeli (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Ibu Fatimah / Pembeli Umum"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-xs focus:outline-none focus:border-navy"
              />
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-gray-400 space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-medium text-navy">Keranjang belanja masih kosong.</p>
                  <p className="text-[11px] text-gray-400">
                    Klik barang di sebelah kiri untuk menambah ke keranjang.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 bg-offwhite rounded-xl border border-card-border text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-heading font-bold text-navy truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Ukuran: {item.product.size} &bull; {formatRupiah(item.product.price)}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-card-border flex items-center justify-center text-navy hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-number font-bold text-xs w-5 text-center text-navy">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-card-border flex items-center justify-center text-navy hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-card-border space-y-3">
              <label className="block text-[11px] font-semibold text-navy">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Tunai', icon: Banknote, label: 'Tunai' },
                  { id: 'Transfer', icon: CreditCard, label: 'Transfer' },
                  { id: 'QRIS', icon: QrCode, label: 'QRIS' },
                ].map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() =>
                        setPaymentMethod(method.id as 'Tunai' | 'Transfer' | 'QRIS')
                      }
                      className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                        isActive
                          ? 'bg-navy text-white border-navy shadow-sm'
                          : 'bg-offwhite text-navy border-card-border hover:bg-khaki-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Input Field */}
              {paymentMethod === 'Tunai' && (
                <div className="p-3 bg-offwhite rounded-xl border border-card-border space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-navy">Uang Diterima Rp</label>
                    {cashNum > 0 && (
                      <span
                        className={`font-number font-bold text-xs ${
                          cashNum >= cartTotal ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {cashNum >= cartTotal
                          ? `Kembali: ${formatRupiah(changeAmount)}`
                          : 'Kurang'}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder={`Minimal ${cartTotal}`}
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-card-border rounded-lg text-sm font-number focus:outline-none focus:border-navy"
                  />
                  {/* Quick Cash Buttons */}
                  <div className="flex gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                    {[cartTotal, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCashAmount(String(amt))}
                        className="px-2 py-1 bg-white border border-card-border rounded text-[10px] font-number text-navy hover:bg-khaki-100 shrink-0"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Display */}
              <div className="p-4 bg-navy text-white rounded-xl flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-[10px] text-khaki font-medium uppercase tracking-wider">
                    Total Pembayaran
                  </p>
                  <p className="font-number text-xl font-bold">{formatRupiah(cartTotal)}</p>
                </div>
                <Sparkles className="w-5 h-5 text-khaki animate-pulse" />
              </div>

              {/* Checkout Button */}
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-3 bg-maroon hover:bg-maroon-700 text-white font-heading font-bold text-sm rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Proses Pembayaran ({totalItemCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM SHEET (< lg screen) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-card-border shadow-2xl rounded-t-2xl p-4 transition-all duration-300">
          {!isMobileCartExpanded ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500">
                  {totalItemCount} item dalam keranjang
                </span>
                <p className="font-number font-bold text-lg text-navy">
                  {formatRupiah(cartTotal)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => setIsMobileCartExpanded(true)}
                    className="p-2.5 bg-offwhite border border-card-border text-navy rounded-xl flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Detail</span>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                )}
                <button
                  disabled={cart.length === 0 || isProcessing}
                  onClick={handleCheckout}
                  className="px-5 py-2.5 bg-maroon text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Bayar</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-card-border">
                <h3 className="font-heading font-bold text-navy text-sm">
                  Detail Keranjang Belanja ({totalItemCount})
                </h3>
                <button
                  onClick={() => setIsMobileCartExpanded(false)}
                  className="p-1 text-gray-400 hover:text-navy"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Items List Mobile */}
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2 bg-offwhite rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-bold text-navy">{item.product.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {formatRupiah(item.product.price)} x {item.quantity} ({item.product.size})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 bg-white rounded border border-card-border flex items-center justify-center font-bold text-navy"
                      >
                        -
                      </button>
                      <span className="font-bold text-navy">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 bg-white rounded border border-card-border flex items-center justify-center font-bold text-navy"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Payment Selector */}
              <div className="space-y-2 pt-2 border-t border-card-border">
                <label className="block text-xs font-bold text-navy">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tunai', 'Transfer', 'QRIS'].map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        setPaymentMethod(m as 'Tunai' | 'Transfer' | 'QRIS')
                      }
                      className={`py-2 text-xs rounded-xl border font-semibold ${
                        paymentMethod === m
                          ? 'bg-navy text-white border-navy'
                          : 'bg-offwhite text-navy border-card-border'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Tunai' && (
                  <input
                    type="number"
                    placeholder={`Nominal Uang Tunai (Minimal ${cartTotal})`}
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full p-2 bg-offwhite border border-card-border rounded-xl text-xs font-number"
                  />
                )}
              </div>

              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-3 bg-maroon text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bayar {formatRupiah(cartTotal)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* MODAL STRUK (RECEIPT MODAL AFTER SUCCESSFUL CHECKOUT) */}
        {completedTx && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-card shadow-2xl border border-card-border overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header Struk */}
              <div className="bg-navy text-white p-5 text-center space-y-1 relative">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-heading font-bold text-lg">Pembayaran Berhasil!</h3>
                <p className="text-xs text-khaki font-mono">{completedTx.invoiceNo}</p>
                <button
                  onClick={() => setCompletedTx(null)}
                  className="absolute top-4 right-4 p-1 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detail Struk */}
              <div className="p-5 space-y-4 text-xs">
                {completedTx.customerName && (
                  <div className="flex justify-between border-b border-card-border pb-2">
                    <span className="text-gray-500">Nama Pembeli</span>
                    <span className="font-semibold text-navy">{completedTx.customerName}</span>
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {completedTx.items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-navy">
                      <div>
                        <p className="font-bold">{item.product.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {item.quantity} x {formatRupiah(item.product.price)} ({item.product.size})
                        </p>
                      </div>
                      <span className="font-number font-bold">
                        {formatRupiah(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-dashed border-gray-300 space-y-1.5">
                  <div className="flex justify-between text-navy font-bold text-sm">
                    <span>TOTAL</span>
                    <span className="font-number text-maroon">
                      {formatRupiah(completedTx.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Metode Bayar</span>
                    <span className="font-medium">{completedTx.paymentMethod}</span>
                  </div>

                  {completedTx.paymentMethod === 'Tunai' && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Diterima</span>
                        <span className="font-number">
                          {formatRupiah(completedTx.cashAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Kembalian</span>
                        <span className="font-number">
                          {formatRupiah(completedTx.change || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      alert('Fungsi cetak struk terhubung ke printer thermal.');
                    }}
                    className="flex-1 py-2 bg-offwhite border border-card-border text-navy rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-khaki-100 text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Struk</span>
                  </button>
                  <button
                    onClick={() => setCompletedTx(null)}
                    className="flex-1 py-2 bg-navy text-white rounded-xl font-semibold hover:bg-navy-800 text-xs"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
