const supabase = require('../utils/supabaseClient');
const { sendPushNotification } = require('../utils/notificationService');

let _channel = null;
const getChannel = () => {
  if (!_channel) {
    _channel = supabase.channel('order-events');
    _channel.subscribe();
  }
  return _channel;
};

const broadcast = (event, payload) => {
  try {
    getChannel().send({ type: 'broadcast', event, payload });
  } catch (err) {
    console.warn(`[Realtime] Could not broadcast ${event}:`, err.message);
  }
};

const getPopulatedOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, status, ready_notification, inserted_at, total_amount, payment_status, payment_method,
      shop_id, slot_id, user_id,
      users ( id, name ),
      time_slots ( id, start_time, end_time ),
      order_items (
        id, quantity, price_at_time,
        menu_items ( id, name, prep_time, description, is_veg, image_url )
      )
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
};

const formatOrder = (order) => {
  const items = (order.order_items || []).filter(i => i.menu_items);
  return {
    id:           order.id,
    status:       order.status,
    paymentStatus:order.payment_status,
    paymentMethod:order.payment_method,
    shopId:       order.shop_id,
    slotId:       order.slot_id,
    userId:       order.user_id,
    customerName: order.users?.name ?? 'Unknown Customer',
    slot:         order.time_slots
      ? { startTime: order.time_slots.start_time, endTime: order.time_slots.end_time }
      : null,
    items:        items.map(i => ({
      menuItemId:  i.menu_items.id,
      name:        i.menu_items.name,
      description: i.menu_items.description,
      isVeg:       i.menu_items.is_veg,
      image:       i.menu_items.image_url,
      price:       i.price_at_time, 
      prepTime:    i.menu_items.prep_time,
      quantity:    i.quantity,
    })),
    itemsSummary: items.map(i => `${i.quantity}x ${i.menu_items.name}`).join(', '),
    totalAmount:  order.total_amount,
    timestamp:    order.inserted_at,
  };
};

exports.getQueue = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, inserted_at, slot_id, total_amount, payment_status,
        users ( name ),
        time_slots ( start_time, end_time ),
        order_items (
          quantity, price_at_time,
          menu_items ( name, description, is_veg, image_url, prep_time )
        )
      `)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('inserted_at', { ascending: true });

    if (error) throw error;

    const queue = data.map((order, idx) => {
      const items = (order.order_items || []).filter(i => i.menu_items);
      const maxPrep = Math.max(0, ...items.map(i => i.menu_items.prep_time || 0));
      const ts = new Date(order.inserted_at);
      return {
        queuePosition: idx + 1,
        id:            order.id,
        status:        order.status,
        customerName:  order.users?.name ?? 'Unknown Customer',
        slot:          order.time_slots
          ? { startTime: order.time_slots.start_time, endTime: order.time_slots.end_time }
          : null,
        items:         items.map(i => ({
          name:        i.menu_items.name,
          quantity:    i.quantity,
          price:       i.price_at_time
        })),
        totalAmount:   order.total_amount,
        timestamp:     order.inserted_at,
        estimatedReady: new Date(ts.getTime() + maxPrep * 60000),
      };
    });

    res.json({ total: queue.length, queue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        id, status, inserted_at, slot_id, total_amount, payment_status,
        users ( name ),
        time_slots ( start_time ),
        order_items ( quantity, menu_items ( name ) )
      `)
      .order('inserted_at', { ascending: false })
      .limit(20);

    if (req.supabaseUser?.role === 'cafe_owner' && req.supabaseUser.shop_id) {
      query = query.eq('shop_id', req.supabaseUser.shop_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const formatted = data.map(order => ({
      id:           order.id,
      itemsSummary: (order.order_items || []).map(i => `${i.quantity}x ${i.menu_items?.name}`).join(', '),
      slot:         order.time_slots?.start_time ?? 'Unknown',
      slotId:       order.slot_id,
      status:       order.status,
      customerName: order.users?.name ?? 'Unknown Customer',
      paymentStatus:order.payment_status,
      totalAmount:  order.total_amount,
      timestamp:    order.inserted_at,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getActiveOrders = async (req, res) => {
  try {
    const userId = req.supabaseUserId;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, inserted_at, slot_id, user_id, total_amount,
        users ( name ),
        time_slots ( start_time ),
        order_items ( quantity, price_at_time, menu_items ( name, image_url ) )
      `)
      .eq('user_id', userId)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('inserted_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(order => ({ 
      ...order, 
      customerName: order.users?.name ?? 'Unknown Customer' 
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id, status, ready_notification, inserted_at,
        order_items ( quantity, menu_items ( prep_time ) ),
        order_status_history ( status, updated_at, updated_by )
      `)
      .eq('id', req.params.id)
      .single();

    if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Order not found' });
    if (error) throw error;

    const maxPrep = Math.max(0, ...(order.order_items || []).map(i => i.menu_items?.prep_time || 0));
    const ts = new Date(order.inserted_at);
    const history = order.order_status_history || [];

    res.json({
      status:            order.status,
      lastUpdated:       history.length ? history[history.length - 1].updated_at : order.inserted_at,
      estimatedReadyTime:new Date(ts.getTime() + maxPrep * 60000),
      readyNotification: order.ready_notification,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { items, slotId, shopId, paymentMethod = 'upi' } = req.body;
    const userId = req.supabaseUserId;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Items array cannot be empty' });
    }

    // 1. Fetch current prices for ordered items to lock price_at_time
    const itemIds = items.map(i => i.menuItem || i.menu_item_id);
    const { data: menuData, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, price')
      .in('id', itemIds);

    if (menuErr) throw menuErr;
    
    let totalAmount = 0;
    const enrichedItems = items.map(i => {
      const id = i.menuItem || i.menu_item_id;
      const dbItem = menuData.find(m => m.id === id);
      if (!dbItem) throw new Error(`Menu item ${id} not found`);
      totalAmount += dbItem.price * i.quantity;
      return { menu_item_id: id, quantity: i.quantity, price: dbItem.price };
    });

    // 2. Insert order using the unified RPC that checks capacity
    const { data: result, error: rpcErr } = await supabase.rpc('create_order_v2', {
      p_user_id:   userId,
      p_slot_id:   slotId,
      p_shop_id:   shopId || null,
      p_items:     enrichedItems,
      p_pay_meth:  paymentMethod,
      p_tot_amt:   totalAmount,
    });

    if (rpcErr) throw rpcErr;

    if (result.status === 'not_found') return res.status(404).json({ error: 'Time slot not found' });
    if (result.status === 'slot_closed') return res.status(409).json({ error: 'Time slot is closed' });
    if (result.status === 'slot_full') {
      return res.status(409).json({ error: 'Time slot is at capacity' });
    }

    const populated = await getPopulatedOrder(result.order_id);
    const payload   = formatOrder(populated);
    broadcast('orderCreated', payload);

    res.status(201).json(payload);
  } catch (err) {
    console.error('[order.controller] createOrder:', err.message);
    res.status(500).json({ error: 'Failed to create order', detail: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid V2 status' });

    const { data: old, error: fetchErr } = await supabase
      .from('orders').select('id, status, user_id').eq('id', id).single();
    if (fetchErr?.code === 'PGRST116') return res.status(404).json({ error: 'Order not found' });
    if (fetchErr) throw fetchErr;

    const patch = { status };
    if (status === 'ready') {
      patch.ready_notification = true;
      sendPushNotification(old.user_id, 'Order Ready', 'Your food is ready!')
        .catch(() => {});
    }

    // No need to manually update shop queues — V2 architecture handles it dynamically through get_shop_queue_size
    await supabase.from('orders').update(patch).eq('id', id);
    await supabase.from('order_status_history').insert({ order_id: id, status, updated_by: req.supabaseUserId || null });

    const populated = await getPopulatedOrder(id);
    const payload   = formatOrder(populated);
    broadcast('orderUpdated', payload);

    res.json(payload);
  } catch (err) {
    console.error('[order.controller] updateOrderStatus:', err.message);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    // Usually orders aren't hard deleted in V2, they should be "cancelled".
    const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
    if (error) throw error;
    broadcast('orderDeleted', { id: req.params.id });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('[order.controller] deleteOrder:', err.message);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
