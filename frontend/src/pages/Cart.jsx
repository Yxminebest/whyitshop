import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { uploadSlip } from "../utils/uploadSlip";

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
    if (!coupon || !user) return alert("❌ กรุณาเข้าสู่ระบบก่อน");
    setMessage({ text: "กำลังตรวจสอบ...", type: "" });
    
    // 1️⃣ ตรวจสอบคูปองพื้นฐาน
    const { data: couponData, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (couponError || !couponData) {
      setDiscount(0);
      setMessage({ text: "❌ คูปองไม่ถูกต้อง หรือหมดอายุ", type: "error" });
      return;
    }

    // 2️⃣ ตรวจสอบ expiry date
    if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
      setDiscount(0);
      setMessage({ text: "❌ คูปองนี้หมดอายุแล้ว", type: "error" });
      return;
    }

    // 3️⃣ ตรวจสอบ minimum purchase requirement
    if (couponData.min_purchase && totalPrice < couponData.min_purchase) {
      setDiscount(0);
      setMessage({ text: `❌ ต้องซื้อขั้นต่ำ ${couponData.min_purchase} บาท`, type: "error" });
      return;
    }

    // 4️⃣ ตรวจสอบ usage limit - check if user already used
    const { data: usedBefore } = await supabase
      .from("coupon_usage")
      .select("id")
      .eq("coupon_id", couponData.id)
      .eq("user_id", user.id)
      .single();

    if (usedBefore) {
      setDiscount(0);
      setMessage({ text: "❌ คุณใช้คูปองนี้ไปแล้ว (ลูกค้าหนึ่งราย ใช้ได้ครั้งเดียว)", type: "error" });
      return;
    }

    // 5️⃣ ตรวจสอบ max usage for all customers
    if (couponData.max_usage > 0 && couponData.current_usage >= couponData.max_usage) {
      setDiscount(0);
      setMessage({ text: "❌ คูปองนี้ถูกใช้จนถึงขีดจำกัดแล้ว", type: "error" });
      return;
    }

    // ✅ ทั้งหมดผ่าน ปรับใช้คูปอง
    const discountValue = couponData.type === "percent" 
      ? (totalPrice * couponData.value) / 100 
      : couponData.value;
    
    setDiscount(discountValue);
    setMessage({ 
      text: `✅ ใช้คูปอง ${coupon} ส่วนลด ${couponData.value}${couponData.type === 'percent' ? '%' : ' บาท'} สำเร็จ`, 
      type: "success" 
    });
  };

  const handleSlipUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSlipFile(null);
      setSlipPreview(null);
      return;
    }
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
      navigate("/login");
      return;
    }
    console.log("📸 Slip file selected:", file.name, file.type, file.size);
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const confirmPayment = async () => {
    if (!user) return navigate("/login");
    if (cartItems.length === 0) return alert("ไม่มีสินค้าในตะกร้า");
    if (!slipFile) return alert("กรุณาแนบหลักฐานการโอนเงิน (สลิป)");

    try {
      setLoading(true);
      
      // ✅ Verify stock before payment
      const { data: products } = await supabase
        .from("products")
        .select("id, stock")
        .in("id", cartItems.map(i => i.id));

      for (let item of cartItems) {
        const product = products?.find(p => p.id === item.id);
        if (!product || product.stock < (item.qty || 1)) {
          return alert(`❌ สินค้า "${item.name}" มี stock ไม่เพียงพอ (เหลือ ${product?.stock || 0} ชิ้น)`);
        }
      }
      
      // ✅ Upload slip with strict validation
      let publicUrl;
      try {
        publicUrl = await uploadSlip(slipFile, user.id);
      } catch (uploadErr) {
        return alert(uploadErr.message);
      }

      // ✅ Create order record
      const { data: orderInsertData, error: orderError } = await supabase
        .from("orders")
        .insert([{ 
          user_id: user.id, 
          total_price: finalPrice, 
          status: "pending", 
          slip_url: publicUrl 
        }]);

      if (orderError) return alert("❌ บันทึกออเดอร์ไม่สำเร็จ: " + orderError.message);

      // Fetch the created order to get its ID
      const { data: orderData, error: fetchError } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("slip_url", publicUrl)
        .maybeSingle();

      if (fetchError || !orderData) return alert("❌ ไม่สามารถดึงข้อมูลออเดอร์");

      // ✅ Create order items (auto decrease stock via trigger)
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id, 
        product_id: item.id, 
        name: item.name, 
        quantity: item.qty || 1, 
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) return alert("❌ บันทึกรายการสินค้าไม่สำเร็จ");

      // ✅ บันทึกการใช้คูปอง (ถ้ามี)
      if (discount > 0 && coupon) {
        const { data: couponData } = await supabase
          .from("coupons")
          .select("id")
          .eq("code", coupon.toUpperCase())
          .single();

        if (couponData) {
          await supabase.from("coupon_usage").insert({
            coupon_id: couponData.id,
            user_id: user.id,
            order_id: orderData.id
          });
        }
      }

      alert("🎉 สั่งซื้อสำเร็จ! กรุณารอแอดมินตรวจสอบสลิป");
      setCartItems([]);
      localStorage.removeItem("cart");
      navigate("/my-orders");
    } catch (err) {
      alert("❌ เกิดข้อผิดพลาดในการสั่งซื้อ: " + err.message);
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

          {/* ส่วนข้อมูลบัญชีธนาคาร */}
          <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "20px", background: "rgba(59, 130, 246, 0.1)", padding: "20px", borderRadius: "12px" }}>
            <h3 style={{ marginBottom: "12px", fontWeight: "bold", color: "var(--primary)" }}>🏦 ข้อมูลธนาคาร:</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
              <p><strong>ธนาคาร:</strong> <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--primary)" }}>กสิกรไทย (Kasikornbank)</span></p>
              <p><strong>ชื่อบัญชี:</strong> <span style={{ fontSize: "16px", fontWeight: "bold" }}>WHY IT SHOP</span></p>
              <p><strong>เลขบัญชี:</strong> <span style={{ fontSize: "16px", fontFamily: "monospace", fontWeight: "bold", color: "var(--primary)" }}>123-4-567890-1</span></p>
            </div>
            <p style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>⚠️ กรุณาโอนเงินตรงตามจำนวนที่ระบุด้านบน</p>
          </div>

          {/* ส่วนอัปโหลดสลิป */}
          <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "20px" }}>
            <p style={{ marginBottom: "12px", fontWeight: "bold" }}>📸 แนบหลักฐานการโอนเงิน:</p>
            <input type="file" className="input-glass" style={{ padding: "8px" }} onChange={handleSlipUpload} accept="image/*" />
            {slipPreview ? (
              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>✅ รูปที่อัปโหลด:</p>
                <img 
                  src={slipPreview} 
                  alt="slip preview" 
                  style={{ 
                    width: "100%", 
                    maxWidth: "250px", 
                    borderRadius: "12px", 
                    border: "3px solid var(--primary)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    objectFit: "contain"
                  }} 
                />
              </div>
            ) : (
              <div style={{ marginTop: "15px", textAlign: "center", padding: "20px", background: "rgba(0,0,0,0.05)", borderRadius: "12px", color: "var(--text-muted)" }}>
                <p>📸 ยังไม่ได้อัปโหลดสลิป</p>
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