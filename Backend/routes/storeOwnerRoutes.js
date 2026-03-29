import express from "express";
import {
  getMyStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  getMyStoreOrders,
  getStoreStats
} from "../controllers/storeOwnerController.js";
import {
  getMyStoreOwnerCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from "../controllers/couponController.js";
import { requireRole, verifyOwnership } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ ทั้งหมด require store_owner role
router.use(requireRole(["store_owner", "admin"])); // Admin สามารถเข้าถึงได้ด้วย

// 📦 PRODUCTS
router.get("/products", getMyStoreProducts);
router.post("/products", createStoreProduct);
router.put("/products/:id", verifyOwnership("product"), updateStoreProduct);
router.delete("/products/:id", verifyOwnership("product"), deleteStoreProduct);

// 📋 ORDERS
router.get("/orders", getMyStoreOrders);

// 🎫 COUPONS
router.get("/coupons", getMyStoreOwnerCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", verifyOwnership("coupon"), updateCoupon);
router.delete("/coupons/:id", verifyOwnership("coupon"), deleteCoupon);

// 📊 STATS
router.get("/stats", getStoreStats);

export default router;
