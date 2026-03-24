import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. โหลดข้อมูลจาก LocalStorage เมื่อเริ่มต้นแอป
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. บันทึกข้อมูลลง LocalStorage ทุกครั้งที่ cartItems เปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ เพิ่มสินค้า (Logic เดิมของคุณ ดีอยู่แล้วครับ)
  const addToCart = (product) => {
    setCartItems((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: (item.qty || 1) + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // ✅ ลดจำนวนสินค้า (เพิ่มฟีเจอร์ใหม่)
  const decreaseQty = (id) => {
    setCartItems((prev) => {
      const exist = prev.find((item) => item.id === id);
      if (exist.qty === 1) {
        return prev.filter((item) => item.id !== id); // ถ้าเหลือ 1 แล้วลดอีก ให้ลบออกเลย
      }
      return prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty - 1 } : item
      );
    });
  };

  // ✅ ลบสินค้า
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ✅ ล้างตะกร้า
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        decreaseQty, 
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}