'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-offwhite text-navy font-sans">
      <div className="bg-white p-8 rounded-card border border-card-border shadow-lg text-center max-w-md">
        <h2 className="font-heading text-xl font-bold text-maroon mb-2">
          Terjadi Kesalahan Aplikasi
        </h2>
        <p className="text-xs text-gray-500 mb-4">{error?.message || 'Error tidak diketahui'}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-semibold"
        >
          Coba Muat Ulang
        </button>
      </div>
    </div>
  );
}
