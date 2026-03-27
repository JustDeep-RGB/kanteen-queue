const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// ─── Firebase Admin Initialization ───────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (admin.apps.length === 0) {
  if (fs.existsSync(serviceAccountPath)) {
    console.log('[Firebase Admin] Initializing with local serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
  } else {
    try {
      console.log('[Firebase Admin] Initializing with application default credentials');
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    } catch (err) {
      console.warn('[Firebase Admin] Initialization failed:', err.message);
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
console.log('FIREBASE_AUTH_DISABLED:', process.env.FIREBASE_AUTH_DISABLED);
const express = require('express');

const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes'); // Moved down after Firebase init!

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Export io so controllers can emit events
module.exports.io = io;

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Canteen API',
      version: '1.0.0',
      description: 'API documentation for the Smart Canteen Queue Management System',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

console.log("MONGO URI:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err.message));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart Canteen Backend running on port ${PORT}`);
});
