import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import morgan from "morgan";
import helmet from "helmet";

import connectDB from "./config/connectDB.js";
import { fixUserIndexes } from "./utils/fixIndexes.js";
import { setupOrderCleanup } from "./utils/orderCleanup.js";

// ROUTES
import userRouter from "./route/user.route.js";
import categoryRouter from "./route/category.route.js";
import uploadRouter from "./route/upload.router.js";
import subCategoryRouter from "./route/subCategory.route.js";
import productRouter from "./route/product.route.js";
import cartRouter from "./route/cart.route.js";
import addressRouter from "./route/address.route.js";
import orderRouter from "./route/order.route.js";
import notificationRouter from "./route/notification.route.js";
import attendanceRouter from "./route/attendance.routes.js";

const app = express();
const server = http.createServer(app);

/* ======================================================
   🔥 IMPORTANT CONSTANTS
====================================================== */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 8080;

/* ======================================================
   🔥 SOCKET.IO
====================================================== */
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ======================================================
   🔥 MIDDLEWARE (ORDER IS VERY IMPORTANT)
====================================================== */

// 1️⃣ CORS — EXACT ORIGIN + credentials
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// 2️⃣ BODY PARSER
app.use(express.json());

// 3️⃣ COOKIE PARSER (🔥 MUST FOR AUTH)
app.use(cookieParser());

// 4️⃣ LOGGER
app.use(morgan("dev"));

// 5️⃣ HELMET — COOKIE SAFE CONFIG
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ======================================================
   🔥 HEALTH CHECK
====================================================== */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: `Server running on port ${PORT}`,
  });
});

/* ======================================================
   🔥 ROUTES
====================================================== */
app.use("/api/user", userRouter);
app.use("/api/category", categoryRouter);
app.use("/api/file", uploadRouter);
app.use("/api/subcategory", subCategoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/attendance", attendanceRouter);

/* ======================================================
   🔥 DATABASE + SERVER START
====================================================== */
(async () => {
  try {
    await connectDB();
    await fixUserIndexes();

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      setupOrderCleanup();
    });
  } catch (error) {
    console.error("❌ Server startup error:", error.message);
  }
})();
