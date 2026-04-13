const supabase = require('../utils/supabaseClient');

// ─── GET /api/prediction ──────────────────────────────────────────────────────
exports.getPrediction = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Totals per menu item from orders in the last 7 days
    const { data: recentItems, error: histErr } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity, orders!inner(inserted_at)')
      .gte('orders.inserted_at', sevenDaysAgo.toISOString());

    if (histErr) throw histErr;

    // Aggregate totals per menu_item_id
    const totals = {};
    (recentItems || []).forEach(({ menu_item_id, quantity }) => {
      totals[menu_item_id] = (totals[menu_item_id] || 0) + quantity;
    });

    const { data: menuItems, error: menuErr } = await supabase
      .from('menu_items').select('id, name, avg_demand');
    if (menuErr) throw menuErr;

    const predictions = menuItems.map(item => ({
      id:              item.id,
      name:            item.name,
      predictedDemand: Math.ceil((totals[item.id] || 0) / 7),
      weeklyTotal:     totals[item.id]  || 0,
    }));

    res.json(predictions);
  } catch (err) {
    console.error('[analytics.controller] getPrediction:', err.message);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
};

// ─── GET /api/summary ─────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    // Total orders
    const { count: totalOrders, error: countErr } = await supabase
      .from('orders').select('*', { count: 'exact', head: true });
    if (countErr) throw countErr;

    // Slot stats
    const { data: slotStats, error: slotErr } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, max_capacity');
    if (slotErr) throw slotErr;

    // Top 3 selling items
    const { data: itemTotals, error: topErr } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity');
    if (topErr) throw topErr;

    const sold = {};
    (itemTotals || []).forEach(({ menu_item_id, quantity }) => {
      sold[menu_item_id] = (sold[menu_item_id] || 0) + quantity;
    });

    const { data: allItems } = await supabase.from('menu_items').select('id, name');
    const topItems = (allItems || [])
      .map(i => ({ name: i.name, sold: sold[i.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);

    res.json({ totalOrders, slotStats, topItems });
  } catch (err) {
    console.error('[analytics.controller] getStats:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message });
  }
};

// ─── GET /api/analytics ───────────────────────────────────────────────────────
exports.getWasteAnalytics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Today's sales per menu item
    const { data: todayItems, error: todayErr } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity, orders!inner(inserted_at)')
      .gte('orders.inserted_at', todayStart.toISOString());
    if (todayErr) throw todayErr;

    const soldToday = {};
    (todayItems || []).forEach(({ menu_item_id, quantity }) => {
      soldToday[menu_item_id] = (soldToday[menu_item_id] || 0) + quantity;
    });

    const { data: items, error: itemsErr } = await supabase
      .from('menu_items').select('id, name, avg_demand, price');
    if (itemsErr) throw itemsErr;

    const wasteData = items.map(item => {
      const sold      = soldToday[item.id] || 0;
      const predicted = item.avg_demand   || 20;
      const prepared  = predicted + Math.ceil(predicted * 0.1);
      const waste     = Math.max(0, prepared - sold);
      return { item: item.name, prepared, sold, waste, costLoss: waste * item.price };
    });

    res.json({ wasteAnalytics: wasteData });
  } catch (err) {
    console.error('[analytics.controller] getWasteAnalytics:', err.message);
    res.status(500).json({ error: 'Failed to fetch waste analytics' });
  }
};
