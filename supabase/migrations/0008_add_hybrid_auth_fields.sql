-- ─── Migration: Add hybrid auth fields to public.users ───────────────────────
--
-- Adds:
--   email       — canonical email address (for OTP + OAuth lookup)
--   provider    — 'google' | 'email' (which auth method the user used)
--   google_id   — Google profile ID (for provider = 'google')
--   otp         — temporary 6-digit OTP string (nullable)
--   otp_expiry  — OTP expiry timestamp (nullable)
--
-- Notes:
--   • `email` is also present on auth.users, but storing it on public.users
--     allows OTP-only users who are not yet in auth.users to have a row here.
--   • The FK to auth.users is relaxed to allow OTP-staging rows that are
--     not yet confirmed. Confirmed users will have a matching auth.users row.
-- ──────────────────────────────────────────────────────────────────────────────

-- Remove the existing FK constraint that requires auth.users entry
-- (OTP staging rows exist before the user is in auth.users)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Make id auto-generated so OTP-only rows can be inserted without an auth.users id
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- New columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email      TEXT,
  ADD COLUMN IF NOT EXISTS provider   TEXT NOT NULL DEFAULT 'email'
    CHECK (provider IN ('google', 'email')),
  ADD COLUMN IF NOT EXISTS google_id  TEXT,
  ADD COLUMN IF NOT EXISTS otp        TEXT,
  ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ;

-- Unique index on email (sparse — allows NULLs but enforces uniqueness when set)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users (email)
  WHERE email IS NOT NULL;

-- Index for fast OTP lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
