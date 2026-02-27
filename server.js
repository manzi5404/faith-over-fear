
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const dropRoutes = require("./src/routes/dropRoutes");
const productRoutes = require("./src/routes/productRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const adminAuthRoutes = require("./src/routes/adminAuthRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

const rawOrigins = process.env.CORS_ORIGIN || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/drops", dropRoutes);
app.use("/api/products", productRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminAuthRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
