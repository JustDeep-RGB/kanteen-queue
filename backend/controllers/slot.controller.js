const supabase = require('../utils/supabaseClient');

// Helper to determine slot status dynamically
const getStatus = (slot, usedCapacity) => {
  if (slot.is_closed) return 'closed';
  if (usedCapacity >= slot.max_capacity) return 'full';
  return 'open';
};

const toSlotView = async (slot) => {
  const { data: usedCapacity } = await supabase.rpc('get_slot_used_capacity', { slot_uuid: slot.id });
  const current_orders = usedCapacity || 0;

  return {
    id:            slot.id,
    shopId:        slot.shop_id,
    date:          slot.date,
    startTime:     slot.start_time,
    endTime:       slot.end_time,
    maxCapacity:   slot.max_capacity,
    currentOrders: current_orders,
    status:        getStatus(slot, current_orders),
  };
};

exports.getSlots = async (req, res) => {
  try {
    const { date, shopId } = req.query;
    let query = supabase.from('time_slots').select('*');

    if (date) query = query.eq('date', date);
    if (shopId) query = query.eq('shop_id', shopId);

    query = query.order('start_time', { ascending: true });

    const { data: slots, error } = await query;
    if (error) throw error;

    const mapped = await Promise.all(slots.map(toSlotView));
    res.json(mapped);
  } catch (err) {
    console.error('[slot.controller] getSlots:', err.message);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, maxCapacity, shopId } = req.body;
    if (!date || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({ error: 'date, startTime, endTime, and maxCapacity are required' });
    }

    const { data, error } = await supabase
      .from('time_slots')
      .insert({
        shop_id:      shopId || null,
        date,
        start_time:   startTime,
        end_time:     endTime,
        max_capacity: maxCapacity,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(await toSlotView(data));
  } catch (err) {
    console.error('[slot.controller] createSlot:', err.message);
    res.status(500).json({ error: 'Failed to create time slot' });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxCapacity, isClosed } = req.body;

    const patch = {};
    if (maxCapacity !== undefined) patch.max_capacity = maxCapacity;
    if (isClosed !== undefined) patch.is_closed = isClosed;

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('time_slots')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Time slot not found' });
    if (error) throw error;

    res.json(await toSlotView(data));
  } catch (err) {
    console.error('[slot.controller] updateSlot:', err.message);
    res.status(500).json({ error: 'Failed to update time slot' });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    // ensure no active orders exist before deletion
    const { data: usedCap } = await supabase.rpc('get_slot_used_capacity', { slot_uuid: id });
    if (usedCap > 0) {
      return res.status(400).json({ error: 'Cannot delete time slot with active orders' });
    }

    const { error } = await supabase.from('time_slots').delete().eq('id', id);
    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Time slot not found' });
    if (error) throw error;

    res.json({ message: 'Time slot deleted successfully' });
  } catch (err) {
    console.error('[slot.controller] deleteSlot:', err.message);
    res.status(500).json({ error: 'Failed to delete time slot' });
  }
};

exports.bookmarkSlot = async (req, res) => {
  try {
    const { id: slotId } = req.params;
    const userId = req.supabaseUserId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized: missing user mapping' });

    const { error: slotErr } = await supabase.from('time_slots').select('id').eq('id', slotId).single();
    if (slotErr?.code === 'PGRST116') return res.status(404).json({ error: 'Time slot not found' });
    
    const { error: existingErr } = await supabase
      .from('user_bookmarked_slots')
      .insert({ user_id: userId, slot_id: slotId });

    if (existingErr && existingErr.code === '23505') {
       return res.status(400).json({ error: 'Slot already bookmarked' }); 
    }
    if (existingErr) throw existingErr;

    res.json({ message: 'Slot bookmarked successfully' });
  } catch (err) {
    console.error('[slot.controller] bookmarkSlot:', err.message);
    res.status(500).json({ error: 'Failed to bookmark slot' });
  }
};
