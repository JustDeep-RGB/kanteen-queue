# Smart Canteen Backend

Node.js/Express backend for the **Smart Canteen Queue Management System** — manages multi-shop cafes, menus, time slots, real-time order queues, users, and admin analytics.

## Features

- **Shop Approval Workflow** — Moderation system where cafe owners submit requests and admins approve them before they go live.
- **Multi-Shop (Cafe) System** — Support for multiple vendors with individual queue tracking (`low` | `medium` | `high`) and location data.
- **Proximity Search** — Find cafes near a specific location using latitude/longitude and radius filters.
- **Menu Management** — CRUD with veg/non-veg classification, shop association, and availability toggles.
- **Time Slot Booking** — Tracks `currentOrders` vs `maxCapacity`, auto-suggests alternatives when slots fill up.
- **Real-Time Queue** — Live order state via real-time database updates.
- **Order Tracking** — Lifecycle: `pending → preparing → ready → collected`.
- **Firebase Auth** — Token verification middleware protecting admin, shop owner, and customer routes.
- **Swagger UI** — Interactive API docs with a dev-key bypass for local testing.
- **Analytics** — Dashboard stats and demand predictions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + Express 5 |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime |
| Auth | Firebase Admin SDK |
| File uploads | Multer + Supabase Storage |
| API docs | Swagger UI (OpenAPI 3.0) |
| Hosting | DigitalOcean App Platform |

---

## Getting Started (Local)

### Prerequisites
- Node.js v18+
- Supabase Project (URL & Service Key)
- Firebase project → download `serviceAccountKey.json` and place it in `/backend`

### Installation

```bash
cd backend
npm install
node server.js
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
PORT=5000

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Firebase (FCM push — NOT used for auth)
# Either set this env var OR place serviceAccountKey.json in /backend
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Auth
AUTH_DISABLED=false
SWAGGER_DEV_KEY=swagger-local-dev-2024

# JWT
JWT_SECRET=your-random-64-byte-hex
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="Smart Canteen <your_email@gmail.com>"

# After Google login, redirect user to:
CLIENT_URL=

# Public URL for Swagger production server (set after DO deploy)
PUBLIC_URL=
```

---

## 🚀 Deploy to DigitalOcean App Platform

### Method 1 — Dashboard (easiest)

1. Push repo to GitHub (make sure `.env` and `serviceAccountKey.json` are in `.gitignore` ✅)
2. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) → **Create App**
3. Connect your GitHub repo, select branch `main`
4. DO will auto-detect Node.js. Set:
   - **Source directory:** `/backend`
   - **Build command:** `npm install`
   - **Run command:** `node server.js`
   - **HTTP port:** `5000`
5. In **Environment Variables**, add all secrets from your `.env` (copy values one-by-one — DO encrypts `SECRET` type at rest)
6. **FIREBASE_SERVICE_ACCOUNT** — paste the full JSON string (the one-liner from your `.env`)
7. Set **Instance size** to `Basic XXS ($5/mo)` for starters
8. Click **Deploy**
9. After deploy, copy your app URL (e.g. `https://kanteen-queue-xxxxx.ondigitalocean.app`)
10. Go back to **Settings → Environment Variables** and set:
    - `PUBLIC_URL` = your DO app URL
    - `GOOGLE_CALLBACK_URL` = `https://your-app-url/api/auth/google/callback`
11. Also add this callback URL to **Google Cloud Console → OAuth 2.0 Credentials → Authorized redirect URIs**

### Method 2 — doctl CLI

```bash
# Install doctl
brew install doctl        # macOS
# or: snap install doctl  # Linux

# Auth
doctl auth init

# Deploy using .do/app.yaml spec
doctl apps create --spec .do/app.yaml

# After first deploy, get your app ID and update env vars:
doctl apps list
doctl apps update <APP_ID> --spec .do/app.yaml
```

### Health Check

DO pings `GET /api/health` to verify the service is up. It returns:
```json
{ "status": "ok" }
```

---

## API Reference

### Shop Requests (Moderation)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shop-requests` | 🔒 Admin | List pending shop registration requests |
| POST | `/api/shop-requests` | 🔒 Owner | Submit a new shop registration request |
| POST | `/api/shop-requests/:id/approve` | 🔒 Admin | Approve request (creates shop entry) |
| POST | `/api/shop-requests/:id/reject` | 🔒 Admin | Reject request |

### Shops (Cafes)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shops` | — | Get active shops. Query: `?lat=&lng=&radius=` (km) |
| GET | `/api/shops/:id` | — | Get a single shop details |
| POST | `/api/shops` | 🔒 | Create a new shop |
| PATCH | `/api/shops/:id` | 🔒 | Update shop details |
| DELETE | `/api/shops/:id` | 🔒 | Delete a shop |

### Menu
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/menu` | — | Get all items. Filter: `?veg=true\|false` or `?shopId=` |
| POST | `/api/menu` | 🔒 | Create item (`multipart/form-data`) |
| PUT | `/api/menu/:id` | 🔒 | Update item |
| DELETE | `/api/menu/:id` | 🔒 | Delete item |

### Time Slots
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/slots` | — | Get all slots. Filter: `?date=YYYY-MM-DD` |
| POST | `/api/slots` | 🔒 | Create a slot |
| PATCH | `/api/slots/:id/status` | 🔒 | Toggle `open`/`closed` status |
| DELETE | `/api/slots/:id` | 🔒 | Delete slot |

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
│   ├── shop.controller.js     # Proximity logic + queue tracking
│   ├── order.controller.js    # manages order lifecycle
│   ├── menu.controller.js     # CRUD for menu items
│   ├── slot.controller.js     # bookings & capacity
│   └── ...
├── models/
│   ├── Shop.js                # Cafe metadata & GPS coords
│   ├── MenuItem.js            # associated with shopId
│   ├── Order.js               # tracks shopId + statusHistory
│   └── ...
├── routes/
│   ├── index.js               # main router
│   ├── shop.routes.js         # cafe-specific routes
│   └── shopRequest.routes.js  # approval workflow routes
├── uploads/                   # menu images (local only — use Supabase Storage in prod)
├── utils/                     # notifications & helpers
└── server.js                  # entry point
```

---

## Swagger UI
**Local:** `http://localhost:5000/api/v1/api-docs/`  
**Production:** `https://your-do-app-url/api/v1/api-docs/`  
Use `SWAGGER_DEV_KEY` for testing without Firebase tokens.
