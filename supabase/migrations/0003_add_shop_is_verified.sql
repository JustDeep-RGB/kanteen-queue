-- ─── Add is_verified to shops ─────────────────────────────────────────────────
-- Shops created via the API start as unverified (pending admin approval).
-- Once an admin approves them, is_verified = true and they become visible
-- in the public-facing shop listing.

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Existing shops (seeded/test data) are marked as already verified so they
-- don't get hidden from the public listing immediately after this migration runs.
UPDATE public.shops SET is_verified = true WHERE is_verified = false;

CREATE INDEX IF NOT EXISTS idx_shops_pending ON public.shops(is_verified) WHERE is_verified = false;
