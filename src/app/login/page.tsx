'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Store } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('Email atau password salah. Silakan coba lagi.');
        } else {
          setErrorMsg('Terjadi kesalahan: ' + error.message);
        }
      } else {
        router.push('/');
      }
    } catch (err) {
      setErrorMsg('Gagal masuk. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-card-border overflow-hidden">
        <div className="bg-navy p-8 text-center">
          <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">Rossya Busana</h1>
          <p className="text-navy-100 text-sm mt-2">Sistem POS & Manajemen Stok Toko</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-heading font-bold text-navy mb-6 text-center">Masuk ke Akun Anda</h2>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-card-border focus:ring-2 focus:ring-navy focus:border-navy outline-none transition-all text-sm"
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-card-border focus:ring-2 focus:ring-navy focus:border-navy outline-none transition-all text-sm"
                placeholder="Masukkan password"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-maroon hover:bg-maroon-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-6 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
