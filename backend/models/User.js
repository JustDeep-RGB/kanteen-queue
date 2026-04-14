const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'shop_owner', 'admin'], default: 'customer' },
  fcmToken: { type: String },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  bookmarkedSlots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
