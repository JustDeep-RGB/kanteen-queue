const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  ownerName:        { type: String, default: '' },
  latitude:         { type: Number, required: true },
  longitude:        { type: Number, required: true },
  address:          { type: String, default: '' },
  avgPrice:         { type: Number, default: 0 },
  seatingAvailable: { type: Boolean, default: false },
  rating:           { type: Number, default: 4.0, min: 0, max: 5 },
  currentQueue:     { type: Number, default: 0, min: 0 },
  isActive:         { type: Boolean, default: true }
}, { timestamps: true });

// Virtual: compute queue level label from currentQueue
shopSchema.virtual('queueLevel').get(function () {
  if (this.currentQueue >= 10) return 'high';
  if (this.currentQueue >= 5)  return 'medium';
  return 'low';
});

// Ensure virtuals are included when converting to JSON / Object
shopSchema.set('toJSON',   { virtuals: true });
shopSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shop', shopSchema);
