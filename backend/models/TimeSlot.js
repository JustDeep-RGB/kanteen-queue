const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g., '13:20'
  endTime: { type: String, required: true },   // e.g., '13:30'
  maxCapacity: { type: Number, required: true },
  currentOrders: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
