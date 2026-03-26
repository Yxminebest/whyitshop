import supabase from "../config/supabase.js";

// GET
export const getProducts = async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

// POST
export const createProduct = async (req, res) => {
  const { name, price } = req.body;

  const { data, error } = await supabase
    .from("products")
    .insert([{ name, price }])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

// DELETE
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Deleted" });
};