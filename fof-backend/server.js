require('dotenv').config({ path: __dirname + '/.env' });
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
const { verifyAdmin } = require('./middleware/authMiddleware');


app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin for now, or specify your frontend URLs
    // For cookie support, we MUST specify the origin instead of '*'
    callback(null, true);
  },
  credentials: true
}));
app.use(cookieParser);
app.use(express.json());


app.use('/api', uploadRoutes);
app.use('/api/drops', verifyAdmin, dropRoutes);
app.use('/api/products', verifyAdmin, productRoutes);
app.use('/api/orders', verifyAdmin, orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', verifyAdmin, settingsRoutes);
app.use('/api/announcements', verifyAdmin, announcementRoutes);


app.use(errorHandler);

const PORT = 5000;

console.log("ENV CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ?? "(missing)");
console.log("ENV CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded" : "Missing");
console.log("ENV CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing");

app.listen(PORT, () => {
  console.log(`✅ API listening on http://localhost:${PORT}`);
});
