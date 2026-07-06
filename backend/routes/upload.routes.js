'use strict';

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { uploadImage } = require('../middleware/upload.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const resolveUser = require('../middleware/resolveUser.middleware');

// Note: Ensure the user is authenticated and resolved before uploading
const authAndResolve = [authMiddleware, resolveUser];

// ─── Shop Images ─────────────────────────────────────────────────────────────
router.post(
  '/shops/:shopId/image',
  authAndResolve,
  uploadImage,
  uploadController.uploadShopImage
);

// ─── Menu Item Images ────────────────────────────────────────────────────────
router.post(
  '/menu-items/:menuItemId/image',
  authAndResolve,
  uploadImage,
  uploadController.uploadMenuItemImage
);

module.exports = router;
