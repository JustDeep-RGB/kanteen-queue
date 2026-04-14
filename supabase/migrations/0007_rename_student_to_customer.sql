-- ════════════════════════════════════════════════════════════════════════════
-- Migration: 0004_rename_student_to_customer
-- Description: Rename user_role enum value 'student' → 'customer'
-- ════════════════════════════════════════════════════════════════════════════

-- Wrapped in a DO block so it is safe to run even if 'student' was already
-- renamed (e.g. via the Supabase dashboard) or never existed.
DO $$
BEGIN
  ALTER TYPE public.user_role RENAME VALUE 'student' TO 'customer';
EXCEPTION
  WHEN invalid_parameter_value THEN
    -- 'student' doesn't exist in the enum — already renamed or never added
    RAISE NOTICE 'user_role value ''student'' not found, skipping rename.';
END;
$$;
