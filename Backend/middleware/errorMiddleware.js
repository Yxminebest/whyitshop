// Backend/middleware/errorMiddleware.js

export const errorHandler = (err, req, res, next) => {
  // ถ้าสถานะเป็น 200 ให้เปลี่ยนเป็น 500 เพราะถือว่าเกิด Error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message,
    // แสดง stack trace เฉพาะตอนพัฒนา เพื่อช่วยในการหาจุดที่โค้ดพัง
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};