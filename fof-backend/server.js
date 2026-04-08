// server.js
require('dotenv').config(); // Must be first

const express = require('express');
const cors = require('cors');
const cookieParser = require('./middleware/cookieParser');
const { protect } = require('./middleware/authMiddleware');
const checkStoreMode = require('./middleware/storeModeMiddleware');
const errorHandler = require('./middleware/errorHandler');

const {pool} = require('./db/connection');
const { initializeDatabase } = require('./db/init');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const dropRoutes = require('./routes/dropRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/adminRoutes');
const storeConfigController = require('./controllers/storeConfigController');

const app = express();
const timestamp = () => new Date().toISOString();
const log = (...args) => console.log(`[${timestamp()}]`, ...args);
const logError = (...args) => console.error(`[${timestamp()}]`, ...args);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_PORTAL_URL,
  'https://faith-over-fear-7euupaew0-manzi5404s-projects.vercel.app',
  'https://faith-over-fear-production.up.railway.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

log('🚀 server.js loaded');

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(cookieParser);
app.use(checkStoreMode);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/drops', dropRoutes);
app.get('/api/store-config', storeConfigController.getStoreConfig);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/reservations', reservationRoutes);

// Contact message route
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    res.status(200).json({ success: true, message: 'Message received!' });
    log('✅ Message saved');
  } catch (error) {
    logError('❌ Database Error:', error);
    res.status(500).json({ success: false, error: 'Database save failed' });
  }
});

// Protected Routes
app.use('/api/orders', protect, orderRoutes);
app.use('/api/upload', protect, uploadRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, error: 'Not Found', path: req.path }));

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await initializeDatabase();
    log('✅ Database initialized');
    app.listen(PORT, '0.0.0.0', () => log(`✅ API listening on 0.0.0.0:${PORT}`));
  } catch (err) {
    logError('❌ Server startup failed:', err);
  }
}

startServer();
