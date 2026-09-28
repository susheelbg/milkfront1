-- Migration: 003_user_devices_table.sql
-- Description: Create public.user_devices table to store FCM device tokens
--              for push notification delivery (Stage 1 — token registration only).

-- 1. Create public.user_devices table
CREATE TABLE IF NOT EXISTS public.user_devices (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token   TEXT        NOT NULL,
    platform       TEXT        NOT NULL DEFAULT 'android',   -- 'android' | 'ios' | 'web'
    created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_active      BOOLEAN     NOT NULL DEFAULT true
);

-- 2. Unique constraint: one device_token can only belong to one active registration.
--    When a device token is re-registered (e.g. app reinstall, new user), the old row
--    is upserted/updated rather than duplicated.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_devices_token
    ON public.user_devices(device_token);

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS ix_user_devices_user_id
    ON public.user_devices(user_id);

CREATE INDEX IF NOT EXISTS ix_user_devices_user_active
    ON public.user_devices(user_id, is_active)
    WHERE is_active = true;

-- 4. Enable Row Level Security
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (idempotent re-run)
DROP POLICY IF EXISTS "Users can view own devices"    ON public.user_devices;
DROP POLICY IF EXISTS "Users can insert own devices"  ON public.user_devices;
DROP POLICY IF EXISTS "Users can update own devices"  ON public.user_devices;
DROP POLICY IF EXISTS "Users can delete own devices"  ON public.user_devices;

-- 6. RLS Policies — users can only access their OWN device tokens

-- SELECT: a user can only read their own registrations
CREATE POLICY "Users can view own devices"
ON public.user_devices FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: a user can only insert rows that reference themselves
CREATE POLICY "Users can insert own devices"
ON public.user_devices FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: a user can only update their own device rows
CREATE POLICY "Users can update own devices"
ON public.user_devices FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: a user can only delete their own device rows
CREATE POLICY "Users can delete own devices"
ON public.user_devices FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 7. Automatic updated_at maintenance trigger
CREATE OR REPLACE FUNCTION public.set_user_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_devices_updated_at ON public.user_devices;
CREATE TRIGGER trg_user_devices_updated_at
    BEFORE UPDATE ON public.user_devices
    FOR EACH ROW EXECUTE FUNCTION public.set_user_devices_updated_at();
