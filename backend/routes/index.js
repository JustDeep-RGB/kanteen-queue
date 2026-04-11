const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth.middleware');
const resolveUser   = require('../middleware/resolveUser.middleware');

const storage = multer.memoryStorage();
const upload  = multer({ storage });

const menuController      = require('../controllers/menu.controller');
const slotController      = require('../controllers/slot.controller');
const orderController     = require('../controllers/order.controller');
const analyticsController = require('../controllers/analytics.controller');
const userController      = require('../controllers/user.controller');
const shopRoutes          = require('./shop.routes');

// ─── Shops (cafes) ────────────────────────────────────────────────────────────
router.use('/shops', shopRoutes);

// ─── Users ─────────────────────────────────────────────────────────────────────
router.get   ('/users',                    authMiddleware, userController.getUsers);
router.get   ('/users/:userId',            authMiddleware, userController.getUserById);
router.post  ('/users',                    authMiddleware, userController.createUser);
router.delete('/users/:userId',            authMiddleware, userController.deleteUser);
router.patch ('/users/:userId/fcm-token',                 userController.updateFcmToken);  // public – called by app

// ─── Menu ──────────────────────────────────────────────────────────────────────
router.get   ('/menu',      menuController.getMenu);                                        // public – ?veg=true|false
router.post  ('/menu',      authMiddleware, upload.single('image'), menuController.createMenuItem);
router.put   ('/menu/:id',  authMiddleware, upload.single('image'), menuController.updateMenuItem);
router.delete('/menu/:id',  authMiddleware, menuController.deleteMenuItem);
router.delete('/menu/:id/image', authMiddleware, menuController.deleteMenuItemImage);

// ─── Slots ─────────────────────────────────────────────────────────────────────
router.get   ('/slots',              slotController.getSlots);                                  // public – ?date=YYYY-MM-DD
router.post  ('/slots',              authMiddleware, slotController.createSlot);
router.put   ('/slots/:id',          authMiddleware, slotController.updateSlot);
router.patch ('/slots/:id/status',   authMiddleware, slotController.patchSlotStatus);            // toggle open/closed
router.delete('/slots/:id',          authMiddleware, slotController.deleteSlot);
router.post  ('/slots/check',        slotController.checkSlotCapacity);                         // public
router.post  ('/slots/suggest',      slotController.suggestSlots);                              // public


// ─── Orders ────────────────────────────────────────────────────────────────────
router.get   ('/orders/queue',       orderController.getQueue);                             // public – real-time queue
router.get   ('/orders',             authMiddleware, orderController.getOrders);
router.get   ('/orders/active',      authMiddleware, resolveUser, orderController.getActiveOrders);
router.post  ('/orders',             authMiddleware, resolveUser, orderController.createOrder);
router.get   ('/orders/:id/status',  orderController.getOrderStatus);                       // public
router.patch ('/orders/:id/status',  authMiddleware, orderController.updateOrderStatus);
router.put   ('/orders/:id/status',  authMiddleware, orderController.updateOrderStatus);    // alias for dashboard
router.delete('/orders/:id',         authMiddleware, orderController.deleteOrder);

// ─── Analytics (admin only) ────────────────────────────────────────────────────
router.get('/summary',         authMiddleware, analyticsController.getStats);
router.get('/prediction',      authMiddleware, analyticsController.getPrediction);
router.get('/dashboard/stats', authMiddleware, analyticsController.getStats);
router.get('/analytics',       authMiddleware, analyticsController.getWasteAnalytics);

module.exports = router;
