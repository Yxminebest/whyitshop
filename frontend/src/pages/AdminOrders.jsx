import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminOrders() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    if (!authLoading && authUser) {
      checkAdmin();
      fetchOrders();
    }
  }, [authUser, authLoading]);

  const checkAdmin = async () => {
    if (!authUser?.id) {
      navigate("/login");
      return;
    }

    try {
      const { data } = await supabase.from("users").select("role").eq("id", authUser.id).maybeSingle();
      if (!data || data.role !== "admin") {
        alert("❌ คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        navigate("/");
      }
    } catch (err) {
      console.error("Admin check error:", err);
      navigate("/");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase.from("orders").select(`*, order_items (*)`).order("created_at", { ascending: false });
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 แก้ไขฟังก์ชันนี้: เช็กว่าถ้าเป็นลิงก์เต็มอยู่แล้ว ให้ใช้ได้เลย
  const getSlipUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path; 
    return supabase.storage.from("slips").getPublicUrl(path).data.publicUrl;
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));

      // ✅ ส่ง Status Update Email (non-blocking)
      fetch(`${import.meta.env.VITE_API_URL}/auth/send-status-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, newStatus })
      })
        .then(r => r.json())
        .then(data => console.log('📧 Status email:', data.message))
        .catch(err => console.log('Email error (non-blocking):', err.message));
    }
    setUpdatingId(null);
  };

  const getStatusStyle = (status) => {
    const colors = { pending: "#facc15", paid: "#38bdf8", shipped: "#a78bfa", completed: "#22c55e", cancelled: "#ef4444" };
    return { background: `${colors[status] || "#fff"}20`, color: colors[status], padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", border: `1px solid ${colors[status]}50` };
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px" }}>📦 จัดการคำสั่งซื้อ (Orders)</h1>

      {loading ? <p style={{ color: "var(--text-muted)" }}>กำลังโหลดออเดอร์...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => {
            const slipUrl = getSlipUrl(order.slip_url || order.slip);
            return (
              <div key={order.id} className="glass-card" style={{ padding: "25px", borderLeft: `5px solid ${getStatusStyle(order.status).color}` }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", marginBottom: "5px" }}>🧾 Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>User: {order.user_id}</p>
                  </div>
                  <span style={getStatusStyle(order.status)}>{order.status.toUpperCase()}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  <div style={{ flex: 2, minWidth: "250px" }}>
                    <p style={{ color: "var(--accent)", fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>ยอดชำระ: {order.total_price} บาท</p>
                    <strong style={{ display: "block", marginBottom: "10px" }}>รายการสินค้า:</strong>
                    {order.order_items?.map((item) => (
                      <div key={item.id} style={{ background: "var(--bg-secondary)", padding: "10px 15px", borderRadius: "8px", marginBottom: "8px", border: "1px solid var(--card-border)" }}>
                        <span style={{ fontWeight: "bold" }}>{item.name || `รหัส: ${item.product_id}`}</span>
                        <span style={{ float: "right", color: "var(--text-muted)" }}>{item.price} ฿ × {item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ flex: 1, minWidth: "150px", textAlign: "center" }}>
                    <strong style={{ display: "block", marginBottom: "10px" }}>หลักฐานการโอน:</strong>
                    {slipUrl ? (
                      <img src={slipUrl} alt="slip" onClick={() => setSelectedSlip(slipUrl)} style={{ width: "100%", maxWidth: "150px", height: "180px", objectFit: "cover", borderRadius: "10px", cursor: "pointer", border: "2px solid var(--card-border)" }} />
                    ) : (
                      <p style={{ color: "var(--danger)", fontSize: "14px" }}>ไม่มีสลิป</p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "15px", background: "var(--bg-secondary)", padding: "15px", borderRadius: "10px", border: "1px solid var(--card-border)" }}>
                  <strong style={{ margin: 0 }}>เปลี่ยนสถานะ:</strong>
                  <select className="input-glass" style={{ margin: 0, width: "auto", padding: "8px 15px", cursor: "pointer" }} value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} disabled={updatingId === order.id}>
                    <option value="pending">Pending (รอตรวจสอบ)</option>
                    <option value="paid">Paid (ชำระเงินแล้ว)</option>
                    <option value="shipped">Shipped (จัดส่งแล้ว)</option>
                    <option value="completed">Completed (สำเร็จ)</option>
                    <option value="cancelled">Cancelled (ยกเลิก)</option>
                  </select>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {selectedSlip && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, cursor: "pointer" }} onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} alt="full slip" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "12px" }} />
        </div>
      )}
    </div>
  );
}

export default AdminOrders;