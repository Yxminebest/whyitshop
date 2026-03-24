import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom"; // 🔥 เพิ่มตัวนำทาง

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").eq("is_active", true);
    setCoupons(data || []);
  };

  const claimCoupon = (code) => {
    // 🔥 บันทึกรหัสคูปองลง localStorage
    localStorage.setItem("selectedCoupon", code);
    alert(`🎉 รับคูปอง ${code} เรียบร้อยแล้ว!\nระบบจะกรอกรหัสให้อัตโนมัติในหน้าตะกร้าสินค้า`);
    
    // 🔥 เมื่อกดตกลง ให้วาร์ปไปหน้าตะกร้าทันที
    navigate("/cart");
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px", fontWeight: "800", textAlign: "center" }}>🎟 คูปองส่วนลดพิเศษ</h1>

      {coupons.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "50px" }}>
          ยังไม่มีคูปองที่เปิดใช้งานในขณะนี้
        </p>
      ) : (
        <div className="product-grid">
          {coupons.map((c) => (
            <div key={c.id} className="glass-card" style={{ textAlign: "center", padding: "30px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ background: "rgba(37, 99, 235, 0.1)", border: "2px dashed var(--primary)", borderRadius: "12px", padding: "15px", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "28px", color: "var(--primary)", letterSpacing: "2px", margin: 0 }}>
                    {c.code}
                  </h2>
                </div>
                
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "var(--text-main)", marginBottom: "10px" }}>
                   ส่วนลด: <span style={{ color: "var(--accent)" }}>{c.type === "percent" ? `${c.value}%` : `${c.value.toLocaleString()} บาท`}</span>
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
                   {c.description || "ใช้ได้กับสินค้าทุกรายการ"}
                </p>
              </div>

              <button
                className="btn-success"
                style={{ width: "100%", padding: "12px", fontSize: "16px", fontWeight: "bold" }}
                onClick={() => claimCoupon(c.code)}
              >
                เก็บคูปองและใช้งาน
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Coupons;