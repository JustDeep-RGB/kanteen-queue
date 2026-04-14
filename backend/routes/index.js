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
const adminRoutes         = require('./admin.routes');
const shopRoutes          = require('./shop.routes');
const shopRequestRoutes   = require('./shopRequest.routes');

// ─── Admin ─────────────────────────────────────────────────────────────────────
router.use('/admin', adminRoutes);

// ─── Shops (cafes) ────────────────────────────────────────────────────────────
router.use('/shops', shopRoutes);

// ─── Shop Requests (cafe approval workflow) ───────────────────────────────────
router.use('/shop-requests', shopRequestRoutes);

// ─── Users ─────────────────────────────────────────────────────────────────────
router.get   ('/users/me',                 authMiddleware, resolveUser, userController.getMe);
router.get   ('/users',                    authMiddleware, userController.getUsers);
router.get   ('/users/:userId',            authMiddleware, userController.getUserById);
router.post  ('/users',                    authMiddleware, userController.createUser);
router.delete('/users/:userId',            authMiddleware, userController.deleteUser);
router.patch ('/users/:userId/fcm-token',                 userController.updateFcmToken);  // public – called by app

// ─── Menu ──────────────────────────────────────────────────────────────────────
router.get   ('/menu',      menuController.getMenu);                                        // public – ?veg=true|false
router.post  ('/menu',      authMiddleware, resolveUser, upload.single('image'), menuController.createMenuItem);
router.put   ('/menu/:id',  authMiddleware, resolveUser, upload.single('image'), menuController.updateMenuItem);
router.delete('/menu/:id',  authMiddleware, resolveUser, menuController.deleteMenuItem);
router.delete('/menu/:id/image', authMiddleware, resolveUser, menuController.deleteMenuItemImage);

// ─── Slots ─────────────────────────────────────────────────────────────────────
router.get   ('/slots',              slotController.getSlots);                                  // public – ?date=YYYY-MM-DD
router.post  ('/slots',              authMiddleware, resolveUser, slotController.createSlot);
router.put   ('/slots/:id',          authMiddleware, resolveUser, slotController.updateSlot);
router.delete('/slots/:id',          authMiddleware, resolveUser, slotController.deleteSlot);
router.post  ('/slots/:id/bookmark', authMiddleware, resolveUser, slotController.bookmarkSlot);

// ─── Orders ────────────────────────────────────────────────────────────────────
router.get   ('/orders/queue',       orderController.getQueue);                             // public – real-time queue
router.get   ('/orders',             authMiddleware, resolveUser, orderController.getOrders);
router.get   ('/orders/active',      authMiddleware, resolveUser, orderController.getActiveOrders);
router.post  ('/orders',             authMiddleware, resolveUser, orderController.createOrder);
router.get   ('/orders/:id/status',  orderController.getOrderStatus);                       // public
router.patch ('/orders/:id/status',  authMiddleware, resolveUser, orderController.updateOrderStatus);
router.put   ('/orders/:id/status',  authMiddleware, resolveUser, orderController.updateOrderStatus);    // alias for dashboard
router.delete('/orders/:id',         authMiddleware, resolveUser, orderController.deleteOrder);

// ─── Analytics (admin only) ────────────────────────────────────────────────────
router.get('/summary',         authMiddleware, analyticsController.getStats);
router.get('/prediction',      authMiddleware, analyticsController.getPrediction);
router.get('/dashboard/stats', authMiddleware, analyticsController.getStats);
router.get('/analytics',       authMiddleware, analyticsController.getWasteAnalytics);

module.exports = router;
