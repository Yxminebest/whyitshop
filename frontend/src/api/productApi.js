import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

export const getProducts = async () => {
  try {
    // ลองเรียก Backend API ก่อน
    try {
      const res = await fetch(`${API_URL}/products`, { 
        signal: AbortSignal.timeout(5000) // timeout 5 วินาที
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("Backend API failed, falling back to Supabase:", err);
    }

    // ถ้า Backend API ล้มเหลว ให้ใช้ Supabase แทน
    const { data, error } = await supabase.from("products").select("*");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getProducts:", error);
    return [];
  }
};

export const addProduct = async (product) => {
  try {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return await res.json();
  } catch (error) {
    console.error("Error in addProduct:", error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return await res.json(); 
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    throw error;
  }
};