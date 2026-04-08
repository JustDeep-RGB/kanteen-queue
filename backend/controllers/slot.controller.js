const TimeSlot = require('../models/TimeSlot');
const Order = require('../models/Order');

exports.getSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) {
      filter.date = date;
    }

    const slots = await TimeSlot.find(filter).lean(); // lean for adding virtual fields

    // Calculate fillPercentage
    const enrichedSlots = slots.map(slot => ({
      ...slot,
      fillPercentage: slot.maxCapacity ? Math.round((slot.currentOrders / slot.maxCapacity) * 100) : 0
    }));

    res.json(enrichedSlots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

exports.checkSlotCapacity = async (req, res) => {
  try {
    const { slotId, date } = req.body;
    
    if (!slotId || !date) {
      return res.status(400).json({ error: 'slotId and date are required' });
    }

    const slot = await TimeSlot.findOne({ _id: slotId, date });
    
    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    const hasCapacity = slot.currentOrders < slot.maxCapacity && slot.status === 'open';

    res.json({
      slotId: slot._id,
      hasCapacity,
      currentOrders: slot.currentOrders,
      maxCapacity: slot.maxCapacity,
      status: slot.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check slot capacity' });
  }
};

exports.suggestSlots = async (req, res) => {
  try {
    const { preferredSlotId, date, userId } = req.body;
    
    if (!preferredSlotId || !date) {
      return res.status(400).json({ error: 'preferredSlotId and date are required' });
    }

    const preferredSlot = await TimeSlot.findOne({ _id: preferredSlotId, date });
    if (!preferredSlot) {
      return res.status(404).json({ error: 'Preferred time slot not found' });
    }

    if (preferredSlot.status === 'open' && preferredSlot.currentOrders < preferredSlot.maxCapacity) {
      return res.json({
        available: true,
        confirmedSlot: {
          slotId: preferredSlot._id,
          startTime: preferredSlot.startTime,
          endTime: preferredSlot.endTime,
          availableSpots: preferredSlot.maxCapacity - preferredSlot.currentOrders,
          fillPercentage: Math.round((preferredSlot.currentOrders / preferredSlot.maxCapacity) * 100)
        }
      });
    }

    // Preferred slot is full or closed. Find other availability today.
    const openSlots = await TimeSlot.find({ date, status: 'open' });
    if (openSlots.length === 0) {
      return res.json({ available: false, message: 'All slots for this day are full' });
    }

    const timeToMins = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    
    const prefTime = timeToMins(preferredSlot.startTime);

    const suggestions = openSlots.map(slot => {
      return {
        slotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSpots: slot.maxCapacity - slot.currentOrders,
        fillPercentage: Math.round((slot.currentOrders / slot.maxCapacity) * 100),
        diff: Math.abs(timeToMins(slot.startTime) - prefTime)
      };
    });

    suggestions.sort((a, b) => a.diff - b.diff);

    // Filter out the strictly technical fields and take top 3
    const top3 = suggestions.slice(0, 3).map(({ diff, ...rest }) => rest);

    res.json({
      available: false,
      message: 'Preferred slot is full, offering closest alternatives',
      suggestions: top3
    });
  } catch (error) {
    console.error('Error suggesting slots:', error);
    res.status(500).json({ error: 'Failed to suggest alternative slots' });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, maxCapacity } = req.body;

    // Validate request body
    if (!date || !startTime || !endTime || maxCapacity === undefined) {
      return res.status(400).json({ error: 'date, startTime, endTime, and maxCapacity are required' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'startTime must be strictly before endTime' });
    }

    // Check for overlapping slots
    const overlappingSlot = await TimeSlot.findOne({
      date,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (overlappingSlot) {
      return res.status(400).json({ error: 'Time slot overlaps with an existing slot on this date' });
    }

    const newSlot = new TimeSlot({
      date,
      startTime,
      endTime,
      maxCapacity,
      currentOrders: 0
    });

    await newSlot.save();
    res.status(201).json(newSlot);
  } catch (error) {
    console.error("Error creating slot:", error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxCapacity, status } = req.body;

    const slot = await TimeSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    let needsSave = false;

    // Prevent reducing capacity below current orders
    if (maxCapacity !== undefined && maxCapacity < slot.currentOrders) {
      return res.status(400).json({ error: 'Cannot reduce maxCapacity below currentOrders' });
    }

    if (maxCapacity !== undefined) {
      slot.maxCapacity = maxCapacity;
      needsSave = true;
    }

    if (status !== undefined && ['open', 'closed', 'full'].includes(status)) {
      if (status === 'open' && slot.currentOrders >= slot.maxCapacity) {
         slot.status = 'full';
      } else {
         slot.status = status;
      }
      needsSave = true;
    }

    if (needsSave) {
      await slot.save();
    }

    res.json(slot);
  } catch (error) {
    console.error('Error updating slot:', error);
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

    // Cascade delete any orders that belong to this slot
    await Order.deleteMany({ slotId: id });

    await TimeSlot.findByIdAndDelete(id);
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};

// PATCH /slots/:id/status  — lightweight availability toggle
// Body: { "status": "open" | "closed" }
exports.patchSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'status must be "open" or "closed"' });
    }

    const slot = await TimeSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // If trying to re-open a slot that is already at capacity, keep it 'full'
    if (status === 'open' && slot.currentOrders >= slot.maxCapacity) {
      slot.status = 'full';
    } else {
      slot.status = status;
    }

    await slot.save(); // pre-save hook preserves 'closed' (won't auto-reopen)
    res.json(slot);
  } catch (error) {
    console.error('Error patching slot status:', error);
    res.status(500).json({ error: 'Failed to update slot status' });
  }
};
