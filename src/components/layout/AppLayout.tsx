'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Store,
  Calendar,
  ChevronRight,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!loading && profile?.role === 'kasir') {
      if (pathname === '/keuangan' || pathname === '/') {
        router.push('/kasir');
      }
    }
  }, [profile, loading, pathname, router]);

  const allNavItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['owner'] },
    { label: 'Stok Barang', href: '/stok', icon: Package, roles: ['owner', 'kasir'] },
    { label: 'Kasir', href: '/kasir', icon: ShoppingCart, roles: ['owner', 'kasir'] },
    { label: 'Keuangan', href: '/keuangan', icon: Wallet, roles: ['owner'] },
  ];

  const navItems = allNavItems.filter((item) => 
    item.roles.includes(profile?.role || '')
  );

  // Indonesian Date string
  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite text-navy flex flex-col md:flex-row main-layout-root">
      {/* DESKTOP SIDEBAR (Visible md and above) */}
      <aside className="hidden md:flex flex-col w-64 bg-navy text-white min-h-screen fixed left-0 top-0 bottom-0 z-30 shadow-lg">
        {/* Brand Logo & Title */}
        <div className="p-6 border-b border-navy-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-maroon flex items-center justify-center text-white shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg tracking-tight text-white leading-tight">
              Rossya Busana
            </h1>
            <p className="text-xs text-khaki font-medium">Toko Seragam Sekolah</p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive
                    ? 'bg-maroon text-white shadow-md font-semibold'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-khaki'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-khaki'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white opacity-80" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 m-4 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center border border-navy-500">
              <User className="w-4 h-4 text-khaki" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                {profile?.role || 'KASIR'}
              </p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-maroon text-gray-400 hover:text-white transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-8">
        {/* TOP BAR (Header) */}
        <header className="sticky top-0 z-20 bg-offwhite/90 backdrop-blur-md border-b border-card-border px-4 py-3.5 md:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-base md:text-xl font-bold text-navy">
                {navItems.find((n) => n.href === pathname)?.label || 'Rossya Busana'}
              </h2>
              <p className="text-xs text-gray-500 hidden md:block">
                Sistem Penjualan & Kelola Stok Seragam Sekolah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex text-xs font-mono bg-khaki-100 border border-khaki-300 text-khaki-700 px-3 py-1.5 rounded-full font-medium items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {todayDate}
            </span>
            
            {/* Mobile Profile & Logout */}
            <div className="md:hidden flex items-center gap-2 pl-2 sm:border-l border-card-border">
              <div className="text-right hidden min-[375px]:block">
                <p className="text-[11px] font-bold text-navy leading-none mb-0.5">{profile?.full_name || 'Admin'}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">{profile?.role || 'KASIR'}</p>
              </div>
              <button 
                onClick={signOut}
                className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center active:bg-rose-200 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 px-4 py-5 md:px-8 md:py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on mobile < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy text-white border-t border-navy-800 shadow-2xl flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-khaki'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-transform ${
                  isActive ? 'bg-maroon text-white scale-105 shadow-md' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium tracking-tight ${
                  isActive ? 'text-white font-bold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
