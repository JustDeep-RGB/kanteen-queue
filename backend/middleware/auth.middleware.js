const admin = require('firebase-admin');

/**
 * Verifies Firebase ID token from Authorization: Bearer <token> header.
 * Attaches decoded user info to req.user.
 * If FIREBASE_AUTH_DISABLED=true, skips auth (for local dev without Firebase setup).
 */
const authMiddleware = async (req, res, next) => {
  if (process.env.FIREBASE_AUTH_DISABLED === 'true') {
    req.user = { uid: 'dev-user', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;
