import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCoupons = async () => {
      try {
        setLoading(true);
        // ดึงเฉพาะคูปองที่ยังเปิดใช้งานอยู่ (is_active: true)
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("is_active", true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setCoupons(data || []);
      } catch (err) {
        console.error("Fetch coupons error:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCoupons();

    return () => { isMounted = false; };
  }, []);

  const claimCoupon = (code) => {
    localStorage.setItem("coupon", code);
    alert(`🎉 รับคูปอง ${code} เรียบร้อยแล้ว!\nระบบจะพยายามใช้โค้ดนี้ให้อัตโนมัติเมื่อคุณไปที่หน้าตะกร้าสินค้า`);
  };

  return (
    <div className="page-container" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontWeight: "800", fontSize: '2.8rem', marginBottom: '10px' }}>🎟️ คูปองส่วนลดพิเศษ</h1>
        <p style={{ color: "var(--text-muted)" }}>เลือกรับส่วนลดสุดคุ้ม เพื่ออุปกรณ์ไอทีชิ้นโปรดของคุณ</p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: '50px' }}>กำลังค้นหาคูปองที่ดีที่สุดสำหรับคุณ...</p>
      ) : coupons.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: '1.2rem' }}>
            😔 เสียใจด้วยนะ ตอนนี้ยังไม่มีคูปองเปิดใช้งาน
          </p>
          <button 
            onClick={() => window.location.href='/products'} 
            className="btn-primary" 
            style={{ marginTop: '20px' }}
          >
            ไปดูสินค้าแนะนำแทน
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '25px' 
        }}>
          {coupons.map((c) => (
            <div key={c.id} className="glass-card" style={{ 
              textAlign: "center", 
              padding: "40px 25px",
              borderRadius: '24px',
              position: 'relative',
              border: '1px solid var(--card-border)',
              background: 'var(--bg-card)',
              overflow: 'hidden'
            }}>
              {/* ตกแต่งคูปองให้เหมือนบัตร (Ticket notches) */}
              <div style={{ 
                position: 'absolute', top: '50%', left: '-10px', width: '20px', height: '20px', 
                background: 'var(--bg-nav)', borderRadius: '50%', transform: 'translateY(-50%)' 
              }}></div>
              <div style={{ 
                position: 'absolute', top: '50%', right: '-10px', width: '20px', height: '20px', 
                background: 'var(--bg-nav)', borderRadius: '50%', transform: 'translateY(-50%)' 
              }}></div>

              <div style={{ 
                background: "rgba(56, 189, 248, 0.05)", 
                border: "2px dashed var(--primary)", 
                borderRadius: "16px", 
                padding: "20px", 
                marginBottom: "25px" 
              }}>
                <h2 style={{ 
                  fontSize: "32px", 
                  color: "var(--primary)", 
                  letterSpacing: "3px", 
                  margin: 0,
                  fontWeight: '900'
                }}>
                  {c.code}
                </h2>
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>มูลค่าส่วนลด</p>
                <p style={{ fontSize: "24px", fontWeight: '800', color: "var(--accent)", margin: 0 }}>
                  {c.type === "percent" ? `${c.value}%` : `${Number(c.value).toLocaleString()} บาท`}
                </p>
                {c.type === "percent" && <small style={{ color: 'var(--text-muted)' }}>*ลดจากยอดรวมสินค้า</small>}
              </div>

              <button
                className="btn-success"
                style={{ 
                  width: "100%", 
                  padding: "15px", 
                  fontSize: "16px", 
                  fontWeight: '700',
                  borderRadius: '14px',
                  boxShadow: '0 10px 15px rgba(34, 197, 94, 0.2)'
                }}
                onClick={() => claimCoupon(c.code)}
              >
                🖱️ เก็บคูปองนี้
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Coupons;