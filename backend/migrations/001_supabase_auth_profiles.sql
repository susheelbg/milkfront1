-- Migration: 001_supabase_auth_profiles.sql
-- Description: Create public.profiles for Supabase Auth, safely link orders and cattle to UUIDs, and preserve all 27 historical orders in legacy_user_id.

-- 1. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    phone TEXT,
    address TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by role
CREATE INDEX IF NOT EXISTS ix_profiles_role ON public.profiles(role);

-- 2. Safely alter orders table to support UUID profiles while preserving historical integer user_id
DO $$
BEGIN
    -- Only rename if user_id is integer
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' 
          AND column_name = 'user_id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.orders RENAME COLUMN user_id TO legacy_user_id;
        ALTER TABLE public.orders ALTER COLUMN legacy_user_id DROP NOT NULL;
    END IF;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_orders_user_id ON public.orders(user_id);

-- 3. Safely alter cattle table to support UUID profiles while preserving historical integer user_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'cattle' 
          AND column_name = 'user_id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.cattle RENAME COLUMN user_id TO legacy_user_id;
        ALTER TABLE public.cattle ALTER COLUMN legacy_user_id DROP NOT NULL;
    END IF;
END $$;

ALTER TABLE public.cattle ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_cattle_user_id ON public.cattle(user_id);

-- 4. Safely alter cattle_reports table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'cattle_reports' 
          AND column_name = 'reporter_id' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.cattle_reports RENAME COLUMN reporter_id TO legacy_reporter_id;
        ALTER TABLE public.cattle_reports ALTER COLUMN legacy_reporter_id DROP NOT NULL;
    END IF;
END $$;

ALTER TABLE public.cattle_reports ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Row Level Security (RLS) Configuration

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile allowed" ON public.profiles;

-- Profiles policies:
-- Anyone authenticated can view their own profile; admins and super_admins can view all profiles
CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

-- Users can update their own profile info (name, phone, address), but CANNOT alter their own role
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

-- Super admins can update any profile (including role promotion/demotion)
CREATE POLICY "Super admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
);

-- Service role or registration trigger/backend can insert profiles
CREATE POLICY "Insert profile allowed"
ON public.profiles FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders or admins view all" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Users can view own orders or admins view all"
ON public.orders FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

-- Enable RLS on feeds
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active feeds or admins view all" ON public.feeds;
DROP POLICY IF EXISTS "Admins can insert feeds" ON public.feeds;
DROP POLICY IF EXISTS "Admins can update feeds" ON public.feeds;
DROP POLICY IF EXISTS "Admins can delete feeds" ON public.feeds;

CREATE POLICY "Anyone can view active feeds or admins view all"
ON public.feeds FOR SELECT
TO authenticated, anon
USING (
    is_hidden = false
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admins can insert feeds"
ON public.feeds FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admins can update feeds"
ON public.feeds FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "Admins can delete feeds"
ON public.feeds FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);

-- Enable RLS on cattle
ALTER TABLE public.cattle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active cattle" ON public.cattle;
DROP POLICY IF EXISTS "Users can insert cattle" ON public.cattle;
DROP POLICY IF EXISTS "Users can delete own cattle or admins delete" ON public.cattle;

CREATE POLICY "Anyone can view active cattle"
ON public.cattle FOR SELECT
TO authenticated, anon
USING (expires_at > now());

CREATE POLICY "Users can insert cattle"
ON public.cattle FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own cattle or admins delete"
ON public.cattle FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);
