'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="bg-offwhite text-navy font-sans min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-card border border-card-border shadow-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-maroon mb-2">Terjadi Kesalahan Utama</h2>
          <p className="text-xs text-gray-500 mb-4">{error?.message || 'Gagal memuat sistem'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-semibold"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}
