import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js"; //

// โหลดค่าคอนฟิกจากไฟล์ .env
dotenv.config();

const app = express();

// --- Middleware ---
// อนุญาตให้ Frontend (ปกติพอร์ต 5173) เรียกใช้งาน API ได้
app.use(cors()); 

// แปลงข้อมูล Request Body ที่เป็น JSON ให้เป็น Object
app.use(express.json());

// --- Routes ---
// เส้นทางหลักสำหรับจัดการข้อมูลสินค้า
app.use("/api/products", productRoutes);

// Route สำหรับเช็คสถานะเซิร์ฟเวอร์
app.get("/", (req, res) => {
  res.send("WhyItShop API is running...");
});

// --- Error Handling ---
// Middleware สำหรับจัดการข้อผิดพลาด (ต้องวางไว้หลัง Routes ทั้งหมด)
app.use(errorHandler);

// --- Server Listening ---
const PORT = process.env.PORT || 5000; //

app.listen(PORT, () => {
  console.log(`
  🚀 Server is ringing!
  📡 URL: http://localhost:${PORT}
  🛠️ Environment: ${process.env.NODE_ENV || 'development'}
  `);
});