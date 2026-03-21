const TimeSlot = require('../models/TimeSlot');

exports.getSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { startTime, endTime, maxCapacity } = req.body;

    // Validate request body
    if (!startTime || !endTime || maxCapacity === undefined) {
      return res.status(400).json({ error: 'startTime, endTime, and maxCapacity are required' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'startTime must be strictly before endTime' });
    }

    // Check for overlapping slots
    const overlappingSlot = await TimeSlot.findOne({
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (overlappingSlot) {
      return res.status(400).json({ error: 'Time slot overlaps with an existing slot' });
    }

    const newSlot = new TimeSlot({
      startTime,
      endTime,
      maxCapacity,
      currentOrders: 0
    });

    await newSlot.save();
    res.status(201).json(newSlot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create slot' });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxCapacity } = req.body;

    const slot = await TimeSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // Prevent reducing capacity below current orders
    if (maxCapacity !== undefined && maxCapacity < slot.currentOrders) {
      return res.status(400).json({ error: 'Cannot reduce maxCapacity below currentOrders' });
    }

    if (maxCapacity !== undefined) {
      slot.maxCapacity = maxCapacity;
      await slot.save();
    }

    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update slot' });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await TimeSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // Prevent deletion if slot has active orders
    if (slot.currentOrders > 0) {
      return res.status(400).json({ error: 'Cannot delete a slot with existing orders' });
    }

    await TimeSlot.findByIdAndDelete(id);
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};
