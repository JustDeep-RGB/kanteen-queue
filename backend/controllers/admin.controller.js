const supabase = require('../utils/supabaseClient');

// ─── GET /api/admin/shops ─────────────────────────────────────────────────────
exports.getAllShops = async (req, res) => {
  try {
    const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[admin.controller] getAllShops:', err.message);
    res.status(500).json({ error: 'Failed to fetch all shops' });
  }
};

// ─── GET /api/admin/shops/pending ─────────────────────────────────────────────
exports.getPendingShops = async (req, res) => {
  try {
    const { data, error } = await supabase.from('shops').select('*').eq('is_verified', false).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[admin.controller] getPendingShops:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending shops' });
  }
};

// ─── PATCH /api/admin/shops/:id/approve ───────────────────────────────────────
exports.approveShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('shops')
      .update({ is_verified: true, is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;
    res.json({ message: 'Shop approved successfully', shop: data });
  } catch (err) {
    console.error('[admin.controller] approveShop:', err.message);
    res.status(500).json({ error: 'Failed to approve shop' });
  }
};

// ─── PATCH /api/admin/shops/:id/deactivate ────────────────────────────────────
exports.deactivateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('shops')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;
    res.json({ message: 'Shop deactivated successfully', shop: data });
  } catch (err) {
    console.error('[admin.controller] deactivateShop:', err.message);
    res.status(500).json({ error: 'Failed to deactivate shop' });
  }
};

// ─── DELETE /api/admin/shops/:id ──────────────────────────────────────────────
exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('shops').delete().eq('id', id);
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
      throw error;
    }
    res.json({ message: 'Shop removed successfully' });
  } catch (err) {
    console.error('[admin.controller] deleteShop:', err.message);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('inserted_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[admin.controller] getAllUsers:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ─── PATCH /api/admin/users/:userId/role ────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'User not found' });
    if (error) throw error;
    res.json({ message: `User role updated to ${role}`, user: data });
  } catch (err) {
    console.error('[admin.controller] updateUserRole:', err.message);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    let query = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false });
    
    // Optional filters
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.shop_id) query = query.eq('shop_id', req.query.shop_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[admin.controller] getAllOrders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
exports.getPlatformAnalytics = async (req, res) => {
  try {
    // We can do this with concurrent count queries
    const queries = [
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('shops').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'preparing', 'ready'])
    ];

    const [usersRes, shopsRes, ordersRes, activeOrdersRes] = await Promise.all(queries);

    if (usersRes.error) throw usersRes.error;
    if (shopsRes.error) throw shopsRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (activeOrdersRes.error) throw activeOrdersRes.error;

    res.json({
      totalUsers: usersRes.count || 0,
      totalShops: shopsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      activeOrders: activeOrdersRes.count || 0
    });
  } catch (err) {
    console.error('[admin.controller] getPlatformAnalytics:', err.message);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
};
