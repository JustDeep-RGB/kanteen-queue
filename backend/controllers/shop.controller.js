const supabase = require('../utils/supabaseClient');

const computeIsOpen = (shop) => {
  if (!shop.is_open) return false;
  if (!shop.opening_time || !shop.closing_time) return true;

  const [openH, openM]   = shop.opening_time.split(':').map(Number);
  const [closeH, closeM] = shop.closing_time.split(':').map(Number);

  const now    = new Date();
  const utcMs  = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist    = new Date(utcMs + 5.5 * 3_600_000);
  const curMin = ist.getHours() * 60 + ist.getMinutes();

  const openMin  = openH  * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  if (closeMin > openMin) return curMin >= openMin && curMin < closeMin;
  return curMin >= openMin || curMin < closeMin;
};

const queueLevel = (n) => (n >= 10 ? 'high' : n >= 5 ? 'medium' : 'low');

const toMapView = async (shop) => {
  // Fetch active queue dynamically
  const { data: qSize } = await supabase.rpc('get_shop_queue_size', { shop_uuid: shop.id });
  const current_queue = qSize || 0;

  return {
    id:               shop.id,
    name:             shop.name,
    latitude:         shop.latitude,
    longitude:        shop.longitude,
    address:          shop.address,
    seatingCapacity:  shop.seating_capacity,
    tableCount:       shop.table_count,
    rating:           shop.rating,
    currentQueue:     current_queue,
    queueLevel:       queueLevel(current_queue),
    openingTime:      shop.opening_time,
    closingTime:      shop.closing_time,
    isOpen:           shop.is_open,
    isCurrentlyOpen:  computeIsOpen(shop),
  };
};

exports.createShop = async (req, res) => {
  try {
    const { name, ownerId, latitude, longitude, address, 
            seatingCapacity, tableCount, rating, isActive, openingTime, closingTime, isOpen } = req.body;

    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'name, latitude, and longitude are required' });
    }

    const { data, error } = await supabase
      .from('shops')
      .insert({
        name, latitude, longitude,
        owner_id:          ownerId          || null,
        address:           address          ?? '',
        seating_capacity:  seatingCapacity  ?? 0,
        table_count:       tableCount       ?? 0,
        rating:            rating           ?? 4.0,
        is_active:         isActive         ?? true,
        is_verified:       false,           // Shops must be verified by admin
        opening_time:      openingTime      ?? '',
        closing_time:      closingTime      ?? '',
        is_open:           isOpen           ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('[shop.controller] createShop:', err.message);
    res.status(500).json({ error: 'Failed to create shop' });
  }
};

exports.getShops = async (req, res) => {
  try {
    let query = supabase.from('shops').select('*').eq('is_active', true).eq('is_verified', true).order('rating', { ascending: false });

    const { lat, lng, radius } = req.query;
    if (lat && lng) {
      const r   = parseFloat(radius) || 10;
      const deg = r / 111;
      const latF = parseFloat(lat), lngF = parseFloat(lng);
      query = query
        .gte('latitude',  latF - deg).lte('latitude',  latF + deg)
        .gte('longitude', lngF - deg).lte('longitude', lngF + deg);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    const mapped = await Promise.all(data.map(toMapView));
    res.json(mapped);
  } catch (err) {
    console.error('[shop.controller] getShops:', err.message);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

exports.getPendingShops = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_verified', false)
      .order('inserted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[shop.controller] getPendingShops:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending shops' });
  }
};

exports.verifyShop = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .update({ is_verified: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;
    res.json({ message: 'Shop verified successfully', shop: data });
  } catch (err) {
    console.error('[shop.controller] verifyShop:', err.message);
    res.status(500).json({ error: 'Failed to verify shop' });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const { data, error } = await supabase.from('shops').select('*').eq('id', req.params.id).single();
    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;
    
    const mapped = await toMapView(data);
    res.json(mapped);
  } catch (err) {
    console.error('[shop.controller] getShopById:', err.message);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const body = { ...req.body };
    const patch = {};
    
    if (body.name !== undefined) patch.name = body.name;
    if (body.ownerId !== undefined) patch.owner_id = body.ownerId || null;
    if (body.address !== undefined) patch.address = body.address;
    if (body.seatingCapacity !== undefined) patch.seating_capacity = body.seatingCapacity;
    if (body.tableCount !== undefined) patch.table_count = body.tableCount;
    if (body.rating !== undefined) patch.rating = body.rating;
    if (body.latitude !== undefined) patch.latitude = body.latitude;
    if (body.longitude !== undefined) patch.longitude = body.longitude;
    if (body.isActive !== undefined) patch.is_active = body.isActive;
    if (body.openingTime !== undefined) patch.opening_time = body.openingTime;
    if (body.closingTime !== undefined) patch.closing_time = body.closingTime;
    if (body.isOpen !== undefined) patch.is_open = body.isOpen;

    const { data, error } = await supabase
      .from('shops').update(patch).eq('id', req.params.id).select().single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[shop.controller] updateShop:', err.message);
    res.status(500).json({ error: 'Failed to update shop' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { isOpen, openingTime, closingTime } = req.body;
    const patch = {};
    if (typeof isOpen      === 'boolean') patch.is_open      = isOpen;
    if (typeof openingTime === 'string')  patch.opening_time = openingTime.trim();
    if (typeof closingTime === 'string')  patch.closing_time = closingTime.trim();

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Provide at least one of: isOpen, openingTime, closingTime' });
    }

    const { data, error } = await supabase
      .from('shops').update(patch).eq('id', req.params.id).select().single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;

    res.json({
      message:         'Shop status updated',
      isOpen:          data.is_open,
      openingTime:     data.opening_time,
      closingTime:     data.closing_time,
      isCurrentlyOpen: computeIsOpen(data),
    });
  } catch (err) {
    console.error('[shop.controller] toggleStatus:', err.message);
    res.status(500).json({ error: 'Failed to update shop status' });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const { error } = await supabase.from('shops').delete().eq('id', req.params.id);
    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Shop not found' });
    if (error) throw error;
    res.json({ message: 'Shop deleted successfully' });
  } catch (err) {
    console.error('[shop.controller] deleteShop:', err.message);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
};
