const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menu.controller');
const slotController = require('../controllers/slot.controller');
const orderController = require('../controllers/order.controller');
const analyticsController = require('../controllers/analytics.controller');

// Menu
router.get('/menu', menuController.getMenu);
router.post('/menu', menuController.createMenuItem);
router.put('/menu/:id', menuController.updateMenuItem);
router.delete('/menu/:id', menuController.deleteMenuItem);

// Slots
router.get('/slots', slotController.getSlots);
router.put('/slots/:id', slotController.updateSlot);

// Orders
router.get('/orders', orderController.getOrders);
router.post('/order', orderController.createOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);

// Analytics & Dashboard (Summary route mapped to getStats)
router.get('/summary', analyticsController.getStats);
router.get('/prediction', analyticsController.getPrediction);
router.get('/dashboard/stats', analyticsController.getStats);
router.get('/analytics', analyticsController.getWasteAnalytics);

module.exports = router;
