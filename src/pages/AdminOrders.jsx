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
                <h3>🧾 {order.id}</h3>

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
              <p>💰 {order.total_price} บาท</p>
              <p>👤 {order.user_id}</p>

              {/* ITEMS */}
              <div style={{ marginTop: "10px" }}>
                <strong>สินค้า:</strong>
                {order.order_items?.map((item) => (
                  <div key={item.id}>
                    - {item.product_id} (x{item.quantity})
                  </div>
                ))}
              </div>

              {/* SLIP */}
              <div style={{ marginTop: "15px" }}>
                <strong>สลิป:</strong>

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
                  <p style={{ opacity: 0.6 }}>ไม่มีสลิป</p>
                )}
              </div>

              {/* STATUS CONTROL */}
              <div style={{ marginTop: "15px" }}>
                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus(order.id, e.target.value)
                  }
                  disabled={updatingId === order.id}
                  style={select}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          );
        })
      )}

      {/* 🔥 MODAL */}
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
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const refreshBtn = {
  background: "#38bdf8",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  color: "white",
};

const card = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
  marginTop: "20px",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const select = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
};

const slipImg = {
  width: "120px",
  borderRadius: "8px",
  cursor: "pointer",
  border: "2px solid #1e293b",
};

const modal = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const modalImg = {
  maxWidth: "90%",
  maxHeight: "90%",
  borderRadius: "10px",
};

export default AdminOrders;