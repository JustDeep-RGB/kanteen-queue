const { io } = require('socket.io-client');
require('dotenv').config();

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';
const MOCK_TOKEN = 'mock-firebase-token-123'; // Replace with a real Firebase token for auth testing

console.log(`[Test Client] Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
  auth: { token: MOCK_TOKEN },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log(`\n✅ [Test Client] Connected! Socket ID: ${socket.id}`);
  console.log('---------------------------------------------------');
  console.log('📡  Listening for real-time queue events...');
  console.log('     orderCreated  → new order placed');
  console.log('     orderUpdated  → order status changed');
  console.log('---------------------------------------------------\n');

  // Verify two-way communication with server
  socket.emit('test-ping', { message: 'Hello from test client', timestamp: new Date() });
});

socket.on('connect_error', (err) => {
  console.error('❌ [Test Client] Connection Error:', err.message);
  console.error('   → Is the backend server running on', SOCKET_URL, '?');
});

// ─── Real-Time Queue Events ───────────────────────────────────────────────────

socket.on('orderCreated', (data) => {
  const time = new Date().toLocaleTimeString();
  console.log(`\n[${time}] 🆕  ORDER CREATED`);
  console.log(`   ID     : ${data.id}`);
  console.log(`   Slot   : ${data.slot}`);
  console.log(`   Items  : ${data.items}`);
  console.log(`   Status : ${data.status}`);
});

socket.on('orderUpdated', (data) => {
  const time = new Date().toLocaleTimeString();
  const statusEmoji = {
    preparing: '🍳',
    ready:     '✅',
    collected: '📦',
    pending:   '⏳'
  }[data.status] || '🔄';

  console.log(`\n[${time}] ${statusEmoji}  ORDER UPDATED`);
  console.log(`   ID     : ${data.id}`);
  console.log(`   Slot   : ${data.slot}`);
  console.log(`   Items  : ${data.items}`);
  console.log(`   Status : ${data.status.toUpperCase()}`);
});

// ─── Test Ping/Pong ───────────────────────────────────────────────────────────

socket.on('test-pong', (data) => {
  console.log(`[Test Client] 🏓 test-pong received:`, data.message);
});

// ─── Disconnect ───────────────────────────────────────────────────────────────

socket.on('disconnect', (reason) => {
  console.log(`\n[Test Client] Disconnected. Reason: ${reason}`);
});

console.log('[Test Client] Press Ctrl+C to exit.\n');
