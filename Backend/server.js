import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // ✅ ป้องกันช่องโหว่พื้นฐาน (OWASP A05)
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import session from "express-session";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
const app = express();

// 🛡️ 1. Security Headers (OWASP A05: Security Misconfiguration)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://kslyrllmwbbgcepvotps.supabase.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// ✅ 2. HTTPS Enforcement (OWASP A02: Cryptographic Failures)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// 🌐 3. CORS Configuration (OWASP A01: Broken Access Control)
const allowedOrigins = [
  "http://localhost:5173",              // Local Development Frontend
  "http://localhost:5000",              // Local Development Backend
  "https://whyitshop.vercel.app",       // Production Frontend (Vercel)
  "https://whyitshop.onrender.com"      // Production Backend (Render)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("❌Not allowed by CORS"));
    }
  },
  credentials: true
}));

// 📦 4. Body Parser (จำกัดขนาดข้อมูลเพื่อป้องกัน DoS Attack)
app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ limit: "10kb", extended: false }));

// 🔐 5. Session & CSRF Protection (OWASP A08: Data Integrity Failures)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === "production", // HTTPS only
    httpOnly: true,  // ป้องกัน XSS
    sameSite: "strict"  // ป้องกัน CSRF
  }
}));

const csrfProtection = csrf({ cookie: false });

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
      csrf: "✅ Enabled",
      hsts: "✅ Enabled",
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