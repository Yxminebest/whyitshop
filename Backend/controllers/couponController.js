import supabase from "../config/supabase.js";
import { logAdminAction } from "../middleware/auditLog.js";

// ✅ ดึงคูปองทั้งหมด (Admin only)
export const getAllCoupons = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ดึงคูปองของร้านตัวเอง (Store Owner)
export const getMyStoreOwnerCoupons = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_owner_id", storeOwnerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ สร้างคูปองใหม่ (Store Owner & Admin)
export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, description, is_active } = req.body;
    const storeOwnerId = req.user.id;

    // Validation
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: "❌ Missing required fields: code, type, value" });
    }

    if (type !== "percent" && type !== "fixed") {
      return res.status(400).json({ error: "❌ Type must be 'percent' or 'fixed'" });
    }

    if (type === "percent" && (value < 0 || value > 100)) {
      return res.status(400).json({ error: "❌ Percent discount must be between 0-100" });
    }

    if (type === "fixed" && value <= 0) {
      return res.status(400).json({ error: "❌ Fixed discount must be greater than 0" });
    }

    // สร้างคูปอง
    const { data, error } = await supabase
      .from("coupons")
      .insert([{
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        description: description || null,
        store_owner_id: storeOwnerId,
        is_active: is_active !== false
      }])
      .select();

    if (error) throw error;

    logAdminAction(req, "CREATE_COUPON", data[0].id, { code, type, value });
    
    res.status(201).json({ 
      message: "✅ Coupon created successfully",
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ อัปเดตคูปอง (Store Owner เฉพาะของตัวเอง, Admin ทั้งหมด)
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, value, description, is_active } = req.body;
    const userId = req.user.id;
    const userRole = req.userRole;

    // ดึงคูปอง
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({ error: "❌ Coupon not found" });
    }

    // ตรวจสอบเจ้าของ (Store Owner ต้องเป็นเจ้าของ, Admin ได้ทั้งหมด)
    if (userRole !== "admin" && coupon.store_owner_id !== userId) {
      return res.status(403).json({ error: "❌ You don't have permission to update this coupon" });
    }

    // อัปเดตคูปอง
    const updateData = {};
    if (type) updateData.type = type;
    if (value !== undefined) updateData.value = Number(value);
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("coupons")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;

    logAdminAction(req, "UPDATE_COUPON", id, updateData);

    res.json({ 
      message: "✅ Coupon updated successfully",
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ลบคูปอง (Store Owner เฉพาะของตัวเอง, Admin ทั้งหมด)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.userRole;

    // ดึงคูปอง
    const { data: coupon, error: fetchError } = await supabase
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({ error: "❌ Coupon not found" });
    }

    // ตรวจสอบเจ้าของ
    if (userRole !== "admin" && coupon.store_owner_id !== userId) {
      return res.status(403).json({ error: "❌ You don't have permission to delete this coupon" });
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) throw error;

    logAdminAction(req, "DELETE_COUPON", id, {});

    res.json({ message: "✅ Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ เปลี่ยน status คูปอง active/inactive (Admin only)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from("coupons")
      .update({ is_active })
      .eq("id", id)
      .select();

    if (error) throw error;

    logAdminAction(req, "TOGGLE_COUPON_STATUS", id, { is_active });

    res.json({ 
      message: "✅ Coupon status updated",
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
