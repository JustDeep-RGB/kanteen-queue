const supabase = require('../utils/supabaseClient');

/**
 * Verifies a Supabase JWT from: Authorization: Bearer <token>
 *
 * Bypass modes (dev only):
 *  - FIREBASE_AUTH_DISABLED=true  → skips all auth
 *  - Bearer <SWAGGER_DEV_KEY>     → skips verification, useful for Swagger UI
 */
const authMiddleware = async (req, res, next) => {
  // Mode 1: fully disabled (local dev / CI)
  if (process.env.FIREBASE_AUTH_DISABLED === 'true') {
    console.log('[Auth] Bypassed (FIREBASE_AUTH_DISABLED=true)');
    req.user = { id: 'dev-user', uid: 'dev-user', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[Auth] ❌ Missing/malformed token on ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Mode 2: Swagger dev key bypass
  const devKey = process.env.SWAGGER_DEV_KEY?.trim();
  if (devKey && token === devKey) {
    console.log(`[Auth] ✅ Swagger dev key accepted for ${req.method} ${req.originalUrl}`);
    req.user = { id: 'swagger-dev', uid: 'swagger-dev', role: 'admin' };
    return next();
  }

  // Mode 3: Real Supabase JWT verification
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.warn(`[Auth] ❌ Token verification failed for ${req.method} ${req.originalUrl}: ${error?.message}`);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Attach user — keep uid alias for backward compat with resolveUser middleware
    req.user = { ...data.user, uid: data.user.id };
    console.log(`[Auth] ✅ Token valid — uid: ${data.user.id}`);
    next();
  } catch (err) {
    console.error(`[Auth] ❌ Unexpected error verifying token:`, err.message);
    if (!res.headersSent) {
      res.status(401).json({ error: 'Unauthorized: Token verification error' });
    }
  }
};

module.exports = authMiddleware;
