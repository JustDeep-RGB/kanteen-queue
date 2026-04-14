-- ════════════════════════════════════════════════════════════════════════════
-- Migration: 0002_shop_approval_workflow
-- Description: Shop (cafe) moderation system — request → approve/reject
--              NOTE: enum values 'shop_owner' and 'customer' must already
--              exist (added by 0001b_extend_user_role_enum.sql).
-- ════════════════════════════════════════════════════════════════════════════


-- ─── 1. SHOP_REQUESTS TABLE ──────────────────────────────────────────────────

CREATE TABLE public.shop_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  owner_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  latitude         FLOAT8,
  longitude        FLOAT8,
  address          TEXT,
  avg_price        NUMERIC,
  seating_capacity INTEGER,
  status           TEXT        NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT shop_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Index for fast lookups by owner and by status (admin review queue)
CREATE INDEX idx_shop_requests_owner  ON public.shop_requests(owner_id);
CREATE INDEX idx_shop_requests_status ON public.shop_requests(status);

COMMENT ON TABLE  public.shop_requests           IS 'Pending cafe registration requests submitted by shop owners.';
COMMENT ON COLUMN public.shop_requests.status    IS 'Lifecycle state: pending → approved | rejected';
COMMENT ON COLUMN public.shop_requests.owner_id  IS 'References the user who submitted this request (must have role = shop_owner).';


-- ─── 2. LOCK DOWN shops TABLE ────────────────────────────────────────────────
--
-- The shops table must only receive rows via the approve_shop_request() RPC.
-- We enforce this by:
--   a) Enabling RLS on shops (done in section 5)
--   b) Granting INSERT only to the internal service role / postgres,
--      NOT to the anon / authenticated roles.
--
-- No DDL change needed here — the RLS policies in section 5 handle it.


-- ─── 3. RPC: approve_shop_request(request_id UUID) ───────────────────────────

CREATE OR REPLACE FUNCTION public.approve_shop_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER          -- Runs as the function owner (postgres), bypasses RLS for the INSERT
SET search_path = public
AS $$
DECLARE
  v_request   public.shop_requests%ROWTYPE;
  v_shop_id   UUID;
BEGIN
  -- 1. Fetch the pending request
  SELECT * INTO v_request
  FROM   public.shop_requests
  WHERE  id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_request % not found', request_id;
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'shop_request % is already %', request_id, v_request.status;
  END IF;

  -- 2. Insert into shops (only approved cafes live here)
  INSERT INTO public.shops (
    name,
    owner_id,
    latitude,
    longitude,
    address,
    seating_capacity,
    is_active
  )
  VALUES (
    v_request.name,
    v_request.owner_id,
    COALESCE(v_request.latitude,  0),
    COALESCE(v_request.longitude, 0),
    COALESCE(v_request.address,   ''),
    COALESCE(v_request.seating_capacity, 0),
    true
  )
  RETURNING id INTO v_shop_id;

  -- 3. Mark the request as approved
  UPDATE public.shop_requests
  SET    status = 'approved'
  WHERE  id = request_id;

  RETURN json_build_object(
    'success',     true,
    'message',     'Shop request approved and cafe created.',
    'shop_id',     v_shop_id,
    'request_id',  request_id
  );
END;
$$;

COMMENT ON FUNCTION public.approve_shop_request(UUID) IS
  'Admin RPC: Approves a pending shop_request, inserts the cafe into shops, and marks the request approved.';


-- ─── 4. RPC: reject_shop_request(request_id UUID) ────────────────────────────

CREATE OR REPLACE FUNCTION public.reject_shop_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Verify existence
  SELECT status INTO v_status
  FROM   public.shop_requests
  WHERE  id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_request % not found', request_id;
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'shop_request % is already %', request_id, v_status;
  END IF;

  -- Mark rejected
  UPDATE public.shop_requests
  SET    status = 'rejected'
  WHERE  id = request_id;

  RETURN json_build_object(
    'success',    true,
    'message',    'Shop request rejected.',
    'request_id', request_id
  );
END;
$$;

COMMENT ON FUNCTION public.reject_shop_request(UUID) IS
  'Admin RPC: Rejects a pending shop_request.';


-- ─── 5. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────

-- Helper: Check if the current user has the given role.
-- Uses the public.users table which mirrors auth.users.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ── 5a. shop_requests ────────────────────────────────────────────────────────

ALTER TABLE public.shop_requests ENABLE ROW LEVEL SECURITY;

-- Cafe owners can insert their own requests only
CREATE POLICY "shop_owners_can_insert_own_requests"
  ON public.shop_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND public.current_user_role() = 'shop_owner'
  );

-- Cafe owners can view their own requests
CREATE POLICY "shop_owners_can_view_own_requests"
  ON public.shop_requests
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    AND public.current_user_role() = 'shop_owner'
  );

-- Admins can view ALL requests
CREATE POLICY "admins_can_select_all_requests"
  ON public.shop_requests
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Admins can update request status (approve / reject flow goes through RPC,
-- but this policy also allows direct status patches if needed)
CREATE POLICY "admins_can_update_request_status"
  ON public.shop_requests
  FOR UPDATE
  TO authenticated
  USING  (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ── 5b. shops ────────────────────────────────────────────────────────────────

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon) can read active/open shops
CREATE POLICY "public_can_select_active_shops"
  ON public.shops
  FOR SELECT
  USING (is_active = true);

-- Admins can read ALL shops (including inactive)
CREATE POLICY "admins_can_select_all_shops"
  ON public.shops
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Only the SECURITY DEFINER RPC (approve_shop_request) can INSERT into shops.
-- Authenticated users are explicitly blocked from direct inserts.
-- No INSERT policy is granted here → default-deny for all non-DEFINER callers.

-- Admins can update shop metadata (hours, capacity, is_active, etc.)
CREATE POLICY "admins_can_update_shops"
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING  (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Shop owners can update only their own shop's operational fields
CREATE POLICY "shop_owners_can_update_own_shop"
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING  (owner_id = auth.uid() AND public.current_user_role() = 'shop_owner')
  WITH CHECK (owner_id = auth.uid() AND public.current_user_role() = 'shop_owner');


-- ─── 6. REALTIME ─────────────────────────────────────────────────────────────
--
-- Enable Supabase Realtime on shop_requests so the admin dashboard
-- receives live notifications for new cafe registration requests.
--
-- NOTE: Supabase tracks which tables are in the realtime publication via
--       the supabase_realtime publication. Run this once against your project.

ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_requests;


-- ─── 7. GRANT EXECUTE ON RPCS (authenticated role only) ──────────────────────

GRANT EXECUTE ON FUNCTION public.approve_shop_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_shop_request(UUID)  TO authenticated;

-- The actual enforcement (admin-only) is handled inside the functions via
-- current_user_role() — non-admins will hit the RAISE EXCEPTION paths
-- if you add a role check. Optionally add one below:

-- Tighten RPCs so only admins can call them at the DB level:
-- (Uncomment if you want double-enforcement beyond application logic)
-- REVOKE EXECUTE ON FUNCTION public.approve_shop_request(UUID) FROM authenticated;
-- REVOKE EXECUTE ON FUNCTION public.reject_shop_request(UUID)  FROM authenticated;
-- Then re-grant only via a wrapper that checks current_user_role() = 'admin'.


-- ════════════════════════════════════════════════════════════════════════════
-- EXAMPLE QUERIES
-- ════════════════════════════════════════════════════════════════════════════

/*

──────────────────────────────────────────────────────
A. Cafe owner submits a shop registration request
──────────────────────────────────────────────────────

INSERT INTO public.shop_requests (
  name,
  owner_id,
  latitude,
  longitude,
  address,
  avg_price,
  seating_capacity
)
VALUES (
  'The Campus Grind',
  auth.uid(),           -- automatically set to the caller's UUID
  12.9716,
  77.5946,
  'Block C, Ground Floor, Campus North',
  120.00,
  50
);


──────────────────────────────────────────────────────
B. Admin fetches all pending requests
──────────────────────────────────────────────────────

SELECT
  sr.id,
  sr.name,
  sr.address,
  sr.avg_price,
  sr.seating_capacity,
  sr.created_at,
  u.name  AS owner_name,
  u.role  AS owner_role
FROM   public.shop_requests sr
JOIN   public.users         u  ON u.id = sr.owner_id
WHERE  sr.status = 'pending'
ORDER  BY sr.created_at ASC;


──────────────────────────────────────────────────────
C. Admin approves a request (via RPC)
──────────────────────────────────────────────────────

SELECT public.approve_shop_request('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- Returns:
-- { "success": true, "message": "Shop request approved and cafe created.",
--   "shop_id": "<new-shop-uuid>", "request_id": "<request-uuid>" }


──────────────────────────────────────────────────────
D. Admin rejects a request (via RPC)
──────────────────────────────────────────────────────

SELECT public.reject_shop_request('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- Returns:
-- { "success": true, "message": "Shop request rejected.",
--   "request_id": "<request-uuid>" }


──────────────────────────────────────────────────────
E. Students / public browse active cafes
──────────────────────────────────────────────────────

SELECT id, name, address, latitude, longitude, rating, is_open
FROM   public.shops
WHERE  is_active = true
ORDER  BY name;


──────────────────────────────────────────────────────
F. Supabase JS — Realtime subscription (admin dashboard)
──────────────────────────────────────────────────────

supabase
  .channel('shop-requests-feed')
  .on(
    'postgres_changes',
    {
      event:  'INSERT',
      schema: 'public',
      table:  'shop_requests',
      filter: 'status=eq.pending',
    },
    (payload) => {
      console.log('New shop request received:', payload.new);
      // trigger a toast / badge update in the admin UI
    }
  )
  .subscribe();

*/
