const TimeSlot = require('../models/TimeSlot');

exports.getSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};
