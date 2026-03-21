const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin lazily to prevent crashing if no keys are set.
// A production app would require a serviceAccountKey.json loaded into admin.credential.cert().
let isInitialized = false;

try {
  admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount) // Uncomment when keys are available
  });
  isInitialized = true;
} catch (error) {
  console.warn('Firebase Admin is not fully configured, notifications will be mocked.');
}

/**
 * Sends a push notification to a user using their FCM Token.
 * Extracted into a service wrapper for cleaner error suppression.
 */
exports.sendPushNotification = async (userId, title, body) => {
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
