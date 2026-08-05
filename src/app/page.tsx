'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/common/Badge';
import { Product, formatRupiah, getStockStatus } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getResetTimestamp } from '@/lib/reset-helper';
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
import Link from 'next/link';

interface DashboardTxItem {
  product_name: string;
  quantity: number;
}

interface DashboardTx {
  id: string;
  invoice_no: string;
  customer_name: string | null;
  payment_method: string;
  status: string;
  total: number;
  created_at: string;
  items: DashboardTxItem[];
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<DashboardTx[]>([]);

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
          category: item.category as Product['category'],
          size: item.size,
          price: item.price,
          costPrice: item.cost_price,
          stock: item.stock,
          minStock: item.min_stock,
          sku: item.sku || '',
        }));
        setProducts(mappedProducts);
      }

      // 2. Fetch Transactions & Transaction Items (Filtered by Reset Cutoff)
      const cutoff = getResetTimestamp();
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
            quantity
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
          })),
        }));
        setTransactions(mappedTx);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleReset = () => fetchDashboardData();
    window.addEventListener('financials-reset', handleReset);
    return () => window.removeEventListener('financials-reset', handleReset);
  }, []);

  // Low stock products filter
  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) => getStockStatus(p.stock, p.minStock) !== 'aman'
    );
  }, [products]);

  // Calculate Today's Omzet & Transaksi Count
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTxs = transactions.filter(
      (t) => new Date(t.created_at).toISOString().slice(0, 10) === todayStr
    );
    const omzet = todayTxs.reduce((sum, t) => sum + t.total, 0);
    const count = todayTxs.length;
    const avg = count > 0 ? Math.round(omzet / count) : 0;
    return { omzet, count, avg, todayTxs };
  }, [transactions]);

  // Calculate 7-Day Revenue Trend Chart Data
  const dailyRevenueData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: 0,
        count: 0,
      };
    });

    transactions.forEach((tx) => {
      const txDateStr = new Date(tx.created_at).toISOString().slice(0, 10);
      const matchDay = last7Days.find((d) => d.dateStr === txDateStr);
      if (matchDay) {
        matchDay.revenue += tx.total;
        matchDay.count += 1;
      }
    });

    return last7Days;
  }, [transactions]);

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* HEADER WELCOME & QUICK ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-navy">
                Ringkasan Toko Hari Ini
              </h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                Data Real-Time
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Pantau omzet, stok seragam, dan penjualan kasir secara langsung dari database.
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
            {/* Card 1: Omzet Hari Ini */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Omzet Hari Ini</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-navy">
                {formatRupiah(todayStats.omzet)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Terhubung kasir hari ini</span>
              </div>
            </div>

            {/* Card 2: Total Transaksi */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Total Penjualan</span>
                <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-navy">
                {todayStats.count} <span className="text-xs font-sans text-gray-500">Nota</span>
              </p>
              <p className="mt-2 text-[11px] text-gray-500">
                {todayStats.avg > 0 ? `Rata-rata ${formatRupiah(todayStats.avg)}/nota` : 'Belum ada transaksi hari ini'}
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

        {/* REVENUE CHART SECTION */}
        <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-heading font-bold text-navy text-base sm:text-lg">
                Tren Omzet 7 Hari Terakhir
              </h3>
              <p className="text-xs text-gray-500">
                Grafik omzet otomatis dihitung dari nota penjualan di database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-maroon"></span>
              <span className="text-xs text-gray-600 font-medium">Omzet Penjualan (Rp)</span>
            </div>
          </div>

          <div className="h-56 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B2E3F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B2E3F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#1F2D50' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#1F2D50' }}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `Rp${(val / 1000000).toFixed(1)}M`
                      : `Rp${(val / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Omzet']}
                  labelFormatter={(label, payload) => {
                    const data = payload && payload[0] ? payload[0].payload : null;
                    return data ? `${label} (${data.date})` : label;
                  }}
                  contentStyle={{
                    backgroundColor: '#FAF9F4',
                    borderColor: '#E6E1D3',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
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

        {/* TWO COLUMN GRID FOR TABLES / LISTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* STOK PERLU PERHATIAN */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-navy text-base">
                    Stok Perlu Perhatian
                  </h3>
                </div>
                <Link
                  href="/stok"
                  className="text-xs font-semibold text-maroon hover:underline flex items-center gap-1"
                >
                  <span>Kelola Stok</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-gray-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-semibold text-emerald-800">
                    Semua stok barang dalam kondisi aman.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Tidak ada barang yang menipis atau habis saat ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-offwhite border border-card-border hover:border-navy-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white border border-card-border flex items-center justify-center text-navy font-bold text-xs shrink-0">
                          {item.category.slice(0, 4)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm text-navy truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            Ukuran: <span className="font-semibold text-navy">{item.size}</span> | SKU: {item.sku}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <p className="font-number text-xs sm:text-sm font-bold text-navy">
                          Sisa: {item.stock} pcs
                        </p>
                        <Badge stock={item.stock} minStock={item.minStock} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-card-border text-center">
              <Link
                href="/stok"
                className="text-xs text-navy font-medium hover:text-maroon transition-colors"
              >
                + Kelola {lowStockProducts.length} barang di halaman Stok
              </Link>
            </div>
          </div>

          {/* TRANSAKSI TERBARU HARI INI */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-navy text-base">
                    Penjualan Terbaru
                  </h3>
                </div>
                <Link
                  href="/kasir"
                  className="text-xs font-semibold text-maroon hover:underline flex items-center gap-1"
                >
                  <span>Ke Kasir</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div className="py-8 text-center text-gray-400 space-y-1">
                  <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-semibold text-navy">Belum ada transaksi penjualan.</p>
                  <p className="text-[11px] text-gray-400">
                    Buka Kasir POS untuk melakukan transaksi pertama.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-offwhite border border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-navy">
                            {tx.invoice_no}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-card-border font-medium text-gray-600">
                            {tx.payment_method}
                          </span>
                          {tx.customer_name && (
                            <span className="text-[10px] text-gray-500 font-medium truncate">
                              ({tx.customer_name})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 truncate">
                          {tx.items && tx.items.length > 0
                            ? tx.items.map((i) => `${i.product_name} (${i.quantity}x)`).join(', ')
                            : 'Transaksi POS'}
                        </p>
                      </div>

                      <div className="flex sm:flex-col justify-between sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-card-border shrink-0">
                        <span className="text-[11px] text-gray-400">
                          {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="font-number text-xs sm:text-sm font-bold text-navy">
                          {formatRupiah(tx.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-card-border text-center">
              <Link
                href="/kasir"
                className="text-xs text-navy font-medium hover:text-maroon transition-colors"
              >
                Buat transaksi baru di Kasir POS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
