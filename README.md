# Smart Canteen Backend

This is the Node.js/Express backend for the **Smart Canteen Queue Management System**. It manages menus, time slots, ordering queues, users, and admin analytics, aiming to streamline cafeteria flows and minimize food waste.

## Features

- **Menu Management**: Full CRUD for canteen menu items with veg/non-veg classification, descriptions, and image uploads.
- **Queue & Time Slot System**: Users book specific 10-minute time slots to pick up their food. The system tracks `currentOrders` vs `maxCapacity` and auto-closes slots when full. It also suggests alternative open slots if a user's preferred slot is full.
- **Real-Time Queue View**: Live queue state via Socket.io — clients receive `orderCreated` and `orderUpdated` events instantly.
- **Order Tracking**: Order lifecycle management (`pending` → `preparing` → `ready` → `collected`).
- **Push Notifications**: Integration with Firebase Cloud Messaging (FCM) to notify students when their order is ready for pickup or when their bookmarked slots fill up.
- **Data Analytics**: Endpoints tailored for the Admin Dashboard to visualize demand predictions, most popular items, and food waste analytics.
- **Interactive API Documentation**: Swagger UI integrated directly into the backend for easy endpoint testing.

## Tech Stack

- **Node.js + Express**: Core server framework.
- **MongoDB + Mongoose (v9.x)**: Database tier. Models include `User`, `MenuItem`, `TimeSlot`, and `Order`.
- **Socket.io**: Real-time bidirectional events for live queue updates.
- **Firebase Admin SDK**: Auth middleware (token verification) and push notifications via FCM.
- **Swagger (OpenAPI 3.0)**: Automatic API documentation.
- **Multer**: Handling multipart/form-data for image uploads.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Atlas or local)
- Firebase project with `serviceAccountKey.json` placed in `/backend`

### Installation

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Ensure you have a `.env` file in the root of the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smart-canteen
FIREBASE_AUTH_DISABLED=false   # Set to true to bypass Firebase auth in local dev
```

### Running the Server
```bash
node server.js
```
The server will start on `http://localhost:5000`.

### Testing Real-Time Sockets
In a separate terminal, run the included socket test client:
```bash
node testsocket.js
```
This connects to the Socket.io server and prints live `orderCreated` / `orderUpdated` events to the console.

---

## API Documentation (Swagger)

Interactive Swagger UI (explore and test all endpoints in browser):

**👉** `http://localhost:5000/api/v1/api-docs/`

---

## API Reference

> Routes marked 🔒 require a Firebase ID token in the `Authorization: Bearer <token>` header.

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | 🔒 | Get all users. Supports optional `?role=student\|admin` filter |
| GET | `/api/users/:userId` | 🔒 | Get a single user by ID |
| POST | `/api/users` | 🔒 | Create a new user (`name`, `rollNumber`, optional `role`) |
| DELETE | `/api/users/:userId` | 🔒 | Delete a user by ID |
| PATCH | `/api/users/:userId/fcm-token` | — | Update FCM push notification token (called by the mobile app) |

---

### Menu

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/menu` | — | Get all menu items. Supports optional `?veg=true` or `?veg=false` filter |
| POST | `/api/menu` | 🔒 | Create a new menu item (multipart/form-data with optional image upload) |
| PUT | `/api/menu/:id` | 🔒 | Update a menu item by ID |
| DELETE | `/api/menu/:id` | 🔒 | Delete a menu item by ID |

**Menu Item Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Name of the dish |
| `description` | String | Short description of the dish |
| `price` | Number | Price in ₹ |
| `prepTime` | Number | Estimated preparation time (minutes) |
| `isVeg` | Boolean | `true` = vegetarian, `false` = non-vegetarian |
| `avgDemand` | Number | Average daily demand (used for analytics) |
| `image` | String/File | URL or uploaded file path |

---

### Time Slots

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/slots` | — | Get all time slots. Supports optional `?date=YYYY-MM-DD` filter |
| POST | `/api/slots` | 🔒 | Create a new time slot |
| PUT | `/api/slots/:id` | 🔒 | Update a time slot by ID |
| DELETE | `/api/slots/:id` | 🔒 | Delete a time slot by ID |
| POST | `/api/slots/check` | — | Check capacity for a specific slot |
| POST | `/api/slots/suggest` | — | Get suggested available slots |

---

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders/queue` | — | **Real-time queue** — all active orders (pending/preparing/ready) with item details, veg badges, descriptions, and estimated ready times |
| GET | `/api/orders` | 🔒 | Get all orders (last 20, sorted by newest) |
| GET | `/api/orders/active?userId=<id>` | — | Get active orders for a specific user |
| POST | `/api/orders` | 🔒 | Place a new order |
| GET | `/api/orders/:id/status` | — | Get status and estimated ready time for an order |
| PATCH | `/api/orders/:id/status` | 🔒 | Update order status (`pending→preparing→ready→collected`) |
| PUT | `/api/orders/:id/status` | 🔒 | Same as PATCH (alias for admin dashboard) |

**Queue Response Shape (`GET /api/orders/queue`):**
```json
{
  "total": 2,
  "queue": [
    {
      "queuePosition": 1,
      "id": "...",
      "status": "preparing",
      "slot": { "startTime": "12:00", "endTime": "12:30" },
      "items": [
        {
          "name": "Dal Tadka",
          "description": "Classic slow-cooked lentil dish with tempering",
          "isVeg": true,
          "image": "/uploads/dal.jpg",
          "price": 60,
          "prepTime": 10,
          "quantity": 2
        }
      ],
      "timestamp": "2026-03-28T06:00:00.000Z",
      "estimatedReady": "2026-03-28T06:10:00.000Z"
    }
  ]
}
```

---

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/summary` | — | Summary stats for admin dashboard |
| GET | `/api/dashboard/stats` | — | Alias for `/api/summary` |
| GET | `/api/prediction` | — | Demand prediction data |
| GET | `/api/analytics` | — | Food waste analytics |

---

## Real-Time Events (Socket.io)

Connect to `ws://localhost:5000` using `socket.io-client`.

| Event (Server → Client) | Payload | Description |
|--------------------------|---------|-------------|
| `orderCreated` | `{ id, items, slot, status, timestamp }` | Emitted when a new order is placed |
| `orderUpdated` | `{ id, items, slot, status, timestamp }` | Emitted when an order's status changes |

| Event (Client → Server) | Payload | Description |
|--------------------------|---------|-------------|
| `test-ping` | `{ message, timestamp }` | Test event to verify connection |

**Auth handshake** (optional): Pass `{ auth: { token: '<firebaseIdToken>' } }` when connecting to include an identity token. The server logs whether a token was provided.

---

## Directory Structure

```
backend/
├── controllers/        # Route handlers (menu, orders, slots, users, analytics)
├── middleware/
│   └── auth.middleware.js  # Firebase token verification middleware
├── models/             # Mongoose schemas (MenuItem, Order, TimeSlot, User)
├── routes/
│   └── index.js        # All routes + Swagger JSDoc annotations
├── uploads/            # Locally stored menu item images
├── utils/              # notificationService.js (FCM push notifications)
├── testsocket.js       # Socket.io test client for real-time queue testing
├── serviceAccountKey.json  # Firebase Admin credentials (not committed)
├── .env                # Environment variables (not committed)
└── server.js           # App entry point, Socket.io init, Swagger config
```
