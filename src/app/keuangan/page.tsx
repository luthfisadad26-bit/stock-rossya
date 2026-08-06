'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatRupiah } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getResetTimestamp, setResetTimestamp } from '@/lib/reset-helper';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  Plus,
  PieChart as PieIcon,
  X,
  Check,
  Loader2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface DBCashEntry {
  id: string;
  type: 'Masuk' | 'Keluar';
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface CategoryRevenue {
  category: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Baju Putih': '#1F2D50',
  Celana: '#8B2E3F',
  Pramuka: '#D9C9A3',
  Aksesoris: '#695D3E',
  Batik: '#059669',
};

export default function KeuanganPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cashRecords, setCashRecords] = useState<DBCashEntry[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryRevenue[]>([]);
  const [cashFilter, setCashFilter] = useState<'Semua' | 'Masuk' | 'Keluar'>('Semua');

  // Modal State for New Cash Entry
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashForm, setCashForm] = useState({
    type: 'Keluar' as 'Masuk' | 'Keluar',
    category: 'Biaya Operasional',
    amount: '',
    description: '',
  });

  // Fetch Financial Data from Supabase
  const fetchKeuanganData = async () => {
    setLoading(true);
    try {
      const cutoff = getResetTimestamp();

      // 1. Fetch Cash Entries (Filtered by Reset Cutoff)
      const { data: cashData } = await supabase
        .from('cash_entries')
        .select('*')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false });

      if (cashData) {
        setCashRecords(cashData as DBCashEntry[]);
      } else {
        setCashRecords([]);
      }

      // 2. Fetch Sales by Category for Pie Chart
      const { data: txItemsData } = await supabase
        .from('transaction_items')
        .select('subtotal, items (category), created_at')
        .gte('created_at', cutoff);

      const catMap: Record<string, number> = {
        'Baju Putih': 0,
        Celana: 0,
        Rok: 0,
        Pramuka: 0,
        Aksesoris: 0,
        Batik: 0,
      };

      if (txItemsData) {
        txItemsData.forEach((row: any) => {
          const catName = row.items?.category || 'Baju Putih';
          catMap[catName] = (catMap[catName] || 0) + (row.subtotal || 0);
        });
      }

      const pieData: CategoryRevenue[] = Object.keys(catMap).map((cat) => ({
        category: cat,
        value: catMap[cat],
        color: CATEGORY_COLORS[cat] || '#1F2D50',
      }));

      setCategoryBreakdown(pieData);
    } catch (err) {
      console.error('Gagal mengambil data keuangan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset Laporan & Keuangan ke Rp 0? Semua transaksi lama akan di-reset dari 0.')) {
      setResetTimestamp();
      fetchKeuanganData();
    }
  };

  useEffect(() => {
    fetchKeuanganData();
    const handleReset = () => fetchKeuanganData();
    window.addEventListener('financials-reset', handleReset);
    return () => window.removeEventListener('financials-reset', handleReset);
  }, []);

  // Calculate Financial Summary
  const totalKasMasuk = useMemo(() => {
    return cashRecords
      .filter((r) => r.type === 'Masuk')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [cashRecords]);

  const totalKasKeluar = useMemo(() => {
    return cashRecords
      .filter((r) => r.type === 'Keluar')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [cashRecords]);

  const labaBersih = totalKasMasuk - totalKasKeluar;

  // Add Cash Entry to Supabase
  const handleSaveCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashForm.amount || !cashForm.description) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from('cash_entries').insert({
        type: cashForm.type,
        category: cashForm.category,
        amount: Number(cashForm.amount),
        description: cashForm.description,
      });

      if (error) {
        alert('Gagal mencatat kas: ' + error.message);
      } else {
        setIsCashModalOpen(false);
        setCashForm({
          type: 'Keluar',
          category: 'Biaya Operasional',
          amount: '',
          description: '',
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('financials-reset'));
        }
        await fetchKeuanganData();
      }
    } catch (err) {
      console.error('Exception saving cash entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Cash Records
  const filteredCashRecords = useMemo(() => {
    if (cashFilter === 'Semua') return cashRecords;
    return cashRecords.filter((r) => r.type === cashFilter);
  }, [cashRecords, cashFilter]);

  // Bar Chart Data (Comparison)
  const barChartData = useMemo(() => {
    return [
      { name: 'Kas Masuk', amount: totalKasMasuk, fill: '#059669' },
      { name: 'Kas Keluar', amount: totalKasKeluar, fill: '#8B2E3F' },
      { name: 'Laba Bersih', amount: Math.max(0, labaBersih), fill: '#1F2D50' },
    ];
  }, [totalKasMasuk, totalKasKeluar, labaBersih]);

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* HEADER & ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-lg sm:text-2xl font-bold text-navy">
                Laporan &amp; Keuangan Toko
              </h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                Laporan Real-Time
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Pantau arus kas (cashflow) dan laporan laba rugi toko secara langsung dari database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-offwhite hover:bg-rose-50 text-rose-700 font-medium text-xs sm:text-sm rounded-xl border border-rose-200 transition-all active:scale-95"
              title="Reset Semua Angka Keuangan ke Rp 0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset ke Rp 0</span>
            </button>
            <button
              onClick={() => setIsCashModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-maroon hover:bg-maroon-700 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Kas Masuk/Keluar</span>
            </button>
          </div>
        </div>

        {/* 3 FINANCIAL KPI CARDS */}
        {loading ? (
          <div className="bg-white p-8 rounded-card border border-card-border text-center flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-navy animate-spin mb-2" />
            <span className="text-xs text-gray-500">Memuat laporan keuangan dari database...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: Total Kas Masuk */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Total Kas Masuk</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ArrowUpCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-emerald-800">
                {formatRupiah(totalKasMasuk)}
              </p>
              <p className="mt-2 text-[11px] text-gray-500">Dari hasil penjualan kasir</p>
            </div>

            {/* Card 2: Total Kas Keluar */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Total Kas Keluar</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <ArrowDownCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-rose-700">
                {formatRupiah(totalKasKeluar)}
              </p>
              <p className="mt-2 text-[11px] text-gray-500">Operasional &amp; restok barang</p>
            </div>

            {/* Card 3: Laba Bersih */}
            <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Estimasi Laba Bersih</span>
                <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <p className="font-number text-xl sm:text-2xl font-bold text-navy">
                {formatRupiah(labaBersih)}
              </p>
              <p className="mt-2 text-[11px] text-emerald-700 font-medium">Surplus kas harian</p>
            </div>
          </div>
        )}

        {/* CHARTS SECTION (Pie Chart & Bar Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Chart 1: Kontribusi Penjualan Per Kategori (Pie Chart) */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-navy text-base">
                  Omzet Penjualan Per Kategori
                </h3>
                <p className="text-xs text-gray-500">Persentase kontribusi hasil jualan</p>
              </div>
              <PieIcon className="w-5 h-5 text-khaki-700" />
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Omzet']}
                    contentStyle={{
                      backgroundColor: '#FAF9F4',
                      borderColor: '#E6E1D3',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {categoryBreakdown.map((c) => (
                <div key={c.category} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: c.color }}
                  ></span>
                  <span className="text-gray-600 font-medium">{c.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Perbandingan Kas Masuk vs Keluar (Bar Chart) */}
          <div className="bg-white p-4 sm:p-5 rounded-card border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-navy text-base">
                  Perbandingan Arus Kas
                </h3>
                <p className="text-xs text-gray-500">Total masuk vs keluar vs laba bersih</p>
              </div>
              <Wallet className="w-5 h-5 text-navy" />
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1D3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#1F2D50' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#1F2D50' }}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Nominal']}
                    contentStyle={{
                      backgroundColor: '#FAF9F4',
                      borderColor: '#E6E1D3',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CASH RECORDS TABLE (BUKU KAS) */}
        <div className="bg-white rounded-card border border-card-border shadow-sm overflow-hidden space-y-3 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-navy text-base sm:text-lg">
                Buku Kas Harian (Arus Kas)
              </h3>
              <p className="text-xs text-gray-500">
                Riwayat detail uang masuk dan keluar dari database Supabase
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-offwhite p-1 border border-card-border rounded-xl self-start sm:self-auto">
              {(['Semua', 'Masuk', 'Keluar'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCashFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cashFilter === tab
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-navy hover:bg-khaki-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-navy text-white font-heading">
                <tr>
                  <th className="py-3 px-4 font-semibold">Waktu</th>
                  <th className="py-3 px-4 font-semibold">Tipe</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold">Keterangan</th>
                  <th className="py-3 px-4 font-semibold text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filteredCashRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileSpreadsheet className="w-8 h-8 text-gray-300" />
                        <p className="text-xs font-semibold text-navy">Belum ada catatan kas tersimpan.</p>
                        <p className="text-[11px] text-gray-400">
                          Klik tombol &quot;Catat Kas Masuk/Keluar&quot; di atas untuk menambah catatan pertama.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCashRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-offwhite/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            record.type === 'Masuk'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-navy">{record.category}</td>
                      <td className="py-3 px-4 text-gray-600">{record.description || '-'}</td>
                      <td
                        className={`py-3 px-4 font-number font-bold text-right ${
                          record.type === 'Masuk' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {record.type === 'Masuk' ? '+' : '-'} {formatRupiah(record.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM CATAT KAS BARU */}
        {isCashModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-card shadow-2xl border border-card-border overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
              <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
                <h3 className="font-heading font-bold text-base">Catat Kas Masuk / Keluar</h3>
                <button
                  onClick={() => !isSaving && setIsCashModalOpen(false)}
                  className="p-1 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCashEntry} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Tipe Transaksi *
                    </label>
                    <select
                      value={cashForm.type}
                      onChange={(e) =>
                        setCashForm({
                          ...cashForm,
                          type: e.target.value as 'Masuk' | 'Keluar',
                        })
                      }
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-xs font-semibold focus:outline-none focus:border-navy"
                    >
                      <option value="Keluar">Kas Keluar (-)</option>
                      <option value="Masuk">Kas Masuk (+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">
                      Kategori *
                    </label>
                    <select
                      value={cashForm.category}
                      onChange={(e) =>
                        setCashForm({ ...cashForm, category: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-xs focus:outline-none focus:border-navy"
                    >
                      <option value="Biaya Operasional">Biaya Operasional</option>
                      <option value="Restok Barang">Restok Barang</option>
                      <option value="Penjualan Kasir">Penjualan Kasir</option>
                      <option value="Gaji Karyawan">Gaji Karyawan</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Nominal Rp *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={cashForm.amount}
                    onChange={(e) =>
                      setCashForm({ ...cashForm, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-sm font-number focus:outline-none focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Keterangan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembelian kantong plastik & konsumsi"
                    value={cashForm.description}
                    onChange={(e) =>
                      setCashForm({ ...cashForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-offwhite border border-card-border rounded-xl text-xs focus:outline-none focus:border-navy"
                  />
                </div>

                <div className="pt-3 border-t border-card-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsCashModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-maroon hover:bg-maroon-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Catatan Kas</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
