import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; // ✅ เพิ่ม: ป้องกันช่องโหว่พื้นฐาน (OWASP A05)
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
const app = express();

// 🛡️ 1. Security Headers (OWASP A05: Security Misconfiguration)
app.use(helmet()); 

// 🌐 2. CORS Configuration (OWASP A01: Broken Access Control)
// จำกัดสิทธิ์เฉพาะโดเมนที่คุณใช้งานจริงเท่านั้น
const allowedOrigins = [
  "http://localhost:5173",          // Local Development
  "https://whyitshop.vercel.app"    // Production บน Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // อนุญาตหากไม่มี origin (เช่น เครื่องมือทดสอบอย่าง Postman) หรืออยู่ในรายการที่กำหนด
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS (Security Violation)"));
    }
  },
  credentials: true
}));

// 📦 3. Body Parser (จำกัดขนาดข้อมูลเพื่อป้องกัน DoS Attack)
app.use(express.json({ limit: "10kb" })); 

// 🚀 4. Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// Default Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "WhyItShop API is secured and running..." });
});

// 🚨 5. Error Handling Middleware (OWASP A04: Next-Gen Injection/Insecure Design)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server secured and running on http://localhost:${PORT}`);
});