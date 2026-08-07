'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/common/Badge';
import { Product, formatRupiah, getStockStatus } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getDataCutoff } from '@/lib/reset-helper';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  ChevronRight,
  Package,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ReceiptPrint from '@/components/kasir/ReceiptPrint';

interface DashboardTx {
  id: string;
  invoice_no: string;
  customer_name: string | null;
  payment_method: string;
  status: string;
  total: number;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
    size: string;
  }[];
}

// Helper to format date in local timezone YYYY-MM-DD
function getLocalDateStr(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<DashboardTx[]>([]);
  const [cashEntries, setCashEntries] = useState<any[]>([]);
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<DashboardTx | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Items
      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true });

      if (itemsData) {
        const mappedProducts: Product[] = itemsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.name.toLowerCase().includes('rok') ? 'Rok' : item.category,
          dbCategory: item.category,
          size: item.size,
          price: item.price,
          costPrice: item.cost_price,
          stock: item.stock,
          minStock: item.min_stock,
          sku: item.sku || '',
        }));
        setProducts(mappedProducts);
      }

      // 2. Fetch Transactions & Transaction Items (exclude old seed data)
      const cutoff = getDataCutoff();
      const { data: txData } = await supabase
        .from('transactions')
        .select(`
          id,
          invoice_no,
          customer_name,
          payment_method,
          status,
          total,
          created_at,
          transaction_items (
            product_name,
            quantity,
            price,
            subtotal,
            size
          )
        `)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (txData) {
        const mappedTx: DashboardTx[] = txData.map((t: any) => ({
          id: t.id,
          invoice_no: t.invoice_no,
          customer_name: t.customer_name,
          payment_method: t.payment_method,
          status: t.status,
          total: t.total,
          created_at: t.created_at,
          items: (t.transaction_items || []).map((ti: any) => ({
            product_name: ti.product_name,
            quantity: ti.quantity,
            price: ti.price || 0,
            subtotal: ti.subtotal || 0,
            size: ti.size || '',
          })),
        }));
        setTransactions(mappedTx);
      } else {
        setTransactions([]);
      }

      // 3. Fetch Cash Entries (Masuk) to calculate total Omzet including non-Kasir
      const { data: cashData } = await supabase
        .from('cash_entries')
        .select('id, amount, created_at')
        .eq('type', 'Masuk')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (cashData) {
        setCashEntries(cashData);
      } else {
        setCashEntries([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Low stock products filter
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => getStockStatus(p.stock, p.minStock) !== 'aman'
    );
  }, [products]);

  // Calculate Overall & Today's Stats in local timezone
  const dashboardStats = useMemo(() => {
    const todayStr = getLocalDateStr(new Date());

    // Total Overall Sales (synced with Keuangan - all cash inflows)
    const totalOmzet = cashEntries.reduce((sum, c) => sum + c.amount, 0);
    const totalCount = transactions.length;

    // Today's Sales (local timezone)
    const todayCash = cashEntries.filter(
      (c) => getLocalDateStr(c.created_at) === todayStr
    );
    const todayOmzet = todayCash.reduce((sum, c) => sum + c.amount, 0);

    const todayTxs = transactions.filter(
      (t) => getLocalDateStr(t.created_at) === todayStr
    );
    const todayCount = todayTxs.length;

    return { totalOmzet, totalCount, todayOmzet, todayCount, todayTxs };
  }, [transactions, cashEntries]);

  // Calculate 7-Day Revenue Trend Chart Data using local timezone
  const dailyRevenueData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: getLocalDateStr(d),
        day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: 0,
        count: 0,
      };
    });

    // Add all cash inflows to revenue
    cashEntries.forEach((c) => {
      const cDateStr = getLocalDateStr(c.created_at);
      const matchDay = last7Days.find((d) => d.dateStr === cDateStr);
      if (matchDay) {
        matchDay.revenue += c.amount;
      }
    });

    // Add transaction counts
    transactions.forEach((tx) => {
      const txDateStr = getLocalDateStr(tx.created_at);
      const matchDay = last7Days.find((d) => d.dateStr === txDateStr);
      if (matchDay) {
        matchDay.count += 1;
      }
    });

    return last7Days.reverse();
  }, [transactions, cashEntries]);

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6 pb-6 hide-on-print">
        {/* HEADER WELCOME & QUICK ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-navy">
                Ringkasan Toko Real-Time
              </h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                Terhubung Database
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Pantau omzet, stok seragam, dan penjualan kasir secara langsung.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/kasir"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-maroon hover:bg-maroon-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buka Kasir POS</span>
            </Link>
          </div>
        </div>

        {/* 3 KPI CARDS */}
        {loading ? (
          <div className="bg-white p-8 rounded-card border border-card-border text-center flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-navy animate-spin mb-2" />
            <span className="text-xs text-gray-500">Memuat data dari database...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: Total Omzet Penjualan */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Total Omzet Penjualan</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-navy">
                {formatRupiah(dashboardStats.totalOmzet)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Hari ini: {formatRupiah(dashboardStats.todayOmzet)}
                </span>
                <span className="text-gray-400">Sinkron Keuangan</span>
              </div>
            </div>

            {/* Card 2: Total Penjualan */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Total Penjualan</span>
                <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-navy">
                {dashboardStats.totalCount} <span className="text-xs font-sans text-gray-500">Nota</span>
              </p>
              <p className="mt-2 text-[11px] text-gray-500">
                Hari ini: <span className="font-semibold text-navy">{dashboardStats.todayCount} Nota</span>
              </p>
            </div>

            {/* Card 3: Stok Perlu Cek */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Stok Perlu Cek</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-amber-700">
                {lowStockProducts.length} <span className="text-xs font-sans text-gray-500">Barang</span>
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-amber-700 font-medium">Stok menipis atau habis</span>
                <Link href="/stok" className="text-[11px] text-navy font-semibold hover:underline">
                  Kelola &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 7-DAY REVENUE TREND CHART */}
        <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                Tren Omzet 7 Hari Terakhir
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Grafik omzet otomatis dihitung dari nota penjualan di database
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B2E3F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B2E3F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  tickFormatter={(v) => (v >= 1000 ? `Rp${v / 1000}k` : `Rp${v}`)}
                />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), 'Omzet Penjualan']}
                  labelFormatter={(lbl) => `Hari: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#1F2D50',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    borderColor: '#1F2D50',
                  }}
                  itemStyle={{ color: '#D9C9A3' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B2E3F"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM SECTION: LOW STOCK & RECENT SALES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Low Stock Alert List */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-card-border mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    Stok Perlu Perhatian
                  </h3>
                </div>
                <Link
                  href="/stok"
                  className="text-xs text-navy font-semibold hover:underline flex items-center gap-0.5"
                >
                  Kelola Stok <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400">Memuat stok...</div>
              ) : lowStockProducts.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-navy">Semua stok seragam aman!</p>
                  <p className="text-[11px] text-gray-400">
                    Tidak ada barang yang menipis di bawah batas minimum.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2.5 bg-offwhite rounded-xl border border-card-border"
                    >
                      <div>
                        <p className="font-heading font-bold text-navy text-xs">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {product.category} &bull; Size {product.size}
                        </p>
                      </div>
                      <Badge stock={product.stock} minStock={product.minStock} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales List */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-card-border mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-navy" />
                  <h3 className="font-heading font-bold text-navy text-sm sm:text-base">
                    Penjualan Terbaru
                  </h3>
                </div>
                <Link
                  href="/kasir"
                  className="text-xs text-navy font-semibold hover:underline flex items-center gap-0.5"
                >
                  Ke Kasir <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400">Memuat transaksi...</div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <Package className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-navy">Belum ada penjualan tercatat</p>
                  <p className="text-[11px] text-gray-400">
                    Buka Kasir POS untuk mulai memasukkan transaksi pertama.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 bg-offwhite rounded-xl border border-card-border text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-navy">
                            {tx.invoice_no}
                          </span>
                          <span className="text-[10px] bg-khaki-100 text-khaki-700 px-1.5 py-0.5 rounded font-medium">
                            {tx.payment_method}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {tx.customer_name || 'Pembeli Umum'} &bull;{' '}
                          {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-number font-bold text-navy">
                          {formatRupiah(tx.total)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTxForPrint(tx);
                            setTimeout(() => {
                              window.print();
                            }, 100);
                          }}
                          className="p-1.5 bg-white border border-card-border rounded-lg text-navy hover:bg-khaki-100"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STRUK PRINT COMPONENT (ONLY VISIBLE DURING PRINT) */}
      <div className="hidden print:block print-only">
        {selectedTxForPrint && (
          <ReceiptPrint
            data={{
              invoiceNo: selectedTxForPrint.invoice_no,
              date: new Date(selectedTxForPrint.created_at).toLocaleDateString('id-ID'),
              customerName: selectedTxForPrint.customer_name || undefined,
              cashierName: 'Kasir',
              paymentMethod: selectedTxForPrint.payment_method,
              total: selectedTxForPrint.total,
              items: selectedTxForPrint.items.map((i) => ({
                name: i.product_name,
                qty: i.quantity,
                price: i.price,
                subtotal: i.subtotal,
                size: i.size,
              })),
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
