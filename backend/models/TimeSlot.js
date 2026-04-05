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
// Rules:
//   - If orders >= capacity → mark 'full' (regardless of admin intent)
//   - If orders < capacity AND status was 'full' → restore to 'open' (capacity freed)
//   - If status is explicitly 'closed' → never auto-reopen
timeSlotSchema.pre('save', function () {
  if (this.currentOrders >= this.maxCapacity) {
    this.status = 'full';
  } else if (this.status === 'full') {
    // Capacity was freed (e.g. order deleted) — restore to open
    this.status = 'open';
  }
  // 'closed' stays 'closed'
});

// Auto-update status on atomic updates like findOneAndUpdate
// Same rules as pre-save: never auto-reopen a 'closed' slot.
timeSlotSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    let needsSave = false;
    if (doc.currentOrders >= doc.maxCapacity && doc.status !== 'full') {
      doc.status = 'full';
      needsSave = true;
    } else if (doc.currentOrders < doc.maxCapacity && doc.status === 'full') {
      // Capacity freed — restore open (but don't touch admin-closed slots)
      doc.status = 'open';
      needsSave = true;
    }
    if (needsSave) {
      await doc.save();
    }
  }
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
