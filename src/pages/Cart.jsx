import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext"; // 1. นำเข้า useAuth
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cartItems, removeFromCart, setCartItems } = useContext(CartContext);
  const { user, loading: authLoading } = useAuth(); // 2. ดึง user จาก Context แทนการดึงเอง
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const finalPrice = Math.max(totalPrice - discount, 0);

  // 3. ลบ useEffect เดิมที่เรียก getUser() ออก เพราะเราใช้จาก useAuth() แล้ว

  const applyCoupon = async () => {
    if (totalPrice === 0) return;
    setMessage({ text: "", type: "" });
    
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setDiscount(0);
        setMessage({ text: "❌ คูปองไม่ถูกต้อง หรือหมดอายุ", type: "error" });
        return;
      }

      const discountValue = data.type === "percent" 
        ? (totalPrice * data.value) / 100 
        : data.value;
      
      setDiscount(discountValue);
      setMessage({ text: `✅ ใช้คูปองส่วนลด ${data.value}${data.type === 'percent' ? '%' : ' บาท'} สำเร็จ`, type: "success" });
    } catch (err) {
      setMessage({ text: "❌ เกิดข้อผิดพลาดในการตรวจสอบคูปอง", type: "error" });
    }
  };

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
      navigate("/login");
      return;
    }
    
    if (file.size > 5000000) { // จำกัด 5MB
      alert("ไฟล์รูปภาพใหญ่เกินไป (จำกัด 5MB)");
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
      
      // 1. อัปโหลดสลิป
      const fileExt = slipFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("slips").upload(filePath, slipFile);
      
      if (uploadError) throw new Error("อัปโหลดสลิปไม่สำเร็จ");

      const { data: { publicUrl } } = supabase.storage.from("slips").getPublicUrl(filePath);

      // 2. บันทึก Order หลัก
      const { data: orderData, error: orderError } = await supabase.from("orders")
        .insert([{ 
          user_id: user.id, 
          total_price: finalPrice, 
          status: "pending", 
          slip: publicUrl 
        }])
        .select().single();

      if (orderError) throw orderError;

      // 3. บันทึกรายการสินค้าใน Order (Order Items)
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id, 
        product_id: item.id, 
        name: item.name, 
        quantity: item.qty || 1, 
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      alert("🎉 สั่งซื้อสำเร็จ! กรุณารอแอดมินตรวจสอบสลิปภายใน 24 ชม.");
      setCartItems([]);
      localStorage.removeItem("cart");
      navigate("/my-orders");
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div style={{ color: "white", textAlign: "center", padding: "100px" }}>กำลังเตรียมตะกร้าสินค้า...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: "30px", fontWeight: "800", fontSize: '2.5rem' }}>🛒 ตะกร้าสินค้า</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "30px" }}>
        
        {/* LEFT: ITEM LIST */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: "25px", borderBottom: '1px solid var(--card-border)', paddingBottom: '15px' }}>รายการสินค้า</h2>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>ตะกร้าของคุณยังว่างเปล่า</p>
              <button onClick={() => navigate('/products')} className="btn-primary" style={{ marginTop: '20px' }}>ไปเลือกซื้อสินค้า</button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "15px", 
                background: "rgba(255,255,255,0.03)", 
                borderRadius: "12px", 
                marginBottom: "15px", 
                border: "1px solid var(--card-border)" 
              }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={item.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ marginBottom: "3px" }}>{item.name}</h4>
                    <p style={{ color: "var(--primary)", fontWeight: "bold" }}>
                      {item.price.toLocaleString()} บาท 
                      <span style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: '10px' }}>x {item.qty}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="btn-primary" style={{ background: "var(--danger)", padding: "8px 15px", borderRadius: '8px' }}>
                  ลบ
                </button>
              </div>
            ))
          )}
        </div>

        {/* RIGHT: SUMMARY & CHECKOUT */}
        <div className="glass-card" style={{ padding: '30px', height: 'fit-content' }}>
          <h2 style={{ marginBottom: "25px" }}>💳 สรุปคำสั่งซื้อ</h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)" }}>ยอดรวมสินค้า</span>
            <span style={{ fontWeight: '600' }}>{totalPrice.toLocaleString()} บาท</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <span style={{ color: "var(--text-muted)" }}>ส่วนลดคูปอง</span>
            <span style={{ color: "var(--danger)", fontWeight: '600' }}>-{discount.toLocaleString()} บาท</span>
          </div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            fontSize: "22px", 
            fontWeight: "800", 
            color: "var(--accent)", 
            borderTop: "2px solid var(--card-border)", 
            paddingTop: "20px",
            marginTop: '10px'
          }}>
            <span>ยอดสุทธิ</span>
            <span>{finalPrice.toLocaleString()} บาท</span>
          </div>

          {/* Coupon Section */}
          <div style={{ marginTop: "30px", background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <input 
              type="text" 
              className="input-glass" 
              placeholder="กรอกโค้ดส่วนลด..." 
              value={coupon} 
              onChange={(e) => setCoupon(e.target.value)} 
              style={{ marginBottom: '10px' }}
            />
            <button onClick={applyCoupon} className="btn-primary" style={{ width: "100%", background: "transparent", border: "1px solid var(--primary)", color: 'var(--primary)' }}>
              ใช้คูปองส่วนลด
            </button>
            {message.text && (
              <p style={{ 
                color: message.type === "error" ? "var(--danger)" : "var(--accent)", 
                fontSize: "13px", 
                marginTop: "12px", 
                textAlign: "center",
                fontWeight: '600'
              }}>{message.text}</p>
            )}
          </div>

          {/* Payment Section */}
          <div style={{ marginTop: "30px", borderTop: "1px solid var(--card-border)", paddingTop: "25px" }}>
            <p style={{ marginBottom: "12px", fontWeight: "700" }}>📷 แนบหลักฐานการโอนเงิน (สลิป):</p>
            <div style={{ position: 'relative' }}>
               <input type="file" className="input-glass" style={{ padding: "10px" }} onChange={handleSlipUpload} accept="image/*" />
            </div>
            {slipPreview && (
              <div style={{ marginTop: '15px', position: 'relative' }}>
                <img src={slipPreview} alt="slip preview" style={{ width: "100%", borderRadius: "12px", border: "2px solid var(--primary)" }} />
                <p style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '5px' }}>ตรวจสอบความถูกต้องก่อนกดยืนยัน</p>
              </div>
            )}
          </div>

          <button 
            onClick={confirmPayment} 
            disabled={loading || cartItems.length === 0} 
            className="btn-success" 
            style={{ 
              width: "100%", 
              padding: "18px", 
              marginTop: "25px", 
              fontSize: "18px", 
              fontWeight: '800',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            {loading ? "📦 กำลังบันทึกออเดอร์..." : "ยืนยันการสั่งซื้อ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;