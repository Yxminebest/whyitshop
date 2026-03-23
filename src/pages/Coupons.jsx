import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Coupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    // ดึงเฉพาะคูปองที่ยังเปิดใช้งานอยู่ (is_active: true)
    const { data } = await supabase.from("coupons").select("*").eq("is_active", true);
    setCoupons(data || []);
  };

  const claimCoupon = (code) => {
    localStorage.setItem("coupon", code);
    alert(`🎉 รับคูปอง ${code} เรียบร้อยแล้ว!\nระบบจะกรอกโค้ดนี้อัตโนมัติในหน้าตะกร้าสินค้า`);
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px", fontWeight: "800" }}>🎟 คูปองส่วนลดพิเศษ</h1>

      {coupons.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "50px" }}>
          ยังไม่มีคูปองที่เปิดใช้งานในขณะนี้
        </p>
      ) : (
        <div className="product-grid">
          {coupons.map((c) => (
            <div key={c.id} className="glass-card" style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ background: "var(--bg-secondary)", border: "2px dashed var(--primary)", borderRadius: "12px", padding: "15px", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "28px", color: "var(--primary)", letterSpacing: "2px", margin: 0 }}>
                  {c.code}
                </h2>
              </div>
              
              <p style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "20px" }}>
                มูลค่าส่วนลด: <strong style={{ color: "var(--accent)" }}>{c.type === "percent" ? `${c.value}%` : `${c.value} บาท`}</strong>
              </p>

              <button
                className="btn-success"
                style={{ width: "100%", padding: "12px", fontSize: "16px" }}
                onClick={() => claimCoupon(c.code)}
              >
                เก็บคูปอง
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Coupons;