const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

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

// Menu
router.get('/menu', menuController.getMenu);
router.post('/menu', upload.single('image'), menuController.createMenuItem);
router.put('/menu/:id', upload.single('image'), menuController.updateMenuItem);
router.delete('/menu/:id', menuController.deleteMenuItem);

// Slots
router.get('/slots', slotController.getSlots);
router.post('/slots', slotController.createSlot);
router.put('/slots/:id', slotController.updateSlot);
router.delete('/slots/:id', slotController.deleteSlot);

// Orders
router.get('/orders', orderController.getOrders);
router.post('/orders', orderController.createOrder);
router.patch('/orders/:id', orderController.updateOrderStatus);

// Analytics & Dashboard 
router.get('/summary', analyticsController.getStats);
router.get('/prediction', analyticsController.getPrediction);
router.get('/dashboard/stats', analyticsController.getStats);
router.get('/analytics', analyticsController.getWasteAnalytics);

module.exports = router;
