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
  const [message, setMessage] = useState("");

  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);

  const [paymentStatus, setPaymentStatus] = useState("ยังไม่ชำระเงิน");

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

  /* ================= COUPON (DB) ================= */

  const applyCoupon = async () => {
    if (!coupon) {
      setMessage("กรุณากรอกโค้ด");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setDiscount(0);
        setMessage("คูปองไม่ถูกต้อง");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setDiscount(0);
        setMessage("คูปองหมดอายุ");
        return;
      }

      let discountValue = 0;

      if (data.type === "percent") {
        discountValue = (totalPrice * data.value) / 100;
      } else {
        discountValue = data.value;
      }

      setDiscount(discountValue);
      setMessage(`ใช้คูปอง ${data.code} สำเร็จ`);
    } catch (err) {
      console.log(err);
      setMessage("เกิดข้อผิดพลาด");
    }
  };

  /* ================= SLIP ================= */

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("อนุญาตเฉพาะไฟล์รูปภาพ");
      return;
    }

    if (file.size > 2000000) {
      alert("ไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
    setPaymentStatus("แนบสลิปแล้ว (รอตรวจสอบ)");
  };

  /* ================= CONFIRM PAYMENT ================= */

  const confirmPayment = async () => {
    if (!user) {
      alert("กรุณา login ก่อน");
      navigate("/login");
      return;
    }

    if (!slipFile) {
      alert("กรุณาแนบสลิปก่อน");
      return;
    }

    try {
      const fileName = `${user.id}_${Date.now()}`;

      // upload slip
      const { error: uploadError } = await supabase.storage
        .from("slips")
        .upload(fileName, slipFile);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      // get url
      const { data: urlData } = supabase.storage
        .from("slips")
        .getPublicUrl(fileName);

      const slipUrl = urlData.publicUrl;

      // insert order
      const { error } = await supabase.from("orders").insert([
        {
          email: user.email,
          items: cartItems,
          total_price: finalPrice,
          status: "pending",
          slip: slipUrl,
        },
      ]);

      if (error) {
        alert(error.message);
        return;
      }

      // success
      setPaymentStatus("ชำระเงินแล้ว ✔");
      setCartItems([]); // 🔥 clear cart
      alert("สั่งซื้อสำเร็จ");

      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>🛒 ตะกร้าสินค้า</h1>

      {cartItems.length === 0 ? (
        <p>ยังไม่มีสินค้า</p>
      ) : (
        <>
          {/* PRODUCT LIST */}
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#1e293b",
                padding: "20px",
                marginBottom: "15px",
                borderRadius: "10px",
              }}
            >
              <h3>{item.name}</h3>
              <p>ราคา: {item.price} บาท</p>
              <p>จำนวน: {item.qty}</p>

              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: "red",
                  color: "white",
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ลบสินค้า
              </button>
            </div>
          ))}

          {/* SUMMARY */}
          <div
            style={{
              background: "#020617",
              padding: "25px",
              borderRadius: "12px",
              marginTop: "30px",
              width: "420px",
            }}
          >
            <h2>💰 สรุปรายการ</h2>

            <p>ราคารวม: {totalPrice} บาท</p>
            <p>ส่วนลด: {discount} บาท</p>

            <h2 style={{ color: "#22c55e" }}>
              ราคาสุทธิ: {finalPrice} บาท
            </h2>

            {/* COUPON */}
            <h3 style={{ marginTop: "20px" }}>🎟 คูปอง</h3>

            <input
              type="text"
              placeholder="เช่น WHY10"
              value={coupon}
              onChange={(e) =>
                setCoupon(e.target.value.toUpperCase())
              }
              style={{
                padding: "10px",
                width: "100%",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "none",
              }}
            />

            <button
              onClick={applyCoupon}
              style={{
                background: "#22c55e",
                color: "white",
                padding: "10px",
                border: "none",
                borderRadius: "8px",
                width: "100%",
              }}
            >
              ใช้คูปอง
            </button>

            {message && <p style={{ marginTop: "10px" }}>{message}</p>}

            {/* PAYMENT */}
            <h3 style={{ marginTop: "30px" }}>💳 ช่องทางการชำระเงิน</h3>

            <div
              style={{
                background: "#1e293b",
                padding: "15px",
                borderRadius: "10px",
                marginTop: "10px",
              }}
            >
              <p>ธนาคารกสิกรไทย</p>
              <p>เลขบัญชี: 123-4-56789-0</p>
              <p>ชื่อบัญชี: WHY IT SHOP</p>
            </div>

            {/* SLIP */}
            <h3 style={{ marginTop: "25px" }}>📄 แนบสลิป</h3>

            <input
              type="file"
              accept="image/*"
              onChange={handleSlipUpload}
            />

            {slipPreview && (
              <img
                src={slipPreview}
                alt="slip"
                style={{
                  width: "200px",
                  marginTop: "10px",
                  borderRadius: "10px",
                }}
              />
            )}

            <p style={{ marginTop: "10px" }}>
              สถานะ: {paymentStatus}
            </p>

            <button
              onClick={confirmPayment}
              style={{
                background: "#2563eb",
                color: "white",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                width: "100%",
                marginTop: "10px",
              }}
            >
              ยืนยันการชำระเงิน
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;