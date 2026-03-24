import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    fetchUsers();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/login");

      const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (error || data?.role !== "admin") {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ❌");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) alert("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      else setUsers(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`ยืนยันการเปลี่ยนสิทธิ์เป็น ${newRole.toUpperCase()}?`)) return;

    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id);
    if (error) alert("❌ เปลี่ยน Role ไม่สำเร็จ");
    else fetchUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm("⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้ออกจากระบบ?")) return;

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) alert("❌ ลบผู้ใช้ไม่สำเร็จ");
    else fetchUsers();
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from("users").update({
      username: editingUser.username,
      phone: editingUser.phone,
    }).eq("id", editingUser.id);

    if (error) alert("❌ บันทึกการแก้ไขไม่สำเร็จ");
    else {
      setEditingUser(null);
      fetchUsers();
    }
  };

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: "30px", fontWeight: "800" }}>👥 Manage Users</h1>

      <div className="glass-card" style={{ overflowX: "auto", padding: "20px" }}>
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center" }}>กำลังโหลดข้อมูล...</p>
        ) : users.length === 0 ? (
          <p style={{ color: "var(--danger)", textAlign: "center" }}>❌ ไม่มีผู้ใช้อยู่ในระบบ</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--card-border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "15px" }}>Email</th>
                <th style={{ padding: "15px" }}>Username</th>
                <th style={{ padding: "15px" }}>Phone</th>
                <th style={{ padding: "15px" }}>Role</th>
                <th style={{ padding: "15px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--card-border)", transition: "0.2s" }}>
                  
                  <td style={{ padding: "15px" }}>{user.email}</td>
                  
                  <td style={{ padding: "15px" }}>
                    {editingUser?.id === user.id ? (
                      <input
                        className="input-glass"
                        style={{ marginBottom: 0, padding: "8px" }}
                        value={editingUser?.username || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      />
                    ) : (user.username || "-")}
                  </td>
                  
                  <td style={{ padding: "15px" }}>
                    {editingUser?.id === user.id ? (
                      <input
                        className="input-glass"
                        style={{ marginBottom: 0, padding: "8px" }}
                        value={editingUser?.phone || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      />
                    ) : (user.phone || "-")}
                  </td>
                  
                  <td style={{ padding: "15px" }}>
                    <span style={{ 
                      background: user.role === "admin" ? "rgba(34, 197, 94, 0.2)" : "var(--bg-secondary)", 
                      color: user.role === "admin" ? "var(--accent)" : "var(--text-muted)", 
                      padding: "5px 10px", 
                      borderRadius: "6px", 
                      fontWeight: "bold",
                      border: "1px solid var(--card-border)"
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  
                  <td style={{ padding: "15px" }}>
                    {editingUser?.id === user.id ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-success" onClick={saveEdit} style={{ padding: "6px 12px", fontSize: "13px" }}>Save</button>
                        <button className="btn-primary" onClick={() => setEditingUser(null)} style={{ background: "var(--bg-secondary)", color: "var(--text-main)", padding: "6px 12px", fontSize: "13px", border: "1px solid var(--card-border)" }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn-primary" onClick={() => setEditingUser(user)} style={{ padding: "6px 12px", fontSize: "13px", background: "var(--primary)" }}>Edit</button>
                        <button className="btn-success" onClick={() => toggleRole(user.id, user.role)} style={{ padding: "6px 12px", fontSize: "13px" }}>Role</button>
                        <button className="btn-primary" onClick={() => deleteUser(user.id)} style={{ background: "var(--danger)", padding: "6px 12px", fontSize: "13px" }}>Delete</button>
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