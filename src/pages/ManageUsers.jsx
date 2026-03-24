import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 1. ใช้ Context

function ManageUsers() {
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USERS ================= */
  const fetchUsers = async (isMounted) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (isMounted) setUsers(data || []);
    } catch (err) {
      console.error("Fetch users error:", err.message);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // ถ้าโหลด Auth เสร็จแล้วแต่ไม่ใช่ Admin ให้ดีดออกทันที (เผื่อหลุดเข้ามา)
    if (!authLoading && currentRole !== "admin") {
      navigate("/");
      return;
    }

    fetchUsers(isMounted);

    return () => { isMounted = false; };
  }, [authLoading, currentRole, navigate]);

  /* ================= CHANGE ROLE ================= */
  const toggleRole = async (id, currentRoleName, targetEmail) => {
    // ป้องกันแอดมินเปลี่ยน Role ตัวเองจนเข้าหน้า Admin ไม่ได้
    if (id === currentUser.id) {
      alert("❌ คุณไม่สามารถเปลี่ยน Role ของตัวเองได้");
      return;
    }

    const newRole = currentRoleName === "admin" ? "user" : "admin";
    const confirmChange = window.confirm(`ยืนยันการเปลี่ยนสิทธิ์ของ ${targetEmail} เป็น ${newRole.toUpperCase()} ?`);

    if (!confirmChange) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", id);

      if (error) throw error;

      alert(`✅ เปลี่ยนสิทธิ์เรียบร้อยแล้ว`);
      fetchUsers(true);
    } catch (err) {
      alert("❌ เปลี่ยนไม่สำเร็จ: " + err.message);
    }
  };

  if (authLoading) return <div style={{ color: "white", textAlign: "center", padding: "100px" }}>Checking Permissions...</div>;

  return (
    <div className="page-container" style={container}>
      <h1 style={{ fontWeight: "800", marginBottom: "10px" }}>👥 Manage Users</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>จัดการสิทธิ์การเข้าถึงระบบของสมาชิกทั้งหมด</p>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>กำลังดึงรายชื่อสมาชิก...</p>
      ) : (
        <div className="glass-card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--card-border)" }}>
          <div style={header}>
            <span style={{ flex: 2 }}>อีเมลสมาชิก</span>
            <span style={{ flex: 1, textAlign: "center" }}>สถานะ (Role)</span>
            <span style={{ flex: 1, textAlign: "right" }}>การจัดการ</span>
          </div>

          {users.length === 0 ? (
            <p style={{ padding: "20px", textAlign: "center" }}>ไม่พบข้อมูลสมาชิก</p>
          ) : (
            users.map((u) => (
              <div key={u.id} style={row}>
                <span style={{ flex: 2, fontSize: "14px", fontWeight: "500" }}>
                  {u.email} {u.id === currentUser.id && <small style={{ color: "var(--primary)" }}>(คุณ)</small>}
                </span>

                <span style={{ 
                  flex: 1, 
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  color: u.role === "admin" ? "var(--accent)" : "var(--text-muted)",
                }}>
                  <span style={{ 
                    background: u.role === "admin" ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.05)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    border: u.role === "admin" ? "1px solid var(--accent)" : "1px solid var(--card-border)"
                  }}>
                    {u.role || "user"}
                  </span>
                </span>

                <div style={{ flex: 1, textAlign: "right" }}>
                  <button
                    onClick={() => toggleRole(u.id, u.role, u.email)}
                    style={{
                      ...btn,
                      opacity: u.id === currentUser.id ? 0.5 : 1,
                      cursor: u.id === currentUser.id ? "not-allowed" : "pointer",
                      background: u.role === "admin" ? "var(--danger)" : "var(--primary)"
                    }}
                    disabled={u.id === currentUser.id}
                  >
                    Set as {u.role === "admin" ? "User" : "Admin"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ================= STYLE ================= */

const container = {
  padding: "40px 20px",
  maxWidth: "1000px",
  margin: "0 auto",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px",
  fontWeight: "bold",
  background: "rgba(255, 255, 255, 0.05)",
  borderBottom: "1px solid var(--card-border)",
  fontSize: "14px",
  color: "var(--text-muted)"
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 20px",
  borderBottom: "1px solid var(--card-border)",
  transition: "0.2s",
};

const btn = {
  color: "white",
  padding: "8px 15px",
  border: "none",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "600",
  transition: "0.3s",
};

export default ManageUsers;