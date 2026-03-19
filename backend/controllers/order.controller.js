const Order = require('../models/Order');
const TimeSlot = require('../models/TimeSlot');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem', 'name')
      .populate('slotId', 'startTime')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, slotId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array cannot be empty' });
    }

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    const orderQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (slot.currentOrders + orderQuantity > slot.maxCapacity) {
      const availableSlots = await TimeSlot.find({
        currentOrders: { $lt: 20 },
        startTime: { $gte: slot.startTime }
      }).sort({ startTime: 1 });
      const nextAvailableSlot = availableSlots.find(s => (s.currentOrders + orderQuantity) <= s.maxCapacity);
      return res.status(409).json({
        error: 'Selected time slot is at capacity',
        suggestion: nextAvailableSlot ? `Try the next available slot at ${nextAvailableSlot.startTime}` : 'No available slots found'
      });
    }
    const order = new Order({ userId, items, slotId });
    await order.save();
    slot.currentOrders += orderQuantity;
    await slot.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('items.menuItem', 'name').populate('slotId', 'startTime');

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
