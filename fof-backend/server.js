const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('./middleware/cookieParser');

const app = express();

const cloudinary = require("./config/cloudinary");
const uploadRoutes = require('./routes/upload');
const dropRoutes = require('./routes/dropRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const errorHandler = require('./middleware/errorHandler');
const { protect, verifyAdmin } = require('./middleware/authMiddleware');
const checkStoreMode = require('./middleware/storeModeMiddleware');

const storeConfigController = require('./controllers/storeConfigController');
const reservationController = require('./controllers/reservationController');


app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));

// Body Parsing Middleware (Always before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser);
app.use(checkStoreMode); // Global protection for /api/orders


// Public Routes (No auth required)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/drops', dropRoutes);
app.get('/api/store-config', storeConfigController.getStoreConfig);
app.get('/api/announcement', require('./controllers/announcementController').getLatestAnnouncement);
app.post('/api/reserve', reservationController.createReservation);
app.get('/api/reservations/me', protect, reservationController.getReservations);

// Protected User Routes (Require valid login)
app.use('/api/orders', protect, orderRoutes);
app.use('/api/upload', protect, uploadRoutes);

// Admin Only Routes (Require valid login + admin email)
app.use('/api/admin/drops', verifyAdmin, dropRoutes);
app.use('/api/admin/products', verifyAdmin, productRoutes);
app.use('/api/admin/settings', verifyAdmin, settingsRoutes);
app.use('/api/admin/announcement', verifyAdmin, announcementRoutes);
app.use('/api/admin/orders', verifyAdmin, orderRoutes);
app.use('/api/admin/store-config', verifyAdmin, storeConfigController.updateStoreConfig);
app.use('/api/admin/reservations', verifyAdmin, reservationController.getReservations);
app.patch('/api/admin/reservations/:id/status', verifyAdmin, reservationController.updateReservationStatus);
app.use('/api/admin/auth-verify', verifyAdmin, (req, res) => res.json({ success: true, user: req.user }));


app.use(errorHandler);

const PORT = 5000;

console.log("ENV CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ?? "(missing)");
console.log("ENV CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("ENV CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API listening on http://127.0.0.1:${PORT}`);
});
