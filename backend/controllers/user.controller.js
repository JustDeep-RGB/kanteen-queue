const User = require('../models/User');

// GET /api/users — Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('-fcmToken').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /api/users/:userId — Get a single user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-fcmToken');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// POST /api/users — Create a user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, rollNumber, role } = req.body;
    if (!name || !rollNumber) {
      return res.status(400).json({ error: 'name and rollNumber are required' });
    }

    const existing = await User.findOne({ rollNumber });
    if (existing) {
      return res.status(409).json({ error: `User with rollNumber '${rollNumber}' already exists` });
    }

    const user = new User({ name, rollNumber, role: role || 'student' });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// DELETE /api/users/:userId — Delete a user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `User '${deleted.name}' deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// PATCH /api/users/:userId/fcm-token — Update FCM token (public, called by app)
exports.updateFcmToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { fcmToken } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'FCM token updated', user: updatedUser });
  } catch (error) {
    console.error('Failed updating FCM token:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};
