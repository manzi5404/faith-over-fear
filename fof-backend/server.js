const path = require('path'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('./middleware/cookieParser');

const app = express();

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
const pool = require('./db/connection');
const { initializeDatabase } = require('./db/init');

// Initialize database tables before the app logic starts
initializeDatabase()
  .then(() => console.log('🚀 Database ready.'))
  .catch(err => {
    console.error('💥 Database initialization failed. Some features may be broken:', err.message);
  });

const { protect, verifyAdmin } = require('./middleware/authMiddleware');
const checkStoreMode = require('./middleware/storeModeMiddleware');
const orderController = require('./controllers/orderController');

const storeConfigController = require('./controllers/storeConfigController');
const reservationController = require('./controllers/reservationController');


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


// Public Routes (No auth required)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/drops', dropRoutes);
app.get('/api/store-config', storeConfigController.getStoreConfig);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/reservations', reservationRoutes);

// ─────────────────────────────────────────────────────────────
// TEMPORARY MIGRATION ENDPOINT — DELETE AFTER USE
// Trigger: GET /api/migrate?secret=FOF_MIGRATE_2026
// Example: https://your-railway-app.railway.app/api/migrate?secret=FOF_MIGRATE_2026
// ─────────────────────────────────────────────────────────────
app.get('/api/migrate', async (req, res) => {
  const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'FOF_MIGRATE_2026';
  if (req.query.secret !== MIGRATION_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden — invalid secret token.' });
  }
  try {
    const { runMigration } = require('./migrate');
    const success = await runMigration();
    if (success) {
      return res.json({
        success: true,
        message: '✅ Migration complete! All 12 tables created. Delete this endpoint from server.js now.'
      });
    } else {
      return res.status(500).json({ success: false, error: 'Migration failed — check Railway logs.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API listening on port ${PORT}`);
});
