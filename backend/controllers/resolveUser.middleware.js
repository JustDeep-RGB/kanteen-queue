const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Middleware that resolves the authenticated Firebase UID (req.user.uid)
 * into a MongoDB User document. Creates one if it doesn't exist yet.
 *
 * After this middleware runs:
 *   req.mongoUserId  — the User document's ObjectId
 *   req.mongoUser    — the full User document
 *
 * Must run AFTER authMiddleware (which sets req.user).
 */
const resolveUser = async (req, res, next) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized: No authenticated user' });
    }

    // If it's already a valid Mongo ObjectId (e.g. from dev bypass), use it directly
    if (mongoose.Types.ObjectId.isValid(firebaseUid) && firebaseUid.length === 24) {
      const user = await User.findById(firebaseUid);
      if (user) {
        req.mongoUserId = user._id;
        req.mongoUser = user;
        return next();
      }
    }

    // Look up by Firebase UID
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // Auto-create a minimal user record on first interaction
      const displayName = req.user.name || req.user.email || 'Student';
      user = await User.create({
        firebaseUid,
        name: displayName,
        rollNumber: `FB-${firebaseUid.substring(0, 8)}`,
        role: 'student',
      });
      console.log(`[ResolveUser] Auto-created User ${user._id} for Firebase UID ${firebaseUid}`);
    }

    req.mongoUserId = user._id;
    req.mongoUser = user;
    next();
  } catch (error) {
    console.error('[ResolveUser] Failed to resolve user:', error.message);
    res.status(500).json({ error: 'Failed to resolve user identity' });
  }
};

module.exports = resolveUser;
