import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const statusSteps = ["pending", "paid", "shipped", "completed"];

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("orders")
          .select(`*, order_items (*)`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setOrders(data || []);
        }
      } catch (err) {
        console.error("Fetch orders error:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const getSlipUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from("slips").getPublicUrl(path);
    return data?.publicUrl;
  };

  const renderTimeline = (status) => {
    if (status === "cancelled") {
      return (
        <div style={{ padding: "12px 20px", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "1px solid var(--danger)", borderRadius: "10px", fontWeight: "bold", margin: "20px 0", display: "inline-block" }}>
          ❌ ออเดอร์นี้ถูกยกเลิกแล้ว
        </div>
      );
    }

    const currentIndex = statusSteps.indexOf(status);

    return (
      <div style={{ display: "flex", alignItems: "center", margin: "25px 0", flexWrap: "wrap", gap: "10px" }}>
        {statusSteps.map((step, index) => {
          const active = index <= currentIndex;
          const isLast = index === statusSteps.length - 1;

          return (
            <div key={step} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ 
                  width: "18px", 
                  height: "18px", 
                  borderRadius: "50%", 
                  background: active ? "var(--accent)" : "rgba(255,255,255,0.1)", 
                  transition: "0.3s", 
                  boxShadow: active ? "0 0 15px var(--accent)" : "none",
                  border: active ? "none" : "2px solid var(--card-border)" 
                }} />
                <span style={{ 
                  fontSize: "11px", 
                  fontWeight: "800", 
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  textTransform: 'uppercase'
                }}>{step}</span>
              </div>
              {!isLast && (
                <div style={{ 
                  width: "40px", 
                  height: "3px", 
                  margin: "0 5px", 
                  transform: "translateY(-12px)", 
                  background: active ? "var(--accent)" : "var(--card-border)", 
                  transition: "0.3s",
                  borderRadius: '2px'
                }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading) return <div style={{ color: "white", textAlign: "center", padding: "100px" }}>กำลังดึงข้อมูลประวัติ...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: "30px", fontWeight: "800", fontSize: '2.2rem' }}>🧾 ประวัติการสั่งซื้อ</h1>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "50px", color: "var(--text-muted)" }}>กำลังโหลดข้อมูลออเดอร์...</p>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px", borderRadius: '20px' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>🛒</div>
          <h3 style={{ color: "var(--text-muted)", fontWeight: "500" }}>คุณยังไม่มีประวัติการสั่งซื้อเลย</h3>
          <button onClick={() => window.location.href='/products'} className="btn-primary" style={{ marginTop: '20px' }}>เริ่มช้อปปิ้งเลย</button>
        </div>
      ) : (
        orders.map((order) => {
          const slipUrl = getSlipUrl(order.slip);
          const orderDate = new Date(order.created_at).toLocaleString("th-TH", {
            dateStyle: 'medium',
            timeStyle: 'short'
          });

          return (
            <div key={order.id} className="glass-card" style={{ marginBottom: "30px", padding: "35px", borderRadius: '20px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--card-border)", paddingBottom: "20px", marginBottom: "25px" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: '800', marginBottom: '5px' }}>
                    Order <span style={{ color: 'var(--primary)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                  </h3>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>📅 สั่งซื้อเมื่อ: {orderDate}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ color: "var(--accent)", fontSize: "24px", fontWeight: "900", margin: 0 }}>
                    {Number(order.total_price).toLocaleString()} <span style={{ fontSize: '14px' }}>บาท</span>
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>สถานะปัจจุบัน:</strong>
                {renderTimeline(order.status)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '20px' }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "15px", border: "1px solid var(--card-border)" }}>
                  <strong style={{ display: "block", marginBottom: "15px", fontSize: '15px' }}>📦 รายการสินค้า ({order.order_items?.length || 0})</strong>
                  {order.order_items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: "10px 0", borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '14px' }}>{item.name} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{Number(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: "block", marginBottom: "10px", fontSize: '14px' }}>📄 สลิป</strong>
                  {slipUrl ? (
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedSlip(slipUrl)}>
                      <img src={slipUrl} alt="slip" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "12px", border: "2px solid var(--card-border)", transition: 'transform 0.2s' }} />
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', fontSize: '10px', padding: '5px 0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>คลิกเพื่อขยาย</div>
                    </div>
                  ) : (
                    <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>ไม่มีสลิป</div>
                  )}
                </div>
              </div>
            </div>
          );
        }) // ปิด map
      )} {/* ปิดเงื่อนไข loading/orders.length */}

      {selectedSlip && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999, cursor: "zoom-out" }} onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} alt="slip full" style={{ maxWidth: "95%", maxHeight: "95%", borderRadius: "10px", border: '2px solid white' }} />
        </div>
      )}
    </div>
  );
}

export default MyOrders;