const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

const menuController = require('../controllers/menu.controller');
const slotController = require('../controllers/slot.controller');
const orderController = require('../controllers/order.controller');
const analyticsController = require('../controllers/analytics.controller');
const userController = require('../controllers/user.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - rollNumber
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the user
 *         rollNumber:
 *           type: string
 *           description: The roll number of the user
 *         role:
 *           type: string
 *           enum: [student, admin]
 *           description: The role of the user
 *         fcmToken:
 *           type: string
 *           description: Firebase Cloud Messaging token for push notifications
 *     MenuItem:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - prepTime
 *       properties:
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         prepTime:
 *           type: number
 *         image:
 *           type: string
 *     TimeSlot:
 *       type: object
 *       required:
 *         - date
 *         - startTime
 *         - endTime
 *         - maxCapacity
 *       properties:
 *         date:
 *           type: string
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         maxCapacity:
 *           type: number
 *         currentOrders:
 *           type: number
 *         status:
 *           type: string
 *           enum: [open, full, closed]
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - slotId
 *       properties:
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               menuItem:
 *                 type: string
 *               quantity:
 *                 type: number
 *         slotId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, preparing, ready, collected]
 */

// Users

/**
 * @swagger
 * /api/users/{userId}/fcm-token:
 *   patch:
 *     summary: Update FCM token for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 */
router.patch('/users/:userId/fcm-token', userController.updateFcmToken);

// Menu

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get all menu items
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: List of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 */
router.get('/menu', menuController.getMenu);

/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Create a new menu item
 *     tags: [Menu]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               prepTime:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Menu item created successfully
 */
router.post('/menu', authMiddleware, upload.single('image'), menuController.createMenuItem);

/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Update a menu item
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               prepTime:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 */
router.put('/menu/:id', authMiddleware, upload.single('image'), menuController.updateMenuItem);

/**
 * @swagger
 * /api/menu/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 */
router.delete('/menu/:id', authMiddleware, menuController.deleteMenuItem);

// Slots

/**
 * @swagger
 * /api/slots:
 *   get:
 *     summary: Get all time slots
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: List of time slots
 */
router.get('/slots', slotController.getSlots);

/**
 * @swagger
 * /api/slots:
 *   post:
 *     summary: Create a new time slot
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeSlot'
 *     responses:
 *       201:
 *         description: Time slot created successfully
 */
router.post('/slots', slotController.createSlot);

/**
 * @swagger
 * /api/slots/check:
 *   post:
 *     summary: Check capacity for a specific slot
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: Capacity status
 */
router.post('/slots/check', slotController.checkSlotCapacity);

/**
 * @swagger
 * /api/slots/suggest:
 *   post:
 *     summary: Suggest available slots
 *     tags: [Slots]
 *     responses:
 *       200:
 *         description: List of suggested slots
 */
router.post('/slots/suggest', slotController.suggestSlots);

/**
 * @swagger
 * /api/slots/{id}:
 *   put:
 *     summary: Update a time slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time slot updated successfully
 */
router.put('/slots/:id', slotController.updateSlot);

/**
 * @swagger
 * /api/slots/{id}:
 *   delete:
 *     summary: Delete a time slot
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time slot deleted successfully
 */
router.delete('/slots/:id', slotController.deleteSlot);

// Orders

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/orders', authMiddleware, orderController.getOrders);

/**
 * @swagger
 * /api/orders/active:
 *   get:
 *     summary: Get active orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of active orders
 */
router.get('/orders/active', orderController.getActiveOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/orders', authMiddleware, orderController.createOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   get:
 *     summary: Get status of an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status
 */
router.get('/orders/:id/status', orderController.getOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, ready, collected]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch('/orders/:id/status', authMiddleware, orderController.updateOrderStatus);
// Alias for admin dashboard which uses PUT
router.put('/orders/:id/status', authMiddleware, orderController.updateOrderStatus);

// Analytics & Dashboard 

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Get statistics summary
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Stats summary
 */
router.get('/summary', analyticsController.getStats);

/**
 * @swagger
 * /api/prediction:
 *   get:
 *     summary: Get demand predictions
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Demand predictions
 */
router.get('/prediction', analyticsController.getPrediction);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard/stats', analyticsController.getStats);

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get food waste analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Waste analytics
 */
router.get('/analytics', analyticsController.getWasteAnalytics);

module.exports = router;
