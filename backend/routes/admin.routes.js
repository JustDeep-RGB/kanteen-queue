const express = require('express');
const router = express.Router();

const adminController  = require('../controllers/admin.controller');
const authMiddleware   = require('../middleware/auth.middleware');
const resolveUser      = require('../middleware/resolveUser.middleware');
const requireRole      = require('../middleware/role.middleware');

// All admin routes are protected by auth + resolveUser + requireRole
// All admin routes are protected by auth + resolveUser + requireRole
router.use(authMiddleware);
router.use(resolveUser);
router.use(requireRole(['admin']));

// ─── Shops Management ─────────────────────────────────────────────────────────
router.get('/shops',          adminController.getAllShops);
router.get('/shops/pending',  adminController.getPendingShops);
router.patch('/shops/:id/approve', adminController.approveShop);
router.patch('/shops/:id/deactivate', adminController.deactivateShop);
router.delete('/shops/:id',   adminController.deleteShop);

// ─── Users & Orders ───────────────────────────────────────────────────────────
router.get('/users',          adminController.getAllUsers);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.get('/orders',         adminController.getAllOrders);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics',      adminController.getPlatformAnalytics);

module.exports = router;
