# Smart Canteen Backend

This is the Node.js/Express backend for the **Smart Canteen Queue Management System**. It manages menus, time slots, ordering queues, users, and admin analytics, aiming to streamline cafeteria flows and minimize food waste.

## Features

- **Menu Management**: Full CRUD for canteen menu items, including image uploads via Multer.
- **Queue & Time Slot System**: Users book specific 10-minute time slots to pick up their food. The system tracks `currentOrders` vs `maxCapacity` and auto-closes slots when full. It also suggests alternative open slots if a user's preferred slot is full.
- **Order Tracking**: Order lifecycle management (`pending` -> `preparing` -> `ready` -> `collected`). 
- **Push Notifications**: Integration with Firebase Cloud Messaging (FCM) to notify students when their order is ready for pickup or when their bookmarked slots open up.
- **Data Analytics**: Endpoints tailored for the Admin Dashboard to visualize demand predictions, most popular items, and food waste analytics.
- **Interactive API Documentation**: Swagger UI integrated directly into the backend for easy endpoint testing.

## Tech Stack

- **Node.js + Express**: Core server framework.
- **MongoDB + Mongoose (v9.x)**: Database tier. Models include `User`, `MenuItem`, `TimeSlot`, and `Order`.
- **Swagger (OpenAPI 3.0)**: Automatic API documentation.
- **Multer**: Handling multipart/form-data for image uploads.
- **Firebase Admin SDK**: For sending push notifications.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Atlas or local)

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
Ensure you have a `.env` file in the root of the `backend` directory containing your secrets:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smart-canteen
```

### Running the Server
Start the development server using Node (or Nodemon if installed):
```bash
node server.js
```
The server will start on `http://localhost:5000`.

## API Documentation (Swagger)

All API endpoints are comprehensively documented and interactive! Once the server is running, navigate to the Swagger Hub to explore and test the endpoints directly from your browser:

**👉 Swagger UI:** `http://localhost:5000/api/v1/api-docs/`

### Core Endpoints Overview
*Detailed schemas and interactive testing available in Swagger.*
- `/api/menu` - GET/POST/PUT/DELETE menu items
- `/api/slots` - GET/POST slots, plus `/slots/check` and `/slots/suggest` logic
- `/api/orders` - GET/POST orders and patch order statuses
- `/api/users/:id/fcm-token` - Manage user push notification tokens
- `/api/summary` & `/api/analytics` - Admin dashboard data aggregations

## Directory Structure

- `/controllers` - Logic handlers for each route (menu, orders, slots, users, analytics).
- `/models` - Mongoose database schemas (`MenuItem.js`, `Order.js`, `TimeSlot.js`, `User.js`).
- `/routes` - Express route definitions mapping URLs to controllers (annotated with Swagger JSDoc).
- `/uploads` - Locally stored images for menu items.
- `/utils` - Validation and utility helpers.
- `server.js` - Main application entry point and Swagger configuration.
