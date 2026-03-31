// server.js (ES Module version)
import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";

import dropRoutes from "./src/routes/dropRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import announcementRoutes from "./src/routes/announcementRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import adminAuthRoutes from "./src/routes/adminAuthRoutes.js";
import errorHandler from "./src/middleware/errorHandler.js";

const app = express();

// Configure CORS
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

// JSON parsing
app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API routes
app.use("/api/drops", dropRoutes);
app.use("/api/products", productRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminAuthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Custom error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3000; // Railway provides PORT
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1); // Ensure Railway knows the server failed
  }
};

startServer();