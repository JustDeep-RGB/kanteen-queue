const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const shopController = require('../controllers/shop.controller');

// Public
router.get ('/',         shopController.getShops);

// Admin-protected (must be before /:id so 'pending' isn't treated as an id)
router.get   ('/pending',        authMiddleware, shopController.getPendingShops);
router.get   ('/:id',            shopController.getShopById);
router.post  ('/',               shopController.createShop);
router.patch ('/:id/verify',     authMiddleware, shopController.verifyShop);
router.patch ('/:id/status',     authMiddleware, shopController.toggleStatus);
router.patch ('/:id',            authMiddleware, shopController.updateShop);
router.delete('/:id',            authMiddleware, shopController.deleteShop);

module.exports = router;
