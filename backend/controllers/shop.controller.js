const Shop = require('../models/Shop');

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Returns a map-ready projection for a Shop document.
 * queueLevel is derived from the virtual defined on the model.
 */
const toMapView = (shop) => ({
  id:               shop._id,
  name:             shop.name,
  latitude:         shop.latitude,
  longitude:        shop.longitude,
  address:          shop.address,
  avgPrice:         shop.avgPrice,
  seatingAvailable: shop.seatingAvailable,
  rating:           shop.rating,
  currentQueue:     shop.currentQueue,
  queueLevel:       shop.queueLevel,        // 'low' | 'medium' | 'high'
  openingTime:      shop.openingTime,       // 'HH:MM' | ''
  closingTime:      shop.closingTime,       // 'HH:MM' | ''
  isOpen:           shop.isOpen,            // manual override flag
  isCurrentlyOpen:  shop.isCurrentlyOpen   // computed virtual
});

// ─── POST /api/shops ───────────────────────────────────────────────────────────
exports.createShop = async (req, res) => {
  try {
    const shop = new Shop(req.body);
    const saved = await shop.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[shop.controller] createShop error:', err.message);
    res.status(500).json({ error: 'Failed to create shop' });
  }
};

// ─── GET /api/shops ────────────────────────────────────────────────────────────
// Optional query params: lat, lng, radius (km) — simple bounding-box filter
exports.getShops = async (req, res) => {
  try {
    const filter = { isActive: true };

    // Bounding-box proximity filter (optional, lightweight, no 2dsphere index needed)
    const { lat, lng, radius } = req.query;
    if (lat && lng) {
      const r    = parseFloat(radius) || 10; // default 10 km
      const deg  = r / 111;                   // 1° ≈ 111 km
      filter.latitude  = { $gte: parseFloat(lat) - deg, $lte: parseFloat(lat) + deg };
      filter.longitude = { $gte: parseFloat(lng) - deg, $lte: parseFloat(lng) + deg };
    }

    const shops = await Shop.find(filter).sort({ rating: -1 });
    res.json(shops.map(toMapView));
  } catch (err) {
    console.error('[shop.controller] getShops error:', err.message);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

// ─── GET /api/shops/:id ────────────────────────────────────────────────────────
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }
    console.error('[shop.controller] getShopById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};

// ─── PATCH /api/shops/:id ──────────────────────────────────────────────────────
exports.updateShop = async (req, res) => {
  try {
    // Disallow direct manipulation of queue via this endpoint — use order lifecycle
    delete req.body.currentQueue;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[shop.controller] updateShop error:', err.message);
    res.status(500).json({ error: 'Failed to update shop' });
  }
};

// ─── PATCH /api/shops/:id/status ──────────────────────────────────────────────
/**
 * Dedicated endpoint to update operating-hours fields and the isOpen override.
 * Accepted body fields: { isOpen, openingTime, closingTime }
 * Returns the full shop document with the computed isCurrentlyOpen virtual.
 */
exports.toggleStatus = async (req, res) => {
  try {
    const { isOpen, openingTime, closingTime } = req.body;
    const update = {};

    if (typeof isOpen === 'boolean')    update.isOpen       = isOpen;
    if (typeof openingTime === 'string') update.openingTime  = openingTime.trim();
    if (typeof closingTime === 'string') update.closingTime  = closingTime.trim();

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        error: 'Provide at least one of: isOpen, openingTime, closingTime'
      });
    }

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    res.json({
      message:          'Shop status updated',
      isOpen:           shop.isOpen,
      openingTime:      shop.openingTime,
      closingTime:      shop.closingTime,
      isCurrentlyOpen:  shop.isCurrentlyOpen
    });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[shop.controller] toggleStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update shop status' });
  }
};

// ─── DELETE /api/shops/:id ─────────────────────────────────────────────────────
exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json({ message: 'Shop deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }
    console.error('[shop.controller] deleteShop error:', err.message);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
};

// ─── Internal queue helpers (called from order.controller) ─────────────────────

/**
 * Atomically increment the currentQueue counter for a cafe.
 * Call this when a new order is CREATED.
 */
exports.incrementQueue = (shopId) =>
  Shop.findByIdAndUpdate(shopId, { $inc: { currentQueue: 1 } });

/**
 * Atomically decrement the currentQueue counter (floor 0) for a cafe.
 * Call this when an order is marked 'collected'.
 */
exports.decrementQueue = (shopId) =>
  Shop.findOneAndUpdate(
    { _id: shopId, currentQueue: { $gt: 0 } },
    { $inc: { currentQueue: -1 } }
  );
