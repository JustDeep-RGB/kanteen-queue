const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  fcmToken: { type: String },
  bookmarkedSlots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
