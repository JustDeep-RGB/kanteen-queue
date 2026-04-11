/**
 * seed_cafe.js — Seed a demo cafe into Supabase (V2 Architecture).
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const cafe = {
  name:              'The Gourmet Kitchen',
  latitude:          28.6139,
  longitude:         77.2090,
  address:           'Block A, Main Campus, New Delhi',
  seating_capacity:  40,
  table_count:       10,
  rating:            4.5,
  is_active:         true,
  opening_time:      '08:00',
  closing_time:      '21:00',
  is_open:           true,
};

const menuItems = [
  { name: 'Dal Tadka',            description: 'Classic yellow lentils tempered with cumin',          price: 60,  prep_time: 10, is_veg: true,  is_available: true },
  { name: 'Paneer Butter Masala', description: 'Cottage cheese in a rich, creamy tomato-cashew gravy',price: 120, prep_time: 15, is_veg: true,  is_available: true },
  { name: 'Chicken Biryani',      description: 'Fragrant basmati rice slow-cooked with chicken',     price: 150, prep_time: 20, is_veg: false, is_available: true },
  { name: 'Masala Chai',          description: 'House-blend spiced tea with ginger & cardamom',       price: 20,  prep_time: 5,  is_veg: true,  is_available: true },
  { name: 'Veg Thali',            description: 'Full meal — rice, 2 sabzis, dal, roti, salad & pickle', price: 100, prep_time: 12, is_veg: true,  is_available: true },
];

async function seed() {
  console.log('🟡 Connecting to Supabase...\n');

  const { data: shop, error: shopErr } = await supabase
    .from('shops').insert(cafe).select().single();

  if (shopErr) throw new Error(`Shop Creation Failed: ${shopErr.message}`);
  console.log(`🏪 Created cafe: "${shop.name}" (ID: ${shop.id})\n`);

  const items = menuItems.map(item => ({ ...item, shop_id: shop.id }));
  const { data: created, error: menuErr } = await supabase
    .from('menu_items').insert(items).select();

  if (menuErr) throw new Error(`Menu Creation Failed: ${menuErr.message}`);

  console.log(`🍽️  Created ${created.length} menu items:`);
  created.forEach(i => {
    const tag = i.is_veg ? '🟢 Veg' : '🔴 Non-Veg';
    console.log(`   • [${tag}] ${i.name} — ₹${i.price} | ${i.prep_time} min`);
  });

  console.log('\n✅ V2 DB Seed Complete.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
