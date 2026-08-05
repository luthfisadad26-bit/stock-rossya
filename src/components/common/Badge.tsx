import React from 'react';
import { getStockStatus } from '@/lib/mock-data';

interface BadgeProps {
  status?: 'aman' | 'menipis' | 'habis';
  stock?: number;
  minStock?: number;
  children?: React.ReactNode;
  variant?: 'stock' | 'category' | 'outline' | 'maroon';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  stock,
  minStock = 10,
  children,
  variant = 'stock',
}) => {
  if (variant === 'stock' || status || stock !== undefined) {
    const finalStatus = status || (stock !== undefined ? getStockStatus(stock, minStock) : 'aman');

    let badgeStyle = '';
    let label = '';

    switch (finalStatus) {
      case 'aman':
        badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        label = children ? String(children) : 'Aman';
        break;
      case 'menipis':
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
        label = children ? String(children) : 'Menipis';
        break;
      case 'habis':
        badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
        label = children ? String(children) : 'Habis';
        break;
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            finalStatus === 'aman'
              ? 'bg-emerald-500'
              : finalStatus === 'menipis'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        />
        {label}
      </span>
    );
  }

  if (variant === 'maroon') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-maroon-50 text-maroon-700 border border-maroon-200">
        {children}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-khaki-100 text-khaki-700 border border-khaki-300">
      {children}
    </span>
  );
};
