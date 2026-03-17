const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menu.controller');
const slotController = require('../controllers/slot.controller');
const orderController = require('../controllers/order.controller');
const analyticsController = require('../controllers/analytics.controller');

// Menu
router.get('/menu', menuController.getMenu);

// Slots
router.get('/slots', slotController.getSlots);

// Orders
router.get('/orders', orderController.getOrders);
router.post('/order', orderController.createOrder);

// Analytics & Dashboard
router.get('/prediction', analyticsController.getPrediction);
router.get('/dashboard/stats', analyticsController.getStats);
router.get('/analytics', analyticsController.getWasteAnalytics);

module.exports = router;
