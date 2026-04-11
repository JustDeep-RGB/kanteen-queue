const admin    = require('firebase-admin');
const supabase = require('./supabaseClient');

/**
 * Sends an FCM push notification to a user via their stored fcm_token.
 * Keeps firebase-admin ONLY for messaging (not auth).
 */
exports.sendPushNotification = async (userId, title, body) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('name, fcm_token')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.log(`[Push] Skipped — user ${userId} not found.`);
      return false;
    }

    if (!user.fcm_token) {
      console.log(`[Push] Skipped — user ${user.name} has no fcmToken.`);
      return false;
    }

    // Dev mock if firebase-admin not initialized
    if (!admin.apps.length) {
      console.log(`[MOCK PUSH] → ${user.name}: "${title} — ${body}"`);
      return true;
    }

    await admin.messaging().send({
      token:        user.fcm_token,
      notification: { title, body },
    });
    console.log(`[Push] ✅ Sent to ${user.name}`);
    return true;
  } catch (err) {
    console.error(`[Push] Silently suppressed for user ${userId}:`, err.message);
    return false;
  }
};
