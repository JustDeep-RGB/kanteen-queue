const jwt      = require('jsonwebtoken');
const supabase  = require('../utils/supabaseClient');

/**
 * Verifies a Bearer token from: Authorization: Bearer <token>
 *
 * Accepts two token types (in priority order):
 *  1. Supabase-issued JWT  — verified via supabase.auth.getUser()
 *  2. App-issued JWT       — verified via JWT_SECRET (issued by OTP / Google OAuth flows)
 *
 * Bypass modes (dev only):
 *  - FIREBASE_AUTH_DISABLED=true  → skips all auth
 *  - Bearer <SWAGGER_DEV_KEY>     → skips verification, useful for Swagger UI
 */
const authMiddleware = async (req, res, next) => {
  // Mode 1: fully disabled (local dev / CI)
  if (process.env.AUTH_DISABLED === 'true') {
    req.user = { id: 'dev-user', uid: 'dev-user', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Mode 2: Swagger dev key bypass
  const devKey = process.env.SWAGGER_DEV_KEY?.trim();
  if (devKey && token === devKey) {
    req.user = { id: 'swagger-dev', uid: 'swagger-dev', role: 'admin' };
    return next();
  }

  // Mode 3a: Try Supabase JWT first (existing flow)
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      req.user = { ...data.user, uid: data.user.id };
      return next();
    }
  } catch (_) {
    // Not a Supabase token — fall through to app JWT check
  }

  // Mode 3b: Try app-issued JWT (OTP / Google OAuth flow)
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    // Normalise to the same shape resolveUser expects
    req.user = { id: payload.userId, uid: payload.userId, role: payload.role, provider: payload.provider, _appJwt: true };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

module.exports = authMiddleware;
