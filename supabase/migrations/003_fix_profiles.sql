-- ============================================================
-- Migration 003: Perbaikan Tabel Profiles & Trigger Auth Users
-- Resolves Error: "relation profiles does not exist" (SQLSTATE 42P01)
-- ============================================================

-- 1. Pastikan tabel public.profiles ada
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'owner'
              CHECK (role IN ('owner', 'kasir')),
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Perbaiki fungsi handle_new_user dengan schema public & search_path eksplisit
-- Saat trigger dipanggil dari auth.users, search_path bawaan adalah 'auth'.
-- Dengan 'SET search_path = public' dan 'public.profiles', Supabase pasti menemukan tabel profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Re-create trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant hak akses dasar ke role Supabase
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
