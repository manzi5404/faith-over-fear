const express = require('express');
const app = express();
const dropRoutes = require('./routes/dropRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const errorHandler = require('./middleware/errorHandler');

app.use(express.json());

app.use('/api/drops', dropRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementRoutes);

app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
