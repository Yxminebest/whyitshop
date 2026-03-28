import supabase from "../config/supabase.js";
import { logAdminAction, logDataAccess } from "../middleware/auditLog.js";

// ✅ ดึงรายชื่อผู้ใช้ทั้งหมด (Admin only)
export const getUsers = async (req, res) => {
  try {
    logDataAccess(req, "users", "read");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ อัปเดตข้อมูลผู้ใช้ (Username, Phone, Role) - Admin only
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    logAdminAction(req, "update_user", id, updates);

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    
    res.json({ 
      message: "User updated successfully",
      data 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ลบผู้ใช้ (Admin only)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    logAdminAction(req, "delete_user", id, { reason: "User deletion" });

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};