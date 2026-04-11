const supabase = require('../utils/supabaseClient');

const BUCKET = 'menu-images';

// ─── Helper: upload file buffer to Supabase Storage ──────────────────────────
const uploadImage = async (file) => {
  if (!file) return null;
  const ext      = file.originalname.split('.').pop();
  const filePath = `${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Helper: delete a file from Supabase Storage by its public URL ───────────
const deleteImageByUrl = async (url) => {
  if (!url) return;
  try {
    // Extract path after /object/public/<bucket>/
    const marker = `/object/public/${BUCKET}/`;
    const idx    = url.indexOf(marker);
    if (idx === -1) return;
    const filePath = url.substring(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch (err) {
    console.error('[menu] Failed to delete image from storage:', err.message);
  }
};

// ─── GET /api/menu ────────────────────────────────────────────────────────────
exports.getMenu = async (req, res) => {
  try {
    let query = supabase.from('menu_items').select('*');

    if (req.query.veg !== undefined) {
      query = query.eq('is_veg', req.query.veg === 'true');
    }
    if (req.query.shopId) {
      query = query.eq('shop_id', req.query.shopId);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[menu.controller] getMenu:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

// ─── POST /api/menu ───────────────────────────────────────────────────────────
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, prepTime, avgDemand, isVeg, isAvailable, shopId } = req.body;

    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        shop_id:     shopId      || null,
        name,
        description: description || '',
        price,
        prep_time:   prepTime,
        is_veg:      isVeg !== undefined ? (isVeg === 'true' || isVeg === true) : true,
        is_available:isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
        image_url:   imageUrl,
      })
      .select()
      .single();

    if (error) {
       console.error('[menu.controller] Supabase Insert Error:', error);
       throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error('[menu.controller] createMenuItem:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create menu item' });
  }
};

// ─── PUT /api/menu/:id ────────────────────────────────────────────────────────
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, prepTime, avgDemand, isVeg, isAvailable, shopId } = req.body;

    // Fetch existing item for old image path
    const { data: existing, error: fetchErr } = await supabase
      .from('menu_items').select('image_url').eq('id', id).single();
    if (fetchErr?.code === 'PGRST116') return res.status(404).json({ error: 'Item not found' });
    if (fetchErr) throw fetchErr;

    let imageUrl = existing.image_url;
    if (req.file) {
      const newUrl = await uploadImage(req.file);
      await deleteImageByUrl(existing.image_url);
      imageUrl = newUrl;
    } else if (req.body.imageUrl !== undefined && req.body.imageUrl !== existing.image_url) {
      await deleteImageByUrl(existing.image_url);
      imageUrl = req.body.imageUrl;
    }

    const patch = {};
    if (name        !== undefined) patch.name         = name;
    if (description !== undefined) patch.description  = description;
    if (price       !== undefined) patch.price        = price;
    if (prepTime    !== undefined) patch.prep_time    = prepTime;
    if (isVeg       !== undefined) patch.is_veg       = (isVeg === 'true' || isVeg === true);
    if (isAvailable !== undefined) patch.is_available = (isAvailable === 'true' || isAvailable === true);
    if (shopId      !== undefined) patch.shop_id      = shopId || null;
    patch.image_url = imageUrl;

    const { data, error } = await supabase
      .from('menu_items').update(patch).eq('id', id).select().single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Item not found' });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[menu.controller] updateMenuItem:', err.message);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

// ─── DELETE /api/menu/:id ─────────────────────────────────────────────────────
exports.deleteMenuItem = async (req, res) => {
  try {
    const { data: item, error: fetchErr } = await supabase
      .from('menu_items').select('image_url').eq('id', req.params.id).single();
    if (fetchErr?.code === 'PGRST116') return res.status(404).json({ error: 'Item not found' });
    if (fetchErr) throw fetchErr;

    await deleteImageByUrl(item.image_url);

    const { error } = await supabase.from('menu_items').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('[menu.controller] deleteMenuItem:', err.message);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

// ─── DELETE /api/menu/:id/image ───────────────────────────────────────────────
exports.deleteMenuItemImage = async (req, res) => {
  try {
    const { data: item, error: fetchErr } = await supabase
      .from('menu_items').select('*').eq('id', req.params.id).single();
    if (fetchErr?.code === 'PGRST116') return res.status(404).json({ error: 'Item not found' });
    if (fetchErr) throw fetchErr;

    await deleteImageByUrl(item.image_url);

    const { data, error } = await supabase
      .from('menu_items').update({ image_url: '' }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ message: 'Image deleted successfully', item: data });
  } catch (err) {
    console.error('[menu.controller] deleteMenuItemImage:', err.message);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
