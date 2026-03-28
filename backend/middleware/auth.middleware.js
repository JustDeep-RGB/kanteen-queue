const admin = require('firebase-admin');

/**
 * Verifies Firebase ID token from Authorization: Bearer <token> header.
 * Attaches decoded user info to req.user.
 *
 * Bypass modes (local/dev only):
 *  - FIREBASE_AUTH_DISABLED=true  → skips all auth
 *  - Bearer <SWAGGER_DEV_KEY>     → skips Firebase, useful for Swagger UI testing
 */
const authMiddleware = (req, res, next) => {
  // Mode 1: fully disabled (local dev / CI)
  if (process.env.FIREBASE_AUTH_DISABLED === 'true') {
    console.log('[Auth] Bypassed (FIREBASE_AUTH_DISABLED=true)');
    req.user = { uid: 'dev-user', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[Auth] ❌ Missing/malformed token on ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  // Mode 2: Swagger dev key bypass
  const devKey = process.env.SWAGGER_DEV_KEY?.trim();
  if (devKey && idToken === devKey) {
    console.log(`[Auth] ✅ Swagger dev key accepted for ${req.method} ${req.originalUrl}`);
    req.user = { uid: 'swagger-dev', role: 'admin' };
    return next();
  }

  // Debug: log a mismatch hint (remove in production)
  if (devKey) {
    console.log(`[Auth] Dev key mismatch — received: "${idToken.substring(0, 20)}..." expected key starts with: "${devKey.substring(0, 10)}..."`);
  }

  // Mode 3: Real Firebase token verification
  console.log(`[Auth] Verifying Firebase token for ${req.method} ${req.originalUrl}...`);
  admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(`[Auth] ✅ Token valid — uid: ${decodedToken.uid}`);
      next();
    })
    .catch(err => {
      console.error(`[Auth] ❌ Token verification failed:`, err.message);
      if (!res.headersSent) {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }
    });
};

module.exports = authMiddleware;
