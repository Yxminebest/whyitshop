import { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ โหลด user และ cart เมื่อ component mount
  useEffect(() => {
    const loadUserAndCart = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          // โหลด cart จาก Supabase
          const { data: cartData } = await supabase
            .from("carts")
            .select("items")
            .eq("user_id", authUser.id)
            .maybeSingle();

          if (cartData?.items) {
            setCartItems(cartData.items);
          } else {
            // ถ้าไม่มี cart ใน Supabase ให้อ่านจาก localStorage
            const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
            setCartItems(savedCart);
          }
        } else {
          // ถ้าไม่ logged in ให้ใช้ localStorage
          const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
          setCartItems(savedCart);
        }
      } catch (err) {
        console.error("Load cart error:", err);
        // Fallback ไป localStorage
        const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItems(savedCart);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndCart();
  }, []);

  // ✅ บันทึก cart ลง localStorage และ Supabase
  useEffect(() => {
    if (loading) return;

    // บันทึก localStorage
    localStorage.setItem("cart", JSON.stringify(cartItems));

    // บันทึก Supabase (ถ้า logged in)
    if (user?.id) {
      const saveToSupabase = async () => {
        try {
          const { data: existingCart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (existingCart) {
            // Update existing cart
            await supabase
              .from("carts")
              .update({ items: cartItems, updated_at: new Date().toISOString() })
              .eq("user_id", user.id);
          } else {
            // Insert new cart
            await supabase
              .from("carts")
              .insert([
                {
                  user_id: user.id,
                  items: cartItems,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]);
          }
        } catch (err) {
          console.error("Save cart to Supabase error:", err);
        }
      };

      saveToSupabase();
    }

    // ⚡ ส่ง event ให้ Navbar ได้รับรู้ว่า cart มีการเปลี่ยนแปลง
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: cartItems.length } }));
  }, [cartItems, loading, user]);

  // ✅ เพิ่มสินค้า
  const addToCart = (product) => {
    setCartItems((prev) => {
      const exist = prev.find((item) => item.id === product.id);

      if (exist) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prev, { ...product, qty: 1 }];
    });
  };

  // ✅ ลบสินค้า
  const removeFromCart = (id) => {
    setCartItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // ✅ ล้างตะกร้า
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children} {/* 🔥 สำคัญมาก */}
    </CartContext.Provider>
  );
}