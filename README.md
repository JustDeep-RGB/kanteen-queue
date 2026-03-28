# Smart Canteen Backend

Node.js/Express backend for the **Smart Canteen Queue Management System** — manages menus, time slots, real-time order queues, users, and admin analytics.

## Features

- **Menu Management** — Full CRUD with veg/non-veg classification, descriptions, and image uploads
- **Time Slot Booking** — Tracks `currentOrders` vs `maxCapacity`, auto-suggests alternatives when slots fill up
- **Real-Time Queue** — Live order state via Socket.io (`orderCreated`, `orderUpdated` events)
- **Order Tracking** — Lifecycle: `pending → preparing → ready → collected`
- **Push Notifications** — Firebase Cloud Messaging (FCM) for order-ready & slot-fill alerts
- **Firebase Auth** — Token verification middleware protecting admin routes
- **Swagger UI** — Interactive API docs with a dev-key bypass for local testing
- **Analytics** — Dashboard stats, demand predictions, and food waste analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express 5 |
| Database | MongoDB + Mongoose 9.x |
| Real-time | Socket.io 4.x |
| Auth | Firebase Admin SDK |
| File uploads | Multer |
| API docs | Swagger UI (OpenAPI 3.0) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (Atlas or local)
- Firebase project → download `serviceAccountKey.json` and place it in `/backend`

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smart-canteen

# Auth modes
FIREBASE_AUTH_DISABLED=false   # Set true to bypass ALL auth (local dev/CI)
SWAGGER_DEV_KEY=swagger-local-dev-2024  # Secret key for Swagger UI testing
```

> **Security**: `.env` and `serviceAccountKey.json` are gitignored — never commit them.

### Run

```bash
node server.js
```

Server starts on `http://localhost:5000`.

### Test Real-Time Sockets

```bash
# In a separate terminal
node testsocket.js
```

Connects to Socket.io and prints live `orderCreated` / `orderUpdated` events with emoji-formatted output.

---

## Authentication

Routes marked 🔒 require a Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

### Auth Bypass Modes (dev only)

| Mode | How to activate | Effect |
|------|-----------------|--------|
| **Fully disabled** | `FIREBASE_AUTH_DISABLED=true` in `.env` | All protected routes open, no token needed |
| **Swagger dev key** | Set `SWAGGER_DEV_KEY` in `.env` | Use that key as the Bearer token in Swagger UI |

**Using the dev key in Swagger UI:**
1. Open `http://localhost:5000/api/v1/api-docs/`
2. Click **Authorize 🔒** (top right)
3. Paste the value of `SWAGGER_DEV_KEY` (e.g. `swagger-local-dev-2024`)
4. Click **Authorize → Close**
5. All protected endpoints will now work

---

## API Reference

### Users 🔒

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | 🔒 | Get all users. Filter: `?role=student\|admin` |
| GET | `/api/users/:userId` | 🔒 | Get a single user by ID |
| POST | `/api/users` | 🔒 | Create a user (`name`, `rollNumber`, optional `role`) |
| DELETE | `/api/users/:userId` | 🔒 | Delete a user |
| PATCH | `/api/users/:userId/fcm-token` | — | Update FCM push token (called by mobile app) |

**Create User body:**
```json
{ "name": "Jasdeep Singh", "rollNumber": "CS2101", "role": "student" }
```

---

### Menu

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/menu` | — | Get all items. Filter: `?veg=true` or `?veg=false` |
| POST | `/api/menu` | 🔒 | Create item (`multipart/form-data`) |
| PUT | `/api/menu/:id` | 🔒 | Update item |
| DELETE | `/api/menu/:id` | 🔒 | Delete item |

**MenuItem fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | Name of the dish |
| `description` | String | — | Short description |
| `price` | Number | ✅ | Price in ₹ |
| `prepTime` | Number | ✅ | Preparation time in minutes |
| `isVeg` | Boolean | — | `true` = veg (default), `false` = non-veg |
| `avgDemand` | Number | — | Avg daily demand (for analytics) |
| `image` | File/URL | — | Menu item image |

---

### Time Slots

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/slots` | — | Get all slots. Filter: `?date=YYYY-MM-DD` |
| POST | `/api/slots` | 🔒 | Create a slot |
| PUT | `/api/slots/:id` | 🔒 | Update slot capacity |
| DELETE | `/api/slots/:id` | 🔒 | Delete slot (fails if has active orders) |
| POST | `/api/slots/check` | — | Check if a slot has capacity |
| POST | `/api/slots/suggest` | — | Get closest available slots |

**Check capacity body:** `{ "slotId": "...", "date": "2026-03-28" }`

**Suggest slots body:** `{ "preferredSlotId": "...", "date": "2026-03-28" }`

---

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders/queue` | — | **Real-time queue** — all active orders with item details & ETA |
| GET | `/api/orders` | 🔒 | All orders (last 20, newest first) |
| GET | `/api/orders/active` | — | Active orders for a user: `?userId=<id>` |
| POST | `/api/orders` | 🔒 | Place a new order |
| GET | `/api/orders/:id/status` | — | Get order status + estimated ready time |
| PATCH | `/api/orders/:id/status` | 🔒 | Advance order status |
| PUT | `/api/orders/:id/status` | 🔒 | Same as PATCH (admin dashboard alias) |

**Valid status transitions:** `pending → preparing → ready → collected` (no skipping, no reversing)

**Queue response (`GET /api/orders/queue`):**
```json
{
  "total": 1,
  "queue": [{
    "queuePosition": 1,
    "id": "abc123",
    "status": "preparing",
    "slot": { "startTime": "12:00", "endTime": "12:30" },
    "items": [{
      "name": "Dal Tadka",
      "description": "Classic lentil dish with tempering",
      "isVeg": true,
      "image": "/uploads/dal.jpg",
      "price": 60,
      "prepTime": 10,
      "quantity": 2
    }],
    "timestamp": "2026-03-28T06:00:00.000Z",
    "estimatedReady": "2026-03-28T06:10:00.000Z"
  }]
}
```

---

### Analytics 🔒

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/summary` | 🔒 | Dashboard summary stats |
| GET | `/api/dashboard/stats` | 🔒 | Alias for `/api/summary` |
| GET | `/api/prediction` | 🔒 | Demand prediction data |
| GET | `/api/analytics` | 🔒 | Food waste analytics |

---

## Real-Time Events (Socket.io)

Connect: `ws://localhost:5000` (use `socket.io-client`)

**Optional auth handshake:**
```js
const socket = io('http://localhost:5000', {
  auth: { token: '<firebaseIdToken>' }
});
```

### Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `orderCreated` | `{ id, items, slot, status, timestamp }` | New order placed |
| `orderUpdated` | `{ id, items, slot, status, timestamp }` | Order status changed |
| `test-pong` | `{ message, timestamp }` | Response to `test-ping` |

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `test-ping` | `{ message, timestamp }` | Verify connection — server replies with `test-pong` |

---

## Swagger UI

**URL:** `http://localhost:5000/api/v1/api-docs/`

- All JSDoc annotations live in `backend/swagger.js` (separate from routes for readability)
- To test protected endpoints locally, use the `SWAGGER_DEV_KEY` bypass (see Auth section above)

---

## Directory Structure

```
backend/
├── controllers/
│   ├── analytics.controller.js
│   ├── menu.controller.js
│   ├── order.controller.js    # includes getQueue for real-time view
│   ├── slot.controller.js
│   └── user.controller.js     # full CRUD + FCM token update
├── middleware/
│   └── auth.middleware.js     # Firebase token verification + dev bypasses
├── models/
│   ├── MenuItem.js            # includes isVeg + description fields
│   ├── Order.js
│   ├── TimeSlot.js
│   └── User.js
├── routes/
│   └── index.js               # clean route definitions (no Swagger clutter)
├── uploads/                   # locally stored menu images
├── utils/
│   └── notificationService.js # FCM push notifications
├── swagger.js                 # all OpenAPI 3.0 JSDoc annotations
├── testsocket.js              # Socket.io test client
├── serviceAccountKey.json     # Firebase Admin credentials (gitignored)
├── .env                       # environment variables (gitignored)
└── server.js                  # entry point: Express, Socket.io, Swagger, MongoDB
```
