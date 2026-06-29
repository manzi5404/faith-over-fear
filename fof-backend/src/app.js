const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { requireAuth } = require('./middleware/auth');
const { requireAdmin } = require('./middleware/admin');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const dropRoutes = require('./routes/drop.routes');
const dropAdminRoutes = require('./routes/drop.admin.routes');
const productRoutes = require('./routes/product.routes');
const productAdminRoutes = require('./routes/product.admin.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const orderAdminRoutes = require('./routes/order.admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const waitlistRoutes = require('./routes/waitlist.routes');

const app = express();

// Security
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = [
  'https://faithoverfearrw.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/drops', dropRoutes);
app.use('/api/products', productRoutes);
app.use('/api/waitlist', waitlistRoutes);

// Admin routes for drops and products
app.use('/api/admin/drops', requireAuth, requireAdmin, dropAdminRoutes);
app.use('/api/admin/products', requireAuth, requireAdmin, productAdminRoutes);

// Authenticated routes
app.use('/api/cart', requireAuth, cartRoutes);
app.use('/api/orders', requireAuth, orderRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);

// Admin-only routes
app.use('/api/admin/orders', requireAuth, requireAdmin, orderAdminRoutes);
app.use('/api/admin/payments', requireAuth, requireAdmin, paymentRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, error: 'Not Found', path: req.path }));

module.exports = { app };
