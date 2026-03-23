import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cartItems, removeFromCart, setCartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const finalPrice = Math.max(totalPrice - discount, 0);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  const applyCoupon = async () => {
    setMessage({ text: "", type: "" });
    const { data } = await supabase.from("coupons").select("*").eq("code", coupon).eq("is_active", true).maybeSingle();

    if (!data) {
      setDiscount(0);
      setMessage({ text: "❌ คูปองไม่ถูกต้อง หรือหมดอายุ", type: "error" });
      return;
    }

    const discountValue = data.type === "percent" ? (totalPrice * data.value) / 100 : data.value;
    setDiscount(discountValue);
    setMessage({ text: "✅ ใช้คูปองส่วนลดสำเร็จ", type: "success" });
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
      <h1 style={{ marginBottom: "30px", fontWeight: "800" }}>🛒 ตะกร้าสินค้า</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
        
        {/* LEFT: ITEM LIST */}
        <div className="glass-card">
          <h2 style={{ marginBottom: "20px" }}>รายการสินค้า</h2>
          {cartItems.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>ตะกร้าของคุณยังว่างเปล่า</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "var(--bg-secondary)", borderRadius: "12px", marginBottom: "10px", border: "1px solid var(--card-border)" }}>
                <div>
                  <h4 style={{ marginBottom: "5px" }}>{item.name}</h4>
                  <p style={{ color: "var(--primary)", fontWeight: "bold" }}>{item.price} บาท <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>x {item.qty}</span></p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="btn-primary" style={{ background: "var(--danger)", padding: "8px 15px" }}>
                  ลบ
                </button>
              </div>
            ))
          )}
        </div>

        {/* RIGHT: SUMMARY & CHECKOUT */}
        <div className="glass-card">
          <h2 style={{ marginBottom: "20px" }}>💳 สรุปคำสั่งซื้อ</h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "var(--text-muted)" }}>ยอดรวมสินค้า</span>
            <span>{totalPrice} บาท</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <span style={{ color: "var(--text-muted)" }}>ส่วนลด</span>
            <span style={{ color: "var(--danger)" }}>-{discount} บาท</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", color: "var(--accent)", borderTop: "1px solid var(--card-border)", paddingTop: "15px" }}>
            <span>ยอดสุทธิ</span>
            <span>{finalPrice} บาท</span>
          </div>

          <div style={{ marginTop: "25px" }}>
            <input type="text" className="input-glass" placeholder="กรอกโค้ดส่วนลด..." value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button onClick={applyCoupon} className="btn-primary" style={{ width: "100%", background: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid var(--primary)" }}>ตรวจสอบคูปอง</button>
            {message.text && <p style={{ color: message.type === "error" ? "var(--danger)" : "var(--accent)", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>{message.text}</p>}
          </div>

          <div style={{ marginTop: "25px", borderTop: "1px solid var(--card-border)", paddingTop: "20px" }}>
            <p style={{ marginBottom: "10px", fontWeight: "bold" }}>แนบหลักฐานการโอนเงิน:</p>
            <input type="file" className="input-glass" style={{ padding: "8px" }} onChange={handleSlipUpload} accept="image/*" />
            {slipPreview && <img src={slipPreview} alt="slip" style={{ width: "100%", borderRadius: "12px", marginTop: "10px", border: "2px solid var(--card-border)" }} />}
          </div>

          <button onClick={confirmPayment} disabled={loading} className="btn-success" style={{ width: "100%", padding: "15px", marginTop: "20px", fontSize: "16px" }}>
            {loading ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;