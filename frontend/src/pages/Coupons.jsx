import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ดึงคูปองเลย (public data ไม่ต้องรอ auth)
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching coupons using REST API...");
      
      // ใช้ REST API โดยตรง แทน supabase client
      const response = await fetch(
        'https://kslyrllmwbbgcepvotps.supabase.co/rest/v1/coupons?select=*',
        {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHlybGxtd2JiZ2NlcHZvdHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODk5MzMsImV4cCI6MjA4ODg2NTkzM30.ydYIpMDDc2VIALcOCmhBjoRPsy3sfx0eO_yKdKzzzrM',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw data from REST API:", data);
      
      // แสดงทั้งหมด (ไม่ filter - เพื่อดูว่ามี data หรือไม่)
      console.log("All coupons:", data);
      setCoupons(data || []);
    } catch (err) {
      console.error("Fetch coupons error:", err);
      setError("ไม่สามารถโหลดคูปองได้: " + (err.message || JSON.stringify(err)));
      setCoupons([]);
    } finally {
      setLoading(false);
    }
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

      {loading ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "50px" }}>
          กำลังโหลดคูปอง...
        </p>
      ) : error ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p style={{ color: "var(--danger)", marginBottom: "20px" }}>❌ {error}</p>
          <button onClick={fetchCoupons} className="btn-primary">
            ลองใหม่
          </button>
        </div>
      ) : coupons.length === 0 ? (
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