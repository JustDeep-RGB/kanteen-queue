const supabase = require('../utils/supabaseClient');

// ─── GET /api/users ───────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    let query = supabase.from('users').select('id, name, roll_number, role, inserted_at, updated_at').order('inserted_at', { ascending: false });
    if (req.query.role) query = query.eq('role', req.query.role);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[user.controller] getUsers:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ─── GET /api/users/:userId ───────────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, roll_number, role, inserted_at, updated_at')
      .eq('id', req.params.userId)
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'User not found' });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[user.controller] getUserById:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// ─── POST /api/users ──────────────────────────────────────────────────────────
// Admin creates a user record manually. Note: this does NOT create a Supabase
// auth account — it only creates the public profile row. For a full auth user,
// use Supabase Admin createUser via the dashboard or a separate admin endpoint.
exports.createUser = async (req, res) => {
  try {
    const { name, rollNumber, role } = req.body;
    if (!name || !rollNumber) {
      return res.status(400).json({ error: 'name and rollNumber are required' });
    }

    const { data: existing } = await supabase
      .from('users').select('id').eq('roll_number', rollNumber).single();

    if (existing) {
      return res.status(409).json({ error: `User with rollNumber '${rollNumber}' already exists` });
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ name, roll_number: rollNumber, role: role || 'student' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('[user.controller] createUser:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// ─── DELETE /api/users/:userId ────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { data: user, error: fetchErr } = await supabase
      .from('users').select('name').eq('id', req.params.userId).single();
    if (fetchErr?.code === 'PGRST116') return res.status(404).json({ error: 'User not found' });
    if (fetchErr) throw fetchErr;

    const { error } = await supabase.from('users').delete().eq('id', req.params.userId);
    if (error) throw error;
    res.json({ message: `User '${user.name}' deleted successfully` });
  } catch (err) {
    console.error('[user.controller] deleteUser:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ─── PATCH /api/users/:userId/fcm-token ──────────────────────────────────────
exports.updateFcmToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken } = req.body;

    if (!fcmToken) return res.status(400).json({ error: 'fcmToken is required' });

    const { data, error } = await supabase
      .from('users')
      .update({ fcm_token: fcmToken })
      .eq('id', userId)
      .select()
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'User not found' });
    if (error) throw error;
    res.json({ message: 'FCM token updated', user: data });
  } catch (err) {
    console.error('[user.controller] updateFcmToken:', err.message);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};
