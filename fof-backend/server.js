const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('./middleware/cookieParser');

const app = express();

const timestamp = () => new Date().toISOString();
const log = (...args) => console.log(`[${timestamp()}]`, ...args);
const logError = (...args) => console.error(`[${timestamp()}]`, ...args);

log('🚀 server.js loaded');

// Body Parsing Middleware (Always before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cloudinary = require("./config/cloudinary");
const uploadRoutes = require('./routes/upload');
const dropRoutes = require('./routes/dropRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const contactRoutes = require('./routes/contactRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const errorHandler = require('./middleware/errorHandler');

let pool;
try {
  log('⚙️ Loading db/connection module');
  pool = require('./db/connection');
  log('✅ db/connection module loaded successfully');
} catch (err) {
  logError('❌ Failed loading db/connection module:', err.message);
  logError(err.stack);
  pool = {
    query: async () => { throw new Error('DB connection module unavailable'); },
    getConnection: async () => { throw new Error('DB connection module unavailable'); }
  };
}

const { initializeDatabase } = require('./db/init');

const { protect, verifyAdmin } = require('./middleware/authMiddleware');
const checkStoreMode = require('./middleware/storeModeMiddleware');
const orderController = require('./controllers/orderController');

const storeConfigController = require('./controllers/storeConfigController');
const reservationController = require('./controllers/reservationController');

process.on('uncaughtException', (err) => {
  logError('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  log('⚙️ Database initialization starting');
  try {
    await initializeDatabase();
    log('✅ Database initialization complete');
  } catch (err) {
    logError('❌ Database initialization failed:', err);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));

// Body parsed earlier

app.use(cookieParser);

app.use((req, res, next) => {
  if (req.path.includes('/messages') || req.path.includes('/contact')) {
    console.log(`📩 INCOMING: ${req.method} ${req.path}`);
    console.log('Headers:', req.headers['content-type']);
  }
  next();
});
app.use(checkStoreMode);

app.get('/health', (req, res) => {
  console.log('⚙️ GET /health');
  res.json({ status: 'ok' });
});

// Public Routes (No auth required)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/drops', dropRoutes);
app.get('/api/store-config', storeConfigController.getStoreConfig);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/reservations', reservationRoutes);


app.post('/api/contact', async (req, res) => {
  console.log('Incoming Message:', req.body);
  const { name, email, subject, message } = req.body;

  try {
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    res.status(200).json({ success: true, message: 'Message received!' });
    console.log('✅ Message saved to database successfully.');
  } catch (error) {
    console.error('❌ Database Error:', error);
    res.status(500).json({ success: false, error: 'Database save failed' });
  }
});

// Protected User Routes (Require valid login)
app.use('/api/orders', protect, orderRoutes);
app.use('/api/upload', protect, uploadRoutes);

// Admin Routes (Isolated with verifyAdmin internally)
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// 404 handler - returns JSON instead of HTML
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found', path: req.path });
});

app.use(errorHandler);

// Use PORT from environment (Railway, Heroku, etc.)
const PORT = process.env.PORT || 5000;

console.log("ENV CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ?? "(missing)");
console.log("ENV CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("ENV CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

function listen() {
  app.listen(PORT, '0.0.0.0', () => {
    log(`✅ API listening on host 0.0.0.0 port ${PORT}`);
  });
}

startServer().then(listen).catch(err => {
  logError('❌ Server startup failed:', err);
});
