require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const TimeSlot = require('./models/TimeSlot');
const Order = require('./models/Order');

async function seedData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-canteen');
    console.log('Connected to database logic for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await TimeSlot.deleteMany({});
    await Order.deleteMany({});
    
    // Create Users
    const users = await User.insertMany([
      { name: 'Admin User', rollNumber: 'ADMIN001', role: 'admin' },
      { name: 'Student One', rollNumber: '20CS001', role: 'student' },
      { name: 'Student Two', rollNumber: '20CS002', role: 'student' }
    ]);
    const student1 = users[1]._id;

    // Create Menu Items
    const menuItems = await MenuItem.insertMany([
      { name: 'Chicken Biryani', price: 120, prepTime: 20, avgDemand: 50 },
      { name: 'Veg Thali', price: 80, prepTime: 15, avgDemand: 70 },
      { name: 'Masala Dosa', price: 60, prepTime: 10, avgDemand: 40 },
      { name: 'Samosa', price: 15, prepTime: 5, avgDemand: 100 },
      { name: 'Cold Coffee', price: 40, prepTime: 5, avgDemand: 60 }
    ]);

    // Create Time Slots (Lunch Break typical times)
    const timeSlots = await TimeSlot.insertMany([
      { startTime: '12:00', endTime: '12:30', maxCapacity: 50, currentOrders: 0 },
      { startTime: '12:30', endTime: '13:00', maxCapacity: 50, currentOrders: 0 },
      { startTime: '13:00', endTime: '13:30', maxCapacity: 50, currentOrders: 0 },
      { startTime: '13:30', endTime: '14:00', maxCapacity: 50, currentOrders: 0 }
    ]);

    // Generate historical orders for prediction (Last 7 days)
    const ordersToInsert = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
        // Create 10 random orders per day
        for (let j = 0; j < 10; j++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Randomly select 1-3 menu items
            const orderItems = [];
            const numItems = Math.floor(Math.random() * 3) + 1;
            for (let k = 0; k < numItems; k++) {
                const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
                orderItems.push({
                    menuItem: randomItem._id,
                    quantity: Math.floor(Math.random() * 2) + 1
                });
            }

            ordersToInsert.push({
                userId: student1,
                items: orderItems,
                slotId: timeSlots[Math.floor(Math.random() * timeSlots.length)]._id,
                status: 'collected',
                timestamp: date
            });
        }
    }

    await Order.insertMany(ordersToInsert);
    console.log('Seeded database successfully with mock users, menu items, slots, and historical orders!');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed', error);
    process.exit(1);
  }
}

seedData();
