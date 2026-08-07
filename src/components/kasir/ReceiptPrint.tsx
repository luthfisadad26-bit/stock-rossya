import React from 'react';
import { formatRupiah } from '@/lib/utils';

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  size?: string;
}

export interface ReceiptData {
  invoiceNo: string;
  date: string;
  customerName?: string;
  cashierName?: string;
  paymentMethod: string;
  total: number;
  cashReceived?: number;
  changeAmount?: number;
  items: ReceiptItem[];
}

interface ReceiptPrintProps {
  storeName?: string;
  data: ReceiptData;
}

export default function ReceiptPrint({ storeName = 'Rossya Busana', data }: ReceiptPrintProps) {
  return (
    <div className="receipt-print-container font-mono text-black bg-white" style={{ width: '58mm', padding: '0', margin: '0', fontSize: '12px', lineHeight: '1.2' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg mb-1">{storeName}</h2>
        <p className="text-[10px]">Toko Seragam Sekolah</p>
        <p className="text-[10px]">Terima Kasih Atas Kunjungan Anda</p>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      {/* Transaction Info */}
      <div className="text-[11px] mb-2 space-y-0.5">
        <div className="flex justify-between">
          <span>No:</span>
          <span>{data.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl:</span>
          <span>{data.date}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{data.cashierName || 'Kasir'}</span>
        </div>
        {data.customerName && (
          <div className="flex justify-between">
            <span>Plg:</span>
            <span>{data.customerName}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      {/* Items List */}
      <div className="text-[11px] mb-2">
        {data.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="font-semibold leading-tight">{item.name} {item.size ? `(${item.size})` : ''}</div>
            <div className="flex justify-between mt-0.5">
              <span>{item.qty} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      {/* Summary */}
      <div className="text-[11px] space-y-1">
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>{formatRupiah(data.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar ({data.paymentMethod}):</span>
          <span>{data.paymentMethod === 'Tunai' ? formatRupiah(data.cashReceived || data.total) : formatRupiah(data.total)}</span>
        </div>
        {data.paymentMethod === 'Tunai' && (
          <div className="flex justify-between">
            <span>Kembali:</span>
            <span>{formatRupiah(data.changeAmount || 0)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-3"></div>

      {/* Footer */}
      <div className="text-center text-[10px] mt-4 mb-4">
        <p>Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
        <p className="mt-2">- Powered by RawBT -</p>
      </div>
    </div>
  );
}
