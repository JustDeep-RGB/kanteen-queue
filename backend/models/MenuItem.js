const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  prepTime: { type: Number, required: true }, // Estimated preparation time in minutes
  avgDemand: { type: Number, default: 0 }, // Estimated average daily demand
  image: { type: String, default: '' } // URL or path to the image
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
