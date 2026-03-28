import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  // ดึงออเดอร์เมื่อ user เปลี่ยนหรือหน้าโหลด
  useEffect(() => {
    let isMounted = true;

    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        
        // ถ้า auth context พร้อม และมี user
        if (!authLoading && user?.id) {
          const { data, error } = await supabase
            .from("orders")
            .select(`*, order_items (*)`)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (isMounted) {
            setOrders(data || []);
          }
        } else {
          if (isMounted) {
            setOrders([]);
          }
        }
      } catch (err) {
        console.error("Fetch orders error:", err);
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMyOrders();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]);

  // 🔥 ฟังก์ชันแก้บั๊กรูปแตก: ดึง Public URL ของสลิป
  const getSlipUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path; 
    return supabase.storage.from("slips").getPublicUrl(path).data.publicUrl;
  };

  // 🎨 ฟังก์ชันสร้าง Timeline สถานะออเดอร์ (ดีไซน์พรีเมียม)
  const renderTimeline = (currentStatus) => {
    const steps = [
      { id: 'pending', label: 'PENDING' },
      { id: 'paid', label: 'PAID' },
      { id: 'shipped', label: 'SHIPPED' },
      { id: 'completed', label: 'COMPLETED' }
    ];

    if (currentStatus === 'cancelled') {
       return <div style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>❌ ออเดอร์ถูกยกเลิก (CANCELLED)</div>
    }

    const currentIndex = steps.findIndex(s => s.id === currentStatus);

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', marginBottom: '25px', overflowX: 'auto' }}>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isLast = index === steps.length - 1;
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '16px', height: '16px', borderRadius: '50%', 
                  background: isCompleted ? 'var(--accent)' : 'var(--text-muted)',
                  opacity: isCompleted ? 1 : 0.3,
                  boxShadow: isCompleted ? '0 0 10px var(--accent)' : 'none'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isCompleted ? 'var(--accent)' : 'var(--text-muted)', opacity: isCompleted ? 1 : 0.5 }}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div style={{ 
                  height: '2px', width: '60px', 
                  background: index < currentIndex ? 'var(--accent)' : 'var(--text-muted)',
                  opacity: index < currentIndex ? 1 : 0.3,
                  margin: '0 10px',
                  transform: 'translateY(-10px)'
                }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-container">
      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "50px" }}>กำลังโหลดข้อมูลออเดอร์...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px" }} className="glass-card">
          <p style={{ fontSize: "18px", color: "var(--text-muted)" }}>คุณยังไม่มีประวัติการสั่งซื้อ</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {orders.map((order) => {
            const slipUrl = getSlipUrl(order.slip);
            return (
              <div key={order.id} style={{ paddingBottom: "30px", borderBottom: "1px solid var(--card-border)" }}>
                
                {/* Header (เลขที่ออเดอร์ & วันที่) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {new Date(order.created_at).toLocaleString("th-TH")}
                  </p>
                </div>

                {/* Timeline & ยอดรวม */}
                <div style={{ marginBottom: "20px" }}>
                   <h3 style={{ fontSize: '18px', color: 'var(--accent)', marginBottom: '15px' }}>💰 ยอดรวม: {order.total_price.toLocaleString()} บาท</h3>
                   {renderTimeline(order.status)}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  
                  {/* กล่องรายการสินค้า */}
                  <div style={{ flex: 2, minWidth: "250px" }}>
                    <strong style={{ display: "block", marginBottom: "10px", fontSize: "15px" }}>รายการสินค้า:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.order_items?.map((item) => (
                        <div key={item.id} style={{ 
                          background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '10px', 
                          borderLeft: '4px solid var(--primary)', display: "flex", justifyContent: "space-between" 
                        }}>
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: 'bold', display: "block" }}>🛒 {item.name || `Product ID: ${item.product_id}`}</span>
                            <span style={{ fontSize: "12px", color: 'var(--text-muted)' }}>{item.price.toLocaleString()} บาท × {item.quantity} ชิ้น</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* กล่องรูปสลิป */}
                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <strong style={{ display: "block", marginBottom: "10px", fontSize: "15px" }}>หลักฐานการโอนเงิน:</strong>
                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: "100px" }}>
                      {slipUrl ? (
                        <img 
                          src={slipUrl} 
                          alt="slip" 
                          onClick={() => setSelectedSlip(slipUrl)}
                          style={{ 
                            width: "100%", maxWidth: "120px", height: "150px", 
                            objectFit: "cover", borderRadius: "8px", 
                            cursor: "pointer", border: "1px solid var(--card-border)",
                            transition: "0.3s"
                          }} 
                          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        />
                      ) : (
                        <div style={{ color: "var(--danger)", fontSize: "14px" }}>
                          ไม่พบสลิป
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ซูมรูปสลิป */}
      {selectedSlip && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, cursor: "pointer" }} 
          onClick={() => setSelectedSlip(null)}
        >
          <img 
            src={selectedSlip} 
            alt="full slip" 
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "12px", boxShadow: "0 0 40px rgba(0,0,0,0.5)" }} 
          />
        </div>
      )}
    </div>
  );
}

export default MyOrders;