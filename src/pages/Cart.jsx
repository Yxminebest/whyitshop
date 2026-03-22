import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Cart() {
  const { cartItems, removeFromCart, setCartItems } =
    useContext(CartContext);

  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [user, setUser] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("");
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= CALCULATE ================= */
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const finalPrice = Math.max(totalPrice - discount, 0);

  /* ================= GET USER ================= */
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    getUser();
  }, []);

  /* ================= COUPON ================= */
  const applyCoupon = async () => {
    setMessage("");

    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) {
      setDiscount(0);
      setMessage("❌ คูปองไม่ถูกต้อง");
      return;
    }

    const discountValue =
      data.type === "percent"
        ? (totalPrice * data.value) / 100
        : data.value;

    setDiscount(discountValue);
    setMessage("✅ ใช้คูปองสำเร็จ");
  };

  /* ================= SLIP ================= */
  const handleSlipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🔥 กันตั้งแต่เลือกไฟล์ (สำคัญ)
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนอัปโหลด ❌");
      navigate("/login");
      return;
    }

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  /* ================= PAYMENT ================= */
  const confirmPayment = async () => {
    // 🔥 เช็ค login ซ้ำ (กัน 2 ชั้น)
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return navigate("/login");
    }

    if (!slipFile) {
      alert("กรุณาแนบสลิป");
      return;
    }

    try {
      setLoading(true);

      /* 🔥 path = user.id (ตรงกับ policy) */
      const filePath = `${user.id}/${Date.now()}_${slipFile.name}`;

      /* 🔥 upload */
      const { error: uploadError } = await supabase.storage
        .from("slips")
        .upload(filePath, slipFile);

      if (uploadError) {
        console.error(uploadError);
        alert("อัปโหลดไม่สำเร็จ ❌");
        return;
      }

      /* 🔥 insert order */
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            total_price: finalPrice,
            status: "pending",
            slip: filePath,
            user_id: user.id,
          },
        ])
        .select();

      if (orderError) throw orderError;

      const order = orderData[0];

      /* 🔥 insert order items */
      const { error: itemError } = await supabase
        .from("order_items")
        .insert(
          cartItems.map((i) => ({
            order_id: order.id,
            product_id: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty,
          }))
        );

      if (itemError) throw itemError;

      setCartItems([]);
      alert("🎉 ชำระเงินสำเร็จ");
      navigate("/");

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <div style={wrapper}>
        {/* LEFT */}
        <div style={left}>
          <h2>🛒 สินค้า</h2>

          {cartItems.length === 0 ? (
            <p>ยังไม่มีสินค้า</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} style={itemCard}>
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.price} บาท x {item.qty}</p>
                </div>

                <button
                  style={btnRed}
                  onClick={() => removeFromCart(item.id)}
                >
                  ลบ
                </button>
              </div>
            ))
          )}
        </div>

        {/* RIGHT */}
        <div style={right}>
          <h2>💳 สรุป</h2>

          <div style={row}>
            <span>รวม</span>
            <span>{totalPrice} บาท</span>
          </div>

          <div style={row}>
            <span>ส่วนลด</span>
            <span>-{discount} บาท</span>
          </div>

          <div style={total}>
            <span>สุทธิ</span>
            <span>{finalPrice} บาท</span>
          </div>

          <input
            placeholder="ใส่คูปอง"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            style={input}
          />

          <button onClick={applyCoupon} style={btnGreen}>
            ใช้คูปอง
          </button>

          {message && <p>{message}</p>}

          <input type="file" onChange={handleSlipUpload} />

          {slipPreview && (
            <img src={slipPreview} style={preview} alt="slip" />
          )}

          <button
            onClick={confirmPayment}
            style={btnBlue}
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  padding: "20px",
  background: "#020617",
  minHeight: "100vh",
  color: "white",
};

const wrapper = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "20px",
};

const left = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
};

const right = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
};

const itemCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#1e293b",
  padding: "15px",
  marginTop: "10px",
  borderRadius: "10px",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
};

const total = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "15px",
  fontSize: "18px",
  color: "#22c55e",
};

const input = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px",
};

const preview = {
  width: "100%",
  marginTop: "10px",
  borderRadius: "10px",
};

const btnGreen = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "#22c55e",
  borderRadius: "8px",
};

const btnBlue = {
  width: "100%",
  marginTop: "10px",
  padding: "12px",
  background: "#2563eb",
  borderRadius: "8px",
};

const btnRed = {
  background: "red",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
};

export default Cart;