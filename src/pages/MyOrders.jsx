import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const statusSteps = ["pending", "paid", "shipped", "completed"];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("orders")
        .select(`*, order_items (*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSlipUrl = (path) => {
    if (!path) return null;
    return supabase.storage.from("slips").getPublicUrl(path).data.publicUrl;
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
      <div style={{ display: "flex", alignItems: "center", margin: "25px 0", flexWrap: "wrap" }}>
        {statusSteps.map((step, index) => {
          const active = index <= currentIndex;
          const isLast = index === statusSteps.length - 1;

          return (
            <div key={step} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: active ? "var(--accent)" : "var(--text-muted)", transition: "0.3s", boxShadow: active ? "0 0 12px var(--accent)" : "none" }} />
                <span style={{ fontSize: "12px", fontWeight: "bold", color: active ? "var(--accent)" : "var(--text-muted)" }}>{step.toUpperCase()}</span>
              </div>
              {!isLast && (
                <div style={{ width: "50px", height: "3px", margin: "0 10px", transform: "translateY(-12px)", background: active ? "var(--accent)" : "var(--card-border)", transition: "0.3s" }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px", fontWeight: "800" }}>🧾 ประวัติการสั่งซื้อ</h1>

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "50px", color: "var(--text-muted)" }}>กำลังโหลดข้อมูล...</p>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "50px 20px" }}>
          <h3 style={{ color: "var(--text-muted)", fontWeight: "normal" }}>คุณยังไม่มีประวัติการสั่งซื้อ 🛒</h3>
        </div>
      ) : (
        orders.map((order) => {
          const slipUrl = getSlipUrl(order.slip);
          const orderDate = new Date(order.created_at).toLocaleString("th-TH");

          return (
            <div key={order.id} className="glass-card" style={{ marginBottom: "25px", padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px" }}>Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{orderDate}</span>
              </div>

              <p style={{ color: "var(--accent)", fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>💰 ยอดรวม: {order.total_price} บาท</p>

              {renderTimeline(order.status)}

              <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "12px", marginTop: "20px", border: "1px solid var(--card-border)" }}>
                <strong style={{ display: "block", marginBottom: "15px" }}>รายการสินค้า:</strong>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{ background: "var(--card-bg)", padding: "12px 15px", marginBottom: "10px", borderRadius: "8px", borderLeft: "4px solid var(--primary)" }}>
                    🛍 {item.name || `รหัสสินค้า: ${item.product_id}`}
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "5px", marginLeft: "24px" }}>
                      {item.price} บาท × {item.quantity} ชิ้น
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "12px", marginTop: "20px", border: "1px solid var(--card-border)" }}>
                <strong style={{ display: "block", marginBottom: "10px" }}>หลักฐานการโอนเงิน:</strong>
                {slipUrl ? (
                  <img src={slipUrl} alt="slip" onClick={() => setSelectedSlip(slipUrl)} style={{ width: "120px", height: "180px", objectFit: "cover", borderRadius: "10px", cursor: "pointer", border: "2px solid var(--card-border)", transition: "0.2s" }} />
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>ไม่มีสลิปแนบมา</p>
                )}
              </div>
            </div>
          );
        })
      )}

      {selectedSlip && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, cursor: "pointer" }} onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} alt="slip full" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "12px", boxShadow: "0 0 30px rgba(0,0,0,0.8)" }} />
        </div>
      )}
    </div>
  );
}

export default MyOrders;