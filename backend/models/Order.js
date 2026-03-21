const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'collected'], default: 'pending' },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'preparing', 'ready', 'collected'] },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'admin' }
  }],
  readyNotification: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
