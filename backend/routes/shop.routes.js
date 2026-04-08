const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const shopController = require('../controllers/shop.controller');

// Public
router.get ('/',    shopController.getShops);
router.get ('/:id', shopController.getShopById);

// Admin-protected
router.post  ('/',    authMiddleware, shopController.createShop);
router.patch ('/:id', authMiddleware, shopController.updateShop);
router.delete('/:id', authMiddleware, shopController.deleteShop);

module.exports = router;
