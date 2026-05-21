require("dotenv").config();
const http    = require("http");
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const { Server } = require("socket.io");

const { connection }           = require("./src/connection/db");
const { farmerRouter }         = require("./src/Farmer/farmerRoutes");
const { AdminRouter }          = require("./src/Admin/adminRoutes");
const { MilkRouter }           = require("./src/Milk/milkRoutes");
const { billingRouter }        = require("./src/Milk/billingRoutes");
const { transporter }          = require("./src/connection/mailConnection");
const rateRouter               = require("./src/Milk/RateSetting/rateSettingRoutes");
const ratesRouter              = require("./src/Milk/RateSetting/rateChartConfigRoutes");
const { paymentRouter }        = require("./src/Payment/paymentRoutes");
const { masterRouter }         = require("./src/MasterAdmin/masterAdmin.routes");
const ticketRouter             = require("./src/Ticket/ticket.routes");
const authMiddleware           = require("./src/middleware/authMiddleware");
const subscriptionGuard        = require("./src/middleware/subscriptionGuard");
const { analyticsRouter }      = require("./src/Analytics/analyticsRoutes");
const { responseInterceptor }  = require("./src/middleware/responseHandler.middleware");
const { generalLimiter, authLimiter } = require("./src/middleware/rateLimiter.middleware");
const sanitizeInput            = require("./src/middleware/sanitize.middleware");
const { initSocketService }    = require("./src/services/socketService");
const { preloadDevanagariFonts } = require("./src/utils/fontManager");

const PORT      = process.env.PORT      || 3030;
const NODE_ENV  = process.env.NODE_ENV  || "development";
const CORS_ORIGIN = process.env.origin  || "http://localhost:3000"; // Next.js default port

const app    = express();
const server = http.createServer(app);  // ← Wrap in raw http.Server for Socket.io

// ============================================================
// SOCKET.IO SETUP
// ============================================================
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === "development" ? "*" : CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Init socket service (so controllers can emit without importing io directly)
initSocketService(io);

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Admin joins their private room (called from frontend after login)
  socket.on("join_admin_room", (adminId) => {
    if (adminId) {
      socket.join(`admin:${adminId}`);
      console.log(`[Socket] Admin ${adminId} joined room admin:${adminId}`);
    }
  });

  // Generic room join — used for 'ads' broadcast room and future chat rooms
  // Also handles 'admin:{adminId}' rooms from the AlertBanner component
  socket.on("join_room", (room) => {
    if (room && typeof room === "string") {
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined room: ${room}`);
    }
  });

  // Master admin room (foundation for future admin↔master chat)
  socket.on("join_master_room", (masterId) => {
    if (masterId) {
      socket.join(`master:${masterId}`);
      socket.join("master_room"); // general master broadcast room (for ticket notifications)
      console.log(`[Socket] Master ${masterId} joined room`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://checkout.razorpay.com",
          "'unsafe-inline'",
        ],
        frameSrc:   ["'self'", "https://api.razorpay.com"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
      },
    },
  })
);

// ============================================================
// CORS CONFIGURATION
// ============================================================
const allowedOrigins =
  NODE_ENV === "development"
    ? true
    : Array.isArray(CORS_ORIGIN)
    ? CORS_ORIGIN
    : [CORS_ORIGIN];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 3600,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ============================================================
// BODY PARSER — raw for Razorpay webhook, json for everything else
// ============================================================
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ============================================================
// LOGGING
// ============================================================
const morganFormat = NODE_ENV === "development" ? "dev" : "combined";
app.use(morgan(morganFormat));

// ============================================================
// INPUT SANITIZATION
// ============================================================
app.use(sanitizeInput);

// ============================================================
// VISITOR TRACKING
// ============================================================
const visitorTracking = require("./src/middleware/visitorTracking.middleware");
app.use(visitorTracking);

// ============================================================
// RATE LIMITING
// ============================================================
app.use("/api/", generalLimiter);
// app.use("/api/admin/login", authLimiter);
// app.use("/api/admin/register", authLimiter);
// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
app.use(responseInterceptor);

// ============================================================
// ROOT + HEALTH
// ============================================================
app.get("/", (req, res) => res.sendFile(__dirname + "/utils/index.html"));

app.get("/health", (req, res) =>
  res.status(200).json({
    status: "ok",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    socketClients: io.engine.clientsCount,
  })
);

// ============================================================
// API ROUTES
// ============================================================
app.use("/api/admin",   AdminRouter);
app.use("/api/master",  masterRouter);             // ← Master admin APIs
app.use("/api/tickets", ticketRouter);             // ← Ticket/Support system

// Core dairy routes — guarded by subscription after authMiddleware
app.use("/api/farmer",    authMiddleware, subscriptionGuard, farmerRouter);
app.use("/api/milk",      authMiddleware, subscriptionGuard, MilkRouter);
app.use("/api/billing",   authMiddleware, subscriptionGuard, billingRouter);
app.use("/api/rate",      authMiddleware, subscriptionGuard, rateRouter);
app.use("/api/rates",     authMiddleware, subscriptionGuard, ratesRouter);
app.use("/api/payment",   authMiddleware, subscriptionGuard, paymentRouter);
app.use("/api/analytics", authMiddleware, subscriptionGuard, analyticsRouter);

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(NODE_ENV === "development" && { error: err.toString(), stack: err.stack }),
  });
});

// ============================================================
// SERVER STARTUP
// ============================================================
server.listen(PORT, async () => {
  try {
    await connection;
    console.log(`✓ Database connected successfully`);
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Socket.io ready`);
    console.log(`✓ Environment: ${NODE_ENV}`);

    // Pre-download Devanagari fonts so Hindi/Marathi PDFs are instant
    preloadDevanagariFonts().catch(() => {});

    transporter.verify((error) => {
      if (error) console.log("⚠ Email service error:", error.message);
      else        console.log("✓ Email service is ready");
    });
  } catch (error) {
    console.error("✗ Server startup error:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received — closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = { app, io };