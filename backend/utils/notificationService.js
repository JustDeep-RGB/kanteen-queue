const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Sends a push notification to a user using their FCM Token.
 * Extracted into a service wrapper for cleaner error suppression.
 */
exports.sendPushNotification = async (userId, title, body) => {
  // Check if firebase was initialized (usually in server.js)
  if (admin.apps.length === 0) {
    console.warn('[Push Notification] Firebase Admin not initialized. Mocking notification.');
    const user = await User.findById(userId);
    console.log(`[MOCK PUSH] Sent to ${user?.name || userId}: "${title} - ${body}"`);
    return true;
  }
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.log(`[Push Notification] Skipped. User ${userId} has no fcmToken mapped.`);
      return false; // Silent skip as required
    }

    if (!isInitialized) {
      console.log(`[MOCK PUSH] Sent to ${user.name} (${user.fcmToken}): "${title} - ${body}"`);
      return true;
    }

    const payload = {
      token: user.fcmToken,
      notification: {
        title,
        body
      }
    };

    // Dispatch natively through the SDK
    await admin.messaging().send(payload);
    console.log(`[Push Notification] Successfully dispatched to ${user.name}`);
    return true;

  } catch (error) {
    // Requirements #3: "Handles errors silently if token is missing or expired"
    console.error(`[Push Notification] Suppressed silently: Failed to push to User ${userId}.`, error.message);
    return false;
  }
};
