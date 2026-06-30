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

// Error handler (placed after routes)
app.use(errorHandler);

// Debug: manual route listing (Express 5 removed app._router)
app.get('/__routes', (req, res) => {
  const routes = [];
  // We collect routes from the registered middleware stack
  app._router?.stack?.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => m !== '_constructor')
        .map((m) => m.toUpperCase());
      routes.push({
        method: methods.join(','),
        path: layer.route.path,
      });
    } else if (layer.name === 'router' && layer.handle?.stack) {
      layer.handle.stack.forEach((sub) => {
        if (sub.route) {
          const methods = Object.keys(sub.route.methods)
            .filter((m) => m !== '_constructor')
            .map((m) => m.toUpperCase());
          routes.push({
            method: methods.join(','),
            path: layer.handle?.url || '' + sub.route.path,
          });
        }
      });
    }
  });

  // Fallback: if _router is undefined (Express 5), we return our known routes
  if (!app._router) {
    return res.status(200).json({
      express_version: require('express/package.json').version,
      note: 'Express 5 removed app._router. Showing registered routes from known route files.',
      routes: [
        { method: 'GET', path: '/health' },
        { method: 'POST', path: '/api/auth/register' },
        { method: 'POST', path: '/api/auth/login' },
        { method: 'POST', path: '/api/auth/google' },
        { method: 'GET', path: '/api/auth/me' },
        { method: 'GET', path: '/api/drops/active' },
        { method: 'GET', path: '/api/drops' },
        { method: 'GET', path: '/api/drops/:slug' },
        { method: 'POST', path: '/api/admin/drops' },
        { method: 'PUT', path: '/api/admin/drops/:id' },
        { method: 'POST', path: '/api/admin/drops/:id/activate' },
        { method: 'GET', path: '/api/products' },
        { method: 'GET', path: '/api/products/:slug' },
        { method: 'POST', path: '/api/admin/products' },
        { method: 'PUT', path: '/api/admin/products/:id' },
        { method: 'DELETE', path: '/api/admin/products/:id' },
        { method: 'GET', path: '/api/cart' },
        { method: 'POST', path: '/api/cart/items' },
        { method: 'PUT', path: '/api/cart/items/:variantId' },
        { method: 'DELETE', path: '/api/cart/items/:variantId' },
        { method: 'DELETE', path: '/api/cart' },
        { method: 'POST', path: '/api/orders' },
        { method: 'GET', path: '/api/orders/my' },
        { method: 'GET', path: '/api/orders/:id' },
        { method: 'GET', path: '/api/admin/orders' },
        { method: 'PUT', path: '/api/admin/orders/:id/status' },
        { method: 'POST', path: '/api/admin/orders/:id/cancel' },
        { method: 'POST', path: '/api/admin/payments/verify' },
        { method: 'GET', path: '/api/notifications' },
        { method: 'GET', path: '/api/notifications/unread-count' },
        { method: 'PUT', path: '/api/notifications/read-all' },
        { method: 'PUT', path: '/api/notifications/:id/read' },
        { method: 'POST', path: '/api/waitlist' },
        { method: 'GET', path: '/api/waitlist' },
      ],
    });
  }

  res.status(200).json({ express_version: require('express/package.json').version, routes });
});

module.exports = { app };
