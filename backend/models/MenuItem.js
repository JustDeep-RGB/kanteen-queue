const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' }, // Description of the dish
  price: { type: Number, required: true },
  prepTime: { type: Number, required: true }, // Estimated preparation time in minutes
  isVeg: { type: Boolean, default: true },    // true = veg, false = non-veg
  avgDemand: { type: Number, default: 0 },    // Estimated average daily demand
  image: { type: String, default: '' },       // URL or path to the image
  isAvailable: { type: Boolean, default: true } // Whether the item is currently available for ordering
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
