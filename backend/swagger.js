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
 *     summary: Update a time slot
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
 *         description: Slot updated
 *   delete:
 *     summary: Delete a time slot
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
 *         description: Slot deleted
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
 *   patch:
 *     summary: Update order status (pending→preparing→ready→collected)
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, ready, collected]
 *     responses:
 *       200:
 *         description: Order status updated
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
 */
