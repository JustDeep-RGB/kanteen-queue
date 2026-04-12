const path  = require('path');
const fs    = require('fs');
const admin = require('firebase-admin');

// ─── Load environment variables FIRST ─────────────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('SUPABASE_URL:',            process.env.SUPABASE_URL      ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:',process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('FIREBASE_AUTH_DISABLED:',  process.env.FIREBASE_AUTH_DISABLED);
console.log('SWAGGER_DEV_KEY:',         process.env.SWAGGER_DEV_KEY   ? 'SET' : 'NOT SET');

// ─── Firebase Admin (FCM push notifications only — NOT used for auth) ─────────
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (admin.apps.length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      console.log('[Firebase Admin] ✅ Initialized for FCM push (env var)');
    } catch (err) {
      console.warn('[Firebase Admin] ⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
      console.warn('[Firebase Admin]   Push notifications will be mocked.');
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });
    console.log('[Firebase Admin] ✅ Initialized for FCM push (serviceAccountKey.json)');
  } else {
    console.warn('[Firebase Admin] ⚠️ No credentials found — push notifications will be mocked.');
  }
}

const express        = require('express');
const http           = require('http');
const cors           = require('cors');
const swaggerJsdoc   = require('swagger-jsdoc');
const swaggerUi      = require('swagger-ui-express');
const routes         = require('./routes');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Smart Canteen API',
      version:     '1.0.0',
      description: 'API documentation for the Smart Canteen Queue Management System',
    },
    servers: [
      { url: `http://localhost:${PORT}`,                                            description: 'Local Development Server' },
      { url: process.env.PUBLIC_URL || 'https://kanteen-queue-production.up.railway.app', description: 'Production Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, 'swagger.js')],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Static uploads dir (kept for backward compat during transition) ──────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack || err.message);
  if (!res.headersSent) {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Smart Canteen Backend running on port ${PORT}`);
  console.log(`   Swagger: http://localhost:${PORT}/api/v1/api-docs\n`);
});
