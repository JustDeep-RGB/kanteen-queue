const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  slotId: { type: String }, // Optional unique string ID depending on your frontend
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // e.g., '13:20'
  endTime: { type: String, required: true },   // e.g., '13:30'
  maxCapacity: { type: Number, required: true },
  currentOrders: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' }
}, { timestamps: true });

// Auto-update status on save
timeSlotSchema.pre('save', function (next) {
  if (this.currentOrders >= this.maxCapacity) {
    this.status = 'full';
  } else if (this.status !== 'closed') {
    this.status = 'open';
  }
  next();
});

// Auto-update status on atomic updates like findOneAndUpdate
timeSlotSchema.post('findOneAndUpdate', async function(doc, next) {
  if (doc) {
    let needsSave = false;
    if (doc.currentOrders >= doc.maxCapacity && doc.status !== 'full') {
      doc.status = 'full';
      needsSave = true;
    } else if (doc.currentOrders < doc.maxCapacity && doc.status === 'full') {
      doc.status = 'open';
      needsSave = true;
    }
    if (needsSave) {
      await doc.save();
    }
  }
  next();
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
