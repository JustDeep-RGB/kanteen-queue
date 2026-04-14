const supabase = require('../utils/supabaseClient');

// ─── GET /api/shop-requests?status=pending ────────────────────────────────────
// Admin: fetch all requests (default: pending)
exports.getShopRequests = async (req, res) => {
  try {
    const status = req.query.status || 'pending';

    const { data, error } = await supabase
      .from('shop_requests')
      .select(`
        id,
        name,
        owner_id,
        latitude,
        longitude,
        address,
        avg_price,
        seating_capacity,
        status,
        created_at,
        users ( name )
      `)
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Flatten owner name for convenience
    const result = data.map((r) => ({
      ...r,
      owner_name: r.users?.name || null,
      users: undefined,
    }));

    res.json(result);
  } catch (err) {
    console.error('[shopRequest.controller] getShopRequests:', err.message);
    res.status(500).json({ error: 'Failed to fetch shop requests' });
  }
};

// ─── POST /api/shop-requests ─────────────────────────────────────────────────
// Cafe owner submits a new shop registration request
exports.createShopRequest = async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      address,
      avg_price,
      seating_capacity,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });

    // owner_id comes from the authenticated user resolved by resolveUser middleware
    const owner_id = req.supabaseUserId;
    if (!owner_id) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('shop_requests')
      .insert({
        name,
        owner_id,
        latitude:         latitude         ?? null,
        longitude:        longitude        ?? null,
        address:          address          ?? null,
        avg_price:        avg_price        ?? null,
        seating_capacity: seating_capacity ?? null,
        status:           'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('[shopRequest.controller] createShopRequest:', err.message);
    res.status(500).json({ error: 'Failed to submit shop request' });
  }
};

// ─── POST /api/shop-requests/:id/approve ────────────────────────────────────
// Admin: approve a pending request → runs the Supabase RPC which inserts into shops
exports.approveShopRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .rpc('approve_shop_request', { request_id: id });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[shopRequest.controller] approveShopRequest:', err.message);
    const status = err.message?.includes('not found') ? 404
                 : err.message?.includes('already')   ? 409
                 : 500;
    res.status(status).json({ error: err.message || 'Failed to approve shop request' });
  }
};

// ─── POST /api/shop-requests/:id/reject ─────────────────────────────────────
// Admin: reject a pending request
exports.rejectShopRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .rpc('reject_shop_request', { request_id: id });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[shopRequest.controller] rejectShopRequest:', err.message);
    const status = err.message?.includes('not found') ? 404
                 : err.message?.includes('already')   ? 409
                 : 500;
    res.status(status).json({ error: err.message || 'Failed to reject shop request' });
  }
};
