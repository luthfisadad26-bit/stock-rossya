export interface Product {
  id: string;
  name: string;
  category: 'Baju Putih' | 'Celana' | 'Pramuka' | 'Aksesoris' | 'Batik';
  size: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  sku: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  date: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: 'Tunai' | 'Transfer' | 'QRIS';
  customerName?: string;
  status: 'Lunas' | 'Piutang';
}

export interface Receivable {
  id: string;
  customerName: string;
  phone: string;
  amount: number;
  dueDate: string;
  status: 'Belum Lulus' | 'Lunas';
  notes: string;
}

export interface CashRecord {
  id: string;
  date: string;
  type: 'Masuk' | 'Keluar';
  category: string;
  amount: number;
  description: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Baju Kurung Putih Lengan Panjang',
    category: 'Baju Putih',
    size: 'M',
    price: 65000,
    costPrice: 48000,
    stock: 35,
    minStock: 10,
    sku: 'BP-KLP-M',
  },
  {
    id: 'prod-2',
    name: 'Baju Putih Lengan Pendek',
    category: 'Baju Putih',
    size: 'L',
    price: 58000,
    costPrice: 42000,
    stock: 8,
    minStock: 15,
    sku: 'BP-LPD-L',
  },
  {
    id: 'prod-3',
    name: 'Baju Putih Lengan Panjang XL',
    category: 'Baju Putih',
    size: 'XL',
    price: 75000,
    costPrice: 54000,
    stock: 3,
    minStock: 12,
    sku: 'BP-LPJ-XL',
  },
  {
    id: 'prod-4',
    name: 'Celana Merah Panjang SD',
    category: 'Celana',
    size: 'L',
    price: 75000,
    costPrice: 55000,
    stock: 42,
    minStock: 15,
    sku: 'CL-MRP-L',
  },
  {
    id: 'prod-5',
    name: 'Celana Biru Panjang SMP',
    category: 'Celana',
    size: 'XL',
    price: 85000,
    costPrice: 62000,
    stock: 18,
    minStock: 10,
    sku: 'CL-BRP-XL',
  },
  {
    id: 'prod-6',
    name: 'Celana Abu Panjang SMA',
    category: 'Celana',
    size: 'L',
    price: 90000,
    costPrice: 68000,
    stock: 0,
    minStock: 10,
    sku: 'CL-ABP-L',
  },
  {
    id: 'prod-7',
    name: 'Rok Merah Rempel SD',
    category: 'Celana',
    size: 'M',
    price: 78000,
    costPrice: 58000,
    stock: 5,
    minStock: 10,
    sku: 'CL-RMR-M',
  },
  {
    id: 'prod-8',
    name: 'Baju Pramuka Penggalang Putra',
    category: 'Pramuka',
    size: 'M',
    price: 80000,
    costPrice: 58000,
    stock: 15,
    minStock: 10,
    sku: 'PRM-BPP-M',
  },
  {
    id: 'prod-9',
    name: 'Rok Pramuka Rempel Cokelat',
    category: 'Pramuka',
    size: 'L',
    price: 85000,
    costPrice: 62000,
    stock: 2,
    minStock: 8,
    sku: 'PRM-RRC-L',
  },
  {
    id: 'prod-10',
    name: 'Celana Pramuka Panjang',
    category: 'Pramuka',
    size: 'L',
    price: 82000,
    costPrice: 60000,
    stock: 24,
    minStock: 10,
    sku: 'PRM-CPJ-L',
  },
  {
    id: 'prod-11',
    name: 'Dasi Merah SD',
    category: 'Aksesoris',
    size: 'All Size',
    price: 15000,
    costPrice: 8000,
    stock: 60,
    minStock: 20,
    sku: 'AKS-DSD-AS',
  },
  {
    id: 'prod-12',
    name: 'Kaos Kaki Putih Polos',
    category: 'Aksesoris',
    size: 'M',
    price: 12000,
    costPrice: 6000,
    stock: 45,
    minStock: 15,
    sku: 'AKS-KKP-M',
  },
  {
    id: 'prod-13',
    name: 'Sabuk Logo Sekolah',
    category: 'Aksesoris',
    size: 'All Size',
    price: 20000,
    costPrice: 11000,
    stock: 4,
    minStock: 10,
    sku: 'AKS-SLS-AS',
  },
  {
    id: 'prod-14',
    name: 'Jilbab Putih Instant Kaos',
    category: 'Aksesoris',
    size: 'L',
    price: 35000,
    costPrice: 22000,
    stock: 22,
    minStock: 10,
    sku: 'AKS-JPI-L',
  },
  {
    id: 'prod-15',
    name: 'Batik Lengan Pendek Motif Sekolah',
    category: 'Batik',
    size: 'M',
    price: 95000,
    costPrice: 70000,
    stock: 20,
    minStock: 10,
    sku: 'BTK-LPM-M',
  },
  {
    id: 'prod-16',
    name: 'Batik Lengan Panjang Motif Parang',
    category: 'Batik',
    size: 'L',
    price: 110000,
    costPrice: 82000,
    stock: 7,
    minStock: 10,
    sku: 'BTK-LPP-L',
  },
  {
    id: 'prod-17',
    name: 'Batik Lengan Pendek Motif Kawung',
    category: 'Batik',
    size: 'XL',
    price: 105000,
    costPrice: 78000,
    stock: 12,
    minStock: 8,
    sku: 'BTK-LPK-XL',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    invoiceNo: 'TRX-20231024-001',
    date: '2023-10-24 14:22',
    items: [
      { productId: 'prod-1', productName: 'Baju Kurung Putih SD', size: 'M', quantity: 2, price: 65000 },
      { productId: 'prod-3', productName: 'Celana SD Merah Panjang', size: 'L', quantity: 1, price: 75000 },
    ],
    total: 205000,
    paymentMethod: 'Tunai',
    customerName: 'Ibu Fatimah',
    status: 'Lunas',
  },
  {
    id: 'tx-102',
    invoiceNo: 'TRX-20231024-002',
    date: '2023-10-24 13:05',
    items: [
      { productId: 'prod-12', productName: 'Dasi SD Merah', size: 'All Size', quantity: 3, price: 15000 },
      { productId: 'prod-13', productName: 'Kaos Kaki Putih Polos SD/SMP', size: 'M', quantity: 2, price: 12000 },
    ],
    total: 69000,
    paymentMethod: 'QRIS',
    customerName: 'Pak Budi',
    status: 'Lunas',
  },
  {
    id: 'tx-103',
    invoiceNo: 'TRX-20231024-003',
    date: '2023-10-24 11:40',
    items: [
      { productId: 'prod-6', productName: 'Celana SMP Biru Panjang', size: 'XL', quantity: 2, price: 85000 },
      { productId: 'prod-7', productName: 'Rok SMP Biru Rempel', size: 'L', quantity: 1, price: 88000 },
    ],
    total: 258000,
    paymentMethod: 'Transfer',
    customerName: 'Ibu Rahma',
    status: 'Lunas',
  },
  {
    id: 'tx-104',
    invoiceNo: 'TRX-20231024-004',
    date: '2023-10-24 10:15',
    items: [
      { productId: 'prod-10', productName: 'Baju Pramuka Penggalang Putra', size: 'M', quantity: 1, price: 80000 },
    ],
    total: 80000,
    paymentMethod: 'Tunai',
    status: 'Lunas',
  },
];

export const DAILY_REVENUE = [
  { day: 'Sen', date: '18 Okt', revenue: 1450000, count: 12 },
  { day: 'Sel', date: '19 Okt', revenue: 1820000, count: 16 },
  { day: 'Rab', date: '20 Okt', revenue: 2100000, count: 19 },
  { day: 'Kam', date: '21 Okt', revenue: 1650000, count: 14 },
  { day: 'Jum', date: '22 Okt', revenue: 2400000, count: 21 },
  { day: 'Sab', date: '23 Okt', revenue: 3250000, count: 28 },
  { day: 'Min', date: '24 Okt', revenue: 2890000, count: 24 },
];

export const REVENUE_BY_CATEGORY = [
  { category: 'Baju Putih', value: 35, color: '#1F2D50' },
  { category: 'Celana', value: 28, color: '#8B2E3F' },
  { category: 'Pramuka', value: 15, color: '#D9C9A3' },
  { category: 'Aksesoris', value: 8, color: '#695D3E' },
  { category: 'Batik', value: 14, color: '#059669' },
];

export const INITIAL_RECEIVABLES: Receivable[] = [
  {
    id: 'rec-1',
    customerName: 'Ibu Nurul (Grosir SD 1)',
    phone: '0812-3456-7890',
    amount: 750000,
    dueDate: '2023-10-30',
    status: 'Belum Lulus',
    notes: 'DP 50% untuk 15 stel seragam SD',
  },
  {
    id: 'rec-2',
    customerName: 'Pak Hendra (Koperasi SMP)',
    phone: '0857-1122-3344',
    amount: 1200000,
    dueDate: '2023-11-05',
    status: 'Belum Lulus',
    notes: 'Pesanan 20 stel celana biru SMP',
  },
  {
    id: 'rec-3',
    customerName: 'Ibu Dewi',
    phone: '0813-9988-7766',
    amount: 230000,
    dueDate: '2023-10-22',
    status: 'Belum Lulus',
    notes: 'Janjikan pelunasan akhir minggu',
  },
];

export const INITIAL_CASH_RECORDS: CashRecord[] = [
  { id: 'cash-1', date: '2023-10-24 14:22', type: 'Masuk', category: 'Penjualan Kasir', amount: 205000, description: 'Penjualan TRX-20231024-001' },
  { id: 'cash-2', date: '2023-10-24 13:05', type: 'Masuk', category: 'Penjualan Kasir', amount: 69000, description: 'Penjualan TRX-20231024-002' },
  { id: 'cash-3', date: '2023-10-24 12:00', type: 'Keluar', category: 'Biaya Operasional', amount: 150000, description: 'Beli plastik packing & konsumsi' },
  { id: 'cash-4', date: '2023-10-24 11:40', type: 'Masuk', category: 'Penjualan Kasir', amount: 258000, description: 'Penjualan TRX-20231024-003' },
  { id: 'cash-5', date: '2023-10-24 09:30', type: 'Keluar', category: 'Restok Barang', amount: 850000, description: 'Restok kain pramuka supplier' },
];

export function getStockStatus(stock: number, minStock: number = 10): 'aman' | 'menipis' | 'habis' {
  if (stock === 0) return 'habis';
  if (stock <= minStock) return 'menipis';
  return 'aman';
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
