import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 1. นำเข้า useAuth

function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole, loading: authLoading } = useAuth(); // 2. ดึงค่าจาก Context

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. ปรับปรุง useEffect ให้ใช้ค่าจาก AuthContext
  useEffect(() => {
    let isMounted = true;

    if (!authLoading) {
      if (!currentUser || currentRole !== "admin") {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ❌");
        navigate("/");
        return;
      }
      fetchUsers(isMounted);
    }

    return () => { isMounted = false; };
  }, [authLoading, currentUser, currentRole, navigate]);

  const fetchUsers = async (isMounted) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (isMounted) setUsers(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const toggleRole = async (id, currentRole) => {
    if (id === currentUser.id) {
      alert("❌ คุณไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`)) return;

    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id);
      if (error) throw error;
      alert("✅ อัปเดตสิทธิ์เรียบร้อย");
      fetchUsers(true);
    } catch (err) {
      alert("❌ ผิดพลาด: " + err.message);
    }
  };

  const deleteUser = async (id) => {
    if (id === currentUser.id) {
      alert("❌ คุณไม่สามารถลบตัวเองได้");
      return;
    }
    if (!window.confirm("⚠️ ยืนยันการลบผู้ใช้? ข้อมูลนี้ไม่สามารถกู้คืนได้")) return;

    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      alert("✅ ลบผู้ใช้สำเร็จ");
      fetchUsers(true);
    } catch (err) {
      alert("❌ ลบไม่สำเร็จ: " + err.message);
    }
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase.from("users").update({
        username: editingUser.username,
        phone: editingUser.phone,
      }).eq("id", editingUser.id);

      if (error) throw error;
      alert("✅ บันทึกการแก้ไขสำเร็จ");
      setEditingUser(null);
      fetchUsers(true);
    } catch (err) {
      alert("❌ บันทึกไม่สำเร็จ: " + err.message);
    }
  };

  if (authLoading) return <div style={{ color: "white", textAlign: "center", padding: "100px" }}>Checking Permissions...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: "10px", fontWeight: "800", fontSize: '2.2rem' }}>👥 Manage Users</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>ตรวจสอบและจัดการสิทธิ์สมาชิกทั้งหมดในระบบ WHY IT Shop</p>

      <div className="glass-card" style={{ overflowX: "auto", padding: "0", borderRadius: '15px', border: '1px solid var(--card-border)' }}>
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "50px" }}>กำลังดึงข้อมูลสมาชิก...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: '14px' }}>
                <th style={{ padding: "20px" }}>Email</th>
                <th style={{ padding: "20px" }}>Username</th>
                <th style={{ padding: "20px" }}>Phone</th>
                <th style={{ padding: "20px" }}>Role</th>
                <th style={{ padding: "20px", textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--card-border)", transition: "0.2s" }}>
                  <td style={{ padding: "15px 20px" }}>
                    {user.email} {user.id === currentUser.id && <small style={{ color: 'var(--primary)' }}>(You)</small>}
                  </td>
                  
                  <td style={{ padding: "15px 20px" }}>
                    {editingUser?.id === user.id ? (
                      <input
                        className="input-glass"
                        style={{ marginBottom: 0, padding: "8px", fontSize: '14px' }}
                        value={editingUser?.username || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      />
                    ) : (user.username || "-")}
                  </td>
                  
                  <td style={{ padding: "15px 20px" }}>
                    {editingUser?.id === user.id ? (
                      <input
                        className="input-glass"
                        style={{ marginBottom: 0, padding: "8px", fontSize: '14px' }}
                        value={editingUser?.phone || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      />
                    ) : (user.phone || "-")}
                  </td>
                  
                  <td style={{ padding: "15px 20px" }}>
                    <span style={{ 
                      background: user.role === "admin" ? "rgba(34, 197, 94, 0.1)" : "rgba(255,255,255,0.05)", 
                      color: user.role === "admin" ? "var(--accent)" : "var(--text-muted)", 
                      padding: "4px 12px", 
                      borderRadius: "20px", 
                      fontSize: "11px",
                      fontWeight: "800",
                      border: user.role === "admin" ? "1px solid var(--accent)" : "1px solid var(--card-border)",
                      textTransform: 'uppercase'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  
                  <td style={{ padding: "15px 20px", textAlign: 'right' }}>
                    {editingUser?.id === user.id ? (
                      <div style={{ display: "flex", gap: "8px", justifyContent: 'flex-end' }}>
                        <button className="btn-success" onClick={saveEdit} style={{ padding: "6px 15px", fontSize: "12px" }}>Save</button>
                        <button className="btn-primary" onClick={() => setEditingUser(null)} style={{ background: "rgba(255,255,255,0.1)", padding: "6px 15px", fontSize: "12px" }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", justifyContent: 'flex-end' }}>
                        <button className="btn-primary" onClick={() => setEditingUser(user)} style={{ padding: "6px 12px", fontSize: "12px", background: 'var(--bg-secondary)', border: '1px solid var(--card-border)' }}>Edit</button>
                        <button className="btn-success" onClick={() => toggleRole(user.id, user.role)} style={{ padding: "6px 12px", fontSize: "12px" }}>Role</button>
                        {user.id !== currentUser.id && (
                          <button className="btn-primary" onClick={() => deleteUser(user.id)} style={{ background: "var(--danger)", padding: "6px 12px", fontSize: "12px" }}>Delete</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;