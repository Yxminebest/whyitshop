import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AdminOrders() {
  /* ================= STATE ================= */
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [selectedSlip, setSelectedSlip] = useState(null);

  /* ================= FETCH ORDERS ================= */
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // ✅ ดึงข้อมูล order พร้อมกับ order_items ทั้งหมด
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        alert("โหลดข้อมูลไม่สำเร็จ");
        return;
      }

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

  /* ================= GET SLIP URL ================= */
  const getSlipUrl = (path) => {
    if (!path) return null;

    const { data } = supabase.storage
      .from("slips")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        alert("❌ เปลี่ยนสถานะไม่สำเร็จ");
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= STATUS COLOR ================= */
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#facc15";
      case "paid":
        return "#38bdf8";
      case "shipped":
        return "#a78bfa";
      case "completed":
        return "#22c55e";
      case "cancelled":
        return "#ef4444";
      default:
        return "white";
    }
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <div style={header}>
        <h1>📦 Admin Orders</h1>

        <button style={refreshBtn} onClick={fetchOrders}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : orders.length === 0 ? (
        <p>ไม่มีออเดอร์</p>
      ) : (
        orders.map((order) => {
          const slipUrl = getSlipUrl(order.slip);

          return (
            <div key={order.id} style={card}>
              {/* HEADER */}
              <div style={topRow}>
                <h3>🧾 {order.id.slice(0, 8)}...</h3>

                <span
                  style={{
                    color: getStatusColor(order.status),
                    fontWeight: "bold",
                  }}
                >
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* INFO */}
              <p style={priceText}>💰 {order.total_price} บาท</p>
              <p style={userText}>👤 User ID: {order.user_id}</p>

              {/* ITEMS */}
              <div style={{ marginTop: "15px" }}>
                <strong>รายการสินค้า:</strong>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={productItem}>
                    🛍 {item.name || `รหัส: ${item.product_id}`}
                    <div style={meta}>
                      {item.price} บาท × {item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* SLIP */}
              <div style={{ marginTop: "15px" }}>
                <strong>สลิปโอนเงิน:</strong>

                {slipUrl ? (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={slipUrl}
                      alt="slip"
                      style={slipImg}
                      onClick={() => setSelectedSlip(slipUrl)}
                    />
                  </div>
                ) : (
                  <p style={{ opacity: 0.6, fontSize: "14px", marginTop: "5px" }}>
                    ไม่มีสลิปแนบมา
                  </p>
                )}
              </div>

              {/* STATUS CONTROL */}
              <div style={{ marginTop: "20px", borderTop: "1px solid #334155", paddingTop: "15px" }}>
                <strong style={{ marginRight: "10px" }}>อัปเดตสถานะ:</strong>
                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus(order.id, e.target.value)
                  }
                  disabled={updatingId === order.id}
                  style={select}
                >
                  <option value="pending">Pending (รอตรวจสอบ)</option>
                  <option value="paid">Paid (ชำระเงินแล้ว)</option>
                  <option value="shipped">Shipped (จัดส่งแล้ว)</option>
                  <option value="completed">Completed (สำเร็จ)</option>
                  <option value="cancelled">Cancelled (ยกเลิก)</option>
                </select>
              </div>
            </div>
          );
        })
      )}

      {/* 🔥 MODAL (แสดงรูปสลิปเต็มจอ) */}
      {selectedSlip && (
        <div style={modal} onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} alt="full slip" style={modalImg} />
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

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const refreshBtn = {
  background: "#38bdf8",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  color: "white",
  fontWeight: "bold",
};

const card = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
  marginTop: "20px",
  border: "1px solid #1e293b",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #1e293b",
  paddingBottom: "10px",
  marginBottom: "10px",
};

const priceText = {
  color: "#22c55e",
  fontSize: "18px",
  fontWeight: "bold",
  marginTop: "5px",
};

const userText = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "5px",
};

const productItem = {
  background: "#1e293b",
  padding: "10px 15px",
  marginTop: "8px",
  borderRadius: "8px",
};

const meta = {
  fontSize: "13px",
  opacity: 0.8,
  marginTop: "4px",
  marginLeft: "22px",
};

const select = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#1e293b",
  color: "white",
  cursor: "pointer",
  outline: "none",
};

const slipImg = {
  width: "120px",
  height: "180px",
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

export default AdminOrders;