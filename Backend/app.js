require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connection } = require("./src/connection/db");
const { farmerRouter } = require("./src/Farmer/farmerRoutes");
const { AdminRouter } = require("./src/Admin/adminRoutes");
const { MilkRouter } = require("./src/Milk/milkRoutes");
const { transporter } = require("./src/connection/mailConnection");
const rateRouter = require("./src/Milk/RateSetting/rateSettingRoutes");
const { paymentRouter } = require("./src/Payment/paymentRoutes");
const { responseInterceptor } = require("./src/middleware/responseHandler.middleware");
const { generalLimiter, authLimiter } = require("./src/middleware/rateLimiter.middleware");
const sanitizeInput = require("./src/middleware/sanitize.middleware");



const PORT = process.env.PORT || 3030;
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.origin || "http://localhost:5173";

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://checkout.razorpay.com",  // Allow Razorpay checkout script
          "'unsafe-inline'",
        ],
        frameSrc: ["'self'", "https://api.razorpay.com"], // Allow Razorpay iframe
        connectSrc: ["'self'", "https://api.razorpay.com"],
      },
    },
  })
);

// ============================================
// CORS CONFIGURATION
// ============================================
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
// ============================================
// BODY PARSER MIDDLEWARE
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.options("*", cors(corsOptions));


// ============================================
// REQUEST LOGGING
// ============================================
const morganFormat = NODE_ENV === "development" ? "dev" : "combined";
app.use(morgan(morganFormat));

// ============================================
// INPUT SANITIZATION (XSS Protection)
// ============================================
app.use(sanitizeInput);

// ============================================
// RATE LIMITING
// ============================================
app.use("/api/", generalLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/register", authLimiter);


// ============================================
// RESPONSE INTERCEPTOR
// ============================================
app.use(responseInterceptor);

// ============================================
// ROOT ENDPOINT
// ============================================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/utils/index.html");
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/admin", AdminRouter);
app.use("/api/farmer", farmerRouter);
app.use("/api/milk", MilkRouter);
app.use("/api/rate", rateRouter);
app.use("/api/payment", paymentRouter);   // ← New Razorpay routes

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV === "development" && { error: err.toString(), stack: err.stack }),
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const server = app.listen(PORT, async () => {
  try {
    await connection;
    console.log(`✓ Database connected successfully`);
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${NODE_ENV}`);

    transporter.verify(function (error) {
      if (error) {
        console.log("⚠ Email service error:", error.message);
      } else {
        console.log("✓ Email service is ready");
      }
    });
  } catch (error) {
    console.error("✗ Server startup error:", error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received — closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;