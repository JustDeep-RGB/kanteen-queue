const TimeSlot = require('../models/TimeSlot');

exports.getSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxCapacity } = req.body;

    const updatedSlot = await TimeSlot.findByIdAndUpdate(
      id,
      { maxCapacity },
      { new: true }
    );

    if (!updatedSlot) return res.status(404).json({ error: 'Slot not found' });
    res.json(updatedSlot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update slot' });
  }
};
