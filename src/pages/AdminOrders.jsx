import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        // ดึงข้อมูล order พร้อมรายการสินค้า และข้อมูล user (email)
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *, 
            order_items (*),
            users (email, firstname, lastname)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) setOrders(data || []);
      } catch (err) {
        console.error("Fetch orders error:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, []);

  const getSlipUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path; 
    return supabase.storage.from("slips").getPublicUrl(path).data.publicUrl;
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setOrders((prev) => 
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      alert(`อัปเดตสถานะออเดอร์เป็น ${newStatus.toUpperCase()} สำเร็จ!`);
    } catch (err) {
      alert("ไม่สามารถอัปเดตสถานะได้: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status) => {
    const colors = { 
      pending: "#facc15", 
      paid: "#38bdf8", 
      shipped: "#a78bfa", 
      completed: "#22c55e", 
      cancelled: "#ef4444" 
    };
    const color = colors[status] || "#fff";
    return { 
      background: `${color}15`, 
      color: color, 
      padding: "6px 12px", 
      borderRadius: "20px", 
      fontSize: "12px", 
      fontWeight: "800", 
      border: `1px solid ${color}40`,
      textTransform: "uppercase"
    };
  };

  return (
    <div className="page-container" style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: "30px", fontWeight: "800" }}>📦 จัดการคำสั่งซื้อ (Orders)</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: "var(--text-muted)" }}>กำลังโหลดข้อมูลออเดอร์จากระบบ...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: "var(--text-muted)" }}>ยังไม่มีคำสั่งซื้อในขณะนี้</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          {orders.map((order) => {
            const slipUrl = getSlipUrl(order.slip);
            const customerName = order.users?.firstname 
              ? `${order.users.firstname} ${order.users.lastname}` 
              : order.users?.email;

            return (
              <div key={order.id} className="glass-card" style={{ 
                padding: "30px", 
                borderLeft: `6px solid ${getStatusStyle(order.status).color}`,
                borderRadius: '16px' 
              }}>
                
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "15px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: '800', marginBottom: "5px" }}>
                      🧾 Order <span style={{ color: 'var(--primary)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      👤 ลูกค้า: <strong>{customerName}</strong>
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      🕒 {new Date(order.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <span style={getStatusStyle(order.status)}>{order.status}</span>
                </div>

                {/* Content Area */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "25px" }}>
                  {/* Items Section */}
                  <div>
                    <p style={{ color: "var(--accent)", fontSize: "20px", fontWeight: "900", marginBottom: "15px" }}>
                      ยอดชำระ: {Number(order.total_price).toLocaleString()} ฿
                    </p>
                    <strong style={{ display: "block", marginBottom: "10px", fontSize: '14px' }}>📦 รายการสินค้า:</strong>
                    {order.order_items?.map((item) => (
                      <div key={item.id} style={{ 
                        background: "rgba(255,255,255,0.03)", 
                        padding: "10px 15px", 
                        borderRadius: "8px", 
                        marginBottom: "8px", 
                        border: "1px solid var(--card-border)",
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: "600" }}>{item.name}</span>
                        <span style={{ float: "right", color: "var(--accent)" }}>
                          {item.price} ฿ × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Slip Section */}
                  <div style={{ textAlign: "center" }}>
                    <strong style={{ display: "block", marginBottom: "10px", fontSize: '14px' }}>📄 หลักฐานการโอน:</strong>
                    {slipUrl ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={slipUrl} 
                          alt="slip" 
                          onClick={() => setSelectedSlip(slipUrl)} 
                          style={{ width: "140px", height: "190px", objectFit: "cover", borderRadius: "12px", cursor: "pointer", border: "2px solid var(--card-border)", transition: 'transform 0.2s' }} 
                        />
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>คลิกเพื่อดูรูปใหญ่</p>
                      </div>
                    ) : (
                      <div style={{ height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,0,0,0.05)', borderRadius: '12px', color: "var(--danger)", border: '1px dashed var(--danger)' }}>
                        ไม่มีสลิป
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update Area */}
                <div style={{ 
                  marginTop: "25px", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "15px", 
                  background: "rgba(255,255,255,0.02)", 
                  padding: "15px 20px", 
                  borderRadius: "12px", 
                  border: "1px solid var(--card-border)" 
                }}>
                  <strong style={{ margin: 0, fontSize: '14px' }}>🔄 เปลี่ยนสถานะ:</strong>
                  <select 
                    className="input-glass" 
                    style={{ margin: 0, width: "auto", padding: "8px 15px", cursor: "pointer", borderRadius: '8px' }} 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, e.target.value)} 
                    disabled={updatingId === order.id}
                  >
                    <option value="pending">Pending (รอตรวจสอบ)</option>
                    <option value="paid">Paid (ชำระเงินแล้ว)</option>
                    <option value="shipped">Shipped (จัดส่งแล้ว)</option>
                    <option value="completed">Completed (สำเร็จ)</option>
                    <option value="cancelled">Cancelled (ยกเลิก)</option>
                  </select>
                  {updatingId === order.id && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>กำลังบันทึก...</span>}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Full Image Modal */}
      {selectedSlip && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, cursor: "zoom-out" }} 
          onClick={() => setSelectedSlip(null)}
        >
          <img src={selectedSlip} alt="full slip" style={{ maxWidth: "95%", maxHeight: "95%", borderRadius: "10px", border: '2px solid white' }} />
        </div>
      )}
    </div>
  );
}

export default AdminOrders;