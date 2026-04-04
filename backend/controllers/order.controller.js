const Order = require('../models/Order');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/notificationService');

// Get the Socket.io instance - requires server.js to have been loaded first
const getIo = () => require('../server').io;

// GET /api/orders/queue — All active orders for real-time queue view
exports.getQueue = async (req, res) => {
  try {
    const activeStatuses = ['pending', 'preparing', 'ready'];
    const orders = await Order.find({ status: { $in: activeStatuses } })
      .populate('items.menuItem', 'name description isVeg image price prepTime')
      .populate('slotId', 'startTime endTime')
      .sort({ timestamp: 1 }); // FIFO order

    const queue = orders.map((order, index) => ({
      queuePosition: index + 1,
      id: order._id,
      status: order.status,
      slot: order.slotId ? {
        startTime: order.slotId.startTime,
        endTime: order.slotId.endTime
      } : null,
      items: order.items
        .filter(i => i.menuItem)
        .map(i => ({
          name: i.menuItem.name,
          description: i.menuItem.description,
          isVeg: i.menuItem.isVeg,
          image: i.menuItem.image,
          price: i.menuItem.price,
          prepTime: i.menuItem.prepTime,
          quantity: i.quantity
        })),
      timestamp: order.timestamp,
      estimatedReady: (() => {
        const maxPrep = Math.max(
          0,
          ...order.items
            .filter(i => i.menuItem)
            .map(i => i.menuItem.prepTime || 0)
        );
        return new Date(order.timestamp.getTime() + maxPrep * 60000);
      })()
    }));

    res.json({ total: queue.length, queue });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};


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
        id: order._id,
        items: itemsStr,
        slot: order.slotId ? order.slotId.startTime : 'Unknown',
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

    // Resolve: userId may be a Firebase UID or a Mongo ObjectId
    let resolvedUserId = userId;
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findOne({ firebaseUid: userId });
      if (!user) return res.json([]); // no user record yet → no orders
      resolvedUserId = user._id;
    }

    const activeOrders = await Order.find({ userId: resolvedUserId, status: { $ne: 'collected' } })
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
    const { userId: rawUserId, items, slotId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array cannot be empty' });
    }

    // Resolve userId: accept either a Mongo ObjectId or a Firebase UID string
    let resolvedUserId = rawUserId;
    if (rawUserId && !rawUserId.match(/^[0-9a-fA-F]{24}$/)) {
      // Not a valid ObjectId — treat as Firebase UID and look up / auto-create
      let user = await User.findOne({ firebaseUid: rawUserId });
      if (!user) {
        // Auto-create a minimal user record from the authenticated request
        const displayName = req.user?.name || req.user?.email || 'Student';
        user = await User.create({
          firebaseUid: rawUserId,
          name: displayName,
          rollNumber: `FB-${rawUserId.substring(0, 8)}`,
          role: 'student',
        });
        console.log(`[Order] Auto-created User ${user._id} for Firebase UID ${rawUserId}`);
      }
      resolvedUserId = user._id;
    }

    const existingSlot = await TimeSlot.findById(slotId);
    if (!existingSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    const orderQuantity = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

    const updatedSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: slotId,
        status: { $ne: 'closed' },
        $expr: { $lte: [{ $add: ["$currentOrders", orderQuantity] }, "$maxCapacity"] }
      },
      { $inc: { currentOrders: orderQuantity } },
      { new: true }
    );

    if (!updatedSlot) {
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
      userId: resolvedUserId,
      items,
      slotId,
      statusHistory: [{ status: 'pending', updatedAt: new Date(), updatedBy: 'system' }]
    });
    await order.save();

    // Populate order for socket emission
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name')
      .populate('slotId', 'startTime');

    // Emit real-time event to all connected clients
    try {
      getIo().emit('orderCreated', {
        id: populatedOrder._id,
        items: populatedOrder.items.map(i => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', '),
        slot: populatedOrder.slotId?.startTime || 'Unknown',
        status: populatedOrder.status,
        timestamp: populatedOrder.timestamp
      });
    } catch (socketErr) {
      console.warn('[Socket.io] Could not emit orderCreated:', socketErr.message);
    }

    // Notify if slot crosses 90% threshold
    const wasBelow90 = (updatedSlot.currentOrders - orderQuantity) < (updatedSlot.maxCapacity * 0.9);
    const isNow90OrAbove = updatedSlot.currentOrders >= (updatedSlot.maxCapacity * 0.9);

    if (wasBelow90 && isNow90OrAbove) {
      User.find({ bookmarkedSlots: slotId }).then(interestedUsers => {
        const spotsLeft = updatedSlot.maxCapacity - updatedSlot.currentOrders;
        const promises = interestedUsers.map(user =>
          sendPushNotification(user._id, 'Slot Filling Up Fast!', `Only ${spotsLeft} spots left for the ${updatedSlot.startTime} slot!`)
        );
        Promise.all(promises).catch(err => console.error('Silent fail on mass notification dispatch:', err));
      }).catch(err => console.error('Silent fail querying users for notifications', err));
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error.name, error.message, error);
    res.status(500).json({ error: 'Failed to create order', detail: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'collected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const transitions = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'collected',
      'collected': null
    };

    if (transitions[oldOrder.status] !== status) {
      return res.status(400).json({ error: `Cannot transition order status from '${oldOrder.status}' backwards or skipping directly to '${status}'` });
    }

    const updateData = {
      $set: { status },
      $push: { statusHistory: { status, updatedAt: new Date(), updatedBy: 'admin' } }
    };

    if (status === 'ready') {
      updateData.$set.readyNotification = true;
      sendPushNotification(oldOrder.userId, "Order Ready", "Your order is ready for pickup!")
        .catch(err => console.error('Silent fail on order ready push', err));
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true })
      .populate('items.menuItem', 'name')
      .populate('slotId', 'startTime');

    // Emit real-time event to all connected clients
    try {
      getIo().emit('orderUpdated', {
        id: updatedOrder._id,
        items: updatedOrder.items.map(i => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', '),
        slot: updatedOrder.slotId?.startTime || 'Unknown',
        status: updatedOrder.status,
        timestamp: updatedOrder.timestamp
      });
    } catch (socketErr) {
      console.warn('[Socket.io] Could not emit orderUpdated:', socketErr.message);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
