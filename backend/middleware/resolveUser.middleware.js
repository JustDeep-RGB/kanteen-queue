const supabase = require('../utils/supabaseClient');

/**
 * Resolves the authenticated Supabase user (req.user.id) into a row in
 * the public.users table. Auto-creates a minimal profile on first sign-in.
 *
 * After this middleware:
 *   req.supabaseUserId  — UUID from public.users (same as auth.users id)
 *   req.supabaseUser    — full users row
 *
 * Must run AFTER authMiddleware (which sets req.user).
 */
const resolveUser = async (req, res, next) => {
  try {
    const uid = req.user?.id || req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized: No authenticated user' });
    }

    // Dev bypass — use a fixed "dev user" row or skip
    if (uid === 'dev-user' || uid === 'swagger-dev') {
      req.supabaseUserId = uid;
      req.supabaseUser   = { id: uid, name: 'Dev User', role: 'admin' };
      return next();
    }

    // Look up profile in public.users
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = "row not found"
      console.error('[ResolveUser] DB error:', error.message);
      return res.status(500).json({ error: 'Failed to resolve user identity' });
    }

    if (!user) {
      // Auto-create a minimal profile row on first interaction
      const displayName = req.user.user_metadata?.full_name
        || req.user.email
        || 'User';

      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert({
          id:          uid,
          name:        displayName,
          roll_number: null,
          role:        'user',
        })
        .select()
        .single();

      if (createErr) {
        console.error('[ResolveUser] Failed to auto-create user:', createErr.message);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      user = created;
      console.log(`[ResolveUser] Auto-created user profile for ${uid}`);
    }

    req.supabaseUserId = user.id;
    req.supabaseUser   = user;
    next();
  } catch (err) {
    console.error('[ResolveUser] Unexpected error:', err.message);
    res.status(500).json({ error: 'Failed to resolve user identity' });
  }
};

module.exports = resolveUser;
