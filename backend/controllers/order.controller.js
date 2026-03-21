const Order = require('../models/Order');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/notificationService');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.menuItem', 'name')
      .populate('slotId', 'startTime')
      .sort({ timestamp: -1 })
      .limit(20);

    const formattedOrders = orders.map(order => {
      const itemsStr = order.items
        .filter(item => item.menuItem)
        .map(item => `${item.quantity}x ${item.menuItem.name}`)
        .join(', ');

      return {
        id: order._id,              // Frontend expects 'id'
        items: itemsStr,            // Frontend expects summarized string
        slot: order.slotId ? order.slotId.startTime : 'Unknown', // Frontend expects 'slot'
        status: order.status,
        timestamp: order.timestamp,
        _rawItems: order.items,
        slotId: order.slotId
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getActiveOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    // Return anything that is not collected
    const activeOrders = await Order.find({ userId, status: { $ne: 'collected' } })
      .populate('items.menuItem', 'name image price')
      .populate('slotId', 'startTime')
      .sort({ timestamp: -1 });

    res.json(activeOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('items.menuItem', 'prepTime');
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Estimate ready time via max prepTime of ordered items directly
    let maxPrepTime = 0;
    if (order.items && order.items.length > 0) {
      maxPrepTime = Math.max(...order.items.map(i => i.menuItem?.prepTime || 0));
    }
    
    const estimatedReadyTime = new Date(order.timestamp.getTime() + maxPrepTime * 60000);

    const lastUpdated = order.statusHistory && order.statusHistory.length > 0 
      ? order.statusHistory[order.statusHistory.length - 1].updatedAt 
      : order.timestamp;

    res.json({
      status: order.status,
      lastUpdated,
      estimatedReadyTime,
      readyNotification: order.readyNotification
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
};
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, slotId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array cannot be empty' });
    }

    const existingSlot = await TimeSlot.findById(slotId);
    if (!existingSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }
    
    // Atomic capacity increment using $expr and $inc to prevent race conditions
    const updatedSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: slotId,
        status: { $ne: 'closed' },
        $expr: { $lte: [ { $add: ["$currentOrders", orderQuantity] }, "$maxCapacity" ] }
      },
      { $inc: { currentOrders: orderQuantity } },
      { new: true }
    );

    if (!updatedSlot) {
      // Find suggestion manually
      const availableSlots = await TimeSlot.find({
        status: 'open',
        date: existingSlot.date,
        startTime: { $gte: existingSlot.startTime }
      }).sort({ startTime: 1 });
      
      const nextAvailableSlot = availableSlots.find(s => (s.currentOrders + orderQuantity) <= s.maxCapacity);
      
      return res.status(409).json({
        error: 'Selected time slot is at capacity',
        suggestion: nextAvailableSlot ? `Try the next available slot at ${nextAvailableSlot.startTime}` : 'No available slots found'
      });
    }

    const order = new Order({ 
      userId, 
      items, 
      slotId,
      statusHistory: [{ status: 'pending', updatedAt: new Date(), updatedBy: 'system' }]
    });
    await order.save();
    
    // Evaluate if we just crossed the 90% threshold precisely
    const wasBelow90 = (updatedSlot.currentOrders - orderQuantity) < (updatedSlot.maxCapacity * 0.9);
    const isNow90OrAbove = updatedSlot.currentOrders >= (updatedSlot.maxCapacity * 0.9);

    if (wasBelow90 && isNow90OrAbove) {
      // Notify all users quietly without blocking the HTTP response
      User.find({ bookmarkedSlots: slotId }).then(interestedUsers => {
        const spotsLeft = updatedSlot.maxCapacity - updatedSlot.currentOrders;
        const promises = interestedUsers.map(user => 
          sendPushNotification(
            user._id, 
            'Slot Filling Up Fast!', 
            `Only ${spotsLeft} spots left for the ${updatedSlot.startTime} slot!`
          )
        );
        Promise.all(promises).catch(err => console.error('Silent fail on mass notification dispatch:', err));
      }).catch(err => console.error('Silent fail querying users for notifications', err));
    }

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
    
    // Only accept exact new strict enums
    const validStatuses = ['pending', 'preparing', 'ready', 'collected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Strictly validate that it only moves one step forward
    const transitions = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'collected',
      'collected': null // Final state
    };

    if (transitions[oldOrder.status] !== status) {
      return res.status(400).json({ error: `Cannot transition order status from '${oldOrder.status}' backwards or skipping directly to '${status}'` });
    }

    // Build atomic update payload
    const updateData = {
      $set: { status },
      $push: { statusHistory: { status, updatedAt: new Date(), updatedBy: 'admin' } }
    };

    // Trigger ready notification flag if ready
    if (status === 'ready') {
      updateData.$set.readyNotification = true;

      // Dispatch async push notification to user
      sendPushNotification(
        oldOrder.userId,
        "Order Ready",
        "Your order is ready for pickup!"
      ).catch(err => console.error('Silent fail on order ready push', err));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('items.menuItem', 'name').populate('slotId', 'startTime');

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
