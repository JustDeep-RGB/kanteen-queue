'use strict';

const supabase = require('../utils/supabaseClient');
const { compressImage } = require('../utils/imageCompression');
const { uploadImageToSupabase, deleteImageFromSupabase } = require('../utils/imageUpload');

/**
 * POST /api/shops/:shopId/image
 * Uploads or replaces the shop image.
 */
exports.uploadShopImage = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // 1. Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    // 2. Fetch current shop to get old image URL (and for authorization check if needed)
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('image_url, owner_id')
      .eq('id', shopId)
      .maybeSingle();

    if (shopErr || !shop) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    // Authorization: only admins or the shop owner can upload
    const userRole = req.user?.role;
    const userId = req.user?.id;
    if (userRole !== 'admin' && shop.owner_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to upload images for this shop.' });
    }

    // 3. Compress image to WebP
    const compressedBuffer = await compressImage(req.file.buffer);

    // 4. Upload to Supabase Storage
    const publicUrl = await uploadImageToSupabase(compressedBuffer, 'shops');

    // 5. Update database with new URL
    const { error: updateErr } = await supabase
      .from('shops')
      .update({ image_url: publicUrl })
      .eq('id', shopId);

    if (updateErr) {
      // Revert upload if DB update fails (optional but good practice)
      await deleteImageFromSupabase(publicUrl);
      throw new Error(`Failed to update database: ${updateErr.message}`);
    }

    // 6. Delete old image if it existed
    if (shop.image_url) {
      await deleteImageFromSupabase(shop.image_url);
    }

    res.status(200).json({ message: 'Shop image uploaded successfully.', image_url: publicUrl });
  } catch (err) {
    console.error('[upload.controller] uploadShopImage:', err.message);
    res.status(500).json({ error: 'Failed to upload shop image.' });
  }
};

/**
 * POST /api/menu-items/:menuItemId/image
 * Uploads or replaces the menu item image.
 */
exports.uploadMenuItemImage = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    // Fetch current menu item to get old image URL and shop_id for auth
    const { data: menuItem, error: menuErr } = await supabase
      .from('menu_items')
      .select('image_url, shop_id')
      .eq('id', menuItemId)
      .maybeSingle();

    if (menuErr || !menuItem) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    // Check authorization via shop owner
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('owner_id')
      .eq('id', menuItem.shop_id)
      .maybeSingle();

    if (shopErr || !shop) {
      return res.status(404).json({ error: 'Associated shop not found.' });
    }

    const userRole = req.user?.role;
    const userId = req.user?.id;
    if (userRole !== 'admin' && shop.owner_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to upload images for this menu item.' });
    }

    // Compress and Upload
    const compressedBuffer = await compressImage(req.file.buffer);
    const publicUrl = await uploadImageToSupabase(compressedBuffer, 'food');

    // Update database
    const { error: updateErr } = await supabase
      .from('menu_items')
      .update({ image_url: publicUrl })
      .eq('id', menuItemId);

    if (updateErr) {
      await deleteImageFromSupabase(publicUrl);
      throw new Error(`Failed to update database: ${updateErr.message}`);
    }

    // Cleanup old image
    if (menuItem.image_url) {
      await deleteImageFromSupabase(menuItem.image_url);
    }

    res.status(200).json({ message: 'Menu item image uploaded successfully.', image_url: publicUrl });
  } catch (err) {
    console.error('[upload.controller] uploadMenuItemImage:', err.message);
    res.status(500).json({ error: 'Failed to upload menu item image.' });
  }
};
