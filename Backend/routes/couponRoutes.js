import express from "express";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} from "../controllers/couponController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ ดึงคูปองทั้งหมด (Admin & Store Owner & User)
router.get("/", getAllCoupons);

// ✅ สร้างคูปองใหม่ (Admin & Store Owner)
router.post("/", requireRole(["admin", "store_owner"]), createCoupon);

// ✅ อัปเดตคูปอง (Admin & Store Owner - เฉพาะของตัวเอง)
router.put("/:id", requireRole(["admin", "store_owner"]), updateCoupon);

// ✅ ลบคูปอง (Admin & Store Owner - เฉพาะของตัวเอง)
router.delete("/:id", requireRole(["admin", "store_owner"]), deleteCoupon);

// ✅ เปลี่ยน status (Admin only)
router.patch("/:id/toggle", requireRole(["admin"]), toggleCouponStatus);

export default router;
