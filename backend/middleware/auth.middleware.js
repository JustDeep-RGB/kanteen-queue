const admin = require('firebase-admin');

/**
 * Verifies Firebase ID token from Authorization: Bearer <token> header.
 * Attaches decoded user info to req.user.
 * If FIREBASE_AUTH_DISABLED=true, skips auth (for local dev).
 */
const authMiddleware = (req, res, next) => {
  // Bypass mode — for local dev only
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
  console.log(`[Auth] Verifying token for ${req.method} ${req.originalUrl}...`);

  // Use .then/.catch instead of async/await to avoid Express 5 async propagation issues
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
