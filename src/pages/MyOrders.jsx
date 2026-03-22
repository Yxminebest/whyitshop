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
          order_items (id, name, price, qty)
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
    const currentIndex = statusSteps.indexOf(status);

    return (
      <div style={timeline}>
        {statusSteps.map((step, index) => {
          const active = index <= currentIndex;

          return (
            <div key={step} style={timelineItem}>
              <div
                style={{
                  ...dot,
                  background: active ? "#22c55e" : "#475569",
                }}
              />

              {index !== statusSteps.length - 1 && (
                <div
                  style={{
                    ...line,
                    background: active ? "#22c55e" : "#475569",
                  }}
                />
              )}

              <span style={label}>
                {step.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  /* ================= UI ================= */
  return (
    <div style={container}>
      <h1>🧾 My Orders</h1>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : orders.length === 0 ? (
        <p>คุณยังไม่มีออเดอร์</p>
      ) : (
        orders.map((order) => {
          const slipUrl = getSlipUrl(order.slip);

          return (
            <div key={order.id} style={card}>
              <h3>Order #{order.id.slice(0, 8)}</h3>

              <p style={price}>💰 {order.total_price} บาท</p>

              {/* 🔥 TIMELINE */}
              {renderTimeline(order.status)}

              {/* PRODUCTS */}
              <div style={{ marginTop: "15px" }}>
                <strong>สินค้า:</strong>
                {order.order_items.map((item) => (
                  <div key={item.id} style={productItem}>
                    🛍 {item.name}
                    <div style={meta}>
                      {item.price} บาท × {item.qty}
                    </div>
                  </div>
                ))}
              </div>

              {/* SLIP */}
              <div style={{ marginTop: "15px" }}>
                <strong>สลิป:</strong>

                {slipUrl ? (
                  <img
                    src={slipUrl}
                    style={slipImg}
                    onClick={() => setSelectedSlip(slipUrl)}
                  />
                ) : (
                  <p style={{ opacity: 0.6 }}>ยังไม่มีสลิป</p>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* MODAL */}
      {selectedSlip && (
        <div style={modal} onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} style={modalImg} />
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

const card = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "12px",
  marginTop: "20px",
};

const price = {
  color: "#22c55e",
  fontSize: "18px",
};

/* 🔥 TIMELINE STYLE */
const timeline = {
  display: "flex",
  alignItems: "center",
  marginTop: "15px",
};

const timelineItem = {
  display: "flex",
  alignItems: "center",
};

const dot = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
};

const line = {
  width: "50px",
  height: "2px",
};

const label = {
  marginLeft: "6px",
  marginRight: "10px",
  fontSize: "12px",
};

const productItem = {
  background: "#1e293b",
  padding: "10px",
  marginTop: "8px",
  borderRadius: "8px",
};

const meta = {
  fontSize: "12px",
  opacity: 0.7,
};

const slipImg = {
  width: "120px",
  marginTop: "10px",
  borderRadius: "8px",
  cursor: "pointer",
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
};

const modalImg = {
  maxWidth: "90%",
  maxHeight: "90%",
  borderRadius: "10px",
};

export default MyOrders;