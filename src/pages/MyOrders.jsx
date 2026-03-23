import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const statusSteps = ["pending", "paid", "shipped", "completed"];

  /* ================= FETCH ================= */
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= SLIP ================= */
  const getSlipUrl = (path) => {
    if (!path) return null;
    return supabase.storage.from("slips").getPublicUrl(path).data.publicUrl;
  };

  /* ================= TIMELINE ================= */
  const renderTimeline = (status) => {
    // 🔥 ถ้าสถานะถูกยกเลิก ให้แสดงข้อความสีแดงแทน Timeline
    if (status === "cancelled") {
      return (
        <div style={cancelledAlert}>
          ❌ ออเดอร์นี้ถูกยกเลิกแล้ว
        </div>
      );
    }

    const currentIndex = statusSteps.indexOf(status);

    return (
      <div style={timeline}>
        {statusSteps.map((step, index) => {
          const active = index <= currentIndex;
          const isLast = index === statusSteps.length - 1;

          return (
            <div key={step} style={timelineItem}>
              {/* จุดและข้อความ */}
              <div style={stepBox}>
                <div
                  style={{
                    ...dot,
                    background: active ? "#22c55e" : "#475569",
                    boxShadow: active ? "0 0 10px #22c55e" : "none"
                  }}
                />
                <span style={{ ...label, color: active ? "#22c55e" : "#94a3b8" }}>
                  {step.toUpperCase()}
                </span>
              </div>

              {/* เส้นเชื่อมต่อ (ซ่อนในสเต็ปสุดท้าย) */}
              {!isLast && (
                <div
                  style={{
                    ...line,
                    background: active ? "#22c55e" : "#475569",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <h1>🧾 My Orders (คำสั่งซื้อของฉัน)</h1>

      {loading ? (
        <p style={{ marginTop: "20px" }}>กำลังโหลดข้อมูล...</p>
      ) : orders.length === 0 ? (
        <div style={emptyBox}>
          <p>คุณยังไม่มีประวัติการสั่งซื้อ 🛒</p>
        </div>
      ) : (
        orders.map((order) => {
          const slipUrl = getSlipUrl(order.slip);
          const orderDate = new Date(order.created_at).toLocaleString("th-TH");

          return (
            <div key={order.id} style={card}>
              <div style={cardHeader}>
                <h3>Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                <span style={dateText}>{orderDate}</span>
              </div>

              <p style={price}>💰 ยอดรวม: {order.total_price} บาท</p>

              {/* 🔥 TIMELINE */}
              {renderTimeline(order.status)}

              {/* PRODUCTS */}
              <div style={sectionBox}>
                <strong style={{ display: "block", marginBottom: "10px" }}>รายการสินค้า:</strong>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={productItem}>
                    🛍 {item.name || `รหัสสินค้า: ${item.product_id}`}
                    <div style={meta}>
                      {item.price} บาท × {item.quantity} ชิ้น
                    </div>
                  </div>
                ))}
              </div>

              {/* SLIP */}
              <div style={sectionBox}>
                <strong>หลักฐานการโอนเงิน:</strong>
                {slipUrl ? (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={slipUrl}
                      style={slipImg}
                      alt="slip"
                      onClick={() => setSelectedSlip(slipUrl)}
                    />
                  </div>
                ) : (
                  <p style={{ opacity: 0.6, fontSize: "14px", marginTop: "5px" }}>ไม่มีสลิปแนบมา</p>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* MODAL (ดูรูปเต็มจอ) */}
      {selectedSlip && (
        <div style={modal} onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} style={modalImg} alt="slip full" />
        </div>
      )}
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  padding: "40px",
  color: "white",
  background: "#020617",
  minHeight: "100vh",
};

const emptyBox = {
  marginTop: "30px",
  padding: "40px",
  background: "#0f172a",
  borderRadius: "12px",
  textAlign: "center",
  color: "#94a3b8",
};

const card = {
  background: "#0f172a",
  padding: "25px",
  borderRadius: "12px",
  marginTop: "20px",
  border: "1px solid #1e293b",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #1e293b",
  paddingBottom: "10px",
  marginBottom: "15px",
};

const dateText = {
  fontSize: "13px",
  color: "#94a3b8",
};

const price = {
  color: "#22c55e",
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "20px",
};

const sectionBox = {
  marginTop: "20px",
  background: "#020617",
  padding: "15px",
  borderRadius: "10px",
};

/* 🔥 TIMELINE STYLE */
const timeline = {
  display: "flex",
  alignItems: "center",
  margin: "25px 0",
  flexWrap: "wrap",
};

const timelineItem = {
  display: "flex",
  alignItems: "center",
};

const stepBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
};

const dot = {
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  transition: "0.3s",
};

const line = {
  width: "50px",
  height: "3px",
  margin: "0 10px",
  transform: "translateY(-12px)", // ดันเส้นขึ้นไปให้ตรงกับจุด
  transition: "0.3s",
};

const label = {
  fontSize: "12px",
  fontWeight: "bold",
};

const cancelledAlert = {
  padding: "10px 15px",
  background: "rgba(239, 68, 68, 0.1)",
  color: "#ef4444",
  border: "1px solid #ef4444",
  borderRadius: "8px",
  fontWeight: "bold",
  margin: "15px 0",
  display: "inline-block",
};

/* PRODUCT & SLIP */
const productItem = {
  background: "#1e293b",
  padding: "12px 15px",
  marginTop: "8px",
  borderRadius: "8px",
  borderLeft: "4px solid #3b82f6",
};

const meta = {
  fontSize: "13px",
  opacity: 0.8,
  marginTop: "5px",
  marginLeft: "24px",
};

const slipImg = {
  width: "100px",
  height: "150px",
  objectFit: "cover",
  borderRadius: "8px",
  cursor: "pointer",
  border: "2px solid #334155",
  transition: "0.2s",
};

const modal = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  cursor: "pointer",
};

const modalImg = {
  maxWidth: "90%",
  maxHeight: "90%",
  borderRadius: "10px",
  boxShadow: "0 0 30px rgba(0,0,0,0.8)",
};

export default MyOrders;