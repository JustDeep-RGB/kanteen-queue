const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const TimeSlot = require('../models/TimeSlot');
exports.getPrediction = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const historicalData = await Order.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItem",
          totalQuantity: { $sum: "$items.quantity" }
        }
      }
    ]);
    const menuItems = await MenuItem.find().lean();
    const predictions = menuItems.map(item => {
      const hist = historicalData.find(h => h._id.toString() === item._id.toString());
      const past7DaysTotal = hist ? hist.totalQuantity : 0;
      const dailyMovingAverage = Math.ceil(past7DaysTotal / 7);
      return {
        _id: item._id,
        name: item.name,
        predictedDemand: dailyMovingAverage,
        weeklyTotal: past7DaysTotal
      };
    });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
};
exports.getStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();

    // orders per slot
    const slotStats = await TimeSlot.find().select('startTime endTime currentOrders maxCapacity');

    // top-selling menu items
    const topItemsPipeline = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.menuItem", sold: { $sum: "$items.quantity" } } },
      { $sort: { sold: -1 } },
      { $limit: 3 }
    ]);

    const populatedTopItems = await MenuItem.populate(topItemsPipeline, { path: "_id", select: "name" });
    const topItems = populatedTopItems.map(t => ({
      name: t._id.name,
      sold: t.sold
    }));

    res.json({ totalOrders, slotStats, topItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
};

// GET /analytics (food waste)
exports.getWasteAnalytics = async (req, res) => {
  try {
    // waste = prepared - sold
    // prepared = predicted demand + small buffer (e.g., 5% or +5 items)

    // We'll calculate today's sold items
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = await Order.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.menuItem", soldToday: { $sum: "$items.quantity" } } }
    ]);

    const items = await MenuItem.find();

    const wasteData = items.map(item => {
      const soldInfo = todaysOrders.find(o => o._id.toString() === item._id.toString());
      const sold = soldInfo ? soldInfo.soldToday : 0;

      // Using avgDemand as proxy for predicted demand for simplicity
      const predicted = item.avgDemand || 20; // fallback if avgDemand is 0
      const buffer = Math.ceil(predicted * 0.1); // 10% buffer
      const prepared = predicted + buffer;

      // Avoid negative waste if we sold more somehow
      const waste = Math.max(0, prepared - sold);

      return {
        item: item.name,
        prepared,
        sold,
        waste,
        costLoss: waste * item.price
      };
    });

    res.json({ wasteAnalytics: wasteData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waste analytics' });
  }
};
