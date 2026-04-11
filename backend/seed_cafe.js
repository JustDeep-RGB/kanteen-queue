/**
 * seed_cafe.js — Run with: node seed_cafe.js
 * Creates a demo cafe and links menu items to it.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Shop     = require('./models/Shop');
const MenuItem = require('./models/MenuItem');

const MONGO_URI = process.env.MONGODB_URI;

const cafe = {
  name:             'The Gourmet Kitchen',
  ownerName:        'Jasdeep Singh',
  latitude:         28.6139,
  longitude:        77.2090,
  address:          'Block A, Main Campus, New Delhi',
  avgPrice:         80,
  seatingAvailable: true,
  rating:           4.5,
  isActive:         true,

  // Operating hours (IST, 24-hour format)
  openingTime:      '08:00',   // 8:00 AM
  closingTime:      '21:00',   // 9:00 PM
  isOpen:           true,      // set to false to force-close regardless of hours
};

const menuItems = [
  {
    name:        'Dal Tadka',
    description: 'Classic yellow lentils tempered with cumin, garlic & dried red chillies',
    price:       60,
    prepTime:    10,
    isVeg:       true,
    avgDemand:   40,
    isAvailable: true,
  },
  {
    name:        'Paneer Butter Masala',
    description: 'Cottage cheese in a rich, creamy tomato-cashew gravy',
    price:       120,
    prepTime:    15,
    isVeg:       true,
    avgDemand:   30,
    isAvailable: true,
  },
  {
    name:        'Chicken Biryani',
    description: 'Fragrant basmati rice slow-cooked with spiced chicken & caramelised onions',
    price:       150,
    prepTime:    20,
    isVeg:       false,
    avgDemand:   50,
    isAvailable: true,
  },
  {
    name:        'Masala Chai',
    description: 'House-blend spiced tea with ginger & cardamom',
    price:       20,
    prepTime:    5,
    isVeg:       true,
    avgDemand:   80,
    isAvailable: true,
  },
  {
    name:        'Veg Thali',
    description: 'Full meal — rice, 2 sabzis, dal, roti, salad & pickle',
    price:       100,
    prepTime:    12,
    isVeg:       true,
    avgDemand:   60,
    isAvailable: true,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // Create cafe
  const shop = await Shop.create(cafe);
  console.log(`🏪 Created cafe: "${shop.name}" (ID: ${shop._id})\n`);

  // Link menu items to cafe
  const items = menuItems.map(item => ({ ...item, shopId: shop._id }));
  const created = await MenuItem.insertMany(items);

  console.log(`🍽️  Created ${created.length} menu items:`);
  created.forEach(i => {
    const tag = i.isVeg ? '🟢 Veg' : '🔴 Non-Veg';
    console.log(`   • [${tag}] ${i.name} — ₹${i.price} | ${i.prepTime} min`);
  });

  console.log('\n📡 Fetch this cafe\'s menu via:');
  console.log(`   GET /api/menu?shopId=${shop._id}`);
  console.log(`   GET /api/shops/${shop._id}`);

  await mongoose.disconnect();
  console.log('\n✅ Done. Disconnected from MongoDB.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
