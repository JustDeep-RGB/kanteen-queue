const User = require('../models/User');

exports.updateFcmToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken is required heavily' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { fcmToken } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'FCM Token securely updated', user: updatedUser });
  } catch (error) {
    console.error('Failed updating FCM token:', error);
    res.status(500).json({ error: 'Internal server error while linking mobile token' });
  }
};
