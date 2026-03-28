import supabase from "../config/supabase.js";

// ดึงรายชื่อผู้ใช้ทั้งหมด
export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users") // ตรวจสอบชื่อตารางในฐานข้อมูลของคุณ (เช่น users หรือ profiles)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// อัปเดตข้อมูลผู้ใช้ (Username, Phone, Role)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ลบผู้ใช้
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};