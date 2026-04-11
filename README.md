# Smart Canteen Backend

Node.js/Express backend for the **Smart Canteen Queue Management System** — manages multi-shop cafes, menus, time slots, real-time order queues, users, and admin analytics.

## Features

- **Multi-Shop (Cafe) System** [NEW] — Support for multiple vendors with individual queue tracking (`low` | `medium` | `high`) and location data.
- **Proximity Search** [NEW] — Find cafes near a specific location using latitude/longitude and radius filters.
- **Menu Management** — CRUD with veg/non-veg classification, shop association, and availability toggles.
- **Time Slot Booking** — Tracks `currentOrders` vs `maxCapacity`, auto-suggests alternatives when slots fill up.
- **Real-Time Queue** — Live order state via Socket.io (`orderCreated`, `orderUpdated` events).
- **Order Tracking** — Lifecycle: `pending → preparing → ready → collected` with automatic cafe queue updates.
- **Push Notifications** — Firebase Cloud Messaging (FCM) for order-ready & slot-fill alerts.
- **Firebase Auth** — Token verification middleware protecting admin & user routes.
- **Swagger UI** — Interactive API docs with a dev-key bypass for local testing.
- **Analytics** — Dashboard stats, demand predictions, and food waste analytics.

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

---

## API Reference

### Shops (Cafes)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shops` | — | Get active shops. Query: `?lat=&lng=&radius=` (km) |
| GET | `/api/shops/:id` | — | Get a single shop details |
| POST | `/api/shops` | 🔒 | Create a new shop |
| PATCH | `/api/shops/:id` | 🔒 | Update shop details |
| DELETE | `/api/shops/:id` | 🔒 | Delete a shop |

**Shop Object Snippet:**
```json
{
  "name": "Central Canteen",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "queueLevel": "low",
  "seatingAvailable": true,
  "rating": 4.5
}
```

---

### Menu
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/menu` | — | Get all items. Filter: `?veg=true\|false` or `?shopId=` |
| POST | `/api/menu` | 🔒 | Create item (`multipart/form-data`) |
| PUT | `/api/menu/:id` | 🔒 | Update item |
| DELETE | `/api/menu/:id` | 🔒 | Delete item |

**MenuItem fields:** `name`, `price`, `prepTime`, `isVeg`, `isAvailable`, `shopId`, `image`.

---

### Time Slots 
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/slots` | — | Get all slots. Filter: `?date=YYYY-MM-DD` |
| POST | `/api/slots` | 🔒 | Create a slot |
| PATCH | `/api/slots/:id/status` | 🔒 | Toggle `open`/`closed` status |
| DELETE | `/api/slots/:id` | 🔒 | Delete slot |

---

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders/queue` | — | **Real-time queue** — filterable by shop |
| POST | `/api/orders` | 🔒 | Place order (updates shop `currentQueue`) |
| PATCH | `/api/orders/:id/status` | 🔒 | Transition: `pending` → `preparing` → `ready` → `collected` |

---

## Directory Structure

```
backend/
├── controllers/
│   ├── shop.controller.js     # [NEW] Proximity logic + queue tracking
│   ├── order.controller.js    # manages order lifecycle
│   ├── menu.controller.js     # CRUD for menu items
│   ├── slot.controller.js     # bookings & capacity
│   └── ...
├── models/
│   ├── Shop.js                # [NEW] Cafe metadata & GPS coords
│   ├── MenuItem.js            # associated with shopId
│   ├── Order.js               # tracks shopId + statusHistory
│   └── ...
├── routes/
│   ├── index.js               # main router
│   └── shop.routes.js         # cafe-specific routes
├── uploads/                   # menu images
├── utils/                     # notifications & helpers
└── server.js                  # entry point
```

---

## Swagger UI
**URL:** `http://localhost:5000/api/v1/api-docs/`
Use `SWAGGER_DEV_KEY` for local testing without Firebase tokens.
