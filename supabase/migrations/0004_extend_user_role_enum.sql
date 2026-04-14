-- ════════════════════════════════════════════════════════════════════════════
-- Migration: 0001b_extend_user_role_enum
-- Description: Safely add 'shop_owner' and 'customer' to the user_role enum
--              BEFORE 0002 runs, since PostgreSQL does not allow using a
--              newly-added enum value in the same transaction it was added.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'shop_owner';
