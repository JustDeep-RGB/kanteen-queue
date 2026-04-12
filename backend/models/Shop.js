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
  isActive:         { type: Boolean, default: true },
  isVerified:       { type: Boolean, default: false },

  // ── Operating hours ──────────────────────────────────────────────────────────
  // Store as 'HH:MM' (24-hour, IST). Leave blank if shop runs 24 h.
  openingTime:      { type: String, default: '' },  // e.g. '08:00'
  closingTime:      { type: String, default: '' },  // e.g. '22:00'

  // Manual override: set to false to force-close the shop regardless of hours.
  // When true (default) the computed isCurrentlyOpen virtual applies.
  isOpen:           { type: Boolean, default: true }
}, { timestamps: true });

// Virtual: compute queue level label from currentQueue
shopSchema.virtual('queueLevel').get(function () {
  if (this.currentQueue >= 10) return 'high';
  if (this.currentQueue >= 5)  return 'medium';
  return 'low';
});

/**
 * Virtual: isCurrentlyOpen
 * Returns true only when:
 *   1. isOpen is not manually forced to false, AND
 *   2. the current IST time falls within [openingTime, closingTime].
 *
 * If openingTime/closingTime are not set, the shop is considered to
 * run 24 hours (open whenever isOpen is true).
 */
shopSchema.virtual('isCurrentlyOpen').get(function () {
  // Hard override — owner explicitly closed the shop
  if (!this.isOpen) return false;

  // No hours configured → treat as always open
  if (!this.openingTime || !this.closingTime) return true;

  // Parse HH:MM strings
  const [openH, openM]  = this.openingTime.split(':').map(Number);
  const [closeH, closeM] = this.closingTime.split(':').map(Number);

  // Current time in IST (UTC+5:30)
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist   = new Date(utcMs + 5.5 * 3_600_000);
  const curMinutes = ist.getHours() * 60 + ist.getMinutes();

  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Handles overnight spans (e.g. 22:00 → 02:00)
  if (closeMinutes > openMinutes) {
    return curMinutes >= openMinutes && curMinutes < closeMinutes;
  } else {
    // Overnight: open if AFTER opening OR BEFORE closing
    return curMinutes >= openMinutes || curMinutes < closeMinutes;
  }
});

// Ensure virtuals are included when converting to JSON / Object
shopSchema.set('toJSON',   { virtuals: true });
shopSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shop', shopSchema);
