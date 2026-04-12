const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  rollNumber: { type: String, required: false, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
  fcmToken: { type: String },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  bookmarkedSlots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
