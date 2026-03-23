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
    (sum, item) => sum + item.price * (item.qty || 1),
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
  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      navigate("/login");
      return;
    }

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  /* ================= CHECKOUT ================= */
  const confirmPayment = async () => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return navigate("/login");
    }

    if (cartItems.length === 0) {
      alert("ไม่มีสินค้าในตะกร้า");
      return;
    }

    if (!slipFile) {
      alert("กรุณาแนบสลิป");
      return;
    }

    try {
      setLoading(true);

      /* ================= UPLOAD SLIP ================= */
      const filePath = `${user.id}/${Date.now()}_${slipFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("slips")
        .upload(filePath, slipFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("❌ อัปโหลดสลิปไม่สำเร็จ");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("slips").getPublicUrl(filePath);

      /* ================= INSERT ORDER ================= */
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            total_price: finalPrice,
            status: "pending",
            slip: publicUrl,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error("Order error:", orderError);
        alert("❌ บันทึกออเดอร์ไม่สำเร็จ");
        return;
      }

      console.log("ORDER CREATED:", orderData);

      /* ================= INSERT ORDER ITEMS ================= */
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

      if (itemsError) {
        console.error("Items error:", itemsError);
        alert("❌ บันทึกรายการสินค้าไม่สำเร็จ");
        return;
      }

      /* ================= SUCCESS ================= */
      alert("🎉 สั่งซื้อสำเร็จ");

      setCartItems([]);
      localStorage.removeItem("cart");

      navigate("/my-orders");

    } catch (err) {
      console.error("Checkout error:", err);
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
                  <p>
                    {item.price} บาท x {item.qty}
                  </p>
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
  border: "none",
  cursor: "pointer",
};

const btnBlue = {
  width: "100%",
  marginTop: "10px",
  padding: "12px",
  background: "#2563eb",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};

const btnRed = {
  background: "#ef4444",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
};

export default Cart;