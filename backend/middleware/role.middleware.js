/**
 * Express middleware to enforce Role-Based Access Control
 * 
 * Must run AFTER authMiddleware and resolveUser middleware.
 * Uses req.supabaseUser.role which is resolved from the public.users table.
 * 
 * @param {Array<String>} allowedRoles - Array of authorized roles e.g., ['admin', 'owner']
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure the user role has been resolved
      if (!req.supabaseUser || !req.supabaseUser.role) {
        return res.status(403).json({ error: 'Forbidden: User role not resolved' });
      }

      const userRole = req.supabaseUser.role;

      // Check if user's role is in the allowed list
      if (!allowedRoles.includes(userRole)) {
        console.warn(`[Role Auth] ❌ Access denied. User role '${userRole}' not in ${JSON.stringify(allowedRoles)} for ${req.method} ${req.originalUrl}`);
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      console.log(`[Role Auth] ✅ Access granted for role '${userRole}'`);
      next();
    } catch (error) {
      console.error(`[Role Auth] ❌ Error checking role:`, error.message);
      res.status(500).json({ error: 'Internal server error while verifying roles' });
    }
  };
};

module.exports = requireRole;
