import supabase from "../config/supabase.js";
import { logAuthEvent } from "./auditLog.js";

// ✅ Middleware: ตรวจสอบว่า user มี role ตามที่ต้องการหรือไม่
export const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // ดึง user ID จาก header Authorization (Supabase JWT)
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "❌ No authorization header" });
      }

      // ดึง user จาก Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      
      if (authError || !user) {
        logAuthEvent(req, "ROLE_CHECK", false, { reason: "Invalid token" });
        return res.status(401).json({ error: "❌ Invalid token" });
      }

      // ดึง role จาก users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        logAuthEvent(req, "ROLE_CHECK", false, { reason: "User not found" });
        return res.status(401).json({ error: "❌ User not found" });
      }

      // ตรวจสอบว่า role ตรงกับที่ต้องการหรือไม่
      if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
        logAuthEvent(req, "ROLE_CHECK", false, { reason: `Forbidden role: ${userData.role}` });
        return res.status(403).json({ error: `❌ Forbidden. Required roles: ${allowedRoles.join(", ")}` });
      }

      // เก็บ user info ไว้ใน req object เพื่อใช้ใน controller
      req.user = user;
      req.userRole = userData.role;

      logAuthEvent(req, "ROLE_CHECK", true, { role: userData.role });
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "❌ Internal server error" });
    }
  };
};

// ✅ Middleware: ตรวจสอบว่า user เป็นเจ้าของสินค้า/คูปอง หรือไม่
export const verifyOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const resourceId = req.params.id;

      if (!userId || !resourceId) {
        return res.status(400).json({ error: "❌ Missing userId or resourceId" });
      }

      // ดึงข้อมูล resource เพื่อตรวจสอบเจ้าของ
      const table = resourceType === "product" ? "products" : "coupons";
      const { data: resource, error } = await supabase
        .from(table)
        .select("store_owner_id")
        .eq("id", resourceId)
        .single();

      if (error || !resource) {
        return res.status(404).json({ error: "❌ Resource not found" });
      }

      // ตรวจสอบว่าเจ้าของตรงกัน
      if (resource.store_owner_id !== userId) {
        return res.status(403).json({ error: "❌ You don't have permission to modify this resource" });
      }

      next();
    } catch (error) {
      console.error("Ownership verification error:", error);
      res.status(500).json({ error: "❌ Internal server error" });
    }
  };
};

// ✅ Middleware: ดึง user info และเก็บไว้ใน req.user
export const extractUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      
      if (!error && user) {
        req.user = user;
        
        // ดึง role จาก users table
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (userData) {
          req.userRole = userData.role;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Extract user error:", error);
    next();
  }
};
