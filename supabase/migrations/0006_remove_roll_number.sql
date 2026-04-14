-- ════════════════════════════════════════════════════════════════════════════
-- Migration: 0003_remove_roll_number
-- Description: Drop roll_number column from public.users
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users
  DROP COLUMN IF EXISTS roll_number;
