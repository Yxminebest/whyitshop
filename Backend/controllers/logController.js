import supabase from "../config/supabase.js";

export const createLog = async (req, res) => {
  const { action, detail, user_id } = req.body;
  const { error } = await supabase
    .from("admin_logs")
    .insert([{ action, detail, user_id }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Log created" });
};