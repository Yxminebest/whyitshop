import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cartItems, removeFromCart, setCartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [coupon, setCoupon] = useState(""); // รหัสคูปองในช่อง input
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const finalPrice = Math.max(totalPrice - discount, 0);

  // 1. 🔥 ระบบดึงคูปองอัตโนมัติจากหน้า Coupons
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();

    // เช็กว่ามีรหัสคูปองที่เก็บไว้ใน localStorage หรือไม่
    const savedCoupon = localStorage.getItem("selectedCoupon");
    if (savedCoupon) {
      setCoupon(savedCoupon); // ใส่รหัสลงในช่อง input ทันที
      localStorage.removeItem("selectedCoupon"); // ลบออกเพื่อไม่ให้ค้างในการซื้อครั้งถัดไป
      
      // หมายเหตุ: หากต้องการให้ตรวจสอบคูปองอัตโนมัติเลย 
      // สามารถเรียกใช้ applyCoupon จากตรงนี้ได้ แต่ต้องระวังเรื่อง totalPrice ที่ยังอาจโหลดไม่เสร็จ
    }
  }, []);

  const applyCoupon = async () => {
    if (!coupon) return;
    setMessage({ text: "กำลังตรวจสอบ...", type: "" });
    
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      setDiscount(0);
      setMessage({ text: "❌ คูปองไม่ถูกต้อง หรือหมดอายุ", type: "error" });
      return;
    }

    const discountValue = data.type === "percent" ? (totalPrice * data.value) / 100 : data.value;
    setDiscount(discountValue);
    setMessage({ text: `✅ ใช้คูปองส่วนลด ${data.value}${data.type === 'percent' ? '%' : ' บาท'} สำเร็จ`, type: "success" });
  };

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
      navigate("/login");
      return;
    }
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const confirmPayment = async () => {
    if (!user) return navigate("/login");
    if (cartItems.length === 0) return alert("ไม่มีสินค้าในตะกร้า");
    if (!slipFile) return alert("กรุณาแนบหลักฐานการโอนเงิน (สลิป)");

    try {
      setLoading(true);
      const filePath = `${user.id}/${Date.now()}_${slipFile.name}`;
      const { error: uploadError } = await supabase.storage.from("slips").upload(filePath, slipFile);
      if (uploadError) return alert("❌ อัปโหลดสลิปไม่สำเร็จ");

      const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(filePath);

      const { data: orderData, error: orderError } = await supabase.from("orders")
        .insert([{ user_id: user.id, total_price: finalPrice, status: "pending", slip: publicUrl }])
        .select().single();

      if (orderError) return alert("❌ บันทึกออเดอร์ไม่สำเร็จ");

      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id, product_id: item.id, name: item.name, quantity: item.qty || 1, price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) return alert("❌ บันทึกรายการสินค้าไม่สำเร็จ");

      alert("🎉 สั่งซื้อสำเร็จ! กรุณารอแอดมินตรวจสอบสลิป");
      setCartItems([]);
      localStorage.removeItem("cart");
      navigate("/my-orders");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการสั่งซื้อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px", fontWeight: "800", textAlign: "center" }}>🛒 ตะกร้าสินค้า</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "30px" }}>
        
        {/* ฝั่งซ้าย: รายการสินค้า */}
        <div className="glass-card" style={{ height: "fit-content" }}>
          <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>📦 รายการสินค้าของคุณ</h2>
          {cartItems.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>ตะกร้าของคุณยังว่างเปล่า</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "rgba(0,0,0,0.1)", borderRadius: "12px", marginBottom: "10px", border: "1px solid var(--card-border)" }}>
                <div>
                  <h4 style={{ marginBottom: "5px" }}>{item.name}</h4>
                  <p style={{ color: "var(--primary)", fontWeight: "bold" }}>{item.price.toLocaleString()} บาท <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>x {item.qty}</span></p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="btn-primary" style={{ background: "var(--danger)", padding: "8px 15px", fontSize: "12px" }}>
                  ลบออก
                </button>
              </div>
            ))
          )}
        </div>

        {/* ฝั่งขวา: สรุปราคาและคูปอง */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* ส่วนของคูปอง */}
          <div>
            <h2 style={{ marginBottom: "15px", fontSize: "20px" }}>🎁 ส่วนลดพิเศษ</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="กรอกโค้ดส่วนลดที่นี่..." 
                value={coupon} 
                onChange={(e) => setCoupon(e.target.value)} 
              />
              <button onClick={applyCoupon} className="btn-primary" style={{ whiteSpace: "nowrap", padding: "0 20px" }}>
                ตรวจสอบ
              </button>
            </div>
            {message.text && (
              <p style={{ 
                color: message.type === "error" ? "var(--danger)" : "var(--accent)", 
                fontSize: "14px", marginTop: "10px", fontWeight: "bold" 
              }}>
                {message.text}
              </p>
            )}
          </div>

          {/* ส่วนสรุปราคา (🔥 เพิ่มระยะเว้นห่างลงมาด้วย borderTop และ paddingTop) */}
          <div style={{ borderTop: "2px dashed var(--card-border)", paddingTop: "25px" }}>
            <h2 style={{ marginBottom: "15px", fontSize: "20px" }}>💳 สรุปยอดชำระ</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "var(--text-muted)" }}>ยอดรวมสินค้า</span>
              <span>{totalPrice.toLocaleString()} บาท</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <span style={{ color: "var(--text-muted)" }}>ส่วนลดจากคูปอง</span>
              <span style={{ color: "var(--danger)" }}>-{discount.toLocaleString()} บาท</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "22px", fontWeight: "900", color: "var(--primary)", borderTop: "1px solid var(--card-border)", paddingTop: "15px" }}>
              <span>ยอดสุทธิ</span>
              <span>{finalPrice.toLocaleString()} บาท</span>
            </div>
          </div>

          {/* ส่วนอัปโหลดสลิป */}
          <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "20px" }}>
            <p style={{ marginBottom: "12px", fontWeight: "bold" }}>📸 แนบหลักฐานการโอนเงิน:</p>
            <input type="file" className="input-glass" style={{ padding: "8px" }} onChange={handleSlipUpload} accept="image/*" />
            {slipPreview && (
              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>ตัวอย่างรูปที่อัปโหลด:</p>
                <img src={slipPreview} alt="slip" style={{ width: "100%", maxWidth: "200px", borderRadius: "12px", border: "2px solid var(--primary)" }} />
              </div>
            )}
          </div>

          <button 
            onClick={confirmPayment} 
            disabled={loading || cartItems.length === 0} 
            className="btn-success" 
            style={{ width: "100%", padding: "18px", fontSize: "18px", fontWeight: "bold", boxShadow: "0 10px 20px rgba(34, 197, 94, 0.2)" }}
          >
            {loading ? "กำลังบันทึกออเดอร์..." : "🛒 ยืนยันการสั่งซื้อ"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Cart;