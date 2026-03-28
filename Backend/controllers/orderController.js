import supabase from "../config/supabase.js";

export const getOrders = async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email)");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};