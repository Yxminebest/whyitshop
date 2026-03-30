import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // ✅ ป้องกันช่องโหว่พื้นฐาน (OWASP A05)
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import session from "express-session";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import storeOwnerRoutes from "./routes/storeOwnerRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
// import { errorHandler } from "./middleware/errorMiddleware.js"; // (เปิดคอมเมนต์เมื่อสร้างไฟล์ middleware แล้ว)

dotenv.config();
const app = express();

// 🌐 1. CORS Configuration FIRST (OWASP A01: Broken Access Control)
const allowedOrigins = [
  "http://localhost:5173",              // Local Development Frontend
  "http://localhost:5000",              // Local Development Backend
  "https://whyitshop.vercel.app",       // Production Frontend (Vercel)
  "https://whyitshop.onrender.com"      // Production Backend (Render)
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("❌Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

// 🛡️ 2. Security Headers (OWASP A05: Security Misconfiguration)
// 💡 แก้ไข: ปิด HSTS ในโหมด Development เพื่อไม่ให้ Postman บังคับใช้ HTTPS
const isProduction = process.env.NODE_ENV === "production";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://kslyrllmwbbgcepvotps.supabase.co", "http://localhost:5000", "http://localhost:5173"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  },
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false // ปิดตอนทดสอบในเครื่อง (Local)
}));

// ✅ 3. HTTPS Enforcement (OWASP A02: Cryptographic Failures)
if (isProduction) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// 📦 4. Body Parser (จำกัดขนาดข้อมูลเพื่อป้องกัน DoS Attack)
app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ limit: "10kb", extended: false }));

// 🔐 5. Session & CSRF Protection (OWASP A08: Data Integrity Failures)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction, // HTTPS only ในโหมด Production
    httpOnly: true,  // ป้องกัน XSS
    sameSite: "strict"  // ป้องกัน CSRF
  }
}));

// ✅ CSRF Protection - ใช้เป็น middleware สำหรับ route ที่ต้องการ
// API ที่ใช้ JWT Bearer token ใน Authorization header ป้องกัน CSRF โดยธรรมชาติอยู่แล้ว
// csrfProtection ไว้ใช้กับ route ที่ใช้ session-based auth เท่านั้น
export const csrfProtection = csrf({ cookie: false });

// ✅ 6. Rate Limiting (OWASP A04: Insecure Design)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts
  message: "Too many login attempts, try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      error: "❌ Too many login attempts. Try again in 15 minutes." 
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,  // 30 requests per minute
  message: "Too many requests, try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);  // Apply to all API routes
app.post("/api/auth/login", loginLimiter);  // Extra strict for login
app.post("/api/auth/register", loginLimiter);  // Extra strict for register

// 🚀 7. Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/store", storeOwnerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);

// 🎫 8. CSRF Token Endpoint
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 📊 9. Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "🛡️ WhyItShop API is secured and running...",
    security: {
      helmet: "✅ Enabled",
      cors: "✅ Enabled",
      rateLimit: "✅ Enabled",
      csrf: "✅ Prepared (Endpoint ready)",
      hsts: isProduction ? "✅ Enabled" : "⚠️ Disabled (Local Development)",
      csp: "✅ Enabled"
    }
  });
});

// 🚨 10. Error Handling Middleware (OWASP A04: Insecure Design)
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // CSRF token errors
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "❌ CSRF token validation failed" });
  }

  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({ error: err.message });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server secured and running on http://localhost:${PORT}`);
});