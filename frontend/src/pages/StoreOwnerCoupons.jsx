import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sanitizeInput } from "../utils/sanitize";

function StoreOwnerCoupons() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();

  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState("percent");
  const [couponValue, setCouponValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!authLoading && authUser) {
      checkStoreOwner();
      fetchCoupons();
    }
  }, [authUser, authLoading]);

  const checkStoreOwner = async () => {
    if (!authUser?.id) {
      navigate("/login");
      return;
    }

    try {
      const { data } = await supabase.from("users").select("role").eq("id", authUser.id).maybeSingle();
      if (!data || (data.role !== "store_owner" && data.role !== "admin")) {
        alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        navigate("/");
      }
    } catch (err) {
      console.error("Store owner check error:", err);
      navigate("/");
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching coupons for store_owner_id:", authUser.id);
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_owner_id", authUser.id);
      
      if (error) {
        console.error("❌ Fetch error:", error);
        setCoupons([]);
      } else {
        console.log("✅ Fetched coupons:", data);
        setCoupons(data || []);
      }
    } catch (err) {
      console.error("Fetch coupons error:", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCoupon = async () => {
    if (!couponCode || couponValue === "") {
      return alert("❌ กรอกข้อมูลให้ครบ");
    }

    if (couponType === "percent" && (couponValue < 0 || couponValue > 100)) {
      return alert("❌ ส่วนลดเปอร์เซ็นต์ต้องอยู่ระหว่าง 0-100");
    }

    if (couponType === "fixed" && couponValue <= 0) {
      return alert("❌ ส่วนลดแบบจำนวนเงินต้องมากกว่า 0");
    }

    try {
      setLoading(true);

      if (editId) {
        // อัปเดตคูปอง
        const { error } = await supabase
          .from("coupons")
          .update({
            code: sanitizeInput(couponCode.toUpperCase()),
            type: couponType,
            value: Number(couponValue),
            expires_at: expiresAt || null
          })
          .eq("id", editId);

        if (error) throw error;
        alert("✅ อัปเดตคูปองแล้ว");
        setEditId(null);
      } else {
        // สร้างคูปองใหม่
        const { error } = await supabase
          .from("coupons")
          .insert([{
            code: sanitizeInput(couponCode.toUpperCase()),
            type: couponType,
            value: Number(couponValue),
            expires_at: expiresAt || null,
            store_owner_id: authUser.id,
            is_active: true
          }]);

        if (error) throw error;
        alert("✅ สร้างคูปองแล้ว");
      }

      resetForm();
      fetchCoupons();
    } catch (err) {
      alert("❌ " + (err.message || "Save failed"));
    } finally {
      setLoading(false);
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("❓ ยืนยันการลบคูปอง?")) return;

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      alert("✅ ลบคูปองแล้ว");
      fetchCoupons();
    } catch (err) {
      alert("❌ ลบคูปองไม่สำเร็จ");
    }
  };

  const handleEdit = (coupon) => {
    setEditId(coupon.id);
    setCouponCode(coupon.code);
    setCouponType(coupon.type);
    setCouponValue(coupon.value);
    setExpiresAt(coupon.expires_at || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setCouponCode("");
    setCouponType("percent");
    setCouponValue("");
    setExpiresAt("");
    setEditId(null);
  };

  return (
    <div className="page-container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800" }}>🎫 จัดการคูปองของฉัน</h1>
        <button
          onClick={() => navigate("/store/dashboard")}
          className="btn-primary"
          style={{ padding: "12px 24px", fontSize: "14px", borderRadius: "10px" }}
        >
          ← กลับ
        </button>
      </div>

      {/* FORM */}
      <div className="glass-card" style={{ padding: "30px", marginBottom: "40px" }}>
        <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>
          {editId ? "📝 แก้ไขคูปอง" : "🎫 สร้างคูปองใหม่"}
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            className="input-glass"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="รหัสคูปอง (เช่น SAVE50)"
            maxLength="20"
          />

          <div style={{ display: "flex", gap: "15px" }}>
            <select
              className="input-glass"
              value={couponType}
              onChange={(e) => setCouponType(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="percent">% ลดเปอร์เซ็นต์</option>
              <option value="fixed">฿ ลดแบบจำนวนเงิน</option>
            </select>

            <input
              type="number"
              className="input-glass"
              style={{ flex: 1 }}
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
              placeholder={couponType === "percent" ? "ลดเปอร์เซ็นต์ (0-100)" : "ลดจำนวนเงิน"}
              min="0"
              max={couponType === "percent" ? "100" : undefined}
            />
          </div>

          <input
            type="datetime-local"
            className="input-glass"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            placeholder="วันหมดอายุคูปอง (ไม่จำเป็น)"
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={saveCoupon}
              className="btn-success"
              style={{ flex: 1, padding: "12px" }}
              disabled={loading}
            >
              {loading ? "⏳ กำลังบันทึก..." : editId ? "💾 อัปเดตคูปอง" : "➕ สร้างคูปอง"}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="btn-primary"
                style={{ flex: 1, padding: "12px", background: "transparent", color: "var(--text-main)", border: "1px solid var(--card-border)" }}
              >
                ❌ ยกเลิก
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COUPONS LIST */}
      <div>
        <h2 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: "bold" }}>🎟 คูปองของฉัน ({coupons.length})</h2>
        
        {coupons.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>ยังไม่มีคูปอง</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {coupons.map((coupon) => (
              <div key={coupon.id} className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                      <div style={{
                        background: "rgba(37, 99, 235, 0.1)",
                        border: "2px dashed var(--primary)",
                        borderRadius: "8px",
                        padding: "10px 15px",
                        minWidth: "120px",
                        textAlign: "center"
                      }}>
                        <h3 style={{ fontSize: "18px", color: "var(--primary)", margin: 0, fontWeight: "bold" }}>
                          {coupon.code}
                        </h3>
                      </div>
                      <div>
                        <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "var(--text-main)" }}>
                          ลด {coupon.type === "percent" ? `${coupon.value}%` : `${coupon.value} บาท`}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "5px 0 0 0" }}>
                          {coupon.is_active ? "✅ เปิดใช้งาน" : "❌ ปิดใช้งาน"}
                        </p>
                      </div>
                    </div>
                    {coupon.description && (
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "10px 0 0 0" }}>
                        {coupon.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="btn-primary"
                      style={{ padding: "8px 16px", fontSize: "13px", background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="btn-primary"
                      style={{ padding: "8px 16px", fontSize: "13px", background: "var(--danger)20", color: "var(--danger)", border: "1px solid var(--danger)" }}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreOwnerCoupons;
