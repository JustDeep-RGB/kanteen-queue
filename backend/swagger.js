/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Shop:
 *       type: object
 *       required: [name, latitude, longitude]
 *       properties:
 *         name:
 *           type: string
 *           example: Campus Cafe
 *         ownerName:
 *           type: string
 *           example: Rajan Sharma
 *         latitude:
 *           type: number
 *           example: 28.6139
 *         longitude:
 *           type: number
 *           example: 77.2090
 *         address:
 *           type: string
 *           example: Block A, Main Campus
 *         avgPrice:
 *           type: number
 *           example: 80
 *         seatingAvailable:
 *           type: boolean
 *           default: false
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           default: 4.0
 *         currentQueue:
 *           type: number
 *           default: 0
 *           readOnly: true
 *           description: Managed automatically via order lifecycle
 *         isActive:
 *           type: boolean
 *           default: true
 *         openingTime:
 *           type: string
 *           example: "08:00"
 *           description: Shop opening time (HH:MM, IST)
 *         closingTime:
 *           type: string
 *           example: "22:00"
 *           description: Shop closing time (HH:MM, IST)
 *         isOpen:
 *           type: boolean
 *           default: true
 *           description: Manual override to force shop closed
 *         isCurrentlyOpen:
 *           type: boolean
 *           readOnly: true
 *           description: Computed virtual based on opening hours and manual override
 *     ShopMapView:
 *       type: object
 *       description: Map-ready projection returned by GET /api/shops
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         address:
 *           type: string
 *         avgPrice:
 *           type: number
 *         seatingAvailable:
 *           type: boolean
 *         rating:
 *           type: number
 *         currentQueue:
 *           type: number
 *         queueLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           description: "low = 0–4 orders, medium = 5–9, high = 10+"
 *         openingTime:
 *           type: string
 *         closingTime:
 *           type: string
 *         isOpen:
 *           type: boolean
 *         isCurrentlyOpen:
 *           type: boolean
 *     User:
 *       type: object
 *       required: [name, rollNumber]
 *       properties:
 *         name:
 *           type: string
 *         rollNumber:
 *           type: string
 *         role:
 *           type: string
 *           enum: [student, admin]
 *           default: student
 *         fcmToken:
 *           type: string
 *     MenuItem:
 *       type: object
 *       required: [name, price, prepTime]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         prepTime:
 *           type: number
 *         isVeg:
 *           type: boolean
 *           default: true
 *           description: true = vegetarian, false = non-vegetarian
 *         avgDemand:
 *           type: number
 *         image:
 *           type: string
 *           format: binary
 *     TimeSlot:
 *       type: object
 *       required: [date, startTime, endTime, maxCapacity]
 *       properties:
 *         date:
 *           type: string
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         maxCapacity:
 *           type: number
 *         currentOrders:
 *           type: number
 *         status:
 *           type: string
 *           enum: [open, full, closed]
 *     Order:
 *       type: object
 *       required: [userId, items, slotId]
 *       properties:
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               menuItem:
 *                 type: string
 *               quantity:
 *                 type: number
 *         slotId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, preparing, ready, collected]
 */

// ─── Users ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, admin]
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Roll number already exists
 */

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/{userId}/fcm-token:
 *   patch:
 *     summary: Update FCM token (called by mobile app — no auth required)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated
 */

// ─── Menu ──────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get all menu items (public)
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: veg
 *         schema:
 *           type: boolean
 *         description: Filter by veg (true) or non-veg (false)
 *     responses:
 *       200:
 *         description: List of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 *   post:
 *     summary: Create a menu item
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       201:
 *         description: Menu item created
 */

/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Update a menu item
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       200:
 *         description: Updated menu item
 *   delete:
 *     summary: Delete a menu item
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item deleted
 */

/**
 * @swagger
 * /api/menu/{id}/image:
 *   delete:
 *     summary: Delete a menu item's image
 *     tags: [Menu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Item not found
 */

// ─── Slots ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/slots:
 *   get:
 *     summary: Get all time slots (public)
 *     tags: [Slots]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Filter by date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of time slots
 *   post:
 *     summary: Create a new time slot
 *     tags: [Slots]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimeSlot'
 *     responses:
 *       201:
 *         description: Slot created
 */

/**
 * @swagger
 * /api/slots/{id}:
 *   put:
 *     summary: Update a time slot (capacity / times / label)
 *     tags: [Slots]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxCapacity:
 *                 type: number
 *                 description: New max capacity (cannot be less than currentOrders)
 *               status:
 *                 type: string
 *                 enum: [open, closed, full]
 *                 description: Manually override slot status
 *     responses:
 *       200:
 *         description: Slot updated
 *       400:
 *         description: Cannot reduce capacity below current orders
 *       404:
 *         description: Slot not found
 *   delete:
 *     summary: Delete a time slot (cascade-deletes all its orders)
 *     tags: [Slots]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot and its orders deleted
 *       404:
 *         description: Slot not found
 */

/**
 * @swagger
 * /api/slots/{id}/status:
 *   patch:
 *     summary: Toggle slot open / closed (lightweight availability switch)
 *     description: |
 *       Only touches the `status` field. Use this instead of PUT when you just
 *       want to open or close a slot without changing capacity or times.
 *       - Passing `open` on a full slot (currentOrders >= maxCapacity) will
 *         result in `full` being stored instead.
 *       - A `closed` slot will never be auto-reopened by the capacity hook.
 *     tags: [Slots]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, closed]
 *                 example: closed
 *     responses:
 *       200:
 *         description: Updated slot object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeSlot'
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Slot not found
 */

/**
 * @swagger
 * /api/slots/check:
 *   post:
 *     summary: Check slot capacity (public)
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotId:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Capacity status
 */

/**
 * @swagger
 * /api/slots/suggest:
 *   post:
 *     summary: Suggest available slots (public)
 *     tags: [Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredSlotId:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Slot suggestions
 */

// ─── Orders ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/queue:
 *   get:
 *     summary: Real-time active queue — all pending/preparing/ready orders (public)
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Queue with item details (veg flag, description, estimatedReady)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 queue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       queuePosition:
 *                         type: number
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, preparing, ready]
 *                       slot:
 *                         type: object
 *                       items:
 *                         type: array
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       estimatedReady:
 *                         type: string
 *                         format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (last 20, newest first)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of orders
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 *       409:
 *         description: Slot at capacity
 */

/**
 * @swagger
 * /api/orders/active:
 *   get:
 *     summary: Get active orders for a user (public)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active orders for the user
 */

/**
 * @swagger
 * /api/orders/{id}/status:
 *   get:
 *     summary: Get order status and estimated ready time (public)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status
 *       404:
 *         description: Order not found
 *   patch:
 *     summary: Update order status (pending → preparing → ready → collected)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, ready, collected]
 *                 example: preparing
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order by ID
 *     description: |
 *       Permanently deletes an order and decrements the slot's `currentOrders`
 *       counter. If the slot was `full` and now has capacity, it is
 *       automatically restored to `open`.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       404:
 *         description: Order not found
 */

// ─── Analytics ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Get admin dashboard summary stats
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Summary stats
 */

/**
 * @swagger
 * /api/prediction:
 *   get:
 *     summary: Get demand predictions
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Demand predictions
 */

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get food waste analytics
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Waste analytics
 */

// ─── Shops (Cafes) ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Get all active cafes — map-ready (public)
 *     tags: [Shops]
 *     description: >
 *       Returns all active cafes with map coordinates and a computed `queueLevel`
 *       label (`low` / `medium` / `high`). Pass optional `lat`, `lng`, and `radius`
 *       for proximity filtering (bounding-box, no index needed).
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude of the user's position
 *         example: 28.6139
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude of the user's position
 *         example: 77.2090
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometres (default 10 km)
 *     responses:
 *       200:
 *         description: List of active cafes sorted by rating
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShopMapView'
 *             example:
 *               - id: "664f1a2b3c4d5e6f78901234"
 *                 name: Campus Cafe
 *                 latitude: 28.6139
 *                 longitude: 77.2090
 *                 address: Block A, Main Campus
 *                 avgPrice: 80
 *                 seatingAvailable: true
 *                 rating: 4.2
 *                 currentQueue: 11
 *                 queueLevel: high
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new cafe (admin only)
 *     tags: [Shops]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shop'
 *           example:
 *             name: Campus Cafe
 *             ownerName: Rajan Sharma
 *             latitude: 28.6139
 *             longitude: 77.2090
 *             address: Block A, Main Campus
 *             avgPrice: 80
 *             seatingAvailable: true
 *             rating: 4.2
 *     responses:
 *       201:
 *         description: Cafe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shop'
 *       400:
 *         description: Validation error (missing required fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Get a cafe by ID (public)
 *     tags: [Shops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the shop
 *         example: 664f1a2b3c4d5e6f78901234
 *     responses:
 *       200:
 *         description: Full cafe document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shop'
 *       400:
 *         description: Invalid shop ID format
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update a cafe's details (admin only)
 *     tags: [Shops]
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Updates any writable field on the shop document.
 *       `currentQueue` is **not** patchable via this endpoint — it is managed
 *       automatically by the order lifecycle (create → collected).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f1a2b3c4d5e6f78901234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               address:
 *                 type: string
 *               avgPrice:
 *                 type: number
 *               seatingAvailable:
 *                 type: boolean
 *               rating:
 *                 type: number
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *           example:
 *             name: Central Canteen
 *             avgPrice: 75
 *             seatingAvailable: true
 *             isActive: true
 *     responses:
 *       200:
 *         description: Updated cafe document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shop'
 *       400:
 *         description: Validation error or invalid ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a cafe permanently (admin only)
 *     tags: [Shops]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f1a2b3c4d5e6f78901234
 *     responses:
 *       200:
 *         description: Shop deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Shop deleted successfully
 *       400:
 *         description: Invalid shop ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Internal server error
 *
 * /api/shops/{id}/status:
 *   patch:
 *     summary: Toggle cafe status or update hours (admin only)
 *     tags: [Shops]
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Dedicated endpoint for managing a cafe's availability.
 *       Update `isOpen` to force-close or re-open, and `openingTime`/`closingTime`
 *       to adjust scheduled hours.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f1a2b3c4d5e6f78901234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isOpen:
 *                 type: boolean
 *               openingTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               closingTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           example:
 *             isOpen: false
 *             openingTime: "08:30"
 *             closingTime: "21:30"
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 isOpen:
 *                   type: boolean
 *                 openingTime:
 *                   type: string
 *                 closingTime:
 *                   type: string
 *                 isCurrentlyOpen:
 *                   type: boolean
 *       400:
 *         description: Validation error or invalid ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Internal server error
 */
